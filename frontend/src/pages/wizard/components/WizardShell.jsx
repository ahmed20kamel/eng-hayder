// src/pages/wizard/components/WizardShell.jsx
import { useId } from "react";
import { useTranslation } from "react-i18next";

export default function WizardShell({ title, children, footer }) {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const headingId = useId();

  return (
    <section
      className="card card--page"
      dir={isRTL ? "rtl" : "ltr"}
      role="region"
      aria-labelledby={headingId}
    >
      <h3
        id={headingId}
        className="page-title"
        style={{
          textAlign: isRTL ? "right" : "left",
        }}
      >
        {title}
      </h3>

      <div className="card-body">
        {children}
      </div>

      {footer ? <div className="mt-12">{footer}</div> : null}
    </section>
  );
}
