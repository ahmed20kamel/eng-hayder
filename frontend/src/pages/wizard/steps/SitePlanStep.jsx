// src/pages/wizard/steps/SitePlanStep.jsx
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import i18n from "../../../i18n";
import { api } from "../../../services/api";
import Field from "../components/Field";
import WizardShell from "../components/WizardShell";
import StepActions from "../components/StepActions";
import RtlSelect from "../../../components/RtlSelect";
import { FaMap, FaTimes } from "react-icons/fa";

/* ==== مساعد: عرض رسائل خطأ السيرفر بشكل منسّق (يدعم التداخل) مع i18n ==== */
function formatServerErrors(data) {
  if (!data) return "";
  const tErr = (k) => i18n.t(`errors.${k}`, k);

  const lines = [];
  const walk = (value, path = []) => {
    if (Array.isArray(value)) {
      if (value.every((v) => typeof v !== "object")) {
        const key = path.length ? tErr(path.at(-1)) : "";
        const txt = value.map(String).join(" • ");
        lines.push(key ? `• ${key}: ${txt}` : `• ${txt}`);
        return;
      }
      value.forEach((item, i) => {
        const last = path.at(-1);
        const label =
          last === "owners"
            ? `${tErr("owners")} #${i + 1}`
            : `${tErr(last)} [${i}]`;
        if (typeof item !== "object") lines.push(`• ${label}: ${String(item)}`);
        else
          Object.entries(item || {}).forEach(([k, v]) =>
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
    const prefix = path
      .slice(0, -1)
      .map((p) => (String(p).includes("→") ? p : tErr(p)))
      .filter(Boolean)
      .join(" → ");
    const fullKey = [prefix, key].filter(Boolean).join(" → ");
    lines.push(fullKey ? `• ${fullKey}: ${String(value)}` : `• ${String(value)}`);
  };

  walk(data);
  return lines.join("\n");
}

export default function SitePlanStep({ projectId, setup, onPrev, onNext }) {
  const { t, i18n: i18next } = useTranslation();
  const isAR = i18next.language === "ar";

  /* =================== القوائم الثابتة (عرض ثنائي اللغة، قيم ثابتة) =================== */
  const MUNICIPALITIES = useMemo(
    () => [
      { value: "Abu Dhabi City", label: { en: "Abu Dhabi City", ar: "أبوظبي" } },
      { value: "Al Ain", label: { en: "Al Ain", ar: "العين" } },
      { value: "Al Dhafra", label: { en: "Al Dhafra", ar: "الظفرة" } },
    ],
    []
  );

  const ZONES = useMemo(
    () => ({
      "Abu Dhabi City": [
        { value: "Al Bateen", label: { en: "Al Bateen", ar: "البطين" } },
        { value: "Madinat Al Riyadh", label: { en: "Madinat Al Riyadh", ar: "مدينة الرياض" } },
        { value: "Khalifa City", label: { en: "Khalifa City", ar: "خليفة سيتي" } },
        { value: "Mohammed Bin Zayed City", label: { en: "Mohammed Bin Zayed City", ar: "مدينة محمد بن زايد" } },
        { value: "Al Shamkha", label: { en: "Al Shamkha", ar: "الشامخة" } },
        { value: "Yas Island", label: { en: "Yas Island", ar: "جزيرة ياس" } },
        { value: "Saadiyat Island", label: { en: "Saadiyat Island", ar: "جزيرة السعديات" } },
        { value: "Al Reem Island", label: { en: "Al Reem Island", ar: "جزيرة الريم" } },
        { value: "Al Raha Beach", label: { en: "Al Raha Beach", ar: "الراحة بيتش" } },
        { value: "Al Shatee", label: { en: "Al Shatee", ar: "الشاطئ" } },
        { value: "Al Shahama", label: { en: "Al Shahama", ar: "الشهامة" } },
      ],
      "Al Ain": [
        { value: "Al Yahar", label: { en: "Al Yahar", ar: "اليحر" } },
        { value: "Al Hayer", label: { en: "Al Hayer", ar: "الهير" } },
        { value: "Zakhir", label: { en: "Zakhir", ar: "زاخر" } },
        { value: "Al Jahili", label: { en: "Al Jahili", ar: "الجاهلي" } },
        { value: "Al Sarouj", label: { en: "Al Sarouj", ar: "الصاروج" } },
      ],
      "Al Dhafra": [
        { value: "Madinat Zayed", label: { en: "Madinat Zayed", ar: "مدينة زايد" } },
        { value: "Ghayathi", label: { en: "Ghayathi", ar: "غياثي" } },
        { value: "Al Ruwais", label: { en: "Al Ruwais", ar: "الرويس" } },
        { value: "As Sila", label: { en: "As Sila", ar: "السلع" } },
        { value: "Delma Island", label: { en: "Delma Island", ar: "دلما" } },
      ],
    }),
    []
  );

  /* =================== الحالة العامة =================== */
  const defaultLandUse =
    setup?.projectType === "commercial" ? "Investment" : "Residential";

  const [form, setForm] = useState({
    // المعاملة
    application_number: "",
    application_date: "",
    application_file: null,
    // العقار
    municipality: "",
    zone: "",
    sector: "",
    road_name: "",
    plot_area_sqm: "",
    plot_area_sqft: "",
    land_no: "",
    plot_address: "",
    construction_status: "",
    allocation_type: "Residential",
    land_use: defaultLandUse,
    base_district: "",
    overlay_district: "",
    allocation_date: "",
    // المطور (للإستثمار)
    project_no: "",
    project_name: "",
    developer_name: "",
    // ملاحظات
    notes: "",
  });

  const setF = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  // خيارات مبنية على اللغة الحالية
  const municipalityOptions = MUNICIPALITIES.map((m) => ({
    value: m.value,
    label: isAR ? m.label.ar : m.label.en,
  }));
  const zonesOptions = (ZONES[form.municipality] || []).map((z) => ({
    value: z.value,
    label: isAR ? z.label.ar : z.label.en,
  }));

  /* =================== الملاك (داخل نفس الخطوة) =================== */
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
      { value: "purchase_100", label: isAR ? i18next.t("share_possession_purchase_100_ar") : i18next.t("share_possession_purchase_100_en") },
      { value: "grant_100",    label: isAR ? i18next.t("share_possession_grant_100_ar")    : i18next.t("share_possession_grant_100_en") },
    ]),
    [isAR, i18next]
  );

  const [owners, setOwners] = useState([{ ...emptyOwner }]);
  const [existingId, setExistingId] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [isView, setIsView] = useState(false);

  /* =================== تواريخ (تحويل) =================== */
  // تحويل الأرقام العربية إلى إنجليزية + تنظيف placeholder
  const normalizeDigits = (s) =>
    String(s ?? "")
      .replace(/[\u0660-\u0669]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d))
      .trim();

  const isPlaceholderDate = (s) =>
    /^dd\s*\/\s*mm\s*\/\s*yyyy$/i.test(String(s).trim());

  const toInputDate = (d) => {
    if (!d) return "";
    const s = normalizeDigits(d);
    if (!s || isPlaceholderDate(s)) return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s; // جاهز للـ <input type="date">
    const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s); // dd/mm/yyyy
    return m ? `${m[3]}-${m[2]}-${m[1]}` : s;
  };

  // ترجّع "" لو مفيش تاريخ صالح (عشان نقدر نتجاهله لاحقًا)
  const toApiDate = (d) => {
    if (!d) return "";
    const s = normalizeDigits(d);
    if (!s || isPlaceholderDate(s)) return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s);
    return m ? `${m[3]}-${m[2]}-${m[1]}` : "";
  };

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
        if (Array.isArray(data) && data.length) {
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
                id_issue_date: toInputDate(o.id_issue_date),
                id_expiry_date: toInputDate(o.id_expiry_date),
                share_percent: arr.length === 1 ? "100" : String(o.share_percent ?? 0),
                id_attachment: null,
              }))
            );
          }
          setIsView(true); // ← إظهار فيو عند الرجوع للخطوة
        }
      } catch {}
    })();
  }, [projectId]); // eslint-disable-line

  // لو غيّرت البلدية نحذف المنطقة غير المتوافقة
  useEffect(() => {
    const zoneValues = (ZONES[form.municipality] || []).map((z) => z.value);
    if (form.zone && !zoneValues.includes(form.zone)) {
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
  const removeOwner = (i) =>
    setOwners((prev) => recalcShares(prev.filter((_, idx) => idx !== i)));
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
    // نحضّر التواريخ الأساسية
    const application_date_api = toApiDate(form.application_date);
    const allocation_date_api = toApiDate(form.allocation_date);

    const normalized = {
      ...form,
      application_date: application_date_api || undefined,
      allocation_date: allocation_date_api || undefined,
    };

    // تحقّق علاقة التاريخين لو الاتنين موجودين
    if (application_date_api && allocation_date_api) {
      const alloc = new Date(allocation_date_api);
      const app = new Date(application_date_api);
      if (alloc >= app) {
        throw new Error(t("errors.allocation_before_application"));
      }
    }

    // الحصص
    const sum = owners.reduce((s, o) => s + (parseFloat(o.share_percent) || 0), 0);
    if (Math.round(sum) !== 100) throw new Error(t("errors.owners_share_sum_100"));

    // الاسم عربي + إنجليزي
    owners.forEach((o, idx) => {
      if (!o.owner_name_ar?.trim() || !o.owner_name_en?.trim()) {
        throw new Error(t("errors.owner_name_bilingual_required", { idx: idx + 1 }));
      }
    });

    const hasOwnerFiles = owners.some((o) => !!o.id_attachment);

    // ====== FormData لو فيه ملفات ======
    if (form.application_file || hasOwnerFiles) {
      const fd = new FormData();

      // نضيف الحقول غير التاريخية كلها، وبالنسبة للتواريخ نضيفها فقط لو فيها قيمة
      Object.entries(normalized).forEach(([k, v]) => {
        if (k === "application_file") return;
        if ((k === "application_date" || k === "allocation_date")) {
          if (v) fd.append(k, v); // بس لما يكون في تاريخ
        } else {
          fd.append(k, v ?? "");
        }
      });

      // الملاك
      owners.forEach((o, i) => {
        Object.entries(o).forEach(([k, v]) => {
          if (k === "id_attachment") return;
          if (k === "id_issue_date" || k === "id_expiry_date") {
            const vd = toApiDate(v);
            if (vd) fd.append(`owners[${i}][${k}]`, vd); // بس لما يكون موجود
            return;
          }
          fd.append(`owners[${i}][${k}]`, v ?? "");
        });
        fd.append(`owners[${i}][owner_name]`, o.owner_name_ar?.trim() || "");
        if (o.id_attachment) fd.append(`owners[${i}][id_attachment]`, o.id_attachment);
      });

      if (form.application_file) fd.append("application_file", form.application_file);
      return fd;
    }

    // ====== JSON عادي ======
    const ownersNormalized = owners.map((o) => {
      const issue = toApiDate(o.id_issue_date);
      const expiry = toApiDate(o.id_expiry_date);
      const base = {
        ...o,
        owner_name: o.owner_name_ar?.trim() || "",
      };
      // نحذف التاريخين لو فاضيين
      if (issue) base.id_issue_date = issue; else delete base.id_issue_date;
      if (expiry) base.id_expiry_date = expiry; else delete base.id_expiry_date;
      return base;
    });

    const jsonPayload = { ...normalized, owners: ownersNormalized };
    // نحذف تواريخ المستوى الأعلى لو فاضية
    if (!application_date_api) delete jsonPayload.application_date;
    if (!allocation_date_api) delete jsonPayload.allocation_date;

    return jsonPayload;
  };

  const saveAndNext = async () => {
    if (!projectId) {
      setErrorMsg(t("open_specific_project_to_save"));
      return;
    }
    try {
      const payload = buildPayload();
      if (existingId) {
        await api.patch(`projects/${projectId}/siteplan/${existingId}/`, payload);
      } else {
        const { data: created } = await api.post(`projects/${projectId}/siteplan/`, payload);
        if (created?.id) setExistingId(created.id);
      }
      setErrorMsg("");
      setIsView(true); // ← التحويل للوضع القرائي بعد الحفظ
      onNext && onNext();
    } catch (err) {
      const serverData = err?.response?.data;
      const formatted = formatServerErrors(serverData);
      const fallback =
        err?.message ||
        (serverData ? JSON.stringify(serverData, null, 2) : t("save_failed"));
      setErrorMsg(formatted || fallback);
    }
  };

  /* =================== واجهة المستخدم =================== */
  return (
    <WizardShell icon={FaMap} title={`📐 ${t("step_siteplan")}`}>
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

      {/* 1) تفاصيل العقار */}
      <h4>📌 {t("property_details")}</h4>
      {isView ? (
        <div className="card">
          <div className="form-grid cols-4">
            <Field label={t("municipality")}><div>{form.municipality || "-"}</div></Field>
            <Field label={t("zone")}><div>{form.zone || "-"}</div></Field>
            <Field label={t("sector")}><div>{form.sector || "-"}</div></Field>
            <Field label={t("road_name")}><div>{form.road_name || "-"}</div></Field>
            <Field label={t("plot_area_sqm")}><div>{form.plot_area_sqm || "-"}</div></Field>
            <Field label={t("plot_area_sqft")}><div>{form.plot_area_sqft || "-"}</div></Field>
            <Field label={t("land_no")}><div>{form.land_no || "-"}</div></Field>
            <Field label={t("plot_address")}><div>{form.plot_address || "-"}</div></Field>
            <Field label={t("construction_status")}><div>{form.construction_status || "-"}</div></Field>
            <Field label={t("allocation_type")}><div>{form.allocation_type || "-"}</div></Field>
            <Field label={t("land_use")}><div>{form.land_use || "-"}</div></Field>
            <Field label={t("base_district")}><div>{form.base_district || "-"}</div></Field>
            <Field label={t("overlay_district")}><div>{form.overlay_district || "-"}</div></Field>
            <Field label={t("allocation_date")}><div>{form.allocation_date || "-"}</div></Field>
          </div>
        </div>
      ) : (
        <div className="form-grid cols-4">
          <Field label={t("municipality")}>
            <RtlSelect
              className="rtl-select"
              options={municipalityOptions}
              value={form.municipality}
              onChange={(v) => { setF("municipality", v); setF("zone", ""); }}
              placeholder={t("select_municipality")}
            />
          </Field>

          <Field label={t("zone")}>
            <RtlSelect
              className="rtl-select"
              options={zonesOptions}
              value={form.zone}
              onChange={(v) => setF("zone", v)}
              placeholder={form.municipality ? t("select_zone") : t("select_municipality_first")}
              isDisabled={!form.municipality}
            />
          </Field>

          <Field label={t("sector")}>
            <input className="input" value={form.sector} onChange={(e) => setF("sector", e.target.value)} />
          </Field>

          <Field label={t("road_name")}>
            <input className="input" value={form.road_name} onChange={(e) => setF("road_name", e.target.value)} />
          </Field>

          <Field label={t("plot_area_sqm")}>
            <input className="input" type="number" value={form.plot_area_sqm} onChange={(e) => onSqmChange(e.target.value)} />
          </Field>

          <Field label={t("plot_area_sqft")}>
            <input className="input" type="number" value={form.plot_area_sqft} onChange={(e) => onSqftChange(e.target.value)} />
          </Field>

          <Field label={t("land_no")}>
            <input className="input" value={form.land_no} onChange={(e) => setF("land_no", e.target.value)} />
          </Field>

          <Field label={t("plot_address")}>
            <input className="input" value={form.plot_address} onChange={(e) => setF("plot_address", e.target.value)} />
          </Field>

          <Field label={t("construction_status")}>
            <input
              className="input"
              value={form.construction_status}
              onChange={(e) => setF("construction_status", e.target.value)}
              placeholder={t("not_constructed_example")}
            />
          </Field>

          <Field label={t("allocation_type")}>
            <select className="input" value={form.allocation_type} onChange={(e) => setF("allocation_type", e.target.value)}>
              <option value="Residential">{t("residential")}</option>
              <option value="Commercial">{t("commercial")}</option>
              <option value="Government">{t("government")}</option>
            </select>
          </Field>

          <Field label={t("land_use")}>
            <select className="input" value={form.land_use} onChange={(e) => setF("land_use", e.target.value)}>
              <option value="Residential">{t("residential")}</option>
              <option value="Investment">{t("investment")}</option>
            </select>
          </Field>

          <Field label={t("base_district")}>
            <input
              className="input"
              value={form.base_district}
              onChange={(e) => setF("base_district", e.target.value)}
              placeholder={t("base_district_ph")}
            />
          </Field>

          <Field label={t("overlay_district")}>
            <input
              className="input"
              value={form.overlay_district}
              onChange={(e) => setF("overlay_district", e.target.value)}
              placeholder={t("overlay_district_ph")}
            />
          </Field>

          <Field label={t("allocation_date")}>
            <input className="input" type="date" value={form.allocation_date || ""} onChange={(e) => setF("allocation_date", e.target.value)} />
          </Field>
        </div>
      )}

      {/* 2) بيانات المطور (تظهر عند الاستثمار) */}
      {form.land_use === "Investment" && (
        <>
          <h4 className="mt-16">🧰 {t("developer_details")}</h4>
          {isView ? (
            <div className="card">
              <div className="form-grid cols-3">
                <Field label={t("developer_name")}><div>{form.developer_name || "-"}</div></Field>
                <Field label={t("project_no")}><div>{form.project_no || "-"}</div></Field>
                <Field label={t("project_name_f")}><div>{form.project_name || "-"}</div></Field>
              </div>
            </div>
          ) : (
            <div className="form-grid cols-3">
              <Field label={t("developer_name")}>
                <input className="input" value={form.developer_name} onChange={(e) => setF("developer_name", e.target.value)} />
              </Field>
              <Field label={t("project_no")}>
                <input className="input" type="number" value={form.project_no} onChange={(e) => setF("project_no", e.target.value)} />
              </Field>
              <Field label={t("project_name_f")}>
                <input className="input" value={form.project_name} onChange={(e) => setF("project_name", e.target.value)} />
              </Field>
            </div>
          )}
        </>
      )}

      {/* 3) معلومات المالك (داخل نفس الخطوة) */}
      <h4 className="mt-16">👤 {t("owner_details")}</h4>

      {isView ? (
        <div className="stack">
          {owners.map((o, i) => (
            <div key={i} className="card">
              <div className="form-grid cols-4">
                <Field label={t("owner_name_ar")}><div>{o.owner_name_ar || "-"}</div></Field>
                <Field label={t("owner_name_en")}><div>{o.owner_name_en || "-"}</div></Field>
                <Field label={t("nationality")}><div>{o.nationality || "-"}</div></Field>
                <Field label={t("share_percent")}><div>{o.share_percent || "0"}%</div></Field>

                <Field label={t("phone")}><div>{o.phone || "-"}</div></Field>
                <Field label={t("email")}><div>{o.email || "-"}</div></Field>

                <Field label={t("id_number")}><div>{o.id_number || "-"}</div></Field>
                <Field label={t("issue_date")}><div>{o.id_issue_date || "-"}</div></Field>
                <Field label={t("expiry_date")}><div>{o.id_expiry_date || "-"}</div></Field>
                <Field label={t("right_hold_type")}><div>{o.right_hold_type || "-"}</div></Field>
                <Field label={t("share_and_acquisition")}><div>{o.share_possession || "-"}</div></Field>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {owners.map((o, i) => (
            <div key={i} className="owner-block">
              {/* الأسماء + الجنسية */}
              <div className="form-grid cols-3">
                <Field label={t("owner_name_ar")}>
                  <input className="input" value={o.owner_name_ar} onChange={(e) => updateOwner(i, "owner_name_ar", e.target.value)} />
                </Field>
                <Field label={t("owner_name_en")}>
                  <input className="input" value={o.owner_name_en} onChange={(e) => updateOwner(i, "owner_name_en", e.target.value)} />
                </Field>
                <Field label={t("nationality")}>
                  <RtlSelect
                    className="rtl-select"
                    options={NATIONALITIES.map(([v, l]) => ({ value: v, label: l }))}
                    value={o.nationality}
                    onChange={(v) => updateOwner(i, "nationality", v)}
                    placeholder={t("select_nationality")}
                  />
                </Field>
              </div>

              {/* الاتصال */}
              <div className="form-grid cols-3 mt-8">
                <Field label={t("phone")}>
                  <input className="input" value={o.phone} onChange={(e) => updateOwner(i, "phone", e.target.value)} />
                </Field>
                <Field label={t("email")}>
                  <input className="input" type="email" value={o.email} onChange={(e) => updateOwner(i, "email", e.target.value)} />
                </Field>
                <div />
              </div>

              {/* الهوية */}
              <div className="form-grid cols-4 mt-8">
                <Field label={t("id_number")}>
                  <input className="input" value={o.id_number} onChange={(e) => updateOwner(i, "id_number", e.target.value)} />
                </Field>
                <Field label={t("issue_date")}>
                  <input className="input" type="date" value={o.id_issue_date || ""} onChange={(e) => updateOwner(i, "id_issue_date", e.target.value)} />
                </Field>
                <Field label={t("expiry_date")}>
                  <input className="input" type="date" value={o.id_expiry_date || ""} onChange={(e) => updateOwner(i, "id_expiry_date", e.target.value)} />
                </Field>
                <Field label={t("id_attachment")}>
                  <input className="input" type="file" onChange={(e) => updateOwner(i, "id_attachment", e.target.files?.[0] || null)} />
                </Field>
              </div>

              {/* الحقوق والحصص */}
              <div className="form-grid cols-4 mt-8">
                <Field label={t("right_hold_type")}>
                  <input className="input" value={o.right_hold_type} onChange={(e) => updateOwner(i, "right_hold_type", e.target.value)} />
                </Field>

                <Field label={t("share_and_acquisition")}>
                  <RtlSelect
                    className="rtl-select"
                    options={SHARE_POSSESSION_OPTIONS}
                    value={o.share_possession}
                    onChange={(v) => updateOwner(i, "share_possession", v)}
                  />
                </Field>

                <Field label={t("share_percent")}>
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

                <Field label={t("action")}>
                  <button
                    className="btn secondary"
                    type="button"
                    onClick={() => removeOwner(i)}
                    disabled={owners.length === 1}
                    title={t("remove")}
                  >
                    <FaTimes /> {t("remove")}
                  </button>
                </Field>
              </div>
            </div>
          ))}

          <div className="mt-12">
            <button className="btn" type="button" onClick={addOwner}>➕ {t("add_owner")}</button>
          </div>
        </>
      )}

      {/* 4) ملاحظات */}
      <h4 className="mt-16">📝 {t("notes")}</h4>
      {isView ? (
        <Field label={t("notes_general")}>
          <div style={{ whiteSpace: "pre-wrap" }}>{form.notes || "-"}</div>
        </Field>
      ) : (
        <Field label={t("notes_general")}>
          <textarea className="input" value={form.notes} onChange={(e) => setF("notes", e.target.value)} />
        </Field>
      )}

      {/* 5) بيانات المعاملة */}
      <h4 className="mt-16">🗂️ {t("application_details")}</h4>
      {isView ? (
        <div className="form-grid cols-3">
          <Field label={t("application_number")}><div>{form.application_number || "-"}</div></Field>
          <Field label={t("application_date")}><div>{form.application_date || "-"}</div></Field>
          <Field label={t("attach_land_site_plan")}><div>{form.application_file ? t("file_attached") : t("no_file")}</div></Field>
        </div>
      ) : (
        <div className="form-grid cols-3">
          <Field label={t("application_number")}>
            <input className="input" value={form.application_number} onChange={(e) => setF("application_number", e.target.value)} />
          </Field>

          <Field label={t("application_date")}>
            <input className="input" type="date" value={form.application_date || ""} onChange={(e) => setF("application_date", e.target.value)} />
          </Field>

          <Field label={t("attach_land_site_plan")}>
            <input className="input" type="file" onChange={(e) => setF("application_file", e.target.files?.[0] || null)} />
          </Field>
        </div>
      )}

      <StepActions onPrev={onPrev} onNext={saveAndNext} />
    </WizardShell>
  );
}
