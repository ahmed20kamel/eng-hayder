// src/pages/ProjectsPage.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadProjects(); }, []);

  const loadProjects = async () => {
    try {
      const { data } = await api.get("projects/");
      setProjects(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="card card--page">
        <div className="content">
          <h2>📁 المشاريع</h2>
          <p className="mini">هذه الصفحة للعرض فقط. إنشاء مشروع يتم من الصفحة الرئيسية.</p>

          {loading ? (
            <p>جارٍ التحميل…</p>
          ) : projects.length === 0 ? (
            <div className="alert"><span className="title">لا توجد مشاريع بعد.</span></div>
          ) : (
            <div className="form-grid cols-4 mt-12">
              {projects.map((p) => {
                const canRunWizard = p.type === "villa" && p.contract_type === "new";
                return (
                  <div key={p.id} className="card">
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8}}>
                      <div>
                        <b>{p.name}</b>
                        <div className="mini">
                          نوع: {p.type || "-"} {p.contract_type ? <>• العقد: {p.contract_type}</> : null}
                        </div>
                      </div>
                      {canRunWizard ? (
                        <Link className="btn" to={`/projects/${p.id}/wizard`}>فتح المعالج</Link>
                      ) : (
                        <span className="mini">المعالج متاح فقط لفيلا سكنية + عقد جديد</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
