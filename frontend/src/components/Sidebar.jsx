// src/components/Sidebar.jsx
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaHome, FaFolderOpen } from "react-icons/fa";

function SideItem({ to, icon: Icon, label, active }) {
  return (
    <Link to={to} className={`side-link ${active ? "active" : ""}`}>
      <Icon aria-hidden />
      <span>{label}</span>
    </Link>
  );
}

export default function Sidebar() {
  const { pathname } = useLocation();
  const { t } = useTranslation();

  const items = [
    { to: "/", label: t("sidebar_home"), icon: FaHome },
    { to: "/projects", label: t("sidebar_projects"), icon: FaFolderOpen },
  ];

  return (
    <aside className="sidebar">
      <div className="side-brand">{t("sidebar_title")}</div>
      <div className="side-section">{t("sidebar_nav")}</div>
      <nav className="side-nav">
        {items.map(({ to, label, icon }) => (
          <SideItem
            key={to}
            to={to}
            label={label}
            icon={icon}
            active={pathname === to || pathname.startsWith(to + "/")}
          />
        ))}
      </nav>
    </aside>
  );
}
