import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import LanguageSwitcher from "./LanguageSwitcher";
import { useTheme } from "../hooks/useTheme";
import Button from "./Button";
import { FaUser, FaChevronDown, FaSignOutAlt, FaCog } from "react-icons/fa";

export default function NavBar() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const isRTL = lang === "ar";
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const { theme, toggleTheme } = useTheme();

  // Get current user from localStorage or use default
  const currentUser = localStorage.getItem("current_user") || (isRTL ? "مستخدم" : "User");

  const companyName = isRTL 
    ? " ال يافور للنقليات والمقاولات العامة"
    : "Al Yafour Transportation & General Contracting";

  return (
    <header className="navbar" dir={isRTL ? "rtl" : "ltr"}>
      <div className="navbar-in">
        <Link to="/" className="navbar-brand">
          <div className="navbar-brand-content">
            <div className="navbar-brand-main">{companyName}</div>
            <div className="navbar-brand-sub">{isRTL ? "شركة مقاولات رائدة" : "Leading Construction Company"}</div>
          </div>
        </Link>

        <div className="navbar-right">
          <Button
            variant="ghost"
            onClick={toggleTheme}
            className="navbar-btn"
            title={theme === "dark" ? (isRTL ? "الوضع الفاتح" : "Light Mode") : (isRTL ? "الوضع الغامق" : "Dark Mode")}
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </Button>
          <LanguageSwitcher />
          
          {/* User Menu */}
          <div className="navbar-user-menu">
            <button
              className="navbar-user-btn"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              onBlur={() => setTimeout(() => setUserMenuOpen(false), 200)}
            >
              <div className="navbar-user-avatar">
                <FaUser />
              </div>
              <span className="navbar-user-name">{currentUser}</span>
              <FaChevronDown className={`navbar-user-chevron ${userMenuOpen ? "open" : ""}`} />
            </button>
            
            {userMenuOpen && (
              <div className="navbar-user-dropdown">
                <div className="navbar-user-dropdown-header">
                  <div className="navbar-user-dropdown-name">{currentUser}</div>
                  <div className="navbar-user-dropdown-role">{isRTL ? "مدير النظام" : "System Administrator"}</div>
                </div>
                <div className="navbar-user-dropdown-divider"></div>
                <button className="navbar-user-dropdown-item">
                  <FaCog className="navbar-user-dropdown-icon" />
                  <span>{isRTL ? "الإعدادات" : "Settings"}</span>
                </button>
                <button className="navbar-user-dropdown-item">
                  <FaSignOutAlt className="navbar-user-dropdown-icon" />
                  <span>{isRTL ? "تسجيل الخروج" : "Sign Out"}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
