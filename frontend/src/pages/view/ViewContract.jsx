import { Link, useParams } from "react-router-dom";
import ContractStep from "../wizard/steps/ContractStep";

export default function ViewContract() {
  const { projectId } = useParams();           // ✅

  return (
    <div className="container">
      <div className="card card--page">
        <div className="content">
          <div className="row" style={{ justifyContent:"space-between", alignItems:"center" }}>
            <h2 style={{ margin: 0 }}>📝 عرض عقد المشروع</h2>
            <Link className="btn secondary" to={`/projects/${projectId}`}>رجوع ←</Link>
          </div>

          <div className="mt-12">
            <ContractStep projectId={projectId} onPrev={null} onNext={null} />
          </div>
        </div>
      </div>
    </div>
  );
}
