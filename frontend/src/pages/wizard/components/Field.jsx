// src/pages/wizard/components/Field.jsx
export default function Field({ label, icon: Icon, textarea = false, children, ...props }) {
  return (
    <div className="stack">
      <label className="label">{Icon ? <Icon /> : null} {label}</label>
      {children
        ? children
        : textarea
          ? <textarea className="input" {...props} />
          : <input className="input" {...props} />}
    </div>
  );
}
