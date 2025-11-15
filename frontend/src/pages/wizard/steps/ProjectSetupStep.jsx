import { useMemo, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import WizardShell from "../components/WizardShell";
import StepActions from "../components/StepActions";
import InfoTip from "../components/InfoTip";
import { api } from "../../../services/api";

export default function ProjectSetupStep({ value, onChange, onNext, onPrev, isView }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const { projectId } = useParams();

  // ✨ internalCode مضاف
  const { projectType, villaCategory, contractType, internalCode } = value || {};
  const set = (k, v) => onChange({ ...value, [k]: v });

  const baseSelected =
    !!projectType && (projectType !== "villa" || !!villaCategory) && !!contractType;

  const allowSitePlanFlow =
    projectType === "villa" &&
    (villaCategory === "residential" || villaCategory === "commercial") &&
    contractType === "new";

  const canProceed = baseSelected && allowSitePlanFlow;

  const SS_KEY = `ProjectSetupStep:isView:${projectId || "new"}`;
  const [localIsView, setLocalIsView] = useState(() => {
    if (isView === true) return true;
    const saved = sessionStorage.getItem(SS_KEY);
    if (saved === "true" || saved === "false") return saved === "true";
    return false;
  });

  useEffect(() => {
    if (isView === true) {
      sessionStorage.setItem(SS_KEY, "true");
      setLocalIsView(true);
    }
  }, [isView]);

  useEffect(() => {
    sessionStorage.setItem(SS_KEY, String(localIsView));
  }, [SS_KEY, localIsView]);

  useEffect(() => {
    if (!baseSelected && localIsView) setLocalIsView(false);
  }, [baseSelected, localIsView]);

  const labels = {
    pageTitle: `🧱 ${t("wizard_step_setup")}`,
    categoryTitle: lang === "ar" ? "🏗️ تصنيف المشروع" : "🏗️ Project Category",
    subcatsTitle: lang === "ar" ? "📄 التصنيفات الفرعية" : "📄 Subcategories",
    contractTypeTitle: lang === "ar" ? "📝 نوع العقد" : "📝 Contract Type",
    // ✨ NEW: internal code labels
    internalCodeTitle: lang === "ar" ? "🔐 الكود الداخلي للمشروع" : "🔐 Internal Project Code",
    internalCodeHelp:
      lang === "ar"
        ? " يبدأ بالحرف  M وبعدين أرقام فردية فقط (1,3,5,7,9)."
        : "Must start with M, followed by odd digits only (1,3,5,7,9). Any other characters/even digits are stripped automatically.",
    internalCodePlaceholder: lang === "ar" ? "مثال: M13579" : "e.g., M13579",

    readyNote:
      lang === "ar"
        ? `اضغط «التالي» للانتقال إلى ${"📐 " + t("wizard_step_siteplan")} ثم ${"📄 " + t("wizard_step_license")} و ${"📝 " + t("wizard_step_contract")}.`
        : `Press “Next” to continue to ${"📐 " + t("wizard_step_siteplan")}, then ${"📄 " + t("wizard_step_license")} and ${"📝 " + t("wizard_step_contract")}.`,
    helpSelectAll:
      lang === "ar"
        ? "اختر تصنيف المشروع (ولو فيلا اختر التصنيف الفرعي) ثم حدّد نوع العقد."
        : "Pick the Project Category (and a subcategory if Villa), then select the Contract Type.",
    helpPathOnly:
      lang === "ar"
        ? "هذا المسار متاح فقط لفيلا سكنية أو فيلا تجارية مع عقد إنشاء جديد. عدّل الاختيارات ليظهر «التالي»."
        : "This path is only available for Residential or Commercial Villa with a New Contract. Adjust selections to enable “Next”.",
    edit: lang === "ar" ? "تعديل" : "Edit",
  };

  const chipsProjectTypes = useMemo(
    () =>
      lang === "ar"
        ? [
            ["villa", "🏡 فيلا"],
            ["commercial", "🏢 تجاري"],
            ["maintenance", "🛠️ أعمال صيانة"],
            ["governmental", "🏛️ مشاريع حكومية"],
            ["fitout", "🔨 أعمال تجديد وتجهيز داخلي"],
          ]
        : [
            ["villa", "🏡 Villa"],
            ["commercial", "🏢 Commercial"],
            ["maintenance", "🛠️ Maintenance Works"],
            ["governmental", "🏛️ Governmental"],
            ["fitout", "🔨 Renovation & Fit-Out"],
          ],
    [lang]
  );

  const villaSubcategories = useMemo(
    () =>
      lang === "ar"
        ? [
            ["residential", "🏡 فيلا سكنية"],
            ["commercial", "🏠💼 فيلا تجارية"],
          ]
        : [
            ["residential", "🏡 Residential Villa"],
            ["commercial", "🏠💼 Commercial Villa"],
          ],
    [lang]
  );

  const contractTypes = useMemo(
    () =>
      lang === "ar"
        ? [
            ["new", "🔹 عقد إنشاء جديد"],
            ["continue", "🔄 عقد استكمال"],
          ]
        : [
            ["new", "🔹 New Contract"],
            ["continue", "🔄 Continuation Contract"],
          ],
    [lang]
  );

  const labelMap = useMemo(() => {
    const m = (pairs) =>
      pairs.reduce((acc, [v, label]) => {
        acc[v] = label;
        return acc;
      }, {});
    return {
      projectType: m(chipsProjectTypes),
      villaCategory: m(villaSubcategories),
      contractType: m(contractTypes),
    };
  }, [chipsProjectTypes, villaSubcategories, contractTypes]);

  const renderChips = (options, currentValue, key) => (
    <div className="chips">
      {options.map(([v, label]) => (
        <button
          key={v}
          type="button"
          className={`chip ${currentValue === v ? "active" : ""}`}
          onClick={() => set(key, v)}
        >
          {label}
        </button>
      ))}
    </div>
  );

// ✨ NEW: formatter for internal code => "M" + digits only (زوجي + فردي)
const toDigits = (s) =>
  (s || "").replace(/[^0-9]/g, ""); // أرقام فقط بدون حذف الزوجي

const formatInternalCode = (raw) => {
  const digits = toDigits(raw);
  return ("M" + digits).slice(0, 40);
};
const isLastDigitOdd = (code) => {
  const last = code.replace(/\D/g, "").slice(-1);
  return ["1", "3", "5", "7", "9"].includes(last);
};

const handleSaveAndNext = async () => {
  if (!projectId) return;

  const formatted = formatInternalCode(internalCode);

  // ✅ التحقق إن آخر رقم فردي
  if (!isLastDigitOdd(formatted)) {
    alert(
      lang === "ar"
        ? "آخر رقم في الكود يجب أن يكون فردي (1,3,5,7,9)."
        : "The last digit must be odd (1,3,5,7,9)."
    );
    return;
  }

  try {
    const payload = {
      project_type: projectType || null,
      villa_category: projectType === "villa" ? (villaCategory || null) : null,
      contract_type: contractType || null,
      internal_code: formatted,
    };

    await api.patch(`projects/${projectId}/`, payload);
    setLocalIsView(true);
    sessionStorage.setItem(SS_KEY, "true");

    if (onNext && canProceed) onNext();
  } catch (e) {
    console.error("Project setup save failed:", e);
  }
};


  return (
    <WizardShell title={labels.pageTitle}>
      {localIsView && (
        <div className={`row ${lang === "ar" ? "justify-start" : "justify-end"} mb-12`}>
          <button type="button" className="btn secondary" onClick={() => setLocalIsView(false)}>
            ✏️ {labels.edit}
          </button>
        </div>
      )}

      {/* ✨ NEW: Internal Code field */}
      <h4 className="inline-flex ai-center gap-6">
        {labels.internalCodeTitle}
        <InfoTip inline align="start" text={labels.internalCodeHelp} />
      </h4>

      {localIsView ? (
        <div className="card" role="group" aria-label={labels.internalCodeTitle}>
          <div className="p-8 mono">
            {(internalCode && formatInternalCode(internalCode)) || "—"}
          </div>
        </div>
      ) : (
        <div className="card" role="group" aria-label={labels.internalCodeTitle}>
          <div className="p-8">
            <input
              type="text"
              inputMode="numeric"
              className="input w-100 mono"
              placeholder={labels.internalCodePlaceholder}
              value={formatInternalCode(internalCode || "")}
              onChange={(e) => set("internalCode", formatInternalCode(e.target.value))}
              aria-describedby="internal-code-help"
              maxLength={40}
            />
            <div id="internal-code-help" className="muted mt-4">
              {labels.internalCodeHelp}
            </div>
          </div>
        </div>
      )}

      {/* تصنيف المشروع + أيقونة المعلومة */}
      <h4 className="inline-flex ai-center gap-6">
        {labels.categoryTitle}
        <InfoTip
          inline
          wide
          align="start"
          text={
            canProceed
              ? labels.readyNote
              : baseSelected
              ? labels.helpPathOnly
              : labels.helpSelectAll
          }
          title={lang === "ar" ? "معلومة" : "Info"}
        />
      </h4>

      {localIsView ? (
        <div className="card" role="group" aria-label={labels.categoryTitle}>
          <div className="p-8">{labelMap.projectType[projectType] || "—"}</div>
        </div>
      ) : (
        renderChips(chipsProjectTypes, projectType, "projectType")
      )}

      {projectType === "villa" && (
        <>
          <h4 className="mt-12 inline-flex ai-center gap-6">
            {labels.subcatsTitle}
            <InfoTip
              inline
              align="start"
              text={lang === "ar" ? "اختر نوع الفيلا (سكنية/تجارية)." : "Pick villa type."}
            />
          </h4>
          {localIsView ? (
            <div className="card" role="group" aria-label={labels.subcatsTitle}>
              <div className="p-8">{labelMap.villaCategory[villaCategory] || "—"}</div>
            </div>
          ) : (
            renderChips(villaSubcategories, villaCategory, "villaCategory")
          )}
        </>
      )}

      <h4 className="mt-12 inline-flex ai-center gap-6">
        {labels.contractTypeTitle}
        <InfoTip
          inline
          align="start"
          text={
            lang === "ar"
              ? "لو عايز مسار رخصة/مخطط، لازم عقد إنشاء جديد."
              : "For site plan/license path, choose New Contract."
          }
        />
      </h4>

      {localIsView ? (
        <div className="card" role="group" aria-label={labels.contractTypeTitle}>
          <div className="p-8">{labelMap.contractType[contractType] || "—"}</div>
        </div>
      ) : (
        renderChips(contractTypes, contractType, "contractType")
      )}

      <StepActions
        onPrev={onPrev}
        onNext={handleSaveAndNext}
        disableNext={!baseSelected}
        nextClassName={baseSelected ? "pulse" : ""}
        nextLabel={lang === "ar" ? "حفظ وانتقال →" : "Save & Next →"}
      />
    </WizardShell>
  );
}
