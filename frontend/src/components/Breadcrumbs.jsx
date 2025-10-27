import { Link, useLocation } from "react-router-dom";

export default function Breadcrumbs() {
  const { pathname } = useLocation();
  const parts = pathname.split("/").filter(Boolean);

  // خرائط أسماء لطيفة بدل slug
  const dict = {
    projects: "المشاريع",
    wizard: "معالج الإعداد",
    siteplan: "مخطط الأرض",
    license: "الرخصة",
    view: "عرض",
  };

  const paths = parts.map((p, i) => ({
    name: dict[p] || p,
    to: "/" + parts.slice(0, i + 1).join("/"),
    last: i === parts.length - 1,
  }));

  if (!parts.length) return null;

  return (
    <div className="breadcrumbs">
      <div className="breadcrumbs-in container">
        <Link className="bc-link" to="/">الرئيسية</Link>
        {paths.map((p, i) => (
          <span key={i}>
            <span className="bc-sep">›</span>
            {p.last ? (
              <span className="bc-current">{p.name}</span>
            ) : (
              <Link className="bc-link" to={p.to}>{p.name}</Link>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}
