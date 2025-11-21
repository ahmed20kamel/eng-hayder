import { useParams, useLocation, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "../services/api";
import { useState, useEffect } from "react";
import PageLayout from "../components/PageLayout";
import Button from "../components/Button";
import ViewRow from "../components/fields/ViewRow";
import { FaUpload, FaBuilding, FaEdit } from "react-icons/fa";

export default function ContractorDetailPage() {
  const { contractorName } = useParams();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const isAR = /^ar\b/i.test(i18n.language || "");
  const [contractorData, setContractorData] = useState(location.state?.contractorData || null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [profileImage, setProfileImage] = useState("");

  useEffect(() => {
    if (contractorData) {
      loadProjects();
      // تحميل صورة البروفايل من localStorage
      const savedImage = localStorage.getItem(`contractor_${contractorData.name}_image`);
      if (savedImage) {
        setProfileImage(savedImage);
      }
    } else {
      setError(t("contractor_data_not_found"));
      setLoading(false);
    }
  }, [contractorData]);

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const url = reader.result;
        setProfileImage(url);
        localStorage.setItem(`contractor_${contractorData.name}_image`, url);
      };
      reader.readAsDataURL(file);
    }
  };

  const loadProjects = async () => {
    if (!contractorData) return;
    setLoading(true);
    try {
      const projectDetails = await Promise.all(
        contractorData.projects.map(async (p) => {
          try {
            const { data } = await api.get(`projects/${p.id}/`);
            return { ...p, ...data };
          } catch (e) {
            return p;
          }
        })
      );
      setProjects(projectDetails);
    } catch (e) {
      console.error("Error loading projects:", e);
      setError(t("error_loading_projects"));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <PageLayout loading={true} loadingText={t("loading")} />;
  }

  if (error || !contractorData) {
    return (
      <PageLayout>
        <div className="container">
          <div className="card">
            <h2>{t("error")}</h2>
            <p>{error || t("contractor_data_not_found")}</p>
            <Button as={Link} to="/contractors" variant="primary">
              {t("back_to_contractors")}
            </Button>
          </div>
        </div>
      </PageLayout>
    );
  }

  const fullContractorData = contractorData.fullData || {};

  return (
    <PageLayout>
      <div className="container">
        {/* بروفايل الشركة */}
        <div className="card" style={{ marginBottom: "24px" }}>
          <div style={{ 
            display: "flex", 
            gap: "32px", 
            alignItems: "flex-start",
            padding: "32px",
            flexWrap: "wrap"
          }}>
            {/* صورة البروفايل */}
            <div style={{ 
              position: "relative",
              flexShrink: 0
            }}>
              {profileImage ? (
                <div style={{ position: "relative" }}>
                  <img 
                    src={profileImage} 
                    alt={contractorData.name}
                    style={{
                      width: "160px",
                      height: "160px",
                      borderRadius: "12px",
                      objectFit: "cover",
                      border: "3px solid var(--border)",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                    }}
                  />
                  <label
                    style={{
                      position: "absolute",
                      bottom: "8px",
                      right: "8px",
                      background: "var(--primary)",
                      color: "white",
                      borderRadius: "50%",
                      width: "36px",
                      height: "36px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                      transition: "all 0.2s ease"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "scale(1.1)";
                      e.currentTarget.style.background = "var(--primary-600)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "scale(1)";
                      e.currentTarget.style.background = "var(--primary)";
                    }}
                  >
                    <FaEdit style={{ fontSize: "14px" }} />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      style={{ display: "none" }}
                    />
                  </label>
                </div>
              ) : (
                <label
                  style={{
                    width: "160px",
                    height: "160px",
                    borderRadius: "12px",
                    border: "3px dashed var(--border)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    background: "var(--surface-2)",
                    transition: "all 0.2s ease",
                    gap: "12px"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--primary)";
                    e.currentTarget.style.background = "var(--primary-50)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border)";
                    e.currentTarget.style.background = "var(--surface-2)";
                  }}
                >
                  <FaBuilding style={{ fontSize: "48px", color: "var(--muted)" }} />
                  <span style={{ fontSize: "14px", color: "var(--muted)", fontWeight: 500 }}>
                    {t("upload_image")}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ display: "none" }}
                  />
                </label>
              )}
            </div>

            {/* معلومات الشركة */}
            <div style={{ flex: 1, minWidth: "300px" }}>
              <Button as={Link} to="/contractors" variant="ghost" style={{ marginBottom: "16px" }}>
                ← {t("back_to_contractors")}
              </Button>
              <h1 style={{ 
                fontSize: "32px", 
                fontWeight: 700, 
                color: "var(--ink)",
                margin: "0 0 8px 0"
              }}>
                {contractorData.name}
              </h1>
              <p style={{ 
                fontSize: "16px", 
                color: "var(--muted)",
                margin: 0
              }}>
                {t("contractor")}
              </p>
            </div>
            </div>
          </div>

          {/* بيانات المقاول */}
        <div className="card">
          <div className="card-body">
            <h2 style={{ marginBottom: "24px" }}>{t("contractor_details")}</h2>
            
                <div className="form-grid cols-2">
                  {fullContractorData.contractor_name && (
                <ViewRow 
                  label={t("contractor_name")} 
                  value={fullContractorData.contractor_name}
                  tip={t("from_license")}
                />
                  )}
                  {fullContractorData.contractor_license_no && (
                <ViewRow 
                  label={t("contractor_license_no")} 
                  value={fullContractorData.contractor_license_no}
                  tip={t("from_license")}
                />
            )}
            {fullContractorData.contractor_trade_license && (
                <ViewRow 
                  label={t("contractor_trade_license")} 
                  value={fullContractorData.contractor_trade_license}
                  tip={t("from_contract")}
                />
            )}
            {contractorData.awardingData?.contractor_registration_number && (
                <ViewRow 
                  label={t("contractor_registration_number")} 
                  value={contractorData.awardingData.contractor_registration_number}
                  tip={t("from_awarding")}
                />
              )}
              </div>
          </div>

          {/* المشاريع */}
          <div className="mt-16">
            <h2>{t("projects")} ({projects.length})</h2>
            {projects.length === 0 ? (
              <p className="prj-muted mt-16">{t("no_projects_found")}</p>
            ) : (
              <div className="prj-table__wrapper mt-16">
                <table className="prj-table">
                  <thead>
                    <tr>
                      <th>{t("project_name")}</th>
                      <th>{t("internal_code")}</th>
                      <th>{t("type")}</th>
                      <th>{t("action")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projects.map((p) => (
                      <tr key={p.id}>
                        <td>{p.name || p.display_name || `Project #${p.id}`}</td>
                        <td>
                          <code>{p.internal_code || `PRJ-${p.id}`}</code>
                        </td>
                        <td>{p.project_type || t("empty_value")}</td>
                        <td>
                          <Button as={Link} to={`/projects/${p.id}`} variant="primary" style={{ marginRight: "8px" }}>
                            {t("view")}
                          </Button>
                          <Button as={Link} to={`/projects/${p.id}/wizard`} variant="ghost">
                            {t("edit")}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

