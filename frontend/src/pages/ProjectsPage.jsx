// src/pages/ProjectsPage.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => { loadProjects(); }, []);

  const loadProjects = async () => {
    try {
      const { data } = await api.get("projects/"); // تأكد من السلاش
      // ✅ يقبل Array مباشر أو شكل Paginated (results/items/data)
      const items = Array.isArray(data) ? data : (data?.results || data?.items || data?.data || []);
      setProjects(items);
    } catch (e) {
      console.error(e);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "⚠️ هل أنت متأكد من حذف هذا المشروع؟\nسيتم حذف جميع البيانات المتعلقة به."
    );
    if (!confirmDelete) return;

    try {
      setDeletingId(id);
      await api.delete(`projects/${id}/`);
      // حدث القائمة محليًا بدون ريفريش
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch (e) {
      console.error("Delete failed:", e);
      alert("❌ حدث خطأ أثناء الحذف.");
    } finally {
      setDeletingId(null);
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

        {projects.length === 0 ? (
          <div className="prj-alert">
            <span className="prj-alert__title">🚧 لا توجد مشاريع بعد.</span>
          </div>
        ) : (
          <div className="prj-table__wrapper">
            <table className="prj-table">
              <thead>
                <tr>
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

                  return (
                    <tr key={p?.id ?? i} className={active ? "prj-row--active" : undefined}>
                      <td className="prj-muted">{i + 1}</td>

                      <td>
                        <div className="prj-cell__main">
                          <div className="prj-cell__title">{p?.name || `مشروع #${p?.id ?? i+1}`}</div>
                          <div className="prj-cell__sub prj-muted">
                            {p?.city ? `المدينة: ${p.city}` : "—"}
                          </div>
                        </div>
                      </td>

                      <td>
                        <code className="prj-code">{p?.internal_code || `PRJ-${p?.id ?? i+1}`}</code>
                      </td>

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
                          onClick={() => handleDelete(p.id)}
                          disabled={deletingId === p.id}
                          title="حذف المشروع"
                        >
                          {deletingId === p.id ? "جارٍ الحذف..." : "حذف ✖"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              <tfoot>
                <tr>
                  <td colSpan={7} className="prj-foot prj-muted">
                    إجمالي المشاريع: {projects.length}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
