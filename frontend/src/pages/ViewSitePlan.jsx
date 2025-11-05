// src/pages/ViewSitePlan.jsx
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../services/api";
import SitePlanStep from "./wizard/steps/SitePlanStep";

export default function ViewSitePlan() {
  const { projectId } = useParams();
  const [loading, setLoading] = useState(true);

  const [setup, setSetup] = useState({ projectType: "", villaCategory: "", contractType: "" });

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`projects/${projectId}/`);
        if (!mounted) return;
        setSetup({
          projectType: data?.project_type || "",
          villaCategory: data?.villa_category || data?.project_subtype || "",
          contractType: data?.contract_type || "",
        });
      } catch {
        // مش لازم نفشل الصفحة لو المشروع مرجعش
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [projectId]);

  return (
    <div className="container">
      <div className="card card--page">
        <div className="content">
          <div className="row row--space-between row--align-center">
            <h2 className="page-title">📐 مخطط الأرض — عرض</h2>
            <div className="row row--gap-8">
              <Link className="btn secondary" to={`/projects/${projectId}`}>
                لوحة المشروع ←
              </Link>
              <Link className="btn" to={`/projects/${projectId}/wizard`}>
                فتح المعالج
              </Link>
            </div>
          </div>

          {loading ? (
            <div className="mini mt-12">⏳ جاري التحميل…</div>
          ) : (
            <div className="mt-12">
              <SitePlanStep projectId={projectId} setup={setup} onPrev={null} onNext={null} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
