// src/pages/wizard/steps/LicenseStep.jsx
import { useEffect, useMemo, useState } from "react";
import { api } from "../../../services/api";
import Field from "../components/Field";
import WizardShell from "../components/WizardShell";
import StepActions from "../components/StepActions";
import RtlSelect from "../../../components/RtlSelect";

import {
  FaIdCard, FaHashtag, FaClipboardList, FaCalendarAlt, FaTools, FaUser,
  FaCity, FaMapMarkerAlt, FaSitemap, FaInfoCircle, FaRulerCombined, FaPaperclip
} from "react-icons/fa";

/* ==== تنسيق أخطاء الخادم ==== */
function formatServerErrors(data) {
  if (!data) return "";
  const prettyKey = (k) => ({
    non_field_errors: "عام",
    license_type: "نوع الرخصة",
    project_no: "رقم المشروع",
    license_no: "رقم الرخصة",
    issue_date: "تاريخ إصدار الرخصة",
    last_issue_date: "تاريخ آخر إصدار",
    license_file_ref: "طلب المشروع",
    project_name: "اسم المشروع",
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

/* ==== تواريخ (نفس أسلوب SitePlanStep) ==== */
const toInputDate = (d) => {
  if (!d) return "";
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(d); // dd/mm/yyyy
  return m ? `${m[3]}-${m[2]}-${m[1]}` : d;        // yyyy-mm-dd
};

// تطبيع لواجهة البرمجة: إرجاع YYYY-MM-DD أو null عند الفراغ
const toApiDate = (d) => {
  if (!d) return null;
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(d); // dd/mm/yyyy
  const v = m ? `${m[3]}-${m[2]}-${m[1]}` : d;
  return /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null;
};

/* ==== خرائط تحويل استخدامات EN -> AR ==== */
const EN_AR = {
  Residential: "سكني",
  Commercial: "تجاري",
  Government: "حكومي",
  Investment: "استثماري",
};
const toAr = (v) => (v && EN_AR[v]) || v || "";

export default function LicenseStep({ projectId, onPrev, onNext }) {
  /* =================== قوائم ثابتة =================== */
  const LICENSE_TYPES = useMemo(
    () => ([
      { value: "new_build_empty_land", label: "بناء جديد في أرض خالية" },
      { value: "renovation", label: "تعديل/ترميم" },
      { value: "extension", label: "إضافة/امتداد" },
    ]),
    []
  );

  /* =================== الحالة =================== */
  const [form, setForm] = useState({
    // أعلى الصفحة
    license_type: "",
    // بيانات الرخصة
    project_no: "",
    license_no: "",
    issue_date: "",
    last_issue_date: "",
    // إضافي
    license_file_ref: "",
    project_name: "",
    license_stage_or_worktype: "",
    city: "",
    license_status: "",
    // بيانات الأرض
    zone: "",
    sector: "",
    plot_no: "",
    plot_area_sqm: "",     // مساحة الأرض (م²)
    land_use: "",
    land_use_sub: "",
    land_plan_no: "",
    plot_address: "",
    // الاستشاري/المقاول
    consultant_name: "",
    consultant_license_no: "",
    contractor_name: "",
    contractor_license_no: "",
    // اختياري
    expiry_date: "",
    technical_decision_ref: "",
    technical_decision_date: "",
    license_notes: "",
    // ملف رخصة البناء
    building_license_file: null,
  });

  // قائمة أسماء الملاك فقط (من SitePlan)
  const [ownerNames, setOwnerNames] = useState([]);

  const [existingId, setExistingId] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const setF = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  /* =================== تحميل License موجود =================== */
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
            // تأكد من عرض العربي حتى لو المتخزن إنجليزي
            land_use: toAr(s.land_use || prev.land_use),
            land_use_sub: toAr(s.land_use_sub || prev.land_use_sub),
            building_license_file: null,
          }));
        }
      } catch {}
    })();
  }, [projectId]); // eslint-disable-line

  /* =================== ربط مع SitePlan =================== */
  useEffect(() => {
    if (!projectId) return;
    (async () => {
      try {
        const { data } = await api.get(`projects/${projectId}/siteplan/`);
        if (!Array.isArray(data) || !data.length) return;
        const s = data[0];

        // اجمع أسماء الملاك فقط — نفضّل العربي ثم owner_name (عام) ثم الإنجليزي
        const names =
          Array.isArray(s.owners)
            ? s.owners
                .map((o) => (o.owner_name_ar || o.owner_name || o.owner_name_en || "").trim())
                .filter(Boolean)
            : [];
        setOwnerNames(names);

        // نقرأ الاستخدامات من السايت بلان — العربي أولاً، وإلا نحول الإنجليزي لعربي
        const landUseRaw =
          (s.allocation_name_ar || s.allocation_name || s.allocation_type || "");
        const landUseSubRaw =
          (s.land_use_ar || s.land_use || "");

        setForm((prev) => ({
          ...prev,
          // عام/أرض
          city: prev.city || s.municipality || "",
          zone: prev.zone || s.zone || "",
          plot_no: prev.plot_no || s.land_no || "",
          sector: prev.sector || s.sector || "",
          plot_address: prev.plot_address || s.plot_address || "",
          plot_area_sqm: prev.plot_area_sqm || s.plot_area_sqm || "",
          // مشروع
          project_no: prev.project_no || s.project_no || "",
          project_name: prev.project_name || s.project_name || "",
          // استخدامات (قسرًا عربي)
          land_use: prev.land_use || toAr(landUseRaw),
          land_use_sub: prev.land_use_sub || toAr(landUseSubRaw),
        }));
      } catch {}
    })();
  }, [projectId]);

  /* =================== بناء الحمولة + تحققات =================== */
  const buildPayload = () => {
    const normalized = {
      ...form,
      issue_date: toApiDate(form.issue_date),
      last_issue_date: toApiDate(form.last_issue_date),
      expiry_date: toApiDate(form.expiry_date),
      technical_decision_date: toApiDate(form.technical_decision_date),
      // تأكد أن الاستخدامات اللي بنرسلها عربي
      land_use: toAr(form.land_use),
      land_use_sub: toAr(form.land_use_sub),
    };

    if (normalized.last_issue_date && normalized.issue_date) {
      const last = new Date(normalized.last_issue_date);
      const first = new Date(normalized.issue_date);
      if (last < first) throw new Error("تاريخ آخر إصدار يجب أن يكون بعد أو مساويًا لتاريخ الإصدار.");
    }

    // في حال وجود ملف رخصة البناء -> FormData
    if (form.building_license_file) {
      const fd = new FormData();
      Object.entries(normalized).forEach(([k, v]) => {
        if (k === "building_license_file") return;
        // لا ترسل الحقول الفارغة/الـ null إلى الخادم في FormData
        if (v === null || v === undefined || v === "") return;
        fd.append(k, v);
      });
      fd.append("building_license_file", form.building_license_file);
      return fd;
    }

    // في الحمولة JSON نُبقي null كما هو حتى يقبلها الخادم
    const { building_license_file, ...rest } = normalized;
    return rest;
  };

  const saveAndNext = async () => {
    if (!projectId) {
      setErrorMsg("افتح المعالج من مشروع محدد ليتم الحفظ على الخادم.");
      return;
    }
    try {
      const payload = buildPayload();
      if (existingId) await api.patch(`projects/${projectId}/license/${existingId}/`, payload);
      else await api.post(`projects/${projectId}/license/`, payload);
      setErrorMsg("");
      if (onNext) onNext();
    } catch (err) {
      const serverData = err?.response?.data;
      const formatted = formatServerErrors(serverData);
      const fallback = err?.message || (serverData ? JSON.stringify(serverData, null, 2) : "تعذّر الحفظ");
      setErrorMsg(formatted || fallback);
    }
  };

  /* =================== الواجهة =================== */
  return (
    <WizardShell icon={FaIdCard} title="الرخصة">
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

      {/* أعلى الصفحة: نوع الرخصة + ملاحظة */}
      <h4>بيانات الرخصة</h4>
      <div className="form-grid cols-3">
        <Field label="نوع الرخصة" icon={FaTools}>
          <RtlSelect
            className="rtl-select"
            options={LICENSE_TYPES}
            value={form.license_type}
            onChange={(v) => setF("license_type", v)}
            placeholder="اختر نوع الرخصة"
          />
          <div className="info-note"><FaInfoCircle aria-hidden /> <div>برجاء أخذ البيانات كما وردت بالرخصة.</div></div>
        </Field>
      </div>

      {/* 1) بيانات الرخصة */}
      <h4 className="mt-16">بيانات الرخصة</h4>
      <div className="form-grid cols-4">
        <Field label="رقم المشروع" icon={FaHashtag}>
          <input className="input" value={form.project_no} onChange={(e) => setF("project_no", e.target.value)} />
        </Field>
        <Field label="رقم الرخصة" icon={FaHashtag}>
          <input className="input" value={form.license_no} onChange={(e) => setF("license_no", e.target.value)} />
        </Field>
        <Field label="تاريخ إصدار الرخصة" icon={FaCalendarAlt}>
          <input className="input" type="date" value={form.issue_date || ""} onChange={(e) => setF("issue_date", e.target.value)} />
        </Field>
        <Field label="تاريخ آخر إصدار للرخصة" icon={FaCalendarAlt}>
          <input className="input" type="date" value={form.last_issue_date || ""} onChange={(e) => setF("last_issue_date", e.target.value)} />
        </Field>

        {/* إرفاق رخصة البناء */}
        <Field label="إرفاق رخصة البناء" icon={FaPaperclip}>
          <input className="input" type="file" onChange={(e) => setF("building_license_file", e.target.files?.[0] || null)} />
          <div className="info-note"><FaInfoCircle aria-hidden /> <div>يرجى إرفاق ملف <strong>رخصة البناء</strong>.</div></div>
        </Field>
      </div>

      {/* 2) بيانات الأرض */}
      <h4 className="mt-16">بيانات الأرض</h4>
      <div className="form-grid cols-4">
        <Field label="المنطقة" icon={FaMapMarkerAlt}>
          <input className="input" value={form.zone} onChange={(e) => setF("zone", e.target.value)} />
        </Field>
        <Field label="الحوض" icon={FaSitemap}>
          <input className="input" value={form.sector} onChange={(e) => setF("sector", e.target.value)} />
        </Field>
        <Field label="رقم القطعة" icon={FaHashtag}>
          <input className="input" value={form.plot_no} onChange={(e) => setF("plot_no", e.target.value)} />
        </Field>

        {/* مساحة الأرض (م²) — تجي من SitePlan */}
        <Field label="مساحة الأرض (م²)" icon={FaRulerCombined}>
          <input className="input" type="number" value={form.plot_area_sqm} onChange={(e) => setF("plot_area_sqm", e.target.value)} />
        </Field>

        <Field label="استخدام الأرض (مسمى التخصيص)" icon={FaSitemap}>
          <input className="input" value={form.land_use} onChange={(e) => setF("land_use", e.target.value)} />
        </Field>
        <Field label="استخدام الأرض الفرعي (استخدام الارض)" icon={FaSitemap}>
          <input className="input" value={form.land_use_sub} onChange={(e) => setF("land_use_sub", e.target.value)} />
        </Field>
      </div>

      {/* 3) أسماء الملاك — من SitePlan فقط */}
      <h4 className="mt-16">أسماء الملاك</h4>
      <div className="form-grid cols-3">
        {ownerNames.length > 0 ? (
          ownerNames.map((name, i) => (
            <Field key={i} label={`المالك #${i + 1}`} icon={FaUser}>
              <input className="input" value={name} readOnly />
            </Field>
          ))
        ) : (
          <div className="info-note" style={{ gridColumn: "1 / -1" }}>
            <FaInfoCircle aria-hidden /> <div>لا توجد أسماء ملاك في مخطط الأرض.</div>
          </div>
        )}
      </div>

      {/* 4) بيانات الاستشاري */}
      <h4 className="mt-16">بيانات الاستشاري</h4>
      <div className="form-grid cols-4">
        <Field label="الاستشاري" icon={FaUser}>
          <input className="input" value={form.consultant_name} onChange={(e) => setF("consultant_name", e.target.value)} />
        </Field>
        <Field label="رخصة الاستشاري" icon={FaHashtag}>
          <input className="input" value={form.consultant_license_no} onChange={(e) => setF("consultant_license_no", e.target.value)} />
        </Field>
      </div>

      {/* 5) بيانات المقاول */}
      <h4 className="mt-16">بيانات المقاول</h4>
      <div className="form-grid cols-4">
        <Field label="المقاول" icon={FaUser}>
          <input className="input" value={form.contractor_name} onChange={(e) => setF("contractor_name", e.target.value)} />
        </Field>
        <Field label="رخصة المقاول" icon={FaHashtag}>
          <input className="input" value={form.contractor_license_no} onChange={(e) => setF("contractor_license_no", e.target.value)} />
        </Field>
      </div>

      <StepActions onPrev={onPrev} onNext={saveAndNext} />
    </WizardShell>
  );
}
