// src/pages/wizard/WizardPage.jsx
import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "../../services/api";
import { FaWrench, FaMap, FaIdCard, FaFileSignature } from "react-icons/fa";

import useWizardState from "./hooks/useWizardState";
import ProjectSetupStep from "./steps/ProjectSetupStep";
import SitePlanStep from "./steps/SitePlanStep";
import LicenseStep from "./steps/LicenseStep";
import ContractStep from "./steps/ContractStep";
import SetupSummary from "./components/SetupSummary.jsx";
import InfoTip from "./components/InfoTip";

const EMPTY_SETUP = { projectType: "", villaCategory: "", contractType: "" };
const STEP_INDEX = { setup: 0, siteplan: 1, license: 2, contract: 3 };

export default function WizardPage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  const { projectId } = useParams();
  const [params] = useSearchParams();

  const mode = (params.get("mode") || "edit").toLowerCase();
  const isView = mode === "view";
  const stepParam = (params.get("step") || "setup").toLowerCase();

  const { setup, setSetup } = useWizardState();

  const [project, setProject] = useState(null);
  const [index, setIndex] = useState(0);

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
        });
      } catch { /* ignore */ }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const setupHasAllSelections = (s = setup) =>
    !!s.projectType && (s.projectType !== "villa" || !!s.villaCategory) && !!s.contractType;

  const allowSitePlanFlow =
    setup.projectType === "villa" &&
    (setup.villaCategory === "residential" || setup.villaCategory === "commercial") &&
    setup.contractType === "new";

  useEffect(() => {
    const wanted = STEP_INDEX[stepParam] ?? 0;
    const maxIndex = allowSitePlanFlow ? 3 : 0;
    setIndex(Math.min(wanted, maxIndex));
  }, [stepParam, allowSitePlanFlow]);

  const labels = {
    setup: lang === "ar" ? "🧱 معلومات المشروع" : "🧱 Project Details",
    siteplan: lang === "ar" ? "📐 مخطط الأرض" : "📐 Land Site Plan",
    license: lang === "ar" ? "📄 ترخيص بناء" : "📄 Building Permit",
    contract: lang === "ar" ? "📝 معلومات العقد" : "📝 Contract Details",
    projectPrefix: lang === "ar" ? "المشروع" : "Project",
    home: lang === "ar" ? "الرئيسية" : "Home",
    infoNote:
      lang === "ar"
        ? "سيتم استخراج بعض بيانات المشروع تلقائيًا من مخطط الأرض 📐 وترخيص البناء 📄 حسب المتاح."
        : "Some project data will be fetched automatically from the Land Site Plan 📐 and the Building Permit 📄 when available.",
  };

  const STEPS = useMemo(() => {
    const base = [{ id: "setup", title: labels.setup, icon: FaWrench, Component: ProjectSetupStep }];
    return allowSitePlanFlow
      ? [
          ...base,
         { id: "siteplan", title: labels.siteplan, Component: SitePlanStep },

          { id: "license", title: labels.license, icon: FaIdCard, Component: LicenseStep },
          { id: "contract", title: labels.contract, icon: FaFileSignature, Component: ContractStep },
        ]
      : base;
  }, [allowSitePlanFlow, labels.setup, labels.siteplan, labels.license, labels.contract]);

  const isFirst = index === 0;
  const isLast = index === STEPS.length - 1;  
  const goPrev = () => !isFirst && setIndex((i) => i - 1);
  const goNext = () => !isLast && setIndex((i) => i + 1);

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
        <div className="row row--space-between row--align-center">
          <div className="mini">
            {project?.name ? `${labels.projectPrefix}: ${project.name}` : null}
          </div>
          <Link className="btn secondary" to={`/projects/${projectId}`}>
            {labels.projectPrefix} ←
          </Link>
        </div>

        {/* Stepper */}
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
              >
                <span className="step-dot">{i + 1}</span>
{Icon && <Icon className="mie-8" />}
                {title}
              </button>
            );
          })}
        </div>

        {/* Info (i) */}
        {index === 0 && (
          <div className="row row--align-center row--gap-8 mt-8">
            <InfoTip wide align="start" text={labels.infoNote} />
            <span className="mini">{/* muted بالفعل */}اضغط على (i) للمعلومة.</span>
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
        <Current projectId={projectId} onPrev={goPrev} isView={isView} />
      )}
    </div>
  );
}
