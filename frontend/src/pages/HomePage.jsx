import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "../services/api";
import { FaPlusCircle } from "react-icons/fa";

export default function HomePage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  async function createProject() {
    try {
      setLoading(true);

      // بدون اسم — بس حالة مبدئية إن حبيت
      const payload = { status: "draft" };
      const res = await api.post("projects/", payload);
      const id = res?.data?.id;

      if (id) {
        navigate(`/projects/${id}/wizard`);
        return;
      }

      // فول باك بسيط
      const list = await api.get("projects/");
      const latestId =
        Array.isArray(list.data) && list.data.length ? list.data[0].id : null;

      if (latestId) {
        navigate(`/projects/${latestId}/wizard`);
      } else {
        alert(t("homepage_created_but_unknown"));
      }
    } catch (err) {
      console.error("Error creating project:", err);
      const msg = err?.response?.data
        ? JSON.stringify(err.response.data)
        : err.message;
      alert(`${t("homepage_error_creating_project")}: ${msg}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container">
      <div className="card card--page">
        <div className="content stack items-center stack--gap-12 text-center">
          <h2 className="text-primary">{t("homepage_title")}</h2>
          <p className="mini max-w-520">
            {t("homepage_subtitle")}
          </p>
          <button onClick={createProject} disabled={loading} className="btn">
            <FaPlusCircle />&nbsp;
            {loading ? t("homepage_creating") : t("homepage_cta")}
          </button>
        </div>
      </div>
    </div>
  );
}
