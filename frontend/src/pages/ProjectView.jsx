import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "../services/api";
import Card from "../components/Card";
import Button from "../components/Button";
import Dialog from "../components/Dialog";
import PageLayout from "../components/PageLayout";
import useProjectData from "../hooks/useProjectData";
import { formatMoney } from "../utils/formatters";
import { getProjectTypeLabel, getVillaCategoryLabel, getContractTypeLabel } from "../utils/projectLabels";
import { formatInternalCode } from "../utils/internalCodeFormatter";

export default function ProjectView() {
  const { projectId } = useParams();
  const { t, i18n } = useTranslation();
  const nav = useNavigate();
  const { project, siteplan, license, contract, awarding, loading } = useProjectData(projectId);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const hasSiteplan = !!siteplan;
  const hasLicense = !!license;
  const hasContract = !!contract;
  const hasAwarding = !!awarding;
  const isHousingLoan = contract?.contract_classification === "housing_loan_program";

  const titleText = project?.display_name || project?.name || t("wizard_project_prefix") + ` #${projectId}`;
  const projectTypeLabel = getProjectTypeLabel(project?.project_type, i18n.language);
  const villaCategoryLabel = project?.villa_category
    ? getVillaCategoryLabel(project.villa_category, i18n.language)
    : null;
  const contractTypeLabel = getContractTypeLabel(project?.contract_type, i18n.language);

  const onDelete = async () => {
    if (!projectId) return;
    try {
      setDeleting(true);
      await api.delete(`projects/${projectId}/`);
      setConfirmOpen(false);
      nav("/projects");
    } catch (e) {
      const msg = e?.response?.data?.detail || e?.message || t("delete_error");
      setErrorMsg(msg);
      setConfirmOpen(false);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <PageLayout loading={loading} loadingText={t("loading")}>
      <div className="container">
        {/* Header Section */}
        <div className="prj-view-header">
          <div className="prj-view-header__content">
            <h1 className="prj-view-title">{titleText}</h1>
            {project?.internal_code && (
              <div className="prj-view-code">
                {t("project_view_internal_code")}{" "}
                <span className="mono">
                  {formatInternalCode(project.internal_code)}
                </span>
              </div>
            )}
          </div>
          <div className="prj-view-header__actions">
            <Button as={Link} variant="secondary" to="/projects">
              {t("back_projects")}
            </Button>
            <Button as={Link} to={`/projects/${projectId}/wizard?step=setup&mode=edit`}>
              {t("edit_project")}
            </Button>
            <Button variant="danger" onClick={() => setConfirmOpen(true)}>
              {t("delete_project")}
            </Button>
          </div>
        </div>

        {/* Cards Grid */}
        <div className="prj-view-grid">
          {/* Row 1: Three Cards - معلومات المشروع، المخطط، الرخصة */}
          <div className="prj-view-grid-row">
            {/* Project Information */}
            <Card
            title={t("project_information")}
            actions={
              <div className="prj-card-actions">
                <Button as={Link} to={`/projects/${projectId}/setup/view`} variant="secondary">
                  {t("view_details")}
                </Button>
                <Button as={Link} to={`/projects/${projectId}/wizard?step=setup&mode=edit`}>
                  {t("edit")}
                </Button>
              </div>
            }
            className="prj-view-card"
          >
            <div className="prj-info-grid">
              {project?.internal_code && (
                <div className="prj-info-item">
                  <div className="prj-info-label">{t("project_view_internal_code")}</div>
                  <div className="prj-info-value">
                    <span className="mono">
                      {formatInternalCode(project.internal_code)}
                    </span>
                  </div>
                </div>
              )}
              <div className="prj-info-item">
                <div className="prj-info-label">{t("project_type_label")}</div>
                <div className="prj-info-value">{projectTypeLabel || t("empty_value")}</div>
              </div>
            </div>
          </Card>

            {/* Site Plan */}
            <Card
            title={t("site_plan")}
            actions={
              <div className="prj-card-actions">
                <Button
                  as={Link}
                  disabled={!hasSiteplan}
                  to={hasSiteplan ? `/projects/${projectId}/siteplan/view` : "#"}
                  variant="secondary"
                  onClick={(e) => {
                    if (!hasSiteplan) e.preventDefault();
                  }}
                >
                  {t("view_details")}
                </Button>
                <Button as={Link} to={`/projects/${projectId}/wizard?step=siteplan&mode=edit`}>
                  {t("edit")}
                </Button>
              </div>
            }
            className="prj-view-card"
          >
            {hasSiteplan ? (
              <div className="prj-info-grid">
                <div className="prj-info-item">
                  <div className="prj-info-label">{t("municipality_label")}</div>
                  <div className="prj-info-value">{siteplan?.municipality || t("empty_value")}</div>
                </div>
                <div className="prj-info-item">
                  <div className="prj-info-label">{t("zone_label")}</div>
                  <div className="prj-info-value">{siteplan?.zone || t("empty_value")}</div>
                </div>
              </div>
            ) : (
              <div className="prj-empty-state">
                {t("site_plan_not_added")}
              </div>
            )}
          </Card>

            {/* Building License */}
            <Card
            title={t("building_license")}
            actions={
              <div className="prj-card-actions">
                <Button
                  as={Link}
                  disabled={!hasLicense}
                  to={hasLicense ? `/projects/${projectId}/license/view` : "#"}
                  variant="secondary"
                  onClick={(e) => {
                    if (!hasLicense) e.preventDefault();
                  }}
                >
                  {t("view_details")}
                </Button>
                <Button as={Link} to={`/projects/${projectId}/wizard?step=license&mode=edit`}>
                  {t("edit")}
                </Button>
              </div>
            }
            className="prj-view-card"
          >
            {hasLicense ? (
              <div className="prj-info-grid">
                <div className="prj-info-item">
                  <div className="prj-info-label">{t("license_no_label")}</div>
                  <div className="prj-info-value">{license?.license_no || t("empty_value")}</div>
                </div>
                <div className="prj-info-item">
                  <div className="prj-info-label">{t("contractor_label")}</div>
                  <div className="prj-info-value">{license?.contractor_name || t("empty_value")}</div>
                </div>
              </div>
            ) : (
              <div className="prj-empty-state">
                {t("license_not_added")}
              </div>
            )}
          </Card>
          </div>

          {/* Row 2: Three Cards - العقد، الترسية، الملخص المالي */}
          <div className="prj-view-grid-row">
            {/* Contract Information */}
            <Card
            title={t("contract_information")}
            actions={
              <div className="prj-card-actions">
                <Button
                  as={Link}
                  disabled={!hasContract}
                  to={hasContract ? `/projects/${projectId}/contract/view` : "#"}
                  variant="secondary"
                  onClick={(e) => {
                    if (!hasContract) e.preventDefault();
                  }}
                >
                  {t("view_details")}
                </Button>
                <Button as={Link} to={`/projects/${projectId}/wizard?step=contract&mode=edit`}>
                  {t("edit")}
                </Button>
              </div>
            }
            className="prj-view-card"
          >
            {hasContract ? (
              <div className="prj-info-grid">
                <div className="prj-info-item">
                  <div className="prj-info-label">{t("contract_type_label")}</div>
                  <div className="prj-info-value">{getContractTypeLabel(contract?.contract_type, i18n.language) || t("empty_value")}</div>
                </div>
                <div className="prj-info-item prj-info-item--highlight">
                  <div className="prj-info-label">{t("total_project_value")}</div>
                  <div className="prj-info-value prj-info-value--money">
                    {formatMoney(contract?.total_project_value)}
                  </div>
                </div>
              </div>
            ) : (
              <div className="prj-empty-state">
                {t("contract_not_added")}
              </div>
            )}
          </Card>

            {/* Awarding (للقرض السكني فقط) */}
            {isHousingLoan && (
              <Card
                title={t("awarding_gulf_bank_contract_info")}
                actions={
                  <div className="prj-card-actions">
                    {hasAwarding && (
                      <Button as={Link} to={`/projects/${projectId}/awarding/view`} variant="secondary">
                        {t("view_details")}
                      </Button>
                    )}
                    <Button as={Link} to={`/projects/${projectId}/wizard?step=award`}>
                      {hasAwarding ? t("edit") : t("add")}
                    </Button>
                  </div>
                }
                className="prj-view-card"
              >
                {hasAwarding ? (
                  <div className="prj-info-grid">
                    <div className="prj-info-item">
                      <div className="prj-info-label">{t("awarding_date")}</div>
                      <div className="prj-info-value">{awarding?.award_date || t("empty_value")}</div>
                    </div>
                    <div className="prj-info-item">
                      <div className="prj-info-label">{t("project_number")}</div>
                      <div className="prj-info-value">{awarding?.project_number || t("empty_value")}</div>
                    </div>
                  </div>
                ) : (
                  <div className="prj-empty-state">
                    {t("awarding_not_added")}
                  </div>
                )}
              </Card>
            )}

            {/* Financial Summary */}
            <Card
            title={t("financial_summary")}
            subtitle={t("financial_summary_subtitle")}
            actions={
              <Button as={Link} variant="secondary" to={`/projects/${projectId}/summary`}>
                {t("view_summary")}
              </Button>
            }
            className="prj-view-card"
          >
            <div className="prj-summary-info">
              {t("financial_summary_desc")}
            </div>
          </Card>
          </div>
        </div>
      </div>

      <Dialog
        open={confirmOpen}
        title={t("confirm_delete")}
        desc={
          <>
            {t("confirm_delete_desc")}{" "}
            <b>{titleText}</b>?<br />
            {t("delete_cannot_undo")}
          </>
        }
        confirmLabel={deleting ? t("deleting") : t("delete_permanent")}
        cancelLabel={t("cancel")}
        onClose={() => !deleting && setConfirmOpen(false)}
        onConfirm={onDelete}
        danger
        busy={deleting}
      />

      <Dialog
        open={!!errorMsg}
        title={t("error")}
        desc={errorMsg}
        confirmLabel={t("ok")}
        onClose={() => setErrorMsg("")}
        onConfirm={() => setErrorMsg("")}
      />
    </PageLayout>
  );
}
