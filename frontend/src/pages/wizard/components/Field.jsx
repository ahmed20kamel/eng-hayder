import { useId } from "react";
import { useTranslation } from "react-i18next";

export default function Field({
  label,
  icon: Icon,
  textarea = false,
  children,
  ...props
}) {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const inputId = useId();

  return (
    <div
      className="stack"
      dir={isRTL ? "rtl" : "ltr"}
      style={{ textAlign: isRTL ? "right" : "left" }}
    >
      {label && (
        <label
          htmlFor={inputId}
          className="label"
          style={{ display: "flex", alignItems: "center", gap: 6 }}
        >
          {Icon ? <Icon aria-hidden="true" /> : null}
          <span>{label}</span>
        </label>
      )}

      {children ? (
        children
      ) : textarea ? (
        <textarea id={inputId} className="input" {...props} />
      ) : (
        <input id={inputId} className="input" {...props} />
      )}
    </div>
  );
}
