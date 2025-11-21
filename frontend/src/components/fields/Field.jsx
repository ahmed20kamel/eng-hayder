import { useId } from "react";
import { useTranslation } from "react-i18next";

export default function Field({
  label,
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
        >
          {label}
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

