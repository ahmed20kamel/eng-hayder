import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../../services/api";

export default function ViewSetup() {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectId) return;
    setLoading(true);
    api
      .get(`projects/${projectId}/`)
      .then(({ data }) => setProject(data))
      .catch(() => setProject(null))
      .finally(() => setLoading(false));
  }, [projectId]);

  if (loading)
    return <div className="container"><div className="card card--page"><div className="content" style={{ textAlign: "center", padding: 40 }}>⏳ جاري تحميل البيانات...</div></div></div>;

  if (!project)
    return <div className="container"><div className="card card--page"><div className="content" style={{ textAlign: "center", padding: 40 }}>⚠️ لم يتم العثور على بيانات المشروع.</div></div></div>;

  return (
    <div className="container">
      <div className="card card--page">
        <div className="content">
          <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
            <h2>🧱 معلومات المشروع</h2>
            <Link className="btn secondary" to={`/projects/${projectId}`}>
              ← المشروع
            </Link>
          </div>

          <div className="card mt-16">
            <h3 style={{ marginBottom: 12 }}>📋 التفاصيل</h3>
            <div className="mini" style={{ lineHeight: 2 }}>
              <div>📦 اسم المشروع: {project?.name || `مشروع #${projectId}`}</div>
              <div>🏗️ تصنيف المشروع: {project?.project_type || "—"}</div>
              {project?.villa_category && <div>🏡 الفئة الفرعية: {project.villa_category}</div>}
              <div>📝 نوع العقد: {project?.contract_type || "—"}</div>
            </div>
          </div>

          <div className="mt-24">
            <Link className="btn" to={`/projects/${projectId}/wizard?step=setup`}>
              تعديل
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
