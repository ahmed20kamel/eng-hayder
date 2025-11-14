import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../../../services/api";
import Field from "../components/Field";
import WizardShell from "../components/WizardShell";
import StepActions from "../components/StepActions";
import RtlSelect from "../../../components/RtlSelect";
import InfoTip from "../components/InfoTip";

import {
  FaIdCard, FaHashtag, FaCalendarAlt, FaTools, FaUser,
  FaCity, FaMapMarkerAlt, FaSitemap, FaInfoCircle, FaRulerCombined, FaPaperclip
} from "react-icons/fa";

/* ==== تحويلات عربي/إنجليزي للاستخدامات (عرض فقط) ==== */
const EN_AR = { Residential: "سكني", Commercial: "تجاري", Government: "حكومي", Investment: "استثماري" };
const AR_EN = Object.fromEntries(Object.entries(EN_AR).map(([en, ar]) => [ar, en]));
const toLocalizedUse = (v, lang) => (!v ? "" : /^ar\b/i.test(lang) ? (EN_AR[v] || v) : (AR_EN[v] || v));

/* ==== تحويلات التاريخ ==== */
const toInputDate = (d) => {
  if (!d) return "";
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(d);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : d;
};
const toApiDate = (d) => {
  if (!d) return null;
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(d);
  const v = m ? `${m[3]}-${m[2]}-${m[1]}` : d;
  return /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null;
};

/* ==== تنسيق أخطاء الخادم ==== */
function formatServerErrors(data) {
  if (!data) return "";
  const prettyKey = (k) => ({
    non_field_errors: "عام",
    license_type: "نوع الرخصة",
    project_no: "رقم المشروع (المطور)",
    license_project_no: "رقم المشروع (الرخصة)",
    license_project_name: "اسم المشروع (الرخصة)",
    license_no: "رقم الرخصة",
    issue_date: "تاريخ إصدار الرخصة",
    last_issue_date: "تاريخ آخر إصدار",
    license_file_ref: "طلب المشروع",
    project_name: "اسم المشروع (المطور)",
    license_stage_or_worktype: "بيان الأعمال",
    city: "البلدية",
    license_status: "حالة الطلب",
    zone: "المنطقة",
    sector: "الحوض",
    plot_no: "رقم القطعة",
    plot_area_sqm: "مساحة الأرض (م²)",
    land_use: "استخدام الأرض",
    land_use_sub: "استخدام الأرض الفرعي",
    land_plan_no: "رقم مخطط الأرض",
    plot_address: "عنوان القسيمة",
    consultant_name: "الاستشاري",
    consultant_license_no: "رخصة الاستشاري",
    contractor_name: "المقاول",
    contractor_license_no: "رخصة المقاول",
    expiry_date: "تاريخ الانتهاء",
    technical_decision_ref: "مرجع القرار الفني",
    technical_decision_date: "تاريخ القرار الفني",
    license_notes: "ملاحظات",
    owners: "الملاك",
  }[k] || k);

  const lines = [];
  const walk = (value, path = []) => {
    if (Array.isArray(value)) {
      if (value.every((v) => typeof v !== "object")) {
        const key = path.length ? prettyKey(path.at(-1)) : "";
        const txt = value.map(String).join(" • ");
        lines.push(key ? `• ${key}: ${txt}` : `• ${txt}`);
        return;
      }
      value.forEach((item, i) => {
        const last = path.at(-1);
        const label = `${prettyKey(last)} [${i}]`;
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
    lines.push(fullKey ? `• ${fullKey}: ${String(value)}` : `• ${String(value)}`);
  };

  walk(data);
  return lines.join("\n");
}
function formatProjectNumber(raw) {
  if (!raw) return "";
  let v = raw.replace(/[^0-9]/g, ""); // لو أرقام فقط
  // صيغة 3-4-6 مثال: 455-1515-151515
  let p1 = v.slice(0, 3);
  let p2 = v.slice(3, 7);
  let p3 = v.slice(7, 13);

  let out = p1;
  if (p2) out += "-" + p2;
  if (p3) out += "-" + p3;
  return out;
}

/* ==== حقول منقولة من SitePlan وتكون read-only (إذا عرض فقط) ==== */
const RO_FIELDS = new Set([
  "city", "zone", "sector", "plot_no", "plot_area_sqm",
  "land_use", "land_use_sub", "land_plan_no", "plot_address",
  "project_no", "project_name" // ← المطوّر (من الـ Site Plan)
]);
const isRO = (k) => RO_FIELDS.has(k);

export default function LicenseStep({ projectId, onPrev, onNext }) {
  const { t, i18n } = useTranslation();
  const isAR = /^ar\b/i.test(i18n.language || "");

  // لابيلات واضحة تفرّق بين المطوّر والرخصة
  const devParen = ` (${t("developer", "المطور")})`;
  const devProjectNoLabel = `${t("project_no")}${devParen}`;
  const devProjectNameLabel = `${t("project_name_f", t("project_name", "اسم المشروع"))}${devParen}`;

  const licProjectNoLabel = t("license_project_no", isAR ? "رقم المشروع (الرخصة)" : "License Project No");
  const licProjectNameLabel = t("license_project_name", isAR ? "اسم المشروع (الرخصة)" : "License Project Name");

  const readonlyHint = t("no_edit_source_siteplan", isAR ? "قراءة فقط (قادمة من مخطط الأرض)" : "Read-only (filled from Site Plan)");

  const LICENSE_TYPES = useMemo(
    () => ([
      { value: "new_build_empty_land", label: t("license_type") + " - " + (isAR ? "بناء جديد في أرض خالية" : "New build on empty land") },
      { value: "renovation", label: isAR ? "تعديل/ترميم" : "Renovation" },
      { value: "extension", label: isAR ? "إضافة/امتداد" : "Extension" },
    ]),
    [isAR, t]
  );
  /* ===========================
   حفظ / قراءة بيانات الاستشاري والمقاول محلياً
   =========================== */

function loadSavedList(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch {
    return [];
  }
}

function saveToList(key, item) {
  const list = loadSavedList(key);

  // لو الاسم موجود بالفعل — لا تضيفه مرتين
  if (!list.find(x => x.name === item.name)) {
    list.push(item);
    localStorage.setItem(key, JSON.stringify(list));
  }

  return list;
}

const [consultantsList, setConsultantsList] = useState([]);
const [contractorsList, setContractorsList] = useState([]);
const [showConsultantDropdown, setShowConsultantDropdown] = useState(false);
const [showContractorDropdown, setShowContractorDropdown] = useState(false);
const [selectedConsultant, setSelectedConsultant] = useState(null);
const [consultantQuery, setConsultantQuery] = useState("");
const [showConsultantSuggestions, setShowConsultantSuggestions] = useState(false);
const [showContractorSuggestions, setShowContractorSuggestions] = useState(false);

useEffect(() => {
  setConsultantsList(loadSavedList("consultants"));
  setContractorsList(loadSavedList("contractors"));
}, []);

/* ==== تنسيق رقم المشروع تلقائياً ==== */
function formatProjectNumber(raw) {
  if (!raw) return "";
  // إزالة أي أحرف غير مسموحة
  let v = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");

  // تقسيمه على شكل B1N-2024-014159
  let part1 = v.slice(0, 3);
  let part2 = v.slice(3, 7);
  let part3 = v.slice(7, 13);

  let formatted = part1;
  if (part2) formatted += "-" + part2;
  if (part3) formatted += "-" + part3;

  return formatted;
}

/* ==== بناء رقم الرخصة تلقائياً من رقم المشروع ==== */
function buildPermitNumber(projectNo) {
  if (!projectNo) return "";
  return projectNo + "-P01";
}

  /* ======= الحالة ======= */
  const [form, setForm] = useState({
    license_type: "",
    // (المطور) جاية من الـ Site Plan
    project_no: "",
    project_name: "",
    // (الرخصة) جديدة ومنفصلة
    license_project_no: "",
    license_project_name: "",

    license_no: "",
    issue_date: "",
    license_file_ref: "",
    license_stage_or_worktype: "",
    city: "",
    license_status: "",
    zone: "",
    sector: "",
    plot_no: "",
    plot_area_sqm: "",
    land_use: "",
    land_use_sub: "",
    land_plan_no: "",
    plot_address: "",
    consultant_name: "",
    consultant_license_no: "",
    contractor_name: "",
    contractor_license_no: "",
    expiry_date: "",
    technical_decision_ref: "",
    technical_decision_date: "",
    license_notes: "",
    building_license_file: null,
  });

  // أصحاب الملك كأوبجكتات كاملة
  const [owners, setOwners] = useState([]); // [{owner_name_ar, owner_name_en, ...}]
  const [existingId, setExistingId] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [isView, setIsView] = useState(false);
  const setF = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  /* تحميل License موجودة (نفضّل بياناتها) ثم اظهر View */
  useEffect(() => {
    if (!projectId) return;
    (async () => {
      try {
        const { data } = await api.get(`projects/${projectId}/license/`);
        if (Array.isArray(data) && data.length) {
          const s = data[0];
          setExistingId(s.id);
          setForm((prev) => ({
            ...prev,
            ...s,
            issue_date: toInputDate(s.issue_date),
            last_issue_date: toInputDate(s.last_issue_date),
            expiry_date: toInputDate(s.expiry_date),
            technical_decision_date: toInputDate(s.technical_decision_date),
            land_use: toLocalizedUse(s.land_use ?? prev.land_use, i18n.language),
            land_use_sub: toLocalizedUse(s.land_use_sub ?? prev.land_use_sub, i18n.language),
            building_license_file: null,
          }));

          if (Array.isArray(s.owners) && s.owners.length) {
            const normalized = s.owners.map(o => ({
              owner_name_ar: o.owner_name_ar || o.owner_name || "",
              owner_name_en: o.owner_name_en || "",
              nationality: o.nationality || "",
              id_number: o.id_number || "",
              id_issue_date: o.id_issue_date || "",
              id_expiry_date: o.id_expiry_date || "",
              right_hold_type: o.right_hold_type || "Ownership",
              share_possession: o.share_possession || "",
              share_percent: (o.share_percent ?? "").toString(),
              phone: o.phone || "",
              email: o.email || "",
            }));
            if (normalized.length) setOwners(normalized);
          }
          setIsView(true); // ← إظهار “عرض فقط” عند الرجوع للخطوة
        }
      } catch {}
    })();
  }, [projectId, i18n.language]); // eslint-disable-line

  /* قراءة SitePlan دائمًا للفول-باك وملء أولي لحقول المطوّر فقط */
  useEffect(() => {
    if (!projectId) return;
    (async () => {
      try {
        const { data } = await api.get(`projects/${projectId}/siteplan/`);
        if (!Array.isArray(data) || !data.length) return;
        const s = data[0];

        setForm((prev) => {
          const next = { ...prev };
          const landUseRaw    = (s.allocation_name_ar || s.allocation_name || s.allocation_type || "");
          const landUseSubRaw = (s.land_use_ar || s.land_use || "");

          if (!prev.city)          next.city = s.municipality || "";
          if (!prev.zone)          next.zone = s.zone || "";
          if (!prev.plot_no)       next.plot_no = s.land_no || "";
          if (!prev.sector)        next.sector = s.sector || "";
          if (!prev.plot_address)  next.plot_address = s.plot_address || "";
          if (!prev.plot_area_sqm) next.plot_area_sqm = s.plot_area_sqm || "";

          // استخدمات الأرض
          if (!prev.land_use)      next.land_use = toLocalizedUse(landUseRaw, i18n.language);
          if (!prev.land_use_sub)  next.land_use_sub = toLocalizedUse(landUseSubRaw, i18n.language);

          // لا نلمس license_project_* هنا — دي تخص الرخصة فقط
          return next;
        });

        if ((!owners || owners.length === 0) && Array.isArray(s.owners)) {
          const ownersFromSP = s.owners.map(o => ({
            owner_name_ar: o.owner_name_ar || o.owner_name || "",
            owner_name_en: o.owner_name_en || "",
            nationality: o.nationality || "",
            id_number: o.id_number || "",
            id_issue_date: o.id_issue_date || "",
            id_expiry_date: o.id_expiry_date || "",
            right_hold_type: o.right_hold_type || "Ownership",
            share_possession: o.share_possession || "",
            share_percent: (o.share_percent ?? "").toString(),
            phone: o.phone || "",
            email: o.email || "",
          }));
          setOwners(ownersFromSP);
        }
      } catch {}
    })();
  }, [projectId, i18n.language]); // eslint-disable-line

  /* تبديل اللغة → أعد تكييف العرض لاستخدامات الأرض */
  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      land_use: toLocalizedUse(prev.land_use, i18n.language),
      land_use_sub: toLocalizedUse(prev.land_use_sub, i18n.language),
    }));
  }, [i18n.language]);

  /* بناء الحمولة */
  const buildPayload = () => {
    const normalized = {
      ...form,
      issue_date: toApiDate(form.issue_date),
      last_issue_date: toApiDate(form.last_issue_date),
      expiry_date: toApiDate(form.expiry_date),
      technical_decision_date: toApiDate(form.technical_decision_date),
    };

    if (normalized.last_issue_date && normalized.issue_date) {
      const last = new Date(normalized.last_issue_date);
      const first = new Date(normalized.issue_date);
      if (last < first) {
        throw new Error(isAR
          ? "تاريخ آخر إصدار يجب أن يكون بعد أو مساويًا لتاريخ الإصدار."
          : "Last issue date must be on or after the issue date.");
      }
    }

    const fd = new FormData();
    Object.entries(normalized).forEach(([k, v]) => {
      if (v === null || v === undefined || v === "") return;
      if (typeof v === "object" && !(v instanceof File) && !(v instanceof Blob)) {
        fd.append(k, JSON.stringify(v));
      } else {
        fd.append(k, v);
      }
    });

    // سنابشوت الملاك داخل الرخصة
    if (Array.isArray(owners) && owners.length) {
      fd.append("owners", JSON.stringify(owners));
    }

    if (form.building_license_file) {
      fd.append("building_license_file", form.building_license_file);
    }
    return fd;
  };
// حفظ الاستشاري في القائمة
// حفظ الاستشاري


const saveAndNext = async () => {
  if (!projectId) {
    setErrorMsg(t("open_specific_project_to_save"));
    return;
  }

  try {
    // حفظ الاستشاري في LocalStorage
    if (form.consultant_name && form.consultant_license_no) {
      const updated = saveToList("consultants", {
        name: form.consultant_name,
        license: form.consultant_license_no
      });
      setConsultantsList(updated);
    }

    // حفظ المقاول في LocalStorage
    if (form.contractor_name && form.contractor_license_no) {
      const updated = saveToList("contractors", {
        name: form.contractor_name,
        license: form.contractor_license_no
      });
      setContractorsList(updated);
    }

    const payload = buildPayload();

    if (existingId) {
      await api.patch(`projects/${projectId}/license/${existingId}/`, payload);
    } else {
      const { data: created } = await api.post(`projects/${projectId}/license/`, payload);
      if (created?.id) setExistingId(created.id);
    }

    setErrorMsg("");
    setIsView(true);

    if (onNext) onNext();

  } catch (err) {
    const serverData = err?.response?.data;
    const formatted = formatServerErrors(serverData);
    const fallback = err?.message || (serverData ? JSON.stringify(serverData, null, 2) : t("save_failed"));
    setErrorMsg(formatted || fallback);
  }
};


  /* ====== واجهة العرض (View) لمقاطع مختلفة ====== */
  const ViewRow = ({ label, value, icon: Icon }) => (
    <Field label={label} icon={Icon}>
      <div>{value || "—"}</div>
    </Field>
  );

  /* الواجهة */
  return (
    <WizardShell icon={FaIdCard} title={t("wizard_step_license")}>
      {errorMsg && (
        <div role="dialog" aria-modal="true"
             style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.35)", zIndex: 2000, display: "grid", placeItems: "center" }}>
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

      {/* أعلى الصفحة: بيانات الرخصة + مشاريع المطور/الرخصة */}
      <h4>{t("license_details")}</h4>
      {isView ? (
        <div className="form-grid cols-3">
          <ViewRow label={t("license_type")} value={LICENSE_TYPES.find(x => x.value === form.license_type)?.label || form.license_type} icon={FaTools} />
          <ViewRow label={t("license_no")} value={form.license_no} icon={FaHashtag} />
<ViewRow label={t("issue_date_first")} value={form.issue_date} icon={FaCalendarAlt} />


          {/* (الرخصة) — تظهر دائمًا */}
          <ViewRow label={licProjectNoLabel} value={form.license_project_no} icon={FaHashtag} />

          <ViewRow label={t("attach_building_license")} value={form.building_license_file ? t("file_attached") : t("no_file")} icon={FaPaperclip} />
        </div>
      ) : (
        <div className="form-grid cols-3">
          {/* نوع الرخصة */}
          <Field label={t("license_type")} icon={FaTools}>
            <div className="row" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <RtlSelect
                className="rtl-select"
                options={LICENSE_TYPES}
                value={form.license_type}
                onChange={(v) => setF("license_type", v)}
                placeholder={t("select_license_type")}
              />
              <InfoTip align="start" text={t("note_take_data_as_in_license")} />
            </div>
          </Field>
<Field label={t("license_no")} icon={FaHashtag}>
  <input
    className="input"
    value={form.license_no}
    onChange={(e) => setF("license_no", e.target.value)}
  />
</Field>


<Field label="تاريخ أول إصدار" icon={FaCalendarAlt}>
  <input
    className="input"
    type="date"
    value={form.issue_date || ""}
    onChange={(e) => setF("issue_date", e.target.value)}
  />
</Field>


<Field label={licProjectNoLabel} icon={FaHashtag}>
  <input
    className="input"
    value={form.license_project_no}
    onChange={(e) => {
      const formatted = formatProjectNumber(e.target.value);

      // تحديث رقم المشروع
      setF("license_project_no", formatted);

      // تحديث رقم الرخصة فقط لو المستخدم لم يضف شيء بعد الشرطة
      if (!form.license_no || form.license_no.startsWith(form.license_project_no)) {
        setF("license_no", formatted + "-"); // ← الشرطة المطلوبة
      }
    }}
  />
</Field>



          {/* الإرفاق */}
          <Field label={t("attach_building_license")} icon={FaPaperclip}>
            <div className="row" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                className="input"
                type="file"
                onChange={(e) => setF("building_license_file", e.target.files?.[0] || null)}
              />
              <InfoTip align="start" text={t("please_attach_building_license")} />
            </div>
          </Field>
        </div>
      )}

      {/* 2) بيانات الأرض */}
      <h4 className="mt-16">{t("land_details")}</h4>
      {isView ? (
        <div className="form-grid cols-4">
          <ViewRow label={t("zone")} value={form.zone} icon={FaMapMarkerAlt} />
          <ViewRow label={t("sector")} value={form.sector} icon={FaSitemap} />
          <ViewRow label={t("plot_no")} value={form.plot_no} icon={FaHashtag} />
          <ViewRow label={t("plot_area_sqm")} value={form.plot_area_sqm} icon={FaRulerCombined} />
          <ViewRow label={t("land_use")} value={form.land_use} icon={FaSitemap} />
          <ViewRow label={t("land_use_sub")} value={form.land_use_sub} icon={FaSitemap} />
          <ViewRow label={t("plot_address")} value={form.plot_address} icon={FaCity} />
        </div>
      ) : (
        <div className="form-grid cols-4">
          <Field label={t("zone")} icon={FaMapMarkerAlt}>
            <input
              className={`input ${isRO("zone") ? "readonly" : ""}`}
              value={form.zone}
              readOnly={isRO("zone")}
              title={isRO("zone") ? readonlyHint : ""}
              onChange={isRO("zone") ? undefined : (e) => setF("zone", e.target.value)}
            />
          </Field>
          <Field label={t("sector")} icon={FaSitemap}>
            <input
              className={`input ${isRO("sector") ? "readonly" : ""}`}
              value={form.sector}
              readOnly={isRO("sector")}
              title={isRO("sector") ? readonlyHint : ""}
              onChange={isRO("sector") ? undefined : (e) => setF("sector", e.target.value)}
            />
          </Field>
          <Field label={t("plot_no")} icon={FaHashtag}>
            <input
              className={`input ${isRO("plot_no") ? "readonly" : ""}`}
              value={form.plot_no}
              readOnly={isRO("plot_no")}
              title={isRO("plot_no") ? readonlyHint : ""}
              onChange={isRO("plot_no") ? undefined : (e) => setF("plot_no", e.target.value)}
            />
          </Field>
          <Field label={t("plot_area_sqm")} icon={FaRulerCombined}>
            <input
              className={`input ${isRO("plot_area_sqm") ? "readonly" : ""}`}
              type={isRO("plot_area_sqm") ? "text" : "number"}
              value={form.plot_area_sqm}
              readOnly={isRO("plot_area_sqm")}
              title={isRO("plot_area_sqm") ? readonlyHint : ""}
              onChange={isRO("plot_area_sqm") ? undefined : (e) => setF("plot_area_sqm", e.target.value)}
            />
          </Field>
          <Field label={t("land_use")} icon={FaSitemap}>
            <input
              className={`input ${isRO("land_use") ? "readonly" : ""}`}
              value={form.land_use}
              readOnly={isRO("land_use")}
              title={isRO("land_use") ? readonlyHint : ""}
              onChange={isRO("land_use") ? undefined : (e) => setF("land_use", e.target.value)}
            />
          </Field>
          <Field label={t("land_use_sub")} icon={FaSitemap}>
            <input
              className={`input ${isRO("land_use_sub") ? "readonly" : ""}`}
              value={form.land_use_sub}
              readOnly={isRO("land_use_sub")}
              title={isRO("land_use_sub") ? readonlyHint : ""}
              onChange={isRO("land_use_sub") ? undefined : (e) => setF("land_use_sub", e.target.value)}
            />
          </Field>
          <Field label={t("plot_address")} icon={FaCity}>
            <input
              className={`input ${isRO("plot_address") ? "readonly" : ""}`}
              value={form.plot_address}
              readOnly={isRO("plot_address")}
              title={isRO("plot_address") ? readonlyHint : ""}
              onChange={isRO("plot_address") ? undefined : (e) => setF("plot_address", e.target.value)}
            />
          </Field>
        </div>
      )}

      {/* 3) بيانات الملاك */}
      <h4 className="mt-16">{t("owner_details")}</h4>
      {owners && owners.length ? (
        owners.map((o, i) => (
          <div key={i} className="owner-block">
            <div className="form-grid cols-3">
              <Field label={t("owner_name_ar")} icon={FaUser}>
                {isView ? (
                  <div>{o.owner_name_ar || "—"}</div>
                ) : (
                  <input className="input readonly" readOnly value={o.owner_name_ar || ""} title={readonlyHint} />
                )}
              </Field>
              <Field label={t("owner_name_en")} icon={FaUser}>
                {isView ? (
                  <div>{o.owner_name_en || "—"}</div>
                ) : (
                  <input className="input readonly" readOnly value={o.owner_name_en || ""} title={readonlyHint} />
                )}
              </Field>
              <div />
            </div>
          </div>
        ))
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
          <InfoTip align="start" text={t("no_owners_in_siteplan")} />
        </div>
      )}

{/* 4) الاستشاري */}
<h4 className="mt-16">{t("consultant_details")}</h4>
<div className="form-grid cols-4">
  
  {/* 🔵 حقل الاستشاري (Search + Input) */}
  <Field label={t("consultant")} icon={FaUser}>
    <div style={{ position: "relative" }}>
      
      <input
        className="input"
        placeholder="اكتب أو ابحث عن اسم الاستشاري"
        value={form.consultant_name}
        onChange={(e) => {
          setF("consultant_name", e.target.value);
          setConsultantQuery(e.target.value);
          setShowConsultantSuggestions(true);
        }}
        onFocus={() => setShowConsultantSuggestions(true)}
        onBlur={() => setTimeout(() => setShowConsultantSuggestions(false), 150)}
      />

      {/* 🔵 قائمة الاقتراحات */}
      {showConsultantSuggestions && consultantQuery && (
        <div
          style={{
            position: "absolute",
            background: "white",
            border: "1px solid #ccc",
            width: "100%",
            maxHeight: "180px",
            overflowY: "auto",
            zIndex: 1000,
          }}
        >
          {consultantsList
            .filter((c) =>
              c.name.toLowerCase().includes(consultantQuery.toLowerCase())
            )
            .map((c, i) => (
              <div
                key={i}
                style={{ padding: "8px", cursor: "pointer" }}
                onMouseDown={() => {
                  setF("consultant_name", c.name);
                  setF("consultant_license_no", c.license);
                  setConsultantQuery(c.name);
                }}
              >
                {c.name}
              </div>
            ))}

          {/* لو مفيش نتائج */}
          {consultantsList.filter((c) =>
            c.name.toLowerCase().includes(consultantQuery.toLowerCase())
          ).length === 0 && (
            <div style={{ padding: "8px", opacity: 0.6 }}>
              لا يوجد — اكتب اسم جديد
            </div>
          )}
        </div>
      )}
    </div>
  </Field>

  {/* 🔵 رقم رخصة الاستشاري */}
  <Field label={t("consultant_lic")} icon={FaHashtag}>
    <input
      className="input"
      placeholder="اكتب رقم رخصة الاستشاري"
      value={form.consultant_license_no}
      onChange={(e) => setF("consultant_license_no", e.target.value)}
    />
  </Field>
</div>

{/* 5) المقاول */}
<h4 className="mt-16">{t("contractor_details")}</h4>

{isView ? (
  <div className="form-grid cols-4">
    <ViewRow
      label={t("contractor")}
      value={form.contractor_name}
      icon={FaUser}
    />
    <ViewRow
      label={t("contractor_lic")}
      value={form.contractor_license_no}
      icon={FaHashtag}
    />
  </div>
) : (
  <div className="form-grid cols-4">

    {/* 🔵 حقل المقاول (بحث + كتابة) */}
    <Field label={t("contractor")} icon={FaUser}>
      <div style={{ position: "relative" }}>

        <input
          className="input"
          placeholder="اكتب أو ابحث عن اسم المقاول"
          value={form.contractor_name}
          onChange={(e) => {
            setF("contractor_name", e.target.value);
            setShowContractorSuggestions(true);
          }}
          onFocus={() => setShowContractorSuggestions(true)}
          onBlur={() =>
            setTimeout(() => setShowContractorSuggestions(false), 150)
          }
        />

        {/* قائمة الاقتراحات */}
        {showContractorSuggestions && form.contractor_name && (
          <div
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              background: "white",
              border: "1px solid #ccc",
              zIndex: 1000,
              maxHeight: "200px",
              overflowY: "auto",
            }}
          >
            {contractorsList
              .filter((c) =>
                c.name
                  .toLowerCase()
                  .includes(form.contractor_name.toLowerCase())
              )
              .map((c, i) => (
                <div
                  key={i}
                  style={{ padding: "8px", cursor: "pointer" }}
                  onMouseDown={() => {
                    setF("contractor_name", c.name);
                    setF("contractor_license_no", c.license);
                  }}
                >
                  {c.name}
                </div>
              ))}

            {contractorsList.filter((c) =>
              c.name.toLowerCase().includes(form.contractor_name.toLowerCase())
            ).length === 0 && (
              <div style={{ padding: "8px", opacity: 0.7 }}>
                لا يوجد — اكتب اسم جديد
              </div>
            )}
          </div>
        )}
      </div>
    </Field>

    {/* 🔵 رقم رخصة المقاول */}
    <Field label={t("contractor_lic")} icon={FaHashtag}>
      <input
        className="input"
        placeholder="اكتب رقم رخصة المقاول"
        value={form.contractor_license_no}
        onChange={(e) =>
          setF("contractor_license_no", e.target.value)
        }
      />
    </Field>

  </div>
)}


      <StepActions onPrev={onPrev} onNext={saveAndNext} />
    </WizardShell>
  );
}
