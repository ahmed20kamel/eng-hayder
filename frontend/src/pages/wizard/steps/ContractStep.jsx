// src/pages/wizard/steps/ContractStep.jsx
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import i18n from "../../../i18n";
import { api } from "../../../services/api";
import WizardShell from "../components/WizardShell";
import StepActions from "../components/StepActions";
import Field from "../components/Field";
import RtlSelect from "../../../components/RtlSelect";
import InfoTip from "../components/InfoTip";
import NumberField from "../../../components/NumberField";

import {
  FaFileSignature, FaList, FaCalendarAlt, FaHashtag,
  FaUserTie, FaUser, FaIdCard, FaMoneyBillWave, FaBalanceScale
} from "react-icons/fa";
/** تنسيق رقم مثل: 1,000,000.00 */
const formatNumberInput = (v) => {
  if (!v) return "";
  const n = Number(String(v).replace(/,/g, ""));
  if (isNaN(n)) return "";
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

/** تحويل الأرقام الإنجليزية إلى عربية */
const toArabicDigits = (str) =>
  String(str).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[d]);

/** تنسيق مبلغ + تحويل عربي */
const formatMoneyArabic = (v) => {
  if (!v) return "—";
  const formatted = formatNumberInput(v);
  return toArabicDigits(formatted);
};
const numberToArabicWords = (num) => {
  if (num === null || num === undefined || num === "") return "";

  num = Number(String(num).replace(/,/g, ""));
  if (isNaN(num)) return "";

  const ones = [
    "", "واحد", "اثنان", "ثلاثة", "أربعة", "خمسة",
    "ستة", "سبعة", "ثمانية", "تسعة"
  ];
  const tens = [
    "", "عشرة", "عشرون", "ثلاثون", "أربعون", "خمسون",
    "ستون", "سبعون", "ثمانون", "تسعون"
  ];
  const teens = [
    "أحد عشر", "اثنا عشر", "ثلاثة عشر", "أربعة عشر", "خمسة عشر",
    "ستة عشر", "سبعة عشر", "ثمانية عشر", "تسعة عشر"
  ];

  const scales = [
    "", "ألف", "مليون", "مليار", "تريليون"
  ];
  const scalesPlural = [
    "", "آلاف", "ملايين", "مليارات", "تريليونات"
  ];

  if (num === 0) return "صفر";

  let parts = [];
  let scaleIndex = 0;

  while (num > 0) {
    let chunk = num % 1000;
    num = Math.floor(num / 1000);

    if (chunk > 0) {
      let text = "";

      let h = Math.floor(chunk / 100);
      let t = Math.floor((chunk % 100) / 10);
      let o = chunk % 10;

      // مئات
      if (h === 1) text += "مائة";
      else if (h === 2) text += "مائتان";
      else if (h > 2) text += ones[h] + " مائة";

      // فاصل بين المئات والباقي
      if (h > 0 && (t > 0 || o > 0)) text += " و ";

      // عشرات + وحدات
      if (t === 1 && o > 0) {
        text += teens[o - 1];
      } else {
        if (o > 0) text += ones[o];
        if (t > 1) {
          if (o > 0) text += " و ";
          text += tens[t];
        }
        if (t === 1 && o === 0) text += tens[1];
      }

      // إضافة (ألف - مليون - مليار...)
      if (scaleIndex > 0) {
        if (chunk === 1) {
          text += " " + scales[scaleIndex];
        } else if (chunk === 2) {
          // خاصّة: مليونان، ألفان، ملياران
          text += " " + scales[scaleIndex] + "ان";
        } else if (chunk >= 3 && chunk <= 10) {
          text += " " + scalesPlural[scaleIndex];
        } else {
          text += " " + scales[scaleIndex];
        }
      }

      parts.unshift(text);
    }

    scaleIndex++;
  }

  return parts.join(" و ");
};

/* === تحويلات التاريخ === */
const toInputDate = (d) => {
  if (!d) return "";
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(d); // dd/mm/yyyy
  return m ? `${m[3]}-${m[2]}-${m[1]}` : d;        // yyyy-mm-dd
};
const toApiDate = (d) => {
  if (!d) return null;
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(d);
  const v = m ? `${m[3]}-${m[2]}-${m[1]}` : d;
  return /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null;
};
const todayIso = () => {
  const t = new Date();
  const mm = String(t.getMonth() + 1).padStart(2, "0");
  const dd = String(t.getDate()).padStart(2, "0");
  return `${t.getFullYear()}-${mm}-${dd}`;
};
const dayNameLocalized = (dateStr, lang) => {
  try {
    const d = dateStr ? new Date(dateStr) : new Date();
    return d.toLocaleDateString(lang || "ar", { weekday: "long" });
  } catch { return ""; }
};

/* === تنسيق أخطاء الخادم مع i18n === */
function formatServerErrors(data) {
  if (!data) return "";
  const tErr = (k) => i18n.t(`errors.${k}`, k);

  const lines = [];
  const walk = (value, path = []) => {
    if (Array.isArray(value)) {
      if (value.every(v => typeof v !== "object")) {
        const key = path.length ? tErr(path.at(-1)) : "";
        lines.push(`• ${key ? key + ": " : ""}${value.map(String).join(" • ")}`);
        return;
      }
      value.forEach((item, i) => {
        const last = path.at(-1);
        const label = last ? `${tErr(last)} [${i}]` : `[${i}]`;
        if (typeof item !== "object") lines.push(`• ${label}: ${String(item)}`);
        else Object.entries(item || {}).forEach(([k, v]) =>
          walk(v, [...path.slice(0, -1), `${label} → ${tErr(k)}`])
        );
      });
      return;
    }
    if (typeof value === "object" && value) {
      for (const [k, v] of Object.entries(value)) walk(v, [...path, k]);
      return;
    }
    const key = path.length ? tErr(path.at(-1)) : "";
    const prefix = path.slice(0, -1)
      .map((p) => (String(p).includes("→") ? p : tErr(p)))
      .filter(Boolean)
      .join(" → ");
    const fullKey = [prefix, key].filter(Boolean).join(" → ");
    lines.push(`• ${fullKey ? fullKey + ": " : ""}${String(value)}`);
  };
  walk(data);
  return lines.join("\n");
}

/* === مساعدات أرقام ومنطقيات === */
const num = (v, d = 0) => {
  const n = parseFloat(String(v ?? "").replace(/[^\d.+-]/g, ""));
  return Number.isFinite(n) ? n : d;
};
const toYesNo = (b) => (b ? "yes" : "no");
const toBool = (v) => v === true || v === "yes";

/* === تسميات الحقول (نترجم لو متوفر) === */
const humanize = (s) =>
  String(s || "")
    .replace(/\./g, " · ")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

const labelForKey = (k) => {
  const last = String(k).split(".").pop();
  const tr = i18n.t(`errors.${last}`, last);
  return tr === last ? humanize(k) : tr;
};

/* === عرض كل حقول المالك (بما فيها المتداخلة) === */
const joinArr = (a) =>
  Array.isArray(a) ? a.filter((v) => v != null && v !== "").join("، ") : a;

const flattenEntries = (obj, prefix = "") => {
  const out = [];
  Object.entries(obj || {}).forEach(([k, v]) => {
    if (v === "" || v === null || v === undefined) return;
    const key = prefix ? `${prefix}.${k}` : k;

    if (typeof v === "object" && v && !Array.isArray(v)) {
      out.push(...flattenEntries(v, key));
    } else {
      out.push([key, joinArr(v)]);
    }
  });
  return out;
};

// ترتيب تفضيلي لبعض الحقول الشائعة
const PRIMARY_ORDER = [
  "owner_name_ar",
  "owner_name_en",
  "owner_name",
  "nationality",
  "id_number",
  "id_issue_date",
  "id_expiry_date",
  "phone",
  "email",
  "address",
  "share_possession",
  "right_hold_type",
  "share_percent",
];

/* ===== View helper ===== */
const ViewRow = ({ label, value, icon: Icon, tip }) => (
  <Field label={label} icon={Icon}>
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span>{value !== undefined && value !== null && String(value) !== "" ? String(value) : "—"}</span>
      {tip ? <InfoTip align="start" text={tip} /> : null}
    </div>
  </Field>
);

/* ============== المكون الرئيسي ============== */
export default function ContractStep({ projectId, onPrev, onNext }) {
  const { t, i18n: i18next } = useTranslation();
  const isAR = i18next.language === "ar";
  const navigate = useNavigate();

  /* ====== قوائم ثابتة (تعتمد اللغة) ====== */
  const CONTRACT_CLASSIFICATION = useMemo(
    () => ([
      {
        value: "housing_loan_program",
        label: t("contract.classification.housing_loan_program.label"),
        desc: t("contract.classification.housing_loan_program.desc"),
      },
      {
        value: "private_funding",
        label: t("contract.classification.private_funding.label"),
        desc: t("contract.classification.private_funding.desc"),
      },
    ]),
    [t]
  );

  const CONTRACT_TYPES = useMemo(
    () => ([
      { value: "lump_sum",      label: t("contract.types.lump_sum") },
      { value: "percentage",    label: t("contract.types.percentage") },
      { value: "design_build",  label: t("contract.types.design_build") },
      { value: "re_measurement",label: t("contract.types.re_measurement") },
    ]),
    [t]
  );

  const EXTRA_FEE_MODE = useMemo(
    () => ([
      { value: "percent", label: t("contract.fees.mode.percent") },
      { value: "fixed",   label: t("contract.fees.mode.fixed") },
      { value: "other",   label: t("contract.fees.mode.other") },
    ]),
    [t]
  );

  /* ====== الحالة ====== */
  const [form, setForm] = useState({
    // تصنيف العقد
    contract_classification: "",
    // نوع العقد
    contract_type: "",
    // بيانات عامة
    tender_no: "",
    contract_date: "",
    // أطراف
    owners: [],
    contractor_name: "",
    contractor_trade_license: "",
    // قيم المشروع
    total_project_value: "",
    total_bank_value: "",
    total_owner_value: "",
    project_duration_months: "",
    // أتعاب — تمويل المالك
    owner_includes_consultant: "no",
    owner_fee_design_percent: "",
    owner_fee_supervision_percent: "",
    owner_fee_extra_mode: "percent",
    owner_fee_extra_value: "",
    // أتعاب — تمويل البنك
    bank_includes_consultant: "no",
    bank_fee_design_percent: "",
    bank_fee_supervision_percent: "",
    bank_fee_extra_mode: "percent",
    bank_fee_extra_value: "",
  });

  const [existingId, setExistingId] = useState(null);
  const [errorMsg, setErrorMsg]   = useState("");
  const [isView, setIsView] = useState(false);
  const setF = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  /* ====== قراءة عقد موجود إن وجد ====== */
  useEffect(() => {
    if (!projectId) return;
    (async () => {
      try {
        const { data } = await api.get(`projects/${projectId}/contract/`);
        if (Array.isArray(data) && data.length) {
          const s = data[0];
          setExistingId(s.id);
          setForm((prev) => ({
            ...prev,
            ...s,
            contract_date: toInputDate(s.contract_date) || prev.contract_date,
            owner_includes_consultant: toYesNo(s.owner_includes_consultant),
            bank_includes_consultant: toYesNo(s.bank_includes_consultant),
          }));
          setIsView(true); // عند الرجوع للخطوة: اعرض View
        }
      } catch {}
    })();
  }, [projectId]); // eslint-disable-line

  /* ====== إكمال بيانات الملاك من SitePlan وإحضار المقاول من License ====== */
  useEffect(() => {
    if (!projectId) return;
    (async () => {
      try {
        const [spRes, lcRes] = await Promise.allSettled([
          api.get(`projects/${projectId}/siteplan/`),
          api.get(`projects/${projectId}/license/`),
        ]);

        // SitePlan → owners (ننسخ كما هم)
        if (spRes.status === "fulfilled" && Array.isArray(spRes.value?.data) && spRes.value.data.length) {
          const sp = spRes.value.data[0];
          const ownersArr = Array.isArray(sp.owners) ? sp.owners : [];
          setForm((prev) => ({
            ...prev,
            owners: prev.owners?.length ? prev.owners : ownersArr.map((o) => ({ ...o })),
          }));
        }

        // License → المقاول ورخصته
        if (lcRes.status === "fulfilled" && Array.isArray(lcRes.value?.data) && lcRes.value.data.length) {
          const lc = lcRes.value.data[0];
          setForm((prev) => ({
            ...prev,
            contractor_name: prev.contractor_name || lc.contractor_name || "",
            contractor_trade_license: prev.contractor_trade_license || lc.contractor_license_no || "",
          }));
        }
      } catch {}
    })();
  }, [projectId]);

  /* ====== ملء تاريخ اليوم تلقائيًا إذا كان فارغًا ====== */
  useEffect(() => {
    if (!form.contract_date) setForm((p) => ({ ...p, contract_date: todayIso() }));
  }, [form.contract_date]);

  /* ====== حساب تمويل المالك تلقائيًا ====== */
  useEffect(() => {
    const total = num(form.total_project_value, 0);
    const bank  = num(form.total_bank_value, 0);
    const owner = Math.max(0, total - bank);
    if (String(owner) !== String(form.total_owner_value)) {
      setForm(prev => ({ ...prev, total_owner_value: String(owner) }));
    }
  }, [form.total_project_value, form.total_bank_value]); // eslint-disable-line

  /* ====== تحققات وبناء الحمولة ====== */
  const buildPayload = () => {
    if (!form.contract_classification) throw new Error(t("contract.errors.select_classification"));
    if (!form.contract_type) throw new Error(t("contract.errors.select_type"));
    if (!form.contract_date) throw new Error(t("contract.errors.select_date"));

    const total = num(form.total_project_value, NaN);
    if (!Number.isFinite(total) || total <= 0) {
      throw new Error(t("contract.errors.total_project_value_positive"));
    }

    const isHousing = form.contract_classification === "housing_loan_program";
    const bank  = num(form.total_bank_value, isHousing ? NaN : 0);
    const owner = Math.max(0, total - bank);

    if (isHousing) {
      if (!Number.isFinite(bank) || bank < 0) {
        throw new Error(t("contract.errors.bank_value_nonnegative"));
      }
      if (num(form.total_owner_value, NaN) !== owner) {
        throw new Error(t("contract.errors.owner_value_autocalc"));
      }
    }

    // نرسل الملاك كما هم تمامًا (أي حقول موجودة ستذهب للسيرفر)
    return {
      contract_classification: form.contract_classification,
      contract_type: form.contract_type,
      tender_no: form.tender_no || "",
      contract_date: toApiDate(form.contract_date),
      owners: form.owners || [],
      contractor_name: form.contractor_name || "",
      contractor_trade_license: form.contractor_trade_license || "",
      total_project_value: total,
      total_bank_value: isHousing ? bank : 0,
      total_owner_value: isHousing ? owner : Math.max(0, total - 0),
      project_duration_months: num(form.project_duration_months, 0),
      owner_includes_consultant: toBool(form.owner_includes_consultant),
      owner_fee_design_percent: num(form.owner_fee_design_percent, 0),
      owner_fee_supervision_percent: num(form.owner_fee_supervision_percent, 0),
      owner_fee_extra_mode: form.owner_fee_extra_mode || "percent",
      owner_fee_extra_value: num(form.owner_fee_extra_value, 0),
      bank_includes_consultant: toBool(form.bank_includes_consultant),
      bank_fee_design_percent: num(form.bank_fee_design_percent, 0),
      bank_fee_supervision_percent: num(form.bank_fee_supervision_percent, 0),
      bank_fee_extra_mode: form.bank_fee_extra_mode || "percent",
      bank_fee_extra_value: num(form.bank_fee_extra_value, 0),
    };
  };

  const save = async () => {
    if (!projectId) {
      setErrorMsg(t("open_specific_project_to_save"));
      return;
    }
    try {
      const payload = buildPayload();
      if (existingId) {
        await api.patch(`projects/${projectId}/contract/${existingId}/`, payload);
      } else {
        const { data: created } = await api.post(`projects/${projectId}/contract/`, payload);
        if (created?.id) setExistingId(created.id);
      }
      setErrorMsg("");
      setIsView(true); // ← التحويل إلى عرض بعد الحفظ

      // لو في onNext (داخل الـ Wizard) هنمشي الفلو،
      // لو مش موجود → نروح لقائمة المشاريع مباشرة
      if (onNext) onNext();
      else navigate("/projects");
    } catch (err) {
      const serverData = err?.response?.data;
      const formatted = formatServerErrors(serverData);
      const fallback = err?.message || (serverData ? JSON.stringify(serverData, null, 2) : t("save_failed"));
      setErrorMsg(formatted || fallback);
    }
  };

  /* ====== اشتقاقات العرض ====== */
  const isHousing = form.contract_classification === "housing_loan_program";
  const showOwnerFees   = form.owner_includes_consultant === "yes";
  const showBankFees    = form.bank_includes_consultant === "yes";

  const finishLabel = isAR ? "إنهاء" : "Finish";

  return (
    <WizardShell icon={FaFileSignature} title={`📄 ${t("contract.title")}`}>
      {/* مودال الخطأ */}
      {errorMsg && (
        <div
          role="dialog"
          aria-modal="true"
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.35)", zIndex: 2000, display: "grid", placeItems: "center" }}
        >
          <div className="card" style={{ maxWidth: 720, width: "92%", direction: isAR ? "rtl" : "ltr" }}>
            <div className="row" style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <h3 style={{ margin: 0 }}>{t("warning")} ⚠️</h3>
            </div>
            <div className="alert error" style={{ marginBottom: 12 }}>
              <div className="title">{t("save_error")}</div>
            </div>
            <pre style={{ whiteSpace: "pre-wrap", margin: 0, fontFamily: "inherit", fontSize: "18px", lineHeight: 1.7 }}>
              {errorMsg}
            </pre>
            <div className="row" style={{ justifyContent: "flex-start", marginTop: 16 }}>
              <button className="btn" type="button" onClick={() => setErrorMsg("")}>{t("ok")}</button>
            </div>
          </div>
        </div>
      )}

      {/* زر تعديل يظهر في وضع العرض */}
      {isView && (
        <div className="row" style={{ justifyContent: isAR ? "flex-start" : "flex-end", marginBottom: 12 }}>
          <button type="button" className="btn secondary" onClick={() => setIsView(false)}>
            ✏️ {t("edit")}
          </button>
        </div>
      )}

      {/* 1) تصنيف العقد */}
      <h4>1) {t("contract.sections.classification")}</h4>
      {isView ? (
        <div className="card">
          <div style={{ padding: 8, display: "flex", alignItems: "center", gap: 8 }}>
            <span>{CONTRACT_CLASSIFICATION.find(m => m.value === form.contract_classification)?.label || "—"}</span>
            {form.contract_classification ? (
              <InfoTip
                align="start"
                text={
                  form.contract_classification === "housing_loan_program"
                    ? t("contract.classification.housing_loan_program.desc")
                    : t("contract.classification.private_funding.desc")
                }
              />
            ) : null}
          </div>
        </div>
      ) : (
        <>
          <div className="row" style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <div className="chips" style={{ flex: "1 1 auto" }}>
              {CONTRACT_CLASSIFICATION.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  className={`chip ${form.contract_classification === m.value ? "active" : ""}`}
                  onClick={() => setF("contract_classification", m.value)}
                  title={m.desc}
                >
                  {m.label}
                </button>
              ))}
            </div>
            {form.contract_classification ? (
              <InfoTip
                align="start"
                text={
                  form.contract_classification === "housing_loan_program"
                    ? t("contract.classification.housing_loan_program.desc")
                    : t("contract.classification.private_funding.desc")
                }
              />
            ) : null}
          </div>
        </>
      )}

      {/* 2) نوع العقد */}
      <h4 className="mt-16">2) {t("contract.sections.type")}</h4>
      {isView ? (
        <div className="form-grid cols-3">
          <ViewRow
            label={t("contract.fields.contract_type")}
            value={CONTRACT_TYPES.find((x) => x.value === form.contract_type)?.label || form.contract_type}
            icon={FaList}
          />
        </div>
      ) : (
        <div className="form-grid cols-3">
          <Field label={t("contract.fields.contract_type")} icon={FaList}>
            <RtlSelect
              className="rtl-select"
              dir={isAR ? "rtl" : "ltr"}
              options={CONTRACT_TYPES}
              value={form.contract_type}
              onChange={(v) => setF("contract_type", v)}
              placeholder={t("contract.placeholders.select_contract_type")}
            />
          </Field>
        </div>
      )}

      {/* 3) بيانات العقد */}
      <h4 className="mt-16">3) {t("contract.sections.details")}</h4>
      {isView ? (
        <div className="form-grid cols-3">
          <ViewRow label={t("contract.fields.contract_number")} value={form.tender_no} icon={FaHashtag}
            tip={isHousing ? t("contract.notes.housing_tender_info") : undefined}
          />
          <ViewRow
            label={t("contract.fields.contract_date")}
            value={form.contract_date}
            icon={FaCalendarAlt}
            tip={form.contract_date ? `${t("contract.labels.day")}: ${dayNameLocalized(form.contract_date, i18next.language)}` : undefined}
          />
        </div>
      ) : (
        <div className="form-grid cols-3">
          <Field label={t("contract.fields.contract_number")} icon={FaHashtag}>
            <div className="row" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                className="input"
                value={form.tender_no}
                onChange={(e) => setF("tender_no", e.target.value)}
                placeholder={t("contract.placeholders.contract_number")}
              />
              {isHousing ? <InfoTip align="start" text={t("contract.notes.housing_tender_info")} /> : null}
            </div>
          </Field>

          <Field label={t("contract.fields.contract_date")} icon={FaCalendarAlt}>
            <div className="row" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                className="input"
                type="date"
                value={form.contract_date || ""}
                onChange={(e) => setF("contract_date", e.target.value)}
              />
              {form.contract_date ? (
                <InfoTip
                  align="start"
                  text={`${t("contract.labels.day")}: ${dayNameLocalized(form.contract_date, i18next.language)}`}
                />
              ) : null}
            </div>
          </Field>
        </div>
      )}

      {/* 4) أطراف العقد */}
      <h4 className="mt-16">4) {t("contract.sections.parties")}</h4>
      <div className="form-grid cols-2">
        <Field label={t("contract.fields.first_party_owner")} icon={FaUser}>
          {form.owners?.length ? (
            <div className="mini" style={{ lineHeight: 1.9 }}>
              {form.owners.map((o, i) => {
                const entries = flattenEntries(o);
                const sorted = entries.sort(([kA], [kB]) => {
                  const a = PRIMARY_ORDER.indexOf(kA.split(".")[0]);
                  const b = PRIMARY_ORDER.indexOf(kB.split(".")[0]);
                  if (a !== -1 || b !== -1) {
                    return (a === -1 ? 999 : a) - (b === -1 ? 999 : b);
                  }
                  return kA.localeCompare(kB);
                });

                return (
                  <div key={i} style={{ padding: "8px 10px", border: "1px solid #eee", borderRadius: 6, marginBottom: 8 }}>
                    {sorted.map(([k, v]) => (
                      <div key={k}>
                        <strong>{labelForKey(k)}:</strong> {String(v)}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="row" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <InfoTip align="start" text={t("contract.notes.no_owners_siteplan")} />
            </div>
          )}
        </Field>

        <Field label={t("contract.fields.second_party_contractor")} icon={FaUserTie}>
          {isView ? (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span>{form.contractor_name || "—"}</span>
                <InfoTip align="start" text={t("contract.notes.autofill_from_license")} />
              </div>
              <div className="row mt-6" style={{ gap: 8, alignItems: "center" }}>
                <FaIdCard aria-hidden /> <div>{form.contractor_trade_license || "—"}</div>
              </div>
            </>
          ) : (
            <>
              <div className="row" style={{ gap: 8, alignItems: "center" }}>
                <input
                  className="input"
                  placeholder={t("contract.placeholders.contractor_name")}
                  value={form.contractor_name}
                  onChange={(e) => setF("contractor_name", e.target.value)}
                />
                <InfoTip align="start" text={t("contract.notes.autofill_from_license")} />
              </div>
              <div className="row mt-6" style={{ gap: 8, alignItems: "center" }}>
                <FaIdCard aria-hidden />
                <input
                  className="input"
                  placeholder={t("contract.placeholders.trade_license")}
                  value={form.contractor_trade_license}
                  onChange={(e) => setF("contractor_trade_license", e.target.value)}
                />
              </div>
            </>
          )}
        </Field>
      </div>

      {/* 5) قيمة العقد والمدة */}
      <h4 className="mt-16">5) {t("contract.sections.value_duration")}</h4>
      {isView ? (
        <div className="form-grid cols-4">
          <ViewRow
  label={t("contract.fields.total_project_value")}
  value={
    <>
      <div>{formatMoneyArabic(form.total_project_value)}</div>
      <div style={{ fontSize: "13px", marginTop: "4px" }}>
        {numberToArabicWords(form.total_project_value)}
      </div>
    </>
  }
  icon={FaMoneyBillWave}
/>

            <>
              <ViewRow label={t("contract.fields.total_bank_value")} value={form.total_bank_value} icon={FaMoneyBillWave} />
              <ViewRow label={t("contract.fields.total_owner_value_calc")} value={form.total_owner_value} icon={FaBalanceScale} />
            </>
          )}
          <ViewRow label={t("contract.fields.project_duration_months")} value={form.project_duration_months} icon={FaHashtag} />
        </div>
      ) : (
        <div className="form-grid cols-4">
<Field label={t("contract.fields.total_project_value")} icon={FaMoneyBillWave}>
  <NumberField
    value={form.total_project_value}
    onChange={(v) => setF("total_project_value", v)}
  />
</Field>


          {isHousing && (
            <>
<Field label={t("contract.fields.total_bank_value")} icon={FaMoneyBillWave}>
  <NumberField
    value={form.total_bank_value}
    onChange={(v) => setF("total_bank_value", v)}
  />
</Field>


<Field label={t("contract.fields.total_owner_value_calc")} icon={FaBalanceScale}>
  <NumberField
    value={form.total_owner_value}
    onChange={() => {}}
    readOnly
  />

  {/* نص عربي تحت القيمة */}
  {form.total_owner_value && (
    <div style={{ fontSize: "13px", marginTop: "4px", color: "#555" }}>
      {numberToArabicWords(form.total_owner_value)}
    </div>
  )}
</Field>

            </>
          )}

          <Field label={t("contract.fields.project_duration_months")} icon={FaHashtag}>
            <input
              className="input"
              type="number"
              min="0"
              value={form.project_duration_months}
              onChange={(e) => setF("project_duration_months", e.target.value)}
              placeholder="0"
            />
          </Field>
        </div>
      )}

      {/* 6) أتعاب الاستشاري ضمن مبلغ العقد */}
      <h4 className="mt-16">6) {t("contract.sections.consultant_fees")}</h4>

      {/* أتعاب — تمويل المالك */}
      <h5 className="mt-8">✅ {t("contract.fees.owner.title")}</h5>
      {isView ? (
        <div className="form-grid cols-3">
          <ViewRow label={t("contract.fees.include_consultant")} value={form.owner_includes_consultant === "yes" ? t("yes") : t("no")} />
          {showOwnerFees && (
            <>
              <ViewRow label={t("contract.fees.design_percent")} value={form.owner_fee_design_percent} />
              <ViewRow label={t("contract.fees.supervision_percent")} value={form.owner_fee_supervision_percent} />
              <ViewRow label={t("contract.fees.extra_type")} value={EXTRA_FEE_MODE.find(m => m.value === form.owner_fee_extra_mode)?.label || form.owner_fee_extra_mode} />
              <ViewRow label={t("contract.fees.extra_value")} value={form.owner_fee_extra_value} />
            </>
          )}
        </div>
      ) : (
        <div className="form-grid cols-3">
          <Field label={t("contract.fees.include_consultant")}>
            <div className="chips">
              {["no","yes"].map(v => (
                <button
                  key={v}
                  type="button"
                  className={`chip ${form.owner_includes_consultant === v ? "active" : ""}`}
                  onClick={() => setF("owner_includes_consultant", v)}
                >
                  {v === "yes" ? t("yes") : t("no")}
                </button>
              ))}
            </div>
          </Field>

          {showOwnerFees && (
            <>
              <Field label={t("contract.fees.design_percent")}>
                <input className="input" type="number" min="0" max="100" value={form.owner_fee_design_percent} onChange={(e) => setF("owner_fee_design_percent", e.target.value)} />
              </Field>
              <Field label={t("contract.fees.supervision_percent")}>
                <input className="input" type="number" min="0" max="100" value={form.owner_fee_supervision_percent} onChange={(e) => setF("owner_fee_supervision_percent", e.target.value)} />
              </Field>
              <Field label={t("contract.fees.extra_type")}>
                <RtlSelect className="rtl-select" dir={isAR ? "rtl" : "ltr"} options={EXTRA_FEE_MODE} value={form.owner_fee_extra_mode} onChange={(v) => setF("owner_fee_extra_mode", v)} />
              </Field>
<Field label={t("contract.fees.extra_value")}>
  <NumberField
    value={form.owner_fee_extra_value}
    onChange={(v) => setF("owner_fee_extra_value", v)}
  />
</Field>

            </>
          )}
        </div>
      )}

      {/* أتعاب — تمويل البنك */}
      <h5 className="mt-16">✅ {t("contract.fees.bank.title")}</h5>
      {isView ? (
        <div className="form-grid cols-3">
          <ViewRow label={t("contract.fees.include_consultant")} value={form.bank_includes_consultant === "yes" ? t("yes") : t("no")} />
          {showBankFees && (
            <>
              <ViewRow label={t("contract.fees.design_percent")} value={form.bank_fee_design_percent} />
              <ViewRow label={t("contract.fees.supervision_percent")} value={form.bank_fee_supervision_percent} />
              <ViewRow label={t("contract.fees.extra_type")} value={EXTRA_FEE_MODE.find(m => m.value === form.bank_fee_extra_mode)?.label || form.bank_fee_extra_mode} />
              <ViewRow label={t("contract.fees.extra_value")} value={form.bank_fee_extra_value} />
            </>
          )}
        </div>
      ) : (
        <div className="form-grid cols-3">
          <Field label={t("contract.fees.include_consultant")}>
            <div className="chips">
              {["no","yes"].map(v => (
                <button
                  key={v}
                  type="button"
                  className={`chip ${form.bank_includes_consultant === v ? "active" : ""}`}
                  onClick={() => setF("bank_includes_consultant", v)}
                >
                  {v === "yes" ? t("yes") : t("no")}
                </button>
              ))}
            </div>
          </Field>

          {showBankFees && (
            <>
              <Field label={t("contract.fees.design_percent")}>
                <input className="input" type="number" min="0" max="100" value={form.bank_fee_design_percent} onChange={(e) => setF("bank_fee_design_percent", e.target.value)} />
              </Field>
              <Field label={t("contract.fees.supervision_percent")}>
                <input className="input" type="number" min="0" max="100" value={form.bank_fee_supervision_percent} onChange={(e) => setF("bank_fee_supervision_percent", e.target.value)} />
              </Field>
              <Field label={t("contract.fees.extra_type")}>
                <RtlSelect className="rtl-select" dir={isAR ? "rtl" : "ltr"} options={EXTRA_FEE_MODE} value={form.bank_fee_extra_mode} onChange={(v) => setF("bank_fee_extra_mode", v)} />
              </Field>
<Field label={t("contract.fees.extra_value")}>
  <NumberField
    value={form.bank_fee_extra_value}
    onChange={(v) => setF("bank_fee_extra_value", v)}
  />
</Field>

            </>
          )}
        </div>
      )}

      {/* (تم حذف بلوك "Tooltips توضيحية" واستبدلناه بإضافات InfoTip بجانب الحقول نفسها) */}

      <StepActions
        onPrev={onPrev}
        onNext={save}
        nextLabel={finishLabel}        // ← زر "إنهاء"
        nextClassName="primary"
      />
    </WizardShell>
  );
}
