// src/pages/wizard/components/InfoTip.jsx
import { useEffect, useRef, useState } from "react";

/**
 * أيقونة معلومات خفيفة تفتح بوب-أوفر أنيق.
 * props:
 * - text: محتوى الفقاعة
 * - align: "start" | "center" | "end"
 * - wide: توسعة عرض الفقاعة
 * - title: عنوان اختياري
 * - inline: لو true تبقى أيقونة صغيرة شفافة تناسب وضعها داخل العنوان
 */
export default function InfoTip({ text, align = "center", wide = false, title, inline = true }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  const isRTL = typeof document !== "undefined" && document?.dir === "rtl";
  const alignStyle =
    align === "start"
      ? { [isRTL ? "right" : "left"]: 0 }
      : align === "end"
      ? { [isRTL ? "left" : "right"]: 0 }
      : { left: "50%", transform: "translateX(-50%)" };

  return (
    <span
      ref={ref}
      style={{
        position: "relative",
        display: "inline-inline",
      }}
    >
      <button
        type="button"
        aria-label="معلومة"
        title="معلومة"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        style={{
          // 👇 نسخة خفيفة جدًا تناسب وضعها جوّا النص
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: inline ? 18 : 26,
          height: inline ? 18 : 26,
          borderRadius: "50%",
          border: inline ? "none" : "1px solid #b6d6ff",
          background: inline ? "transparent" : "#eaf3ff",
          color: "#0b74ad",
          cursor: "pointer",
          fontWeight: 700,
          lineHeight: 1,
          padding: 0,
          marginInlineStart: 6,
          outline: "none",
        }}
      >
        {/* أيقونة SVG أنعم من حرف i */}
        <svg
          width={inline ? 16 : 18}
          height={inline ? 16 : 18}
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" stroke="#0b74ad" strokeWidth="1.6" fill={inline ? "transparent" : "#eaf3ff"} />
          <path d="M12 10.5v6" stroke="#0b74ad" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="12" cy="7.2" r="1.2" fill="#0b74ad" />
        </svg>
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="false"
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            zIndex: 40,
            minWidth: wide ? 320 : 240,
            maxWidth: 460,
            background: "#fff",
            border: "1px solid #e1e8f5",
            boxShadow: "0 10px 22px rgba(13,52,120,.15)",
            borderRadius: 10,
            padding: "12px 14px",
            direction: isRTL ? "rtl" : "ltr",
            ...alignStyle,
          }}
        >
          {title ? (
            <div
              style={{
                fontWeight: 700,
                marginBottom: 6,
                color: "#0b74ad",
                fontSize: 14,
              }}
            >
              {title}
            </div>
          ) : null}
          <div style={{ lineHeight: 1.7, fontSize: 14, color: "#1d273b" }}>{text}</div>
        </div>
      )}
    </span>
  );
}
