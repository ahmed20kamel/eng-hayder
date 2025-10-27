// src/pages/wizard/steps/SitePlanStep.jsx
import { useEffect, useMemo, useState } from "react";
import { api } from "../../../services/api";
import Field from "../components/Field";
import WizardShell from "../components/WizardShell";
import StepActions from "../components/StepActions";
import RtlSelect from "../../../components/RtlSelect";

import {
  FaMap, FaCity, FaMapMarkerAlt, FaSitemap, FaRulerCombined, FaRuler,
  FaHashtag, FaHome, FaStickyNote, FaCalendarAlt, FaUser, FaKey,
  FaTimes, FaClipboardList, FaTools, FaPaperclip, FaInfoCircle
} from "react-icons/fa";

/* ==== مساعد: عرض رسائل خطأ السيرفر بشكل منسّق (يدعم التداخل) ==== */
function formatServerErrors(data) {
  if (!data) return "";
  const prettyKey = (k) => ({
    non_field_errors: "عام",
    application_date: "تاريخ المعاملة",
    allocation_date: "تاريخ التخصيص",
    municipality: "البلدية",
    zone: "المنطقة",
    sector: "الحوض/القطاع",
    land_no: "رقم الأرض",
    plot_area_sqm: "المساحة (م²)",
    plot_area_sqft: "المساحة (قدم²)",
    allocation_type: "مسمى التخصيص",
    land_use: "استخدام الأرض",
    project_no: "رقم المشروع",
    project_name: "اسم المشروع",
    developer_name: "اسم المطور",
    owners: "الملاك",
    owner_name: "اسم المالك",
    owner_name_ar: "الاسم (عربي)",
    owner_name_en: "الاسم (English)",
    nationality: "الجنسية",
    id_number: "رقم الهوية",
    id_issue_date: "تاريخ إصدار",
    id_expiry_date: "تاريخ انتهاء",
    id_attachment: "إرفاق الهوية",
    right_hold_type: "نوع الحق",
    share_possession: "الحصّة/الحيازة",
    share_percent: "النسبة %",
    phone: "رقم الهاتف",
    email: "البريد الإلكتروني",
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
        const label = last === "owners" ? `المالك #${i + 1}` : `${prettyKey(last)} [${i}]`;
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

export default function SitePlanStep({ projectId, setup, onPrev, onNext }) {
  /* =================== القوائم الثابتة =================== */
  const MUNICIPALITIES = useMemo(
    () => [
      ["Abu Dhabi City", "أبوظبي"],
      ["Al Ain", "العين"],
      ["Al Dhafra", "الظفرة"],
    ],
    []
  );

  const ZONES = useMemo(
    () => ({
      "Abu Dhabi City": [
        "البطين","مدينة الرياض","خليفة سيتي","مدينة محمد بن زايد","الشامخة",
        "جزيرة ياس","جزيرة السعديات","جزيرة الريم","الراحة بيتش","الشاطئ","الشهامة",
      ],
      "Al Ain": ["اليحر","الهير","زاخر","الجاهلي","الصاروج"],
      "Al Dhafra": ["مدينة زايد","غياثي","الرويس","السلع","دلما"],
    }),
    []
  );

  const NATIONALITIES = useMemo(
    () =>
      [
        "Emirati","Saudi","Egyptian","Jordanian","Syrian","Lebanese","Palestinian","Sudanese",
        "Indian","Pakistani","Bangladeshi","Filipino","British","American","French","German",
        "Chinese","Turkish","Moroccan","Tunisian","Algerian","Iraqi","Yemeni","Kuwaiti","Qatari","Bahraini","Omani",
      ].map((n) => [n, n]),
    []
  );

  const SHARE_POSSESSION_OPTIONS = useMemo(
    () => ([
      { value: "purchase_100", label: "بيع وشراء 100%" },
      { value: "grant_100",    label: "منحة 100%" },
    ]),
    []
  );

  const defaultLandUse =
    setup?.projectType === "commercial" ? "Investment" : "Residential";

  /* =================== تواريخ (تحويل) =================== */
  const toInputDate = (d) => {
    if (!d) return "";
    const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(d); // dd/mm/yyyy
    return m ? `${m[3]}-${m[2]}-${m[1]}` : d;        // yyyy-mm-dd
  };
  const toApiDate = toInputDate;

  /* =================== الحالة العامة =================== */
  const [form, setForm] = useState({
    application_number: "",
    application_date: "",
    application_file: null,

    municipality: "",
    zone: "",
    sector: "",
    land_no: "",
    plot_area_sqm: "",
    plot_area_sqft: "",
    allocation_type: "Residential",
    land_use: defaultLandUse,
    allocation_date: "",

    project_no: "",
    project_name: "",
    developer_name: "",
    notes: "",
  });

  const emptyOwner = {
    owner_name_ar: "",
    owner_name_en: "",
    nationality: "",
    id_number: "",
    id_issue_date: "",
    id_expiry_date: "",
    id_attachment: null,
    right_hold_type: "Ownership",
    share_possession: "",
    share_percent: "100",
    phone: "",
    email: "",
  };

  const [owners, setOwners] = useState([{ ...emptyOwner }]);
  const [existingId, setExistingId] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  const setF = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const zonesOptions = (ZONES[form.municipality] || []).map((z) => ({ value: z, label: z }));

  /* =================== تحويل المساحات =================== */
  const [lock, setLock] = useState(false);
  const sqm2ft = (sqm) => (Number(sqm) || 0) * 10.7639;
  const ft2sqm = (ft) => (Number(ft) || 0) / 10.7639;
  const onSqmChange = (v) => {
    if (lock) return;
    setLock(true);
    setF("plot_area_sqm", v);
    setF("plot_area_sqft", v ? sqm2ft(v).toFixed(2) : "");
    setLock(false);
  };
  const onSqftChange = (v) => {
    if (lock) return;
    setLock(true);
    setF("plot_area_sqft", v);
    setF("plot_area_sqm", v ? ft2sqm(v).toFixed(2) : "");
    setLock(false);
  };

  /* =================== تحميل بيانات موجودة =================== */
  useEffect(() => {
    if (!projectId) return;
    (async () => {
      try {
        const { data } = await api.get(`projects/${projectId}/siteplan/`);
        if (data.length) {
          const s = data[0];
          setExistingId(s.id);
          setForm((prev) => ({
            ...prev,
            ...s,
            application_file: null,
            application_date: toInputDate(s.application_date),
            allocation_date: toInputDate(s.allocation_date),
          }));
          if (s.owners?.length) {
            setOwners(
              s.owners.map((o, idx, arr) => ({
                ...emptyOwner,
                ...o,
                share_percent: arr.length === 1 ? "100" : String(o.share_percent ?? 0),
                id_attachment: null,
              }))
            );
          }
        }
      } catch {}
    })();
  }, [projectId]); // eslint-disable-line

  useEffect(() => {
    if (form.zone && !ZONES[form.municipality]?.includes(form.zone)) {
      setF("zone", "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.municipality]);

  /* =================== نسب الملاك =================== */
  const recalcShares = (arr) => {
    if (arr.length === 1) {
      arr[0].share_percent = "100";
      return arr;
    }
    const sumOthers = arr.slice(0, -1).reduce((s, o) => s + (parseFloat(o.share_percent) || 0), 0);
    const rem = Math.max(0, 100 - sumOthers);
    arr[arr.length - 1].share_percent = String(rem);
    return arr;
  };

  const addOwner = () => setOwners((prev) => recalcShares([...prev, { ...emptyOwner, share_percent: "0" }]));
  const removeOwner = (i) => setOwners((prev) => recalcShares(prev.filter((_, idx) => idx !== i)));
  const updateOwner = (i, key, value) =>
    setOwners((prev) => {
      const x = [...prev];
      x[i] = { ...x[i], [key]: value };
      if (key === "share_percent" && i !== x.length - 1) {
        const capped = Math.max(0, Math.min(100, parseFloat(value) || 0));
        x[i].share_percent = String(capped);
        return recalcShares(x);
      }
      if (x.length === 1) x[0].share_percent = "100";
      return x;
    });

  /* =================== حفظ + تحققات =================== */
  const buildPayload = () => {
    const normalized = {
      ...form,
      application_date: toApiDate(form.application_date),
      allocation_date: toApiDate(form.allocation_date),
    };

    // أقدم فقط
    if (normalized.allocation_date && normalized.application_date) {
      const alloc = new Date(normalized.allocation_date);
      const app = new Date(normalized.application_date);
      if (alloc >= app) {
        throw new Error("انتبه: يجب أن يكون تاريخ التخصيص أقدم من تاريخ المعاملة.");
      }
    }

    // مجموع النِّسَب = 100%
    const sum = owners.reduce((s, o) => s + (parseFloat(o.share_percent) || 0), 0);
    if (Math.round(sum) !== 100) throw new Error("مجموع نسب الملاك يجب أن يساوي 100%.");

    // ✅ تحقق: لازم الاسم عربي *وكمان* إنجليزي
    owners.forEach((o, idx) => {
      if (!o.owner_name_ar?.trim() || !o.owner_name_en?.trim()) {
        throw new Error(`المالك #${idx + 1}: يرجى تعبئة الاسم بالعربي والإنجليزي.`);
      }
    });

    const hasOwnerFiles = owners.some((o) => !!o.id_attachment);

    // --- حالة FormData (فيها ملفات) ---
    if (form.application_file || hasOwnerFiles) {
      const fd = new FormData();
      Object.entries(normalized).forEach(([k, v]) => fd.append(k, v ?? ""));

      owners.forEach((o, i) => {
        // نبعث كل حقول المالك كما هي
        Object.entries(o).forEach(([k, v]) => {
          if (k === "id_attachment") return;
          fd.append(`owners[${i}][${k}]`, v ?? "");
        });
        // ✅ ومتطلبات الـAPI: owner_name = الاسم العربي (مع بقاء العربي/الإنجليزي منفصلين)
        fd.append(`owners[${i}][owner_name]`, o.owner_name_ar?.trim() || "");

        if (o.id_attachment) fd.append(`owners[${i}][id_attachment]`, o.id_attachment);
      });

      if (form.application_file) fd.append("application_file", form.application_file);
      return fd;
    }

    // --- حالة JSON (بدون ملفات) ---
    const ownersNormalized = owners.map((o) => ({
      ...o,
      owner_name: o.owner_name_ar?.trim() || "", // نحفظه أيضًا (لتوافق الـAPI)
    }));

    return { ...normalized, owners: ownersNormalized };
  };

  const saveAndNext = async () => {
    if (!projectId) {
      setErrorMsg("افتح المعالج من مشروع محدد ليتم الحفظ على الخادم.");
      return;
    }
    try {
      const payload = buildPayload();
      if (existingId) await api.patch(`projects/${projectId}/siteplan/${existingId}/`, payload);
      else await api.post(`projects/${projectId}/siteplan/`, payload);
      setErrorMsg("");
      onNext();
    } catch (err) {
      const serverData = err?.response?.data;
      const formatted = formatServerErrors(serverData);
      const fallback = err?.message || (serverData ? JSON.stringify(serverData, null, 2) : "تعذّر الحفظ");
      setErrorMsg(formatted || fallback);
    }
  };

  /* =================== واجهة المستخدم =================== */
  return (
    <WizardShell icon={FaMap} title="مخطط الأرض">
      {/* مودال الخطأ */}
      {errorMsg && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.35)",
            zIndex: 2000,
            display: "grid",
            placeItems: "center",
          }}
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

      {/* 📄 بيانات المعاملة */}
      <h4>📄 بيانات المعاملة</h4>
      <div className="form-grid cols-3">
        <Field label="رقم المعاملة" icon={FaHashtag}>
          <input className="input" value={form.application_number} onChange={(e) => setF("application_number", e.target.value)} />
          <div className="info-note"><FaInfoCircle aria-hidden /> <div>يوجد أسفل يسار <strong>مخطط البناء</strong>.</div></div>
        </Field>

        <Field label="تاريخ المعاملة" icon={FaCalendarAlt}>
          <input className="input" type="date" value={form.application_date || ""} onChange={(e) => setF("application_date", e.target.value)} />
          <div className="info-note"><FaInfoCircle aria-hidden /> <div>يوجد أسفل يمين <strong>مخطط البناء</strong>.</div></div>
        </Field>

        <Field label="إرفاق مخطط الأرض" icon={FaPaperclip}>
          <input className="input" type="file" onChange={(e) => setF("application_file", e.target.files?.[0] || null)} />
          <div className="info-note"><FaInfoCircle aria-hidden /> <div>أرفق ملف <strong>مخطط الأرض</strong> (PDF أو صورة).</div></div>
        </Field>
      </div>

      {/* 📌 بيانات الأرض */}
      <h4 className="mt-16">📌 بيانات الأرض</h4>
      <div className="form-grid cols-4">
        <Field label="البلدية" icon={FaCity}>
          <RtlSelect className="rtl-select"
            options={MUNICIPALITIES.map(([value, label]) => ({ value, label }))}
            value={form.municipality}
            onChange={(v) => { setF("municipality", v); setF("zone", ""); }}
            placeholder="اختر البلدية"
          />
        </Field>

        <Field label="المنطقة" icon={FaMapMarkerAlt}>
          <RtlSelect className="rtl-select"
            options={zonesOptions}
            value={form.zone}
            onChange={(v) => setF("zone", v)}
            placeholder={form.municipality ? "اختر المنطقة " : "اختر البلدية أولًا"}
            isDisabled={!form.municipality}
          />
        </Field>

        <Field label="الحوض / القطاع" icon={FaSitemap}>
          <input className="input" value={form.sector} onChange={(e) => setF("sector", e.target.value)} />
        </Field>

        <Field label="رقم الأرض" icon={FaHashtag}>
          <input className="input" value={form.land_no} onChange={(e) => setF("land_no", e.target.value)} />
        </Field>

        <Field label="المساحة (م²)" icon={FaRulerCombined}>
          <input className="input" type="number" value={form.plot_area_sqm} onChange={(e) => onSqmChange(e.target.value)} />
        </Field>

        <Field label="المساحة (قدم²)" icon={FaRuler}>
          <input className="input" type="number" value={form.plot_area_sqft} onChange={(e) => onSqftChange(e.target.value)} />
        </Field>

        <Field label="ملاحظات" icon={FaStickyNote} textarea>
          <textarea className="input" value={form.notes} onChange={(e) => setF("notes", e.target.value)} />
        </Field>
      </div>

      {/* 🏷️ التخصيص والاستخدام */}
      <h4 className="mt-16">🏷️ التخصيص والاستخدام</h4>
      <div className="form-grid cols-3">
        <Field label="مسمى التخصيص" icon={FaKey}>
          <select className="input" value={form.allocation_type} onChange={(e) => setF("allocation_type", e.target.value)}>
            <option value="Residential">سكني</option>
            <option value="Commercial">تجاري</option>
            <option value="Government">حكومي</option>
          </select>
        </Field>

        <Field label="استخدام الأرض" icon={FaHome}>
          <select className="input" value={form.land_use} onChange={(e) => setF("land_use", e.target.value)}>
            <option value="Residential">سكني</option>
            <option value="Investment">استثماري</option>
          </select>
        </Field>

        <Field label="تاريخ التخصيص" icon={FaCalendarAlt}>
          <input className="input" type="date" value={form.allocation_date || ""} onChange={(e) => setF("allocation_date", e.target.value)} />
        </Field>
      </div>

      {/* 🧰 بيانات المطور — صف واحد من 3 أعمدة */}
      {form.land_use === "Investment" && (
        <>
          <h4 className="mt-16">🧰 بيانات المطور</h4>
          <div className="form-grid cols-3">
            <Field label="اسم المطور" icon={FaTools}>
              <input className="input" value={form.developer_name} onChange={(e) => setF("developer_name", e.target.value)} />
            </Field>
            <Field label="رقم المشروع" icon={FaHashtag}>
              <input className="input" type="number" value={form.project_no} onChange={(e) => setF("project_no", e.target.value)} />
            </Field>
            <Field label="اسم المشروع" icon={FaClipboardList}>
              <input className="input" value={form.project_name} onChange={(e) => setF("project_name", e.target.value)} />
            </Field>
          </div>
        </>
      )}

      {/* 👤 بيانات الملاك */}
      <h4 className="mt-16"><FaUser /> بيانات الملاك</h4>

      {owners.map((o, i) => (
        <div key={i} className="owner-block">
          {/* صف 1: عربي + English + الجنسية */}
          <div className="form-grid cols-3">
            <Field label="الاسم (عربي)">
              <input className="input" value={o.owner_name_ar} onChange={(e) => updateOwner(i, "owner_name_ar", e.target.value)} />
            </Field>
            <Field label="الاسم (English)">
              <input className="input" value={o.owner_name_en} onChange={(e) => updateOwner(i, "owner_name_en", e.target.value)} />
            </Field>
            <Field label="الجنسية">
              <RtlSelect
                className="rtl-select"
                options={NATIONALITIES.map(([v, l]) => ({ value: v, label: l }))}
                value={o.nationality}
                onChange={(v) => updateOwner(i, "nationality", v)}
                placeholder="اختر الجنسية أو اكتب للبحث"
              />
            </Field>
          </div>

          {/* صف جديد: الهاتف + البريد */}
          <div className="form-grid cols-3 mt-8">
            <Field label="رقم الهاتف">
              <input className="input" value={o.phone} onChange={(e) => updateOwner(i, "phone", e.target.value)} />
            </Field>
            <Field label="البريد الإلكتروني">
              <input className="input" type="email" value={o.email} onChange={(e) => updateOwner(i, "email", e.target.value)} />
            </Field>
            <div />
          </div>

          {/* صف 2: رقم الهوية + إصدار + انتهاء + إرفاق */}
          <div className="form-grid cols-4 mt-8">
            <Field label="رقم الهوية">
              <input className="input" value={o.id_number} onChange={(e) => updateOwner(i, "id_number", e.target.value)} />
            </Field>
            <Field label="تاريخ إصدار">
              <input className="input" type="date" value={o.id_issue_date || ""} onChange={(e) => updateOwner(i, "id_issue_date", e.target.value)} />
            </Field>
            <Field label="تاريخ انتهاء">
              <input className="input" type="date" value={o.id_expiry_date || ""} onChange={(e) => updateOwner(i, "id_expiry_date", e.target.value)} />
            </Field>
            <Field label="إرفاق الهوية">
              <input className="input" type="file" onChange={(e) => updateOwner(i, "id_attachment", e.target.files?.[0] || null)} />
            </Field>
          </div>

          {/* صف 3: نوع الحق + الحصّة/الحيازة + النسبة + إجراء */}
          <div className="form-grid cols-4 mt-8">
            <Field label="نوع الحق">
              <input className="input" value={o.right_hold_type} onChange={(e) => updateOwner(i, "right_hold_type", e.target.value)} />
            </Field>

            <Field label="الحصّة/الحيازة">
              <RtlSelect
                className="rtl-select"
                options={SHARE_POSSESSION_OPTIONS}
                value={o.share_possession}
                onChange={(v) => updateOwner(i, "share_possession", v)}
              />
            </Field>

            <Field label="النسبة %">
              <input
                className="input"
                type="number"
                min="0"
                max="100"
                value={o.share_percent}
                onChange={(e) => updateOwner(i, "share_percent", e.target.value)}
                disabled={owners.length === 1 || i === owners.length - 1}
              />
            </Field>

            <Field label="إجراء">
              <button
                className="btn secondary"
                type="button"
                onClick={() => removeOwner(i)}
                disabled={owners.length === 1}
                title="حذف المالك"
              >
                <FaTimes /> حذف
              </button>
            </Field>
          </div>
        </div>
      ))}

      <div className="mt-12">
        <button className="btn" type="button" onClick={addOwner}>➕ إضافة مالك جديد</button>
      </div>

      <StepActions onPrev={onPrev} onNext={saveAndNext} />
    </WizardShell>
  );
}
