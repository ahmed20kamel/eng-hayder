import { useTranslation } from "react-i18next";
import { FaGlobe } from "react-icons/fa";

export default function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const lang = i18n.language;
  const isRTL = lang === "ar";

  // التبديل بين اللغتين
  const toggle = () => i18n.changeLanguage(isRTL ? "en" : "ar");

  return (
    <button
      type="button"
      className="btn secondary"
      onClick={toggle}
      title={t("language_switch_title")}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: isRTL ? "row-reverse" : "row",
      }}
    >
      <FaGlobe style={{ marginInlineEnd: isRTL ? 0 : 8, marginInlineStart: isRTL ? 8 : 0 }} />
      {t("language")}
    </button>
  );
}
