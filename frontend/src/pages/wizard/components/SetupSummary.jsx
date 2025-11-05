// src/pages/wizard/components/SetupSummary.jsx
import {
  FaHome,
  FaBuilding,
  FaPaintBrush,
  FaWrench,
  FaIndustry,
  FaUniversity,
  FaPlusCircle,
  FaRedoAlt,
  FaTag
} from "react-icons/fa";
import { useTranslation } from "react-i18next";

// ✅ أيقونة مناسبة لكل نوع مشروع
function iconForProjectType(type) {
  switch (type) {
    case "villa":        return <FaHome />;
    case "commercial":   return <FaBuilding />;
    case "maintenance":  return <FaWrench />;
    case "fitout":       return <FaPaintBrush />;
    case "infra":        return <FaIndustry />;
    case "government":
    case "governmental": return <FaUniversity />;
    default:             return <FaTag />;
  }
}

export default function SetupSummary({ setup }) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  if (!setup) return null;
  const { projectType, villaCategory, contractType } = setup;

  // ✅ استخدم i18n فقط لضمان أن اللغة دايمًا تطابق الواجهة
  const projectTypeText =
    ({
      villa:        t("project_type_villa"),
      commercial:   t("project_type_commercial"),
      maintenance:  t("project_type_maintenance"),
      governmental: t("project_type_governmental"),
      government:   t("project_type_governmental"),
      fitout:       t("project_type_fitout"),
      // لو عندك نوع للبنية التحتية أضف مفتاح ترجمة مخصص (مثلاً project_type_infra)
      infra:        t("project_type_fitout"),
    }[projectType]) || projectType || "";

  const villaCategoryText =
    villaCategory === "residential"
      ? t("villa_residential")
      : villaCategory === "commercial"
      ? t("villa_commercial")
      : "";

  const contractTypeText =
    contractType === "new"
      ? t("contract_new")
      : contractType === "continue"
      ? t("contract_continue")
      : "";

  const items = [];

  if (projectType) {
    items.push(
      <span key="type" className="badge">
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          {iconForProjectType(projectType)}
          <b>{t("setup_project_category_title")}:</b>&nbsp;{projectTypeText}
        </span>
      </span>
    );
  }

  if (projectType === "villa" && villaCategory) {
    items.push(
      <span key="villa" className="badge">
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          {villaCategory === "residential" ? <FaHome /> : <FaBuilding />}
          <b>{t("setup_subcategories_title")}:</b>&nbsp;{villaCategoryText}
        </span>
      </span>
    );
  }

  if (contractType) {
    items.push(
      <span key="contract" className="badge">
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          {contractType === "new" ? <FaPlusCircle /> : <FaRedoAlt />}
          <b>{t("setup_contract_type_title")}:</b>&nbsp;{contractTypeText}
        </span>
      </span>
    );
  }

  if (!items.length) return null;

  return (
    <div className="summary" dir={isRTL ? "rtl" : "ltr"}>
      {items}
    </div>
  );
}
