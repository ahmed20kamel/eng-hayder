// src/pages/wizard/steps/SummaryStep.jsx
import { useTranslation } from "react-i18next";
import WizardShell from "../components/WizardShell";
import StepActions from "../components/StepActions";
import ContractFinancialSummary from "../components/ContractFinancialSummary";
import { FaPrint } from "react-icons/fa";

export default function SummaryStep({ projectId, onPrev }) {
  const { i18n } = useTranslation();
  const isAR = i18n.language === "ar";

  return (
    <WizardShell title={isAR ? "✅ الملخص النهائي للعقد" : "✅ Final Contract Summary"}>
      <div className="row" style={{ justifyContent: "flex-end" }}>
        <button className="btn secondary" onClick={() => window.print()}>
          <FaPrint /> {isAR ? "طباعة / PDF" : "Print / PDF"}
        </button>
      </div>

      {/* جدول الملخص المالي بالضبط مثل الإكسيل */}
      <div className="mt-12">
        <ContractFinancialSummary projectId={projectId} />
      </div>

      <StepActions onPrev={onPrev} onNext={null} />
    </WizardShell>
  );
}
