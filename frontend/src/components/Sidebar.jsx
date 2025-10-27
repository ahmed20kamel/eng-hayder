// src/components/Sidebar.jsx
import { Link, useLocation } from "react-router-dom";
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

  const items = [
    { to: "/", label: "الرئيسية", icon: FaHome },
    { to: "/projects", label: "المشاريع", icon: FaFolderOpen },
  ];

  return (
    <aside className="sidebar">
      <div className="side-brand">القائمة</div>
      <div className="side-section">التنقل</div>
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
