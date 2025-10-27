// src/pages/wizard/steps/ContractStep.jsx
import { useEffect, useMemo, useState } from "react";
import { api } from "../../../services/api";
import WizardShell from "../components/WizardShell";
import StepActions from "../components/StepActions";
import Field from "../components/Field";
import RtlSelect from "../../../components/RtlSelect";
import {
  FaFileSignature, FaList, FaCalendarAlt, FaHashtag, FaInfoCircle,
  FaUserTie, FaUser, FaIdCard, FaMoneyBillWave, FaBalanceScale
} from "react-icons/fa";

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
// تاريخ اليوم + اسم اليوم بالعربية
const todayIso = () => {
  const t = new Date();
  const mm = String(t.getMonth() + 1).padStart(2, "0");
  const dd = String(t.getDate()).padStart(2, "0");
  return `${t.getFullYear()}-${mm}-${dd}`;
};
const dayNameAr = (dateStr) => {
  try {
    const d = dateStr ? new Date(dateStr) : new Date();
    const days = ["الأحد","الاثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت"];
    return days[d.getDay()];
  } catch { return ""; }
};

/* === تنسيق أخطاء الخادم === */
function formatServerErrors(data) {
  if (!data) return "";
  const prettyKey = (k) => ({
    non_field_errors: "عام",
    contract_type: "نوع العقد",
    lump_sum_mode: "تصنيف عقد المقطوعية",
    tender_no: "رقم العقد",
    contract_date: "تاريخ العقد",
    owners: "الملاك",
    contractor_name: "اسم المقاول",
    contractor_trade_license: "الرخصة التجارية",
    total_project_value: "قيمة الأعمال الإجمالية للمشروع",
    total_bank_value: "قيمة أعمال تمويل البنك",
    total_owner_value: "قيمة أعمال تمويل المالك",
    project_duration_months: "مدة المشروع (بالأشهر)",
    owner_includes_consultant: "يشمل أتعاب الاستشاري ضمن تمويل المالك",
    owner_fee_design_percent: "نسبة أتعاب التصميم (المالك)",
    owner_fee_supervision_percent: "نسبة أتعاب الإشراف (المالك)",
    owner_fee_extra_mode: "نوع الأتعاب الإضافية (المالك)",
    owner_fee_extra_value: "قيمة الأتعاب الإضافية (المالك)",
    bank_includes_consultant: "يشمل أتعاب الاستشاري ضمن تمويل البنك",
    bank_fee_design_percent: "نسبة أتعاب التصميم (البنك)",
    bank_fee_supervision_percent: "نسبة أتعاب الإشراف (البنك)",
    bank_fee_extra_mode: "نوع الأتعاب الإضافية (البنك)",
    bank_fee_extra_value: "قيمة الأتعاب الإضافية (البنك)",
  }[k] || k);

  const lines = [];
  const walk = (value, path = []) => {
    if (Array.isArray(value)) {
      if (value.every(v => typeof v !== "object")) {
        const key = path.length ? prettyKey(path.at(-1)) : "";
        lines.push(`• ${key ? key + ": " : ""}${value.map(String).join(" • ")}`);
        return;
      }
      value.forEach((item, i) => {
        const last = path.at(-1);
        const label = last ? `${prettyKey(last)} [${i}]` : `[${i}]`;
        if (typeof item !== "object") lines.push(`• ${label}: ${String(item)}`);
        else Object.entries(item || {}).forEach(([k, v]) =>
          walk(v, [...path.slice(0, -1), `${label} → ${prettyKey(k)}`])
        );
      });
      return;
    }
    if (typeof value === "object" && value) {
      for (const [k, v] of Object.entries(value)) walk(v, [...path, k]);
      return;
    }
    const key = path.length ? prettyKey(path.at(-1)) : "";
    const prefix = path.slice(0, -1)
      .map((p) => (String(p).includes("→") ? p : prettyKey(p)))
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

/* === عرض مفاتيح المالك بتسميات عربية شائعة، وأي مفاتيح إضافية كما هي === */
const prettyOwnerKey = (k) => ({
  owner_name_ar: "الاسم (عربي)",
  owner_name_en: "الاسم (English)",
  owner_name: "اسم المالك",
  nationality: "الجنسية",
  id_number: "رقم الهوية",
  id_issue_date: "تاريخ إصدار الهوية",
  id_expiry_date: "تاريخ انتهاء الهوية",
  right_hold_type: "نوع الحق",
  share_possession: "الحصّة/الحيازة",
  share_percent: "نسبة الملكية %",
  phone: "الهاتف",
  email: "البريد الإلكتروني",
  address: "العنوان",
}[k] || k);

/* ============== المكون الرئيسي ============== */
export default function ContractStep({ projectId, onPrev, onNext }) {
  /* ====== قوائم ثابتة ====== */
  const CONTRACT_TYPES = useMemo(
    () => ([
      { value: "lump_sum", label: "عقد مقاولة بالمقطوعية" },
      { value: "type_b",   label: "نوع عقد 2" },
      { value: "type_c",   label: "نوع عقد 3" },
    ]),
    []
  );

  const LUMP_SUM_MODES = useMemo(
    () => ([
      { value: "private_contract", label: "عقد خاص" },
      { value: "housing_loan_program", label: "عقد مخصص لبرامج مشروع قرض الإسكان" },
    ]),
    []
  );

  const EXTRA_FEE_MODE = useMemo(
    () => ([
      { value: "percent", label: "نسبة مئوية %" },
      { value: "fixed",   label: "مبلغ مقطوع" },
    ]),
    []
  );

  /* ====== الحالة ====== */
  const [form, setForm] = useState({
    // نوع العقد
    contract_type: "",
    lump_sum_mode: "",
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

        // SitePlan → owners (خذهم كما هم بالكامل، دون فلترة)
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
    if (!form.contract_type) throw new Error("يرجى اختيار نوع عقد المقاولة.");
    if (form.contract_type === "lump_sum" && !form.lump_sum_mode) {
      throw new Error("يرجى اختيار تصنيف عقد المقطوعية.");
    }
    if (!form.contract_date) throw new Error("يرجى تحديد تاريخ العقد.");

    const total = num(form.total_project_value, NaN);
    const bank  = num(form.total_bank_value, NaN);
    const owner = num(form.total_owner_value, NaN);
    if (!Number.isFinite(total) || total <= 0) throw new Error("قيمة الأعمال الإجمالية للمشروع يجب أن تكون رقمًا أكبر من صفر.");
    if (!Number.isFinite(bank) || bank < 0)  throw new Error("قيمة أعمال تمويل البنك يجب أن تكون رقمًا صفرًا فأعلى.");
    if (owner !== Math.max(0, total - bank)) throw new Error("حساب تمويل المالك غير مطابق، وسيتم احتسابه آليًا من الإجمالي مطروحًا منه تمويل البنك.");

    // أرسل الملاك كما هم تمامًا
    return {
      contract_type: form.contract_type,
      lump_sum_mode: form.contract_type === "lump_sum" ? form.lump_sum_mode : "",
      tender_no: form.tender_no || "",
      contract_date: toApiDate(form.contract_date),
      owners: form.owners || [],
      contractor_name: form.contractor_name || "",
      contractor_trade_license: form.contractor_trade_license || "",
      total_project_value: total,
      total_bank_value: bank,
      total_owner_value: Math.max(0, total - bank),
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
      setErrorMsg("افتح المعالج من مشروع محدد ليتم الحفظ على الخادم.");
      return;
    }
    try {
      const payload = buildPayload();
      if (existingId) await api.patch(`projects/${projectId}/contract/${existingId}/`, payload);
      else await api.post(`projects/${projectId}/contract/`, payload);
      setErrorMsg("");
      if (onNext) onNext();
    } catch (err) {
      const serverData = err?.response?.data;
      const formatted = formatServerErrors(serverData);
      const fallback = err?.message || (serverData ? JSON.stringify(serverData, null, 2) : "تعذّر الحفظ");
      setErrorMsg(formatted || fallback);
    }
  };

  /* ====== الواجهة ====== */
  const showLumpSumMode = form.contract_type === "lump_sum";
  const showOwnerFees   = form.owner_includes_consultant === "yes";
  const showBankFees    = form.bank_includes_consultant === "yes";

  // ترتيب عرض شائع لبعض المفاتيح ثم أي مفاتيح إضافية
  const ownerKeyOrder = [
    "owner_name_ar","owner_name_en","owner_name",
    "nationality","id_number","id_issue_date","id_expiry_date",
    "share_percent","right_hold_type","share_possession",
    "phone","email","address"
  ];

  return (
    <WizardShell icon={FaFileSignature} title="العقد">
      {/* مودال الخطأ */}
      {errorMsg && (
        <div
          role="dialog"
          aria-modal="true"
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.35)", zIndex: 2000, display: "grid", placeItems: "center" }}
        >
          <div className="card" style={{ maxWidth: 720, width: "92%", direction: "rtl" }}>
            <div className="row" style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <h3 style={{ margin: 0 }}>تنبيه ⚠️</h3>
            </div>
            <div className="alert error" style={{ marginBottom: 12 }}>
              <div className="title">خطأ أثناء الحفظ</div>
            </div>
            <pre style={{ whiteSpace: "pre-wrap", margin: 0, fontFamily: "inherit", fontSize: "18px", lineHeight: 1.7 }}>
              {errorMsg}
            </pre>
            <div className="row" style={{ justifyContent: "flex-start", marginTop: 16 }}>
              <button className="btn" type="button" onClick={() => setErrorMsg("")}>تم</button>
            </div>
          </div>
        </div>
      )}

      {/* نوع العقد */}
      <h4>نوع عقد المقاولة</h4>
      <div className="form-grid cols-3">
        <Field label="نوع العقد" icon={FaList}>
          <RtlSelect
            className="rtl-select"
            options={CONTRACT_TYPES}
            value={form.contract_type}
            onChange={(v) => setF("contract_type", v)}
            placeholder="اختر نوع العقد"
          />
        </Field>

        {showLumpSumMode && (
          <Field label="تصنيف عقد المقطوعية">
            <div className="chips">
              {LUMP_SUM_MODES.map(m => (
                <button
                  key={m.value}
                  type="button"
                  className={`chip ${form.lump_sum_mode === m.value ? "active" : ""}`}
                  onClick={() => setF("lump_sum_mode", m.value)}
                >
                  {m.label}
                </button>
              ))}
            </div>
            <div className="mini mt-4"><FaInfoCircle aria-hidden /> اختر واحد فقط.</div>
          </Field>
        )}
      </div>

      {/* بيانات عامة */}
      <h4 className="mt-16">بيانات العقد</h4>
      <div className="form-grid cols-3">
        <Field label="رقم  العقد" icon={FaHashtag}>
          <input className="input" value={form.tender_no} onChange={(e) => setF("tender_no", e.target.value)} />
        </Field>
        <Field label="تاريخ العقد" icon={FaCalendarAlt}>
          <input
            className="input"
            type="date"
            value={form.contract_date || ""}
            onChange={(e) => setF("contract_date", e.target.value)}
          />
          {form.contract_date && (
            <div className="mini mt-4">
              <FaInfoCircle aria-hidden /> <span>اليوم: {dayNameAr(form.contract_date)}</span>
            </div>
          )}
        </Field>
      </div>

      {/* الأطراف */}
      <h4 className="mt-16">الأطراف</h4>
      <div className="form-grid cols-2">
        <Field label="الطرف الأول (المالك)" icon={FaUser}>
          {form.owners?.length ? (
            <div className="mini" style={{ lineHeight: 1.9 }}>
              {form.owners.map((o, i) => {
                // جهّز مفاتيح العرض: أولًا المتعارف عليها ثم أي مفاتيح إضافية
                const known = ownerKeyOrder.filter((k) => o[k] !== undefined);
                const extras = Object.keys(o).filter(
                  (k) =>
                    !known.includes(k) &&
                    k !== "id_attachment" &&
                    typeof o[k] !== "object"
                );
                const keysToShow = [...known, ...extras];

                return (
                  <div key={i} style={{ padding: "8px 10px", border: "1px solid #eee", borderRadius: 6, marginBottom: 8 }}>
                    {keysToShow.map((k) => {
                      const v = o[k];
                      if (v === "" || v === null || v === undefined) return null;
                      return (
                        <div key={k}>
                          <strong>{prettyOwnerKey(k)}:</strong> {String(v)}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="info-note"><FaInfoCircle aria-hidden /> <div>لا توجد بيانات ملاك — تأكد من حفظ مخطط الأرض.</div></div>
          )}
        </Field>

        <Field label="الطرف الثاني (المقاول)" icon={FaUserTie}>
          <div className="row" style={{ gap: 8, alignItems: "center" }}>
            <input className="input" placeholder="اسم المقاول" value={form.contractor_name} onChange={(e) => setF("contractor_name", e.target.value)} />
          </div>
          <div className="row mt-6" style={{ gap: 8, alignItems: "center" }}>
            <FaIdCard aria-hidden />
            <input className="input" placeholder="الرخصة التجارية" value={form.contractor_trade_license} onChange={(e) => setF("contractor_trade_license", e.target.value)} />
          </div>
          <div className="mini mt-4"><FaInfoCircle aria-hidden /> إذا كانت الرخصة والاسم متوفرين من الرخصة سيتم ملؤهما تلقائيًا.</div>
        </Field>
      </div>

      {/* قيم المشروع */}
      <h4 className="mt-16">القيم والمدة</h4>
      <div className="form-grid cols-4">
        <Field label="قيمة الأعمال الإجمالية للمشروع" icon={FaMoneyBillWave}>
          <input className="input" type="number" min="0" value={form.total_project_value} onChange={(e) => setF("total_project_value", e.target.value)} />
        </Field>
        <Field label="قيمة أعمال تمويل البنك الإجمالية" icon={FaMoneyBillWave}>
          <input className="input" type="number" min="0" value={form.total_bank_value} onChange={(e) => setF("total_bank_value", e.target.value)} />
        </Field>
        <Field label="قيمة أعمال تمويل المالك الإجمالية (محسوبة)" icon={FaBalanceScale}>
          <input className="input" type="number" value={form.total_owner_value} readOnly />
        </Field>
        <Field label="مدة المشروع (بالأشهر)" icon={FaHashtag}>
          <input className="input" type="number" min="0" value={form.project_duration_months} onChange={(e) => setF("project_duration_months", e.target.value)} />
        </Field>
      </div>

      {/* أتعاب الاستشاري — تمويل المالك */}
      <h4 className="mt-16">أتعاب الاستشاري ضمن مبلغ تمويل المالك؟</h4>
      <div className="form-grid cols-3">
        <Field label="يشمل أتعاب الاستشاري؟">
          <div className="chips">
            {["no","yes"].map(v => (
              <button
                key={v}
                type="button"
                className={`chip ${form.owner_includes_consultant === v ? "active" : ""}`}
                onClick={() => setF("owner_includes_consultant", v)}
              >
                {v === "yes" ? "نعم" : "لا"}
              </button>
            ))}
          </div>
        </Field>

        {showOwnerFees && (
          <>
            <Field label="نسبة أتعاب التصميم (%)">
              <input className="input" type="number" min="0" max="100" value={form.owner_fee_design_percent} onChange={(e) => setF("owner_fee_design_percent", e.target.value)} />
            </Field>
            <Field label="نسبة أتعاب الإشراف (%)">
              <input className="input" type="number" min="0" max="100" value={form.owner_fee_supervision_percent} onChange={(e) => setF("owner_fee_supervision_percent", e.target.value)} />
            </Field>
            <Field label="نوع أتعاب إضافية">
              <RtlSelect className="rtl-select" options={EXTRA_FEE_MODE} value={form.owner_fee_extra_mode} onChange={(v) => setF("owner_fee_extra_mode", v)} />
            </Field>
            <Field label="قيمة الأتعاب الإضافية">
              <input
                className="input"
                type="number"
                min="0"
                value={form.owner_fee_extra_value}
                onChange={(e) => setF("owner_fee_extra_value", e.target.value)}
                placeholder={form.owner_fee_extra_mode === "percent" ? "نسبة %" : "مبلغ"}
              />
            </Field>
          </>
        )}
      </div>

      {/* أتعاب الاستشاري — تمويل البنك */}
      <h4 className="mt-16">أتعاب الاستشاري ضمن مبلغ تمويل البنك؟</h4>
      <div className="form-grid cols-3">
        <Field label="يشمل أتعاب الاستشاري؟">
          <div className="chips">
            {["no","yes"].map(v => (
              <button
                key={v}
                type="button"
                className={`chip ${form.bank_includes_consultant === v ? "active" : ""}`}
                onClick={() => setF("bank_includes_consultant", v)}
              >
                {v === "yes" ? "نعم" : "لا"}
              </button>
            ))}
          </div>
        </Field>

        {showBankFees && (
          <>
            <Field label="نسبة أتعاب التصميم (%)">
              <input className="input" type="number" min="0" max="100" value={form.bank_fee_design_percent} onChange={(e) => setF("bank_fee_design_percent", e.target.value)} />
            </Field>
            <Field label="نسبة أتعاب الإشراف (%)">
              <input className="input" type="number" min="0" max="100" value={form.bank_fee_supervision_percent} onChange={(e) => setF("bank_fee_supervision_percent", e.target.value)} />
            </Field>
            <Field label="نوع أتعاب إضافية">
              <RtlSelect className="rtl-select" options={EXTRA_FEE_MODE} value={form.bank_fee_extra_mode} onChange={(v) => setF("bank_fee_extra_mode", v)} />
            </Field>
            <Field label="قيمة الأتعاب الإضافية">
              <input
                className="input"
                type="number"
                min="0"
                value={form.bank_fee_extra_value}
                onChange={(e) => setF("bank_fee_extra_value", e.target.value)}
                placeholder={form.bank_fee_extra_mode === "percent" ? "نسبة %" : "مبلغ"}
              />
            </Field>
          </>
        )}
      </div>

      <StepActions onPrev={onPrev} onNext={save} />
    </WizardShell>
  );
}
