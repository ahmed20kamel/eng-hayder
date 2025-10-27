import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { FaPlusCircle } from "react-icons/fa";

export default function HomePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  async function createProject() {
    try {
      setLoading(true);
      const { data } = await api.post("projects/", { name: "مشروع جديد" });
      navigate(`/projects/${data.id}/wizard`);
    } catch (err) {
      console.error("خطأ أثناء إنشاء المشروع:", err);
      alert("حدث خطأ أثناء إنشاء المشروع، حاول مرة أخرى.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container">
      <div className="card card--page">
        <div
          className="content"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
            textAlign: "center",
          }}
        >
          <h2 style={{ color: "var(--primary)" }}>🏗️ نظام إدارة المشاريع</h2>
          <p className="mini" style={{ maxWidth: 520 }}>
            ابدأ بإنشاء مشروع جديد لإدخال <strong>بيانات المشروع</strong>.
          </p>
          <button onClick={createProject} disabled={loading} className="btn">
            <FaPlusCircle /> &nbsp;
            {loading ? "جارٍ الإنشاء..." : "إضافة مشروع جديد"}
          </button>
          {/* <p className="mini">سيتم نقلك إلى معالج الإعداد بعد الإنشاء.</p> */}
        </div>
      </div>
    </div>
  );
}
