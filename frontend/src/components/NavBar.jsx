import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "./LanguageSwitcher";

export default function NavBar() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const isRTL = lang === "ar";

  return (
    <header className="navbar">
      <div
        className="navbar-in"
        style={{
          gridTemplateColumns: "1fr auto",
          direction: isRTL ? "rtl" : "ltr",
        }}
      >
        {/* عنوان بسيط يرجّع للرئيسية */}
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

        {/* مبدّل اللغة */}
        <div className="nav-right">
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}
