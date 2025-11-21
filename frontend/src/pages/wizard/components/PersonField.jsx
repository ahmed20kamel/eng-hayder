// مكون موحد لحقل الاستشاري أو المقاول مع البحث
import { useState } from "react";
import { useTranslation } from "react-i18next";
import Field from "../../../components/fields/Field";
import ViewRow from "../../../components/fields/ViewRow";
import { loadSavedList } from "../../../utils/localStorage";

export default function PersonField({
  type = "consultant", // "consultant" or "contractor"
  label,
  licenseLabel,
  nameValue,
  licenseValue,
  onNameChange,
  onLicenseChange,
  isView,
  onSelect,
}) {
  const { t } = useTranslation();
  const [showSuggestions, setShowSuggestions] = useState(false);
  const storageKey = type === "consultant" ? "consultants" : "contractors";
  const [savedList] = useState(() => loadSavedList(storageKey));

  const namePlaceholder = type === "consultant" 
    ? t("consultant_name_placeholder")
    : t("contractor_name_placeholder");
  const licensePlaceholder = type === "consultant"
    ? t("consultant_license_placeholder")
    : t("contractor_license_placeholder");
  const notFoundText = type === "consultant"
    ? t("consultant_not_found", { defaultValue: "" })
    : t("contractor_not_found");

  if (isView) {
    return (
      <>
        <ViewRow label={label} value={nameValue} />
        <ViewRow label={licenseLabel} value={licenseValue} />
      </>
    );
  }

  const filteredList = savedList.filter((c) =>
    c.name.toLowerCase().includes((nameValue || "").toLowerCase())
  );

  return (
    <>
      <Field label={label}>
        <div className="pos-relative">
          <input
            className="input"
            placeholder={namePlaceholder}
            value={nameValue || ""}
            onChange={(e) => {
              const v = e.target.value;
              onNameChange(v);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          />
          {showSuggestions && nameValue && (
            <div className="dropdown-list">
              {filteredList.length > 0 ? (
                filteredList.map((c, i) => (
                  <div
                    key={i}
                    className="dropdown-item"
                    onMouseDown={() => {
                      onNameChange(c.name);
                      onLicenseChange(c.license);
                      if (onSelect) onSelect(c);
                    }}
                  >
                    {c.name}
                  </div>
                ))
              ) : (
                notFoundText && (
                  <div className="dropdown-item opacity-70">
                    {notFoundText}
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </Field>
      <Field label={licenseLabel}>
        <input
          className="input"
          placeholder={licensePlaceholder}
          value={licenseValue || ""}
          onChange={(e) => onLicenseChange(e.target.value)}
        />
      </Field>
    </>
  );
}

