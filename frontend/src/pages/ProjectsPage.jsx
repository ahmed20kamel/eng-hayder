import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enriching, setEnriching] = useState(false);

  // حذف فردي
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [targetProject, setTargetProject] = useState(null); // {id, name}
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
    has_siteplan: "any", // any | yes | no
    has_license: "any",
    has_contract: "any",
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
      // بعد ما نجيب اللستة الأساسية، نثريها بالمالك والاستشاري
      enrichOwnersAndConsultants(items || []);
    } catch (e) {
      console.error(e);
      setProjects([]);
      showToast("error", "تعذّر تحميل المشاريع.");
    } finally {
      setLoading(false);
    }
  };

  // ====== إثراء البيانات: المالك (SitePlan) + الاستشاري (License) ======
  const enrichOwnersAndConsultants = async (items) => {
    if (!items?.length) return;
    setEnriching(true);
    try {
      // هنجيب لكل مشروع أول سجل من siteplan و license (لو موجودين)
      const enriched = await Promise.all(
        items.map(async (p) => {
          const id = p.id;
          let ownerLabel = null;
          let consultantName = null;

          // 1) SitePlan → owners
          try {
            const { data: sp } = await api.get(`projects/${id}/siteplan/`);
            const first = Array.isArray(sp) ? sp[0] : null;
            if (first?.owners?.length) {
              const owners = first.owners.map((o) => o?.owner_name_ar || o?.owner_name || o?.owner_name_en || "").filter(Boolean);
              if (owners.length) {
                ownerLabel = `فيلا السيد/ه ${owners[0]}${owners.length > 1 ? " وشركاؤه" : ""}`;
              }
            }
          } catch (e) {
            // لا شيء
          }

          // 2) License → consultant_name
          try {
            const { data: lic } = await api.get(`projects/${id}/license/`);
            const firstL = Array.isArray(lic) ? lic[0] : null;
            if (firstL?.consultant_name) {
              consultantName = firstL.consultant_name;
            }
          } catch (e) {
            // لا شيء
          }

          return { ...p, __owner_label: ownerLabel, __consultant_name: consultantName };
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

  // أدوات مساعدة
  const getOwnerLabel = (p) =>
    p?.__owner_label ||
    (p?.display_name ? `فيلا السيد/ه ${p.display_name}` : "فيلا السيد/ه —");

  const getConsultantName = (p) =>
    p?.__consultant_name || p?.consultant?.name || p?.consultant_name || "—";

  // ====== تصفية البيانات ======
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

      const hay = [
        p?.display_name,
        p?.name,
        p?.internal_code,
        p?.project_type,
        p?.contract_type,
        p?.city,
        getOwnerLabel(p),
        getConsultantName(p),
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

      return true;
    });
  }, [projects, filters]);

  // خيارات الفلاتر (قوائم فريدة من البيانات)
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

  // ====== تحديد متعدد ======
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

  // حذف فردي
  const askDelete = (p) => {
    const title = p?.display_name || p?.name || `مشروع #${p?.id}`;
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
      showToast("success", "تم حذف المشروع بنجاح.");
      setConfirmOpen(false);
      setTargetProject(null);
    } catch (e) {
      console.error("Delete failed:", e);
      showToast("error", "حدث خطأ أثناء الحذف.");
    } finally {
      setDeletingId(null);
    }
  };

  // حذف جماعي
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
    if (fail === 0) showToast("success", `تم حذف ${ok} مشروعًا بنجاح.`);
    else if (ok === 0) showToast("error", "تعذّر حذف المشاريع المحددة.");
    else showToast("error", `تم حذف ${ok} وفشل حذف ${fail}.`);
  };

  if (loading) {
    return (
      <div className="prj-container">
        <div className="prj-card prj-page">
          <div className="prj-loading"><p className="prj-loading__text">⏳ جاري تحميل المشاريع...</p></div>
        </div>
      </div>
    );
  }

  const selectedCount = selectedIds.size;

  const clearFilters = () =>
    setFilters({
      q: "", internal_code: "", city: "", project_type: "",
      consultant: "", contract_type: "", has_siteplan: "any",
      has_license: "any", has_contract: "any",
    });

  return (
    <div className="prj-container" dir="rtl">
      {/* ستايل بسيط للفلاتر (تحسين الشكل بسرعة) */}
      <style>{`
        .filters {
          position: sticky; top: 0; background: #fff; z-index: 5;
          padding: 10px 12px; border: 1px solid #eee; border-radius: 10px; margin-bottom: 12px;
        }
        .filters__grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px; }
        .filters__grid2 { display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px; margin-top: 8px; }
        @media (max-width: 1200px) { .filters__grid, .filters__grid2 { grid-template-columns: repeat(3, 1fr); } }
        @media (max-width: 700px) { .filters__grid, .filters__grid2 { grid-template-columns: repeat(2, 1fr); } }
        .prj-input, .prj-select { width: 100%; padding: 10px 12px; border: 1px solid #ddd; border-radius: 8px; }
        .filters__actions { display:flex; gap:8px; align-items:center; justify-content:flex-start; }
      `}</style>

      <div className="prj-card prj-page">
        <div className="prj-header">
          <h2 className="prj-title"><span className="prj-title__icon">📁</span><span>المشاريع</span></h2>
          <p className="prj-subtitle">اختر مشروعًا للاطّلاع على التفاصيل أو تعديل البيانات.</p>
        </div>

        {/* شريط الفلاتر المحسّن */}
        <div className="filters">
          <div className="filters__grid">
            <input className="prj-input" placeholder="بحث عام..." value={filters.q}
              onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))} />
            <input className="prj-input" placeholder="الكود الداخلي" value={filters.internal_code}
              onChange={(e) => setFilters((f) => ({ ...f, internal_code: e.target.value }))} />
            <input className="prj-input" placeholder="المدينة" value={filters.city}
              onChange={(e) => setFilters((f) => ({ ...f, city: e.target.value }))} />
            <select className="prj-select" value={filters.project_type}
              onChange={(e) => setFilters((f) => ({ ...f, project_type: e.target.value }))}>
              <option value="">التصنيف (الكل)</option>
              {projectTypes.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <select className="prj-select" value={filters.consultant}
              onChange={(e) => setFilters((f) => ({ ...f, consultant: e.target.value }))}>
              <option value="">الاستشاري (الكل)</option>
              {consultants.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select className="prj-select" value={filters.contract_type}
              onChange={(e) => setFilters((f) => ({ ...f, contract_type: e.target.value }))}>
              <option value="">نوع العقد (الكل)</option>
              {contractTypes.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="filters__grid2">
            <select className="prj-select" value={filters.has_siteplan}
              onChange={(e) => setFilters((f) => ({ ...f, has_siteplan: e.target.value }))}>
              <option value="any">مخطط: الكل</option>
              <option value="yes">مخطط: نعم</option>
              <option value="no">مخطط: لا</option>
            </select>
            <select className="prj-select" value={filters.has_license}
              onChange={(e) => setFilters((f) => ({ ...f, has_license: e.target.value }))}>
              <option value="any">ترخيص: الكل</option>
              <option value="yes">ترخيص: نعم</option>
              <option value="no">ترخيص: لا</option>
            </select>
            <select className="prj-select" value={filters.has_contract}
              onChange={(e) => setFilters((f) => ({ ...f, has_contract: e.target.value }))}>
              <option value="any">عقد: الكل</option>
              <option value="yes">عقد: نعم</option>
              <option value="no">عقد: لا</option>
            </select>
            <div className="filters__actions">
              <button className="prj-btn prj-btn--ghost" onClick={clearFilters}>مسح الفلاتر</button>
              {enriching && <span className="prj-muted">…جاري جلب المالك/الاستشاري</span>}
            </div>
          </div>
        </div>

        {/* شريط إجراءات عند وجود تحديد */}
        {selectedCount > 0 && (
          <div className="prj-bulkbar">
            <div className="prj-bulkbar__info">محدد: <strong>{selectedCount}</strong></div>
            <div className="prj-bulkbar__actions">
              <button className="prj-btn prj-btn--danger" onClick={askBulkDelete}>حذف المحدد</button>
              <button className="prj-btn prj-btn--ghost" onClick={() => setSelectedIds(new Set())}>إلغاء التحديد</button>
            </div>
          </div>
        )}

        {filteredProjects.length === 0 ? (
          <div className="prj-alert"><span className="prj-alert__title">🚧 لا توجد مشاريع مطابقة للفلاتر.</span></div>
        ) : (
          <div className="prj-table__wrapper">
            <table className="prj-table">
              <thead>
                <tr>
                  <th style={{ width: 36, textAlign: "center" }}>
                    <input type="checkbox" aria-label="تحديد الكل" checked={isAllSelected} onChange={toggleSelectAll} />
                  </th>
                  <th>#</th>
                  <th>الكود الداخلي</th>
                  <th>المالك</th>
                  <th>التصنيف</th>
                  <th>الاستشاري</th>
                  <th>نوع العقد</th>
                  <th>الحالة</th>
                  <th>إجراءات</th>
                </tr>
              </thead>

              <tbody>
                {filteredProjects.map((p, i) => {
                  const hasSiteplan = !!p?.has_siteplan;
                  const hasLicense = !!p?.has_license;
                  const hasContract = !!p?.contract_type;
                  const active = hasSiteplan || hasLicense || hasContract;
                  const checked = selectedIds.has(p.id);
                  const title = p?.display_name || p?.name || `مشروع #${p?.id ?? i + 1}`;

                  return (
                    <tr key={p?.id ?? i} className={active ? "prj-row--active" : undefined}>
                      <td style={{ textAlign: "center" }}>
                        <input type="checkbox" aria-label={`تحديد ${title}`} checked={checked} onChange={() => toggleSelect(p.id)} />
                      </td>

                      <td className="prj-muted">{i + 1}</td>

                      <td>
                        <code className="prj-code">{p?.internal_code || `PRJ-${p?.id ?? i + 1}`}</code>
                        <div className="prj-cell__sub prj-muted">{p?.city ? `المدينة: ${p.city}` : "—"}</div>
                      </td>

                      <td className="prj-nowrap">{getOwnerLabel(p)}</td>
                      <td className="prj-nowrap">{p?.project_type || "—"}</td>
                      <td className="prj-nowrap">{getConsultantName(p)}</td>
                      <td className="prj-nowrap">{p?.contract_type || "—"}</td>

                      <td>
                        <div className="prj-badges">
                          <span className={`prj-badge ${hasSiteplan ? "is-on" : "is-off"}`}>مخطط</span>
                          <span className={`prj-badge ${hasLicense ? "is-on" : "is-off"}`}>ترخيص</span>
                          <span className={`prj-badge ${hasContract ? "is-on" : "is-off"}`}>عقد</span>
                        </div>
                      </td>

                      <td className="prj-actions">
                        <Link className="prj-btn prj-btn--primary" to={`/projects/${p?.id}/wizard`}>تعديل</Link>
                        <Link className="prj-btn prj-btn--ghost" to={`/projects/${p?.id}`}>عرض →</Link>
                        <button className="prj-btn prj-btn--danger" onClick={() => askDelete(p)} disabled={deletingId === p.id} title="حذف المشروع">حذف</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              <tfoot>
                <tr>
                  <td colSpan={9} className="prj-foot prj-muted">
                    إجمالي المشاريع المطابقة: {filteredProjects.length} / الكل: {projects.length}
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
      {confirmOpen && (
        <ConfirmDialog
          title="تأكيد الحذف"
          desc={<>هل أنت متأكد من حذف المشروع <strong style={{marginInline: 6}}>{targetProject?.name}</strong>؟<br/>هذا الإجراء لا يمكن التراجع عنه.</>}
          confirmLabel={deletingId ? "جارٍ الحذف..." : "حذف نهائي"}
          cancelLabel="إلغاء"
          onClose={() => !deletingId && setConfirmOpen(false)}
          onConfirm={handleDelete}
          danger
          busy={!!deletingId}
        />
      )}

      {/* Confirm Dialog — حذف جماعي */}
      {bulkConfirmOpen && (
        <ConfirmDialog
          title="حذف جماعي"
          desc={<>سيتم حذف <strong>{selectedCount}</strong> مشروع/مشاريع نهائيًا.<br/>هل تريد المتابعة؟</>}
          confirmLabel={bulkDeleting ? "جارٍ الحذف..." : "حذف المحدد"}
          cancelLabel="إلغاء"
          onClose={() => !bulkDeleting && setBulkConfirmOpen(false)}
          onConfirm={handleBulkDelete}
          danger
          busy={bulkDeleting}
        />
      )}
    </div>
  );
}

/* ====== Dialog Component (بدون مكتبات) ====== */
function ConfirmDialog({ title, desc, confirmLabel, cancelLabel, onClose, onConfirm, danger, busy }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const onBackdrop = (e) => {
    if (e.target === dialogRef.current) onClose?.();
  };

  return (
    <div ref={dialogRef} className="dlg-backdrop" onMouseDown={onBackdrop}>
      <div className="dlg" role="dialog" aria-modal="true" aria-labelledby="dlg-title" aria-describedby="dlg-desc">
        <div className="dlg-hd"><span id="dlg-title" className="dlg-title">{title}</span></div>
        <div id="dlg-desc" className="dlg-body">{desc}</div>
        <div className="dlg-ft">
          <button className="prj-btn prj-btn--ghost" onClick={onClose} disabled={busy}>{cancelLabel || "إلغاء"}</button>
          <button className={`prj-btn ${danger ? "prj-btn--danger" : "prj-btn--primary"}`} onClick={onConfirm} disabled={busy}>
            {confirmLabel || "تأكيد"}
          </button>
        </div>
      </div>
    </div>
  );
}
  