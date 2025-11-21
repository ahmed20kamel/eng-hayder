import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "../services/api";
import Button from "../components/Button";
import Dialog from "../components/Dialog";
import PageLayout from "../components/PageLayout";
import { getProjectTypeLabel, getContractTypeLabel } from "../utils/projectLabels";
import { formatInternalCode } from "../utils/internalCodeFormatter";

export default function ProjectsPage() {
  const { t, i18n } = useTranslation();
  const isAR = /^ar\b/i.test(i18n.language || "");
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enriching, setEnriching] = useState(false);

  // حذف فردي
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [targetProject, setTargetProject] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // تحديد متعدد + حذف جماعي
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // Toast بسيط
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);


  // ===== فلاتر منظّمة =====
  const [filters, setFilters] = useState({
    q: "",
    internal_code: "",
    city: "",
    project_type: "",
    consultant: "",
    contract_type: "",
    has_siteplan: "any",
    has_license: "any",
    has_contract: "any",
    has_awarding: "any",
  });

  useEffect(() => {
    loadProjects();
    return () => clearTimeout(toastTimer.current);
  }, []);

  const loadProjects = async () => {
    try {
      const { data } = await api.get("projects/");
      const items = Array.isArray(data) ? data : (data?.results || data?.items || data?.data || []);
      setProjects(items || []);
      enrichOwnersAndConsultants(items || []);
    } catch (e) {
      console.error(e);
      setProjects([]);
      showToast("error", t("projects_loading_error"));
    } finally {
      setLoading(false);
    }
  };

  const enrichOwnersAndConsultants = async (items) => {
    if (!items?.length) return;
    setEnriching(true);
    try {
      const enriched = await Promise.all(
        items.map(async (p) => {
          const id = p.id;
          let ownerLabel = null;
          let consultantName = null;
          let hasAwarding = false;
          let awardingData = null;

          try {
            const { data: sp } = await api.get(`projects/${id}/siteplan/`);
            const first = Array.isArray(sp) ? sp[0] : null;
            if (first?.owners?.length) {
              const owners = first.owners.map((o) => o?.owner_name_ar || o?.owner_name || o?.owner_name_en || "").filter(Boolean);
              if (owners.length) {
                ownerLabel = `${t("villa_mr_ms")} ${owners[0]}${owners.length > 1 ? t("villa_mr_ms_partners") : ""}`;
              }
            }
          } catch (e) {}

          try {
            const { data: lic } = await api.get(`projects/${id}/license/`);
            const firstL = Array.isArray(lic) ? lic[0] : null;
            if (firstL) {
              // استخدام design_consultant_name أو supervision_consultant_name
              consultantName = firstL.design_consultant_name || firstL.supervision_consultant_name || null;
            }
          } catch (e) {}

          try {
            const { data: aw } = await api.get(`projects/${id}/awarding/`);
            const firstA = Array.isArray(aw) ? aw[0] : (aw || null);
            if (firstA) {
              hasAwarding = true;
              awardingData = firstA;
            }
          } catch (e) {}

          return { 
            ...p, 
            __owner_label: ownerLabel, 
            __consultant_name: consultantName,
            __has_awarding: hasAwarding,
            __awarding_data: awardingData,
          };
        })
      );

      setProjects(enriched);
    } catch (e) {
      console.error("Enrich failed", e);
    } finally {
      setEnriching(false);
    }
  };

  const showToast = (type, msg) => {
    setToast({ type, msg });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2500);
  };

  const getOwnerLabel = (p) =>
    p?.__owner_label ||
    (p?.display_name 
      ? `${t("villa_mr_ms")} ${p.display_name}`
      : t("villa_mr_ms_empty"));

  const getConsultantName = (p) =>
    p?.__consultant_name || p?.consultant?.name || p?.consultant_name || t("empty_value");

  const filteredProjects = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    const code = filters.internal_code.trim().toLowerCase();
    const city = filters.city.trim().toLowerCase();
    const type = filters.project_type;
    const consultant = filters.consultant;
    const ctype = filters.contract_type;

    return projects.filter((p) => {
      const hasSiteplan = !!p?.has_siteplan;
      const hasLicense = !!p?.has_license;
      const hasContract = !!p?.contract_type;
      const hasAwarding = !!p?.__has_awarding;
      const awardingData = p?.__awarding_data;

      const hay = [
        p?.display_name,
        p?.name,
        p?.internal_code,
        p?.project_type,
        p?.contract_type,
        p?.city,
        getOwnerLabel(p),
        getConsultantName(p),
        awardingData?.project_number || "",
        awardingData?.consultant_registration_number || "",
        awardingData?.contractor_registration_number || "",
        awardingData?.award_date || "",
      ]
        .join(" ")
        .toLowerCase();

      if (q && !hay.includes(q)) return false;
      if (code && !(p?.internal_code || "").toLowerCase().includes(code)) return false;
      if (city && !(p?.city || "").toLowerCase().includes(city)) return false;
      if (type && type !== (p?.project_type || "")) return false;
      if (consultant && consultant !== getConsultantName(p)) return false;
      if (ctype && ctype !== (p?.contract_type || "")) return false;

      if (filters.has_siteplan !== "any") {
        if (filters.has_siteplan === "yes" && !hasSiteplan) return false;
        if (filters.has_siteplan === "no" && hasSiteplan) return false;
      }
      if (filters.has_license !== "any") {
        if (filters.has_license === "yes" && !hasLicense) return false;
        if (filters.has_license === "no" && hasLicense) return false;
      }
      if (filters.has_contract !== "any") {
        if (filters.has_contract === "yes" && !hasContract) return false;
        if (filters.has_contract === "no" && hasContract) return false;
      }
      if (filters.has_awarding !== "any") {
        if (filters.has_awarding === "yes" && !hasAwarding) return false;
        if (filters.has_awarding === "no" && hasAwarding) return false;
      }

      return true;
    });
  }, [projects, filters, isAR]);

  const uniqueValues = (getter) => {
    const s = new Set();
    projects.forEach((p) => {
      const v = getter(p);
      if (v) s.add(v);
    });
    return Array.from(s);
  };

  const projectTypes = useMemo(() => uniqueValues((p) => p?.project_type), [projects]);
  const consultants = useMemo(() => uniqueValues(getConsultantName), [projects]);
  const contractTypes = useMemo(() => uniqueValues((p) => p?.contract_type), [projects]);

  const isAllSelected =
    filteredProjects.length > 0 && filteredProjects.every((p) => selectedIds.has(p.id));

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      if (isAllSelected) return new Set();
      return new Set(filteredProjects.map((p) => p.id));
    });
  };

  const askDelete = (p) => {
    const title = p?.display_name || p?.name || `${t("wizard_project_prefix")} #${p?.id}`;
    setTargetProject({ id: p.id, name: title });
    setConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (!targetProject?.id) return;
    const id = targetProject.id;
    try {
      setDeletingId(id);
      await api.delete(`projects/${id}/`);
      setProjects((prev) => prev.filter((p) => p.id !== id));
      setSelectedIds((prev) => {
        const n = new Set(prev);
        n.delete(id);
        return n;
      });
      showToast("success", t("delete_success"));
      setConfirmOpen(false);
      setTargetProject(null);
    } catch (e) {
      console.error("Delete failed:", e);
      showToast("error", t("delete_error"));
    } finally {
      setDeletingId(null);
    }
  };

  const askBulkDelete = () => {
    if (selectedIds.size === 0) return;
    setBulkConfirmOpen(true);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    setBulkDeleting(true);
    const ids = Array.from(selectedIds);
    let ok = 0, fail = 0;
    for (const id of ids) {
      try { await api.delete(`projects/${id}/`); ok += 1; }
      catch (e) { console.error("Bulk delete failed for id", id, e); fail += 1; }
    }
    setProjects(prev => prev.filter(p => !selectedIds.has(p.id)));
    setSelectedIds(new Set());
    setBulkDeleting(false);
    setBulkConfirmOpen(false);
    if (fail === 0) showToast("success", t("bulk_delete_success", { count: ok }));
    else if (ok === 0) showToast("error", t("bulk_delete_error"));
    else showToast("error", t("bulk_delete_partial", { ok, fail }));
  };

  const selectedCount = selectedIds.size;

  const clearFilters = () =>
    setFilters({
      q: "", internal_code: "", city: "", project_type: "",
      consultant: "", contract_type: "", has_siteplan: "any",
      has_license: "any", has_contract: "any", has_awarding: "any",
    });

  return (
    <PageLayout loading={loading} loadingText={t("loading_projects")}>
      <div className="container">
        <div className="card">
          <div className="prj-header">
            <h1 className="prj-title">{t("projects_title")}</h1>
            <p className="prj-subtitle">{t("projects_subtitle")}</p>
          </div>

          {/* شريط الفلاتر */}
          <div className="prj-filters">
            <div className="prj-filters__grid">
              <input 
                className="prj-input" 
                placeholder={t("general_search")} 
                value={filters.q}
                onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))} 
              />
              <input 
                className="prj-input" 
                placeholder={t("project_view_internal_code").replace(":", "")} 
                value={filters.internal_code}
                onChange={(e) => setFilters((f) => ({ ...f, internal_code: e.target.value }))} 
              />
              <input 
                className="prj-input" 
                placeholder={t("city")} 
                value={filters.city}
                onChange={(e) => setFilters((f) => ({ ...f, city: e.target.value }))} 
              />
              <select 
                className="prj-select" 
                value={filters.project_type}
                onChange={(e) => setFilters((f) => ({ ...f, project_type: e.target.value }))}
              >
                <option value="">{t("type_all")}</option>
                {projectTypes.map((t) => (
                  <option key={t} value={t}>{getProjectTypeLabel(t, i18n.language)}</option>
                ))}
              </select>
              <select 
                className="prj-select" 
                value={filters.consultant}
                onChange={(e) => setFilters((f) => ({ ...f, consultant: e.target.value }))}
              >
                <option value="">{t("consultant_all")}</option>
                {consultants.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <select 
                className="prj-select" 
                value={filters.contract_type}
                onChange={(e) => setFilters((f) => ({ ...f, contract_type: e.target.value }))}
              >
                <option value="">{t("contract_type_all")}</option>
                {contractTypes.map((c) => (
                  <option key={c} value={c}>{getContractTypeLabel(c, i18n.language)}</option>
                ))}
              </select>
            </div>

            <div className="prj-filters__grid2">
              <select 
                className="prj-select" 
                value={filters.has_siteplan}
                onChange={(e) => setFilters((f) => ({ ...f, has_siteplan: e.target.value }))}
              >
                <option value="any">{t("plan_all")}</option>
                <option value="yes">{t("plan_yes")}</option>
                <option value="no">{t("plan_no")}</option>
              </select>
              <select 
                className="prj-select" 
                value={filters.has_license}
                onChange={(e) => setFilters((f) => ({ ...f, has_license: e.target.value }))}
              >
                <option value="any">{t("license_all")}</option>
                <option value="yes">{t("license_yes")}</option>
                <option value="no">{t("license_filter_no")}</option>
              </select>
              <select 
                className="prj-select" 
                value={filters.has_contract}
                onChange={(e) => setFilters((f) => ({ ...f, has_contract: e.target.value }))}
              >
                <option value="any">{t("contract_all")}</option>
                <option value="yes">{t("contract_yes")}</option>
                <option value="no">{t("contract_no")}</option>
              </select>
              <select 
                className="prj-select" 
                value={filters.has_awarding}
                onChange={(e) => setFilters((f) => ({ ...f, has_awarding: e.target.value }))}
              >
                <option value="any">{t("awarding_all")}</option>
                <option value="yes">{t("awarding_yes")}</option>
                <option value="no">{t("awarding_no")}</option>
              </select>
              <div className="prj-filters__actions">
                <Button variant="ghost" onClick={clearFilters}>
                  {t("clear_filters")}
                </Button>
                {enriching && (
                  <span className="prj-muted">
                    {t("loading_owner_consultant")}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* شريط إجراءات عند وجود تحديد */}
          {selectedCount > 0 && (
            <div className="prj-bulkbar">
              <div className="prj-bulkbar__info">
                {t("selected")} <strong>{selectedCount}</strong>
              </div>
              <div className="prj-bulkbar__actions">
                <Button variant="danger" onClick={askBulkDelete}>
                  {t("delete_selected")}
                </Button>
                <Button variant="ghost" onClick={() => setSelectedIds(new Set())}>
                  {t("clear_selection")}
                </Button>
              </div>
            </div>
          )}

          {filteredProjects.length === 0 ? (
            <div className="prj-alert">
              <div className="prj-alert__title">
                {t("no_projects_match")}
              </div>
            </div>
          ) : (
            <div className="prj-table__wrapper">
            <table className="prj-table">
              <thead>
                <tr>
                  <th style={{ width: 50 }} className="text-center">
                    <input 
                      type="checkbox" 
                      aria-label={t("select_all")} 
                      checked={isAllSelected} 
                      onChange={toggleSelectAll} 
                    />
                  </th>
                  <th>#</th>
                  <th>{t("project_view_internal_code").replace(":", "")}</th>
                  <th>{t("owner")}</th>
                  <th>{t("type")}</th>
                  <th>{t("consultant")}</th>

                  {/* ✅ اخفاء نوع العقد: احذف الهيدر ده */}
                  {/* <th>{t("contract_type_label")}</th> */}

                  <th>{t("status")}</th>
                  <th>{t("action")}</th>
                </tr>
              </thead>

              <tbody>
                {filteredProjects.map((p, i) => {
                  const hasSiteplan = !!p?.has_siteplan;
                  const hasLicense = !!p?.has_license;
                  const hasContract = !!p?.contract_type;
                  const hasAwarding = !!p?.__has_awarding;
                  const checked = selectedIds.has(p.id);
                  const title = p?.display_name || p?.name || `${t("wizard_project_prefix")} #${p?.id ?? i + 1}`;

                  return (
                    <tr
                      key={p?.id ?? i}
                      className={hasSiteplan || hasLicense || hasContract || hasAwarding ? "prj-row--active" : undefined}
                    >
                      <td className="text-center">
                        <input 
                          type="checkbox" 
                          aria-label={`${t("select")} ${title}`} 
                          checked={checked} 
                          onChange={() => toggleSelect(p.id)} 
                        />
                      </td>

                      <td className="prj-muted">{i + 1}</td>

                      <td>
                        <code className="prj-code">
                          {p?.internal_code
                            ? formatInternalCode(p.internal_code)
                            : `PRJ-${p?.id ?? i + 1}`}
                        </code>
                        {p?.city && (
                          <div className="prj-cell__sub prj-muted">
                            {t("city_label")} {p.city}
                          </div>
                        )}
                      </td>

                      <td className="prj-nowrap">{getOwnerLabel(p)}</td>

                      {/* ✅ النوع + سكنية جديدة */}
                      <td className="prj-nowrap">
                        {p?.project_type
                          ? `${getProjectTypeLabel(p.project_type, i18n.language)} سكنية جديدة`
                          : t("empty_value")}
                      </td>

                      <td className="prj-nowrap">{getConsultantName(p)}</td>

                      {/* ✅ اخفاء نوع العقد: احذف الخلية دي */}
                      {/* 
                      <td className="prj-nowrap">
                        {p?.contract_type ? getContractTypeLabel(p.contract_type, i18n.language) : t("empty_value")}
                      </td> 
                      */}

                      <td>
                        <div className="prj-badges">
                          <span className={`prj-badge ${hasSiteplan ? "is-on" : "is-off"}`}>
                            {t("bc_siteplan")}
                          </span>
                          <span className={`prj-badge ${hasLicense ? "is-on" : "is-off"}`}>
                            {t("bc_license")}
                          </span>
                          <span className={`prj-badge ${hasContract ? "is-on" : "is-off"}`}>
                            {t("bc_contract")}
                          </span>
                          <span className={`prj-badge ${hasAwarding ? "is-on" : "is-off"}`}>
                            {t("bc_awarding")}
                          </span>
                        </div>
                      </td>

                      <td className="prj-actions">
                        <Button as={Link} variant="primary" to={`/projects/${p?.id}/wizard`} className="prj-btn prj-btn--primary">
                          {t("edit")}
                        </Button>
                        <Button as={Link} variant="ghost" to={`/projects/${p?.id}`} className="prj-btn prj-btn--ghost">
                          {t("view")}
                        </Button>
                        <Button 
                          variant="danger" 
                          onClick={() => askDelete(p)} 
                          disabled={deletingId === p.id} 
                          title={t("delete_project")}
                          className="prj-btn prj-btn--danger"
                        >
                          {t("delete")}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              <tfoot>
                <tr>
                  {/* ✅ كان 9 بقى 8 بعد حذف عمود نوع العقد */}
                  <td colSpan={8} className="prj-foot prj-muted">
                    {t("matching_total", { count: filteredProjects.length, total: projects.length })}
                  </td>
                </tr>
              </tfoot>
            </table>
            </div>
          )}
        </div>

        {/* Toast */}
        {toast && (
          <div className={`toast ${toast.type === "success" ? "toast--ok" : "toast--err"}`} role="status" aria-live="polite">
            {toast.msg}
          </div>
        )}

        {/* Confirm Dialog — حذف فردي */}
        <Dialog
          open={confirmOpen}
          title={t("confirm_delete")}
          desc={
            <>
              {t("confirm_delete_desc")}{" "}
              <strong style={{marginInline: 6}}>{targetProject?.name}</strong>?<br/>
              {t("delete_cannot_undo")}
            </>
          }
          confirmLabel={deletingId ? t("deleting") : t("delete_permanent")}
          cancelLabel={t("cancel")}
          onClose={() => !deletingId && setConfirmOpen(false)}
          onConfirm={handleDelete}
          danger
          busy={!!deletingId}
        />

        {/* Confirm Dialog — حذف جماعي */}
        <Dialog
          open={bulkConfirmOpen}
          title={t("bulk_delete")}
          desc={
            <>
              {t("bulk_delete_desc")}{" "}
              <strong>{selectedCount}</strong>{" "}
              {t("bulk_delete_desc2")}<br/>
              {t("bulk_delete_continue")}
            </>
          }
          confirmLabel={bulkDeleting ? t("deleting") : t("delete_selected")}
          cancelLabel={t("cancel")}
          onClose={() => !bulkDeleting && setBulkConfirmOpen(false)}
          onConfirm={handleBulkDelete}
          danger
          busy={bulkDeleting}
        />
      </div>
    </PageLayout>
  );
}
