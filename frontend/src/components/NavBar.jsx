import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "./LanguageSwitcher";
import { useTheme } from "../hooks/useTheme"; // 👈 استدعاء الهوك

export default function NavBar() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const isRTL = lang === "ar";

  const { theme, toggleTheme } = useTheme(); // 👈 شغل الثيم

  return (
    <header className="navbar">
      <div
        className="navbar-in"
        style={{
          gridTemplateColumns: "1fr auto",
          direction: isRTL ? "rtl" : "ltr",
        }}
      >
        {/* عنوان يرجّع للرئيسية */}
        <Link
          to="/"
          className="brand"
          style={{
            gap: 8,
            fontWeight: 800,
            display: "flex",
            alignItems: "center",
          }}
        >
          🧱 <span>{t("navbar_title")}</span>
        </Link>

        {/* يمين النافبار */}
        <div className="nav-right" style={{ display: "flex", gap: 10 }}>
          {/* switch theme */}
          <button
            onClick={toggleTheme}
            className="btn ghost"
            style={{ padding: "8px 12px", fontSize: 16 }}
            title={theme === "dark" ? "الوضع الفاتح" : "الوضع الغامق"}
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>

          {/* مبدّل اللغة */}
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}
