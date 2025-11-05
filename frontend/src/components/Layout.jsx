import { useTranslation } from "react-i18next";
import NavBar from "./NavBar";
import Sidebar from "./Sidebar";
import Breadcrumbs from "./Breadcrumbs";

export default function Layout({ children }) {
  const { i18n } = useTranslation();
  const lang = i18n.language;
  const isRTL = lang === "ar";

  return (
    <div
      className="layout"
      lang={lang}
      dir={isRTL ? "rtl" : "ltr"}
      style={{
        display: "grid",
        gridTemplateColumns: "auto 1fr",
        minHeight: "100vh",
      }}
    >
      <Sidebar />
      <div className="main">
        <NavBar />
        <Breadcrumbs />
        <main className="content container">{children}</main>
      </div>
    </div>
  );
}
