import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "../services/api";
import PageLayout from "../components/PageLayout";
import Button from "../components/Button";

export default function ContractorsPage() {
  const { t, i18n } = useTranslation();
  const isAR = /^ar\b/i.test(i18n.language || "");
  const navigate = useNavigate();
  const [contractors, setContractors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadContractors();
  }, []);

  const loadContractors = async () => {
    setLoading(true);
    try {
      const { data: projects } = await api.get("projects/");
      const items = Array.isArray(projects) ? projects : (projects?.results || projects?.items || projects?.data || []);
      
      const contractorsMap = new Map();

      await Promise.all(
        items.map(async (p) => {
          const projectId = p.id;
          
          // جلب بيانات من الرخصة
          let licenseData = null;
          try {
            const { data: lic } = await api.get(`projects/${projectId}/license/`);
            if (Array.isArray(lic) && lic.length > 0) {
              licenseData = lic[0];
            }
          } catch (e) {}

          // جلب بيانات من العقد
          let contractData = null;
          try {
            const { data: contract } = await api.get(`projects/${projectId}/contract/`);
            if (Array.isArray(contract) && contract.length > 0) {
              contractData = contract[0];
            }
          } catch (e) {}

          // جلب بيانات من الترسية
          let awardingData = null;
          try {
            const { data: award } = await api.get(`projects/${projectId}/awarding/`);
            if (Array.isArray(award) && award.length > 0) {
              awardingData = award[0];
            }
          } catch (e) {}

          // استخدام بيانات المقاول من الرخصة أو العقد
          const contractorName = licenseData?.contractor_name || contractData?.contractor_name;
          
          if (contractorName) {
            const key = contractorName.toLowerCase().trim();
            if (!contractorsMap.has(key)) {
              contractorsMap.set(key, {
                name: contractorName,
                licenseNo: licenseData?.contractor_license_no || "",
                tradeLicense: contractData?.contractor_trade_license || "",
                projects: [],
                fullData: {
                  contractor_name: contractorName,
                  contractor_license_no: licenseData?.contractor_license_no,
                  contractor_trade_license: contractData?.contractor_trade_license,
                },
                awardingData: {},
              });
            }
            const contractorData = contractorsMap.get(key);
            
            // إضافة بيانات الترسية إذا كانت موجودة
            if (awardingData?.contractor_registration_number) {
              contractorData.awardingData = {
                contractor_registration_number: awardingData.contractor_registration_number,
              };
            }
            
            if (!contractorData.projects.find((pr) => pr.id === projectId)) {
              contractorData.projects.push({
                id: projectId,
                name: p?.display_name || p?.name || `Project #${projectId}`,
                internalCode: p?.internal_code,
              });
            }
          }
        })
      );

      const contractorsList = Array.from(contractorsMap.values()).sort((a, b) => 
        a.name.localeCompare(b.name, isAR ? "ar" : "en")
      );

      setContractors(contractorsList);
    } catch (e) {
      console.error("Error loading contractors:", e);
      setContractors([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredContractors = contractors.filter((contractor) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      contractor.name.toLowerCase().includes(query) ||
      contractor.licenseNo?.toLowerCase().includes(query) ||
      contractor.tradeLicense?.toLowerCase().includes(query)
    );
  });

  const handleContractorClick = (contractor) => {
    navigate(`/contractors/${encodeURIComponent(contractor.name)}`, { 
      state: { contractorData: contractor } 
    });
  };

  return (
    <PageLayout loading={loading} loadingText={t("loading")}>
      <div className="container">
        <div className="card">
          <div className="prj-header">
            <h1 className="prj-title">{t("contractors")}</h1>
            <p className="prj-subtitle">{t("contractors_page_subtitle")}</p>
          </div>

          <div className="mb-12">
            <input
              type="text"
              className="input"
              placeholder={t("search_contractors")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ maxWidth: "400px" }}
            />
          </div>

          {filteredContractors.length === 0 ? (
            <div className="card text-center" style={{ padding: "40px" }}>
              <p className="prj-muted">
                {searchQuery ? t("no_contractors_match_search") : t("no_contractors_found")}
              </p>
            </div>
          ) : (
            <div className="prj-table__wrapper">
              <table className="prj-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>{t("contractor_name")}</th>
                    <th>{t("license_number")}</th>
                    <th>{t("trade_license")}</th>
                    <th>{t("projects_count")}</th>
                    <th>{t("action")}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredContractors.map((contractor, idx) => (
                    <tr key={idx}>
                      <td className="prj-muted">{idx + 1}</td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{contractor.name}</div>
                      </td>
                      <td>
                        <code className="prj-code">{contractor.licenseNo || t("empty_value")}</code>
                      </td>
                      <td>
                        <code className="prj-code">{contractor.tradeLicense || t("empty_value")}</code>
                      </td>
                      <td>
                        <span className="prj-badge is-on">
                          {contractor.projects.length} {t("projects")}
                        </span>
                      </td>
                      <td className="prj-actions">
                        <Button
                          variant="primary"
                          onClick={() => handleContractorClick(contractor)}
                          className="prj-btn prj-btn--primary"
                        >
                          {t("view_details")}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={6} className="prj-foot prj-muted">
                      {t("total_contractors", { count: filteredContractors.length, total: contractors.length })}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}

