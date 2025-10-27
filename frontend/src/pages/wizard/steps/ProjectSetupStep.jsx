import { useMemo } from "react";
import { PROJECT_TYPES } from "../hooks/useWizardState";
import WizardShell from "../components/WizardShell";
import StepActions from "../components/StepActions";
import { FaInfoCircle } from "react-icons/fa";

export default function ProjectSetupStep({ value, onChange, onNext, onPrev }) {
  const { projectType, villaCategory, contractType } = value;
  const set = (k, v) => onChange({ ...value, [k]: v });

  const baseSelected =
    !!projectType && (projectType !== "villa" || !!villaCategory) && !!contractType;

  const allowSitePlanFlow =
    projectType === "villa" && villaCategory === "residential" && contractType === "new";

  // “التالي” مسموح فقط لما الشرط الخاص متحقق
  const canProceed = baseSelected && allowSitePlanFlow;

  const chipsProjectTypes = useMemo(
    () =>
      Object.entries(PROJECT_TYPES).map(([k, label]) => [
        k,
        (k === "villa" ? "🏠 " :
         k === "commercial" ? "🏢 " :
         k === "maintenance" ? "🛠 " :
         k === "fitout" ? "🎨 " :
         k === "infra" ? "🧱 " : "🏛 ") + label,
      ]),
    []
  );

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

  return (
    <WizardShell title="🏗️ بيانات المشروع">
      <h4>نوع المشروع</h4>
      {renderChips(chipsProjectTypes, projectType, "projectType")}

      {projectType === "villa" && (
        <>
          <h4 className="mt-12">تصنيف الفيلا</h4>
          {renderChips(
            [
              ["residential", "🏡 سكني"],
              ["commercial", "🏢 تجاري"],
            ],
            villaCategory,
            "villaCategory"
          )}
        </>
      )}

      <h4 className="mt-12">نوع العقد</h4>
      {renderChips(
        [
          ["new", "🆕 عقد جديد"],
          ["continue", "🔁 عقد استكمال"],
        ],
        contractType,
        "contractType"
      )}

      {/* ✅ رسالة قصيرة بنفس شكل المعلومة عند الجاهزية */}
      {canProceed ? (
        <div className="info-note mt-12" role="note">
          <FaInfoCircle aria-hidden />
          <div>اضغط التالي للانتقال إلى <strong>معلومات مخطط الأرض</strong>.</div>
        </div>
      ) : (
        <div className="mini mt-12" role="status" aria-live="polite">
          {baseSelected
            ? "هذا المسار متاح فقط للـ «فيلا سكنية» مع «عقد جديد». عدّل الاختيارات ليظهر «التالي»."
            : "اختر نوع المشروع (ولو فيلا اختر التصنيف) ثم نوع العقد."}
        </div>
      )}

      <StepActions
        onPrev={onPrev}
        onNext={onNext}
        disableNext={!canProceed}
        nextClassName={canProceed ? "pulse" : ""}
      />
    </WizardShell>
  );
}
