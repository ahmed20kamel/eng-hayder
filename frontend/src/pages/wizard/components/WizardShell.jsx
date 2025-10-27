// src/pages/wizard/components/WizardShell.jsx
export default function WizardShell({ icon: Icon, title, children, footer }) {
  return (
    <div className="card card--page">
      <h3 style={{display:"flex", alignItems:"center", gap:10}}>
        {Icon ? <Icon/> : null} {title}
      </h3>
      <div className="content mt-8">
        {children}
      </div>
      {footer}
    </div>
  );
}
