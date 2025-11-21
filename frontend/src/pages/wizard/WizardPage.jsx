import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaCheck } from "react-icons/fa";
import { api } from "../../services/api";
import Button from "../../components/Button";

import useWizardState from "./hooks/useWizardState";
import useProjectData from "../../hooks/useProjectData";
import ProjectSetupStep from "./steps/ProjectSetupStep";
import SitePlanStep from "./steps/SitePlanStep";
import LicenseStep from "./steps/LicenseStep";
import ContractStep from "./steps/ContractStep";
import SetupSummary from "./components/SetupSummary.jsx";
import InfoTip from "./components/InfoTip";
import AwardingStep from "./steps/AwardingStep";

const EMPTY_SETUP = { projectType: "", villaCategory: "", contractType: "" };
const STEP_INDEX = { setup: 0, siteplan: 1, license: 2, contract: 3, award: 4 };

export default function WizardPage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const isAR = /^ar\b/i.test(lang || "");

  const { projectId } = useParams();
  const [params] = useSearchParams();

  const mode = (params.get("mode") || "edit").toLowerCase();
  const isView = mode === "view";
  const stepParam = (params.get("step") || "setup").toLowerCase();

  const { setup, setSetup } = useWizardState();

  const [project, setProject] = useState(null);
  const [contract, setContract] = useState(null);
  const [index, setIndex] = useState(0);
  
  // ✅ جلب بيانات المشروع للتحقق من المراحل المكتملة
  const { siteplan, license, contract: contractData, awarding } = useProjectData(projectId);

  useEffect(() => {
    if (!projectId) return;
    (async () => {
      try {
        const { data } = await api.get(`projects/${projectId}/`);
        setProject(data);
        setSetup({
          projectType: data?.project_type || "",
          villaCategory: data?.villa_category || "",
          contractType: data?.contract_type || "",
          internalCode: data?.internal_code || "",
        });
      } catch {}
    })();
  }, [projectId, setSetup]);

  const setupHasAllSelections = (s = setup) =>
    !!s.projectType && (s.projectType !== "villa" || !!s.villaCategory) && !!s.contractType;

  const allowSitePlanFlow =
    setup.projectType === "villa" &&
    (setup.villaCategory === "residential" || setup.villaCategory === "commercial") &&
    setup.contractType === "new";

  // تحميل بيانات العقد لتحديد نوع التمويل
  useEffect(() => {
    if (!projectId || !allowSitePlanFlow) return;
    let mounted = true;
    (async () => {
      try {
        const { data } = await api.get(`projects/${projectId}/contract/`);
        if (mounted && Array.isArray(data) && data.length > 0) {
          setContract(data[0]);
        }
      } catch {}
    })();
    return () => { mounted = false; };
  }, [projectId, allowSitePlanFlow]);

  const labels = {
    setup: t("wizard_step_setup"),
    siteplan: t("wizard_step_siteplan"),
    license: t("wizard_step_license"),
    contract: t("wizard_step_contract"),
    award: t("wizard_step_award"),
    projectPrefix: t("wizard_project_prefix"),
    home: t("wizard_home"),
    infoNote: t("wizard_info_note"),
  };

  // تحديد ما إذا كان التمويل خاص (يحتاج AwardingStep)
  const isPrivateFunding = contract?.contract_classification === "private_funding";
  const isHousingLoan = contract?.contract_classification === "housing_loan_program";

  const STEPS = useMemo(() => {
    const base = [{ id: "setup", title: labels.setup, Component: ProjectSetupStep }];
    if (!allowSitePlanFlow) return base;
    
    const steps = [
      ...base,
      { id: "siteplan", title: labels.siteplan, Component: SitePlanStep },
      { id: "license", title: labels.license, Component: LicenseStep },
      { id: "contract", title: labels.contract, Component: ContractStep },
    ];
    
    // إضافة AwardingStep فقط للقرض السكني (وليس للتمويل الخاص)
    // إذا لم يكن هناك contract بعد، نضيف AwardingStep كخيار افتراضي
    // إذا كان هناك contract وكان housing_loan، نضيف AwardingStep
    // إذا كان هناك contract وكان private_funding، لا نضيف AwardingStep
    const shouldAddAwardingStep = !contract || isHousingLoan;
    if (shouldAddAwardingStep) {
      steps.push({ id: "award", title: labels.award, Component: AwardingStep });
    }
    
    return steps;
  }, [allowSitePlanFlow, contract, isHousingLoan, isPrivateFunding, labels.setup, labels.siteplan, labels.license, labels.contract, labels.award]);

  useEffect(() => {
    const wanted = STEP_INDEX[stepParam] ?? 0;
    const maxIndex = allowSitePlanFlow ? (STEPS.length - 1) : 0;
    setIndex(Math.min(wanted, maxIndex));
  }, [stepParam, allowSitePlanFlow, STEPS.length]);

  // التأكد من أن index صالح بعد تحديث STEPS (مثلاً إذا تم إزالة AwardingStep)
  useEffect(() => {
    if (index >= STEPS.length) {
      setIndex(Math.max(0, STEPS.length - 1));
    }
  }, [STEPS.length, index]);

  const isFirst = index === 0;
  const isLast = index === STEPS.length - 1;
  const goPrev = () => !isFirst && setIndex((i) => i - 1);
  const goNext = () => !isLast && setIndex((i) => i + 1);

  const canEnter = (i) => {
    if (i === 0) return true;
    if (!allowSitePlanFlow) return false;
    return setupHasAllSelections();
  };
  const onStepClick = (i) => {
    if (canEnter(i)) setIndex(i);
  };

  // ✅ تحديد المراحل المكتملة
  const isStepCompleted = (stepId) => {
    switch (stepId) {
      case "setup":
        // Setup مكتمل إذا كان هناك project_type و contract_type
        return setupHasAllSelections();
      case "siteplan":
        return !!siteplan;
      case "license":
        return !!license;
      case "contract":
        return !!contractData;
      case "award":
        return !!awarding;
      default:
        return false;
    }
  };

  const Current = STEPS[index].Component;

  return (
    <div className="container">
      <div className="card">
        <div className="row row--space-between row--align-center">
          <div className="mini">
            {project?.name ? `${labels.projectPrefix}: ${project.name}` : null}
          </div>
          <Button as={Link} variant="secondary" to={`/projects/${projectId}`}>
            {labels.projectPrefix} ←
          </Button>
        </div>

        {/* Stepper */}
        <div className="stepper numbered mt-8">
          {STEPS.map(({ id, title }, i) => {
            const locked = !canEnter(i);
            const active = index === i;
            const completed = isStepCompleted(id);
            return (
              <button
                key={id}
                type="button"
                className={`step ${active ? "active" : ""} ${locked ? "disabled" : ""} ${completed ? "completed" : ""}`}
                onClick={() => onStepClick(i)}
                disabled={locked}
              >
                <span className="step-dot">
                  {completed ? <FaCheck className="step-check" /> : i + 1}
                </span>
                {title}
              </button>
            );
          })}
        </div>

        {/* Info */}
        {index === 0 && (
          <div className="row row--align-center row--gap-8 mt-8">
            <InfoTip wide align="start" text={labels.infoNote} />
            <span className="mini">{t("wizard_info_click")}</span>
          </div>
        )}

        {/* Summary */}
        <div className="mt-12">
          <SetupSummary setup={setup} />
        </div>
      </div>

      {/* الخطوات */}
      {index === 0 && (
        <Current
          value={setup}
          onChange={setSetup}
          onNext={() => {
            if (!isView && allowSitePlanFlow && setupHasAllSelections()) goNext();
          }}
          isView={isView}
        />
      )}

      {allowSitePlanFlow && index === 1 && (
        <Current projectId={projectId} setup={setup} onPrev={goPrev} onNext={goNext} isView={isView} />
      )}
      {allowSitePlanFlow && index === 2 && (
        <Current projectId={projectId} onPrev={goPrev} onNext={goNext} isView={isView} />
      )}
      {allowSitePlanFlow && index === 3 && (
        <Current 
          projectId={projectId} 
          onPrev={goPrev} 
          // ✅ نمرر onNext إذا كانت هناك خطوة تالية (AwardingStep موجودة)
          // ContractStep سيتحقق داخلياً من نوع العقد (housing_loan_program) ليقرر ما إذا كان يجب الانتقال للخطوة التالية
          onNext={STEPS.some(s => s.id === "award") ? goNext : undefined}
          isView={isView} 
        />
      )}
      {allowSitePlanFlow && index === 4 && (
        <Current projectId={projectId} onPrev={goPrev} isView={isView} />
      )}
    </div>
  );
}
