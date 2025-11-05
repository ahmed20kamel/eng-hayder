// src/pages/ViewSummary.jsx
import { Link, useParams } from "react-router-dom";
import ContractFinancialSummary from "./wizard/components/ContractFinancialSummary";

export default function ViewSummary() {
  const { projectId } = useParams();

  return (
    <div className="container">
      <div className="card card--page">
        <div className="content">
          <div className="row row--space-between row--align-center">
            <h2 className="page-title">📊 الملخص المالي للمشروع</h2>
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
            <ContractFinancialSummary projectId={projectId} />
          </div>
        </div>
      </div>
    </div>
  );
}
