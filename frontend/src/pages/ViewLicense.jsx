// src/pages/ViewLicense.jsx
import { Link, useParams } from "react-router-dom";
import LicenseStep from "./wizard/steps/LicenseStep";

export default function ViewLicense() {
  const { projectId } = useParams();
  
  return (
    <div className="container">
      <div className="card card--page">
        <div className="content">
          
          <div className="row row--space-between row--align-center">
            <h2 className="page-title">📄 ترخيص البناء — عرض</h2>
            <div className="row row--gap-8">
              <Link className="btn secondary" to={`/projects/${projectId}`}>
                لوحة المشروع ←
              </Link>
              <Link className="btn" to={`/projects/${projectId}/wizard`}>
                فتح المعالج
              </Link>
            </div>
          </div>

          <div className="mt-12">
            <LicenseStep projectId={projectId} onPrev={null} onNext={null} />
          </div>

        </div>
      </div>
    </div>
  );
}
