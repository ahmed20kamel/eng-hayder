// src/pages/wizard/components/SetupSummary.jsx
import {
  FaHome,
  FaBuilding,
  FaTools,
  FaPaintBrush,
  FaWrench,
  FaIndustry,
  FaUniversity,
  FaPlusCircle,
  FaRedoAlt,
  FaTag
} from "react-icons/fa";
import { labelProjectType } from "../hooks/useWizardState";

function iconForProjectType(type) {
  switch (type) {
    case "villa":        return <FaHome />;
    case "commercial":   return <FaBuilding />;
    case "maintenance":  return <FaWrench />;
    case "fitout":       return <FaPaintBrush />;
    case "infra":        return <FaIndustry />;
    case "government":   return <FaUniversity />;
    default:             return <FaTag />;
  }
}

export default function SetupSummary({ setup }) {
  if (!setup) return null;
  const { projectType, villaCategory, contractType } = setup;

  const items = [];

  if (projectType) {
    items.push(
      <span key="type" className="badge">
        <span style={{display:"inline-flex",alignItems:"center",gap:6}}>
          {iconForProjectType(projectType)} <b>نوع المشروع:</b> {labelProjectType(projectType)}
        </span>
      </span>
    );
  }

  if (projectType === "villa" && villaCategory) {
    items.push(
      <span key="villa" className="badge">
        <span style={{display:"inline-flex",alignItems:"center",gap:6}}>
          {villaCategory === "residential" ? <FaHome/> : <FaBuilding/>}
          <b>تصنيف الفيلا:</b> {villaCategory === "residential" ? "سكني" : "تجاري"}
        </span>
      </span>
    );
  }

  if (contractType) {
    items.push(
      <span key="contract" className="badge">
        <span style={{display:"inline-flex",alignItems:"center",gap:6}}>
          {contractType === "new" ? <FaPlusCircle/> : <FaRedoAlt/>}
          <b>نوع العقد:</b> {contractType === "new" ? "جديد" : "استكمال"}
        </span>
      </span>
    );
  }

  if (!items.length) return null;
  return <div className="summary">{items}</div>;
}
