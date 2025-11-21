import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { FaHome, FaFolderOpen, FaHardHat, FaUsers, FaUserTie, FaUpload, FaBuilding } from "react-icons/fa";

function SideItem({ to, icon: Icon, label, active }) {
  return (
    <Link to={to} className={`sidebar-link ${active ? "sidebar-link--active" : ""}`}>
      <Icon className="sidebar-link__icon" aria-hidden />
      <span className="sidebar-link__text">{label}</span>
    </Link>
  );
}

export default function Sidebar() {
  const { pathname } = useLocation();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const [logoUrl, setLogoUrl] = useState(() => {
    return localStorage.getItem("company_logo") || "";
  });

  const items = [
    { to: "/", label: t("sidebar_home"), icon: FaHome },
    { to: "/projects", label: t("sidebar_projects"), icon: FaFolderOpen },
    { to: "/owners", label: t("sidebar_owners"), icon: FaUsers },
    { to: "/consultants", label: t("sidebar_consultants"), icon: FaUserTie },
    { to: "/contractors", label: t("sidebar_contractors"), icon: FaHardHat },
  ];

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const url = reader.result;
        setLogoUrl(url);
        localStorage.setItem("company_logo", url);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <aside className="sidebar">
      {/* Logo Section */}
      <div className="sidebar-logo-section">
        <div className="sidebar-logo-container">
          {logoUrl ? (
            <div className="sidebar-logo-wrapper">
              <img src={logoUrl} alt="Company Logo" className="sidebar-logo" />
              <label className="sidebar-logo-upload">
                <FaUpload className="sidebar-logo-upload-icon" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  style={{ display: "none" }}
                />
              </label>
            </div>
          ) : (
            <label className="sidebar-logo-placeholder">
              <FaBuilding className="sidebar-logo-placeholder-icon" />
              <span className="sidebar-logo-placeholder-text">
                {isRTL ? "رفع الشعار" : "Upload Logo"}
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                style={{ display: "none" }}
              />
            </label>
          )}
        </div>
      </div>

      {/* Navigation Section */}
      <nav className="sidebar-nav">
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
