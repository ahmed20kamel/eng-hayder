// src/pages/ViewSummary.jsx
import { Link, useParams } from "react-router-dom";
import ContractFinancialSummary from "./wizard/components/ContractFinancialSummary";

export default function ViewSummary() {
  const { projectId } = useParams();

  return (
    <div className="container">
      <div className="card card--page">
        <div className="content">
          <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ margin: 0 }}>📊 الملخص المالي للمشروع</h2>
            <div className="row" style={{ gap: 8 }}>
              <Link className="btn secondary" to={`/projects/${projectId}`}>لوحة المشروع ←</Link>
              <Link className="btn" to={`/projects/${projectId}/wizard`}>فتح المعالج</Link>
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
