import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // حذف فردي
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [targetProject, setTargetProject] = useState(null); // {id, name}
  const [deletingId, setDeletingId] = useState(null);

  // ✅ تحديد متعدد + حذف جماعي
  const [selectedIds, setSelectedIds] = useState(new Set()); // Set<number>
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // Toast بسيط
  const [toast, setToast] = useState(null); // {type: 'success'|'error', msg}
  const toastTimer = useRef(null);

  useEffect(() => { loadProjects(); return () => clearTimeout(toastTimer.current); }, []);

  const loadProjects = async () => {
    try {
      const { data } = await api.get("projects/");
      const items = Array.isArray(data) ? data : (data?.results || data?.items || data?.data || []);
      setProjects(items);
    } catch (e) {
      console.error(e);
      setProjects([]);
      showToast("error", "تعذّر تحميل المشاريع.");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (type, msg) => {
    setToast({ type, msg });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2500);
  };

  // ====== تحديد متعدد ======
  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const isAllSelected = projects.length > 0 && projects.every(p => selectedIds.has(p.id));
  const toggleSelectAll = () => {
    setSelectedIds(prev => {
      if (isAllSelected) return new Set(); // إلغاء الكل
      return new Set(projects.map(p => p.id)); // تحديد الكل المعروض
    });
  };

  // فتح الـ Dialog الفردي
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

  // ====== حذف جماعي ======
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
      try {
        await api.delete(`projects/${id}/`);
        ok += 1;
      } catch (e) {
        console.error("Bulk delete failed for id", id, e);
        fail += 1;
      }
    }

    setProjects(prev => prev.filter(p => !selectedIds.has(p.id)));
    setSelectedIds(new Set());
    setBulkDeleting(false);
    setBulkConfirmOpen(false);

    if (fail === 0) {
      showToast("success", `تم حذف ${ok} مشروعًا بنجاح.`);
    } else if (ok === 0) {
      showToast("error", "تعذّر حذف المشاريع المحددة.");
    } else {
      showToast("error", `تم حذف ${ok} وفشل حذف ${fail}.`);
    }
  };

  if (loading) {
    return (
      <div className="prj-container">
        <div className="prj-card prj-page">
          <div className="prj-loading">
            <p className="prj-loading__text">⏳ جاري تحميل المشاريع...</p>
          </div>
        </div>
      </div>
    );
  }

  const selectedCount = selectedIds.size;

  return (
    <div className="prj-container" dir="rtl">
      <div className="prj-card prj-page">
        <div className="prj-header">
          <h2 className="prj-title">
            <span className="prj-title__icon">📁</span>
            <span>المشاريع</span>
          </h2>
          <p className="prj-subtitle">اختر مشروعًا للاطّلاع على التفاصيل أو تعديل البيانات.</p>
        </div>

        {/* شريط إجراءات عند وجود تحديد */}
        {selectedCount > 0 && (
          <div className="prj-bulkbar">
            <div className="prj-bulkbar__info">
              محدد: <strong>{selectedCount}</strong>
            </div>
            <div className="prj-bulkbar__actions">
              <button className="prj-btn prj-btn--danger" onClick={askBulkDelete}>
                حذف المحدد
              </button>
              <button className="prj-btn prj-btn--ghost" onClick={() => setSelectedIds(new Set())}>
                إلغاء التحديد
              </button>
            </div>
          </div>
        )}

        {projects.length === 0 ? (
          <div className="prj-alert">
            <span className="prj-alert__title">🚧 لا توجد مشاريع بعد.</span>
          </div>
        ) : (
          <div className="prj-table__wrapper">
            <table className="prj-table">
              <thead>
                <tr>
                  <th style={{width: 36, textAlign: "center"}}>
                    <input
                      type="checkbox"
                      aria-label="تحديد الكل"
                      checked={isAllSelected}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th>#</th>
                  <th>اسم المشروع</th>
                  <th>الكود الداخلي</th>
                  <th>التصنيف</th>
                  <th>نوع العقد</th>
                  <th>الحالة</th>
                  <th>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((p, i) => {
                  const hasSiteplan = !!p?.has_siteplan;
                  const hasLicense  = !!p?.has_license;
                  const hasContract = !!p?.contract_type;
                  const active      = hasSiteplan || hasLicense || hasContract;
                  const checked     = selectedIds.has(p.id);

                  const title = p?.display_name || p?.name || `مشروع #${p?.id ?? i+1}`;

                  return (
                    <tr key={p?.id ?? i} className={active ? "prj-row--active" : undefined}>
                      <td style={{ textAlign: "center" }}>
                        <input
                          type="checkbox"
                          aria-label={`تحديد ${title}`}
                          checked={checked}
                          onChange={() => toggleSelect(p.id)}
                        />
                      </td>

                      <td className="prj-muted">{i + 1}</td>

                      <td>
                        <div className="prj-cell__main">
                          <div className="prj-cell__title">{title}</div>
                          <div className="prj-cell__sub prj-muted">
                            {p?.city ? `المدينة: ${p.city}` : "—"}
                          </div>
                        </div>
                      </td>

                      <td><code className="prj-code">{p?.internal_code || `PRJ-${p?.id ?? i+1}`}</code></td>
                      <td className="prj-nowrap">{p?.project_type || "—"}</td>
                      <td className="prj-nowrap">{p?.contract_type || "—"}</td>

                      <td>
                        <div className="prj-badges">
                          <span className={`prj-badge ${hasSiteplan ? "is-on" : "is-off"}`}>مخطط</span>
                          <span className={`prj-badge ${hasLicense  ? "is-on" : "is-off"}`}>ترخيص</span>
                          <span className={`prj-badge ${hasContract ? "is-on" : "is-off"}`}>عقد</span>
                        </div>
                      </td>

                      <td className="prj-actions">
                        <Link className="prj-btn prj-btn--primary" to={`/projects/${p?.id}/wizard`}>تعديل</Link>
                        <Link className="prj-btn prj-btn--ghost"   to={`/projects/${p?.id}`}>عرض →</Link>

                        <button
                          className="prj-btn prj-btn--danger"
                          onClick={() => askDelete(p)}
                          disabled={deletingId === p.id}
                          title="حذف المشروع"
                        >
                          حذف
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              <tfoot>
                <tr>
                  <td colSpan={8} className="prj-foot prj-muted">
                    إجمالي المشاريع: {projects.length}
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
          desc={
            <>
              هل أنت متأكد من حذف المشروع
              <strong style={{marginInline: 6}}>{targetProject?.name}</strong>؟
              <br />
              هذا الإجراء لا يمكن التراجع عنه.
            </>
          }
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
          desc={
            <>
              سيتم حذف <strong>{selectedCount}</strong> مشروع/مشاريع نهائيًا.
              <br />
              هل تريد المتابعة؟
            </>
          }
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

  // إغلاق بالـ ESC و الضغط على الخلفية
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
        <div className="dlg-hd">
          <span id="dlg-title" className="dlg-title">{title}</span>
        </div>
        <div id="dlg-desc" className="dlg-body">
          {desc}
        </div>
        <div className="dlg-ft">
          <button className="prj-btn prj-btn--ghost" onClick={onClose} disabled={busy}>
            {cancelLabel || "إلغاء"}
          </button>
          <button
            className={`prj-btn ${danger ? "prj-btn--danger" : "prj-btn--primary"}`}
            onClick={onConfirm}
            disabled={busy}
          >
            {confirmLabel || "تأكيد"}
          </button>
        </div>
      </div>
    </div>
  );
}
