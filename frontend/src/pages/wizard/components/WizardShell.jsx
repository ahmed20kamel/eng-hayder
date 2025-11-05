// src/pages/wizard/components/WizardShell.jsx
import { useId } from "react";
import { useTranslation } from "react-i18next";

export default function WizardShell({ icon: Icon, title, children, footer }) {
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
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          margin: 0,
          textAlign: isRTL ? "right" : "left",
        }}
      >
        {Icon ? <Icon aria-hidden /> : null}
        <span>{title}</span>
      </h3>

      <div className="content mt-8">
        {children}
      </div>

      {footer ? <div className="mt-12">{footer}</div> : null}
    </section>
  );
}
