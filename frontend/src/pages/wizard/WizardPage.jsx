// src/pages/wizard/WizardPage.jsx
import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../../services/api";
import { FaWrench, FaMap, FaIdCard, FaInfoCircle, FaFileSignature } from "react-icons/fa";

import useWizardState from "./hooks/useWizardState";
import ProjectSetupStep from "./steps/ProjectSetupStep";
import SitePlanStep from "./steps/SitePlanStep";
import LicenseStep from "./steps/LicenseStep";
import ContractStep from "./steps/ContractStep"; // ⬅️ جديد
import SetupSummary from "./components/SetupSummary.jsx";

const EMPTY_SETUP = { projectType: "", villaCategory: "", contractType: "" };

export default function WizardPage() {
  const { projectId } = useParams();
  const { setup, setSetup } = useWizardState();

  const [project, setProject] = useState(null);
  useEffect(() => {
    if (!projectId) return;
    api.get(`projects/${projectId}/`).then(({ data }) => setProject(data)).catch(() => {});
  }, [projectId]);

  const [index, setIndex] = useState(0);
  useEffect(() => {
    setSetup(EMPTY_SETUP);
    setIndex(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const setupHasAllSelections = (s = setup) =>
    !!s.projectType && (s.projectType !== "villa" || !!s.villaCategory) && !!s.contractType;

  const allowSitePlanFlow =
    setup.projectType === "villa" &&
    setup.villaCategory === "residential" &&
    setup.contractType === "new";

  const STEPS = useMemo(() => {
    const base = [{ id: "setup", title: "بيانات المشروع", icon: FaWrench, Component: ProjectSetupStep }];
    return allowSitePlanFlow
      ? [
          ...base,
          { id: "siteplan",  title: "مخطط الأرض", icon: FaMap, Component: SitePlanStep },
          { id: "license",   title: "الرخصة",      icon: FaIdCard, Component: LicenseStep },
          { id: "contract",  title: "العقد",       icon: FaFileSignature, Component: ContractStep }, // ⬅️ جديد
        ]
      : base;
  }, [allowSitePlanFlow]);

  const isFirst = index === 0;
  const isLast  = index === STEPS.length - 1;
  const goPrev  = () => !isFirst && setIndex(i => i - 1);
  const goNext  = () => !isLast  && setIndex(i => i + 1);

  const canEnter = (i) => {
    if (i === 0) return true;
    if (!allowSitePlanFlow) return false;
    return setupHasAllSelections();
  };

  const onStepClick = (i) => { if (canEnter(i)) setIndex(i); };

  const Current = STEPS[index].Component;

  return (
    <div className="container">
      <div className="card">
        <div className="row" style={{justifyContent:"space-between", alignItems:"center"}}>
          <div className="mini">{project?.name ? `المشروع: ${project.name}` : null}</div>
          <Link className="btn secondary" to="/">الرئيسية ←</Link>
        </div>

        {/* Stepper مرقّم + قفل التنقّل */}
        <div className="stepper numbered mt-8">
          {STEPS.map(({ id, title, icon: Icon }, i) => {
            const locked = !canEnter(i);
            const active = index === i;
            return (
              <button
                key={id}
                type="button"
                className={`step ${active ? "active" : ""} ${locked ? "disabled" : ""}`}
                onClick={() => onStepClick(i)}
                disabled={locked}
                aria-disabled={locked}
              >
                <span className="step-dot">{i + 1}</span>
                <Icon style={{marginInlineEnd:8}}/>{title}
              </button>
            );
          })}
        </div>

        {/* ✅ المعلومة العلوية */}
        {index === 0 && (
          <div className="info-note mt-8" role="note">
            <FaInfoCircle aria-hidden />
            <div>يتم استخراج <strong>المعلومات التالية</strong> من <strong>مخطط الأرض</strong>.</div>
          </div>
        )}

        {/* ملخص الإعداد */}
        <div className="mt-12">
          <SetupSummary setup={setup} />
        </div>
      </div>

      {/* الخطوة الحالية فقط */}
      {index === 0 && (
        <Current
          value={setup}
          onChange={setSetup}
          onNext={() => {
            if (allowSitePlanFlow && setupHasAllSelections()) goNext();
          }}
        />
      )}

      {allowSitePlanFlow && index === 1 && (
        <Current projectId={projectId} setup={setup} onPrev={goPrev} onNext={goNext} />
      )}

      {allowSitePlanFlow && index === 2 && (
        <Current projectId={projectId} onPrev={goPrev} onNext={goNext} />
      )}

      {allowSitePlanFlow && index === 3 && (
        <Current projectId={projectId} onPrev={goPrev} />
      )}
    </div>
  );
}
