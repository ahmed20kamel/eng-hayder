import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function Breadcrumbs() {
  const { pathname } = useLocation();
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const isRTL = lang === "ar";

  const parts = pathname.split("/").filter(Boolean);

  // خريطة المترجمات حسب المفتاح
  const dict = {
    projects: t("bc_projects"),
    wizard: t("bc_wizard"),
    siteplan: t("bc_siteplan"),
    license: t("bc_license"),
    view: t("bc_view"),
  };

  const paths = parts.map((p, i) => ({
    name: dict[p] || p,
    to: "/" + parts.slice(0, i + 1).join("/"),
    last: i === parts.length - 1,
  }));

  if (!parts.length) return null;

  return (
    <div
      className="breadcrumbs"
      dir={isRTL ? "rtl" : "ltr"}
      style={{
        textAlign: isRTL ? "right" : "left",
      }}
    >
      <div className="breadcrumbs-in container">
        <Link className="bc-link" to="/">
          {t("bc_home")}
        </Link>
        {paths.map((p, i) => (
          <span key={i}>
            <span className="bc-sep">›</span>
            {p.last ? (
              <span className="bc-current">{p.name}</span>
            ) : (
              <Link className="bc-link" to={p.to}>
                {p.name}
              </Link>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}
