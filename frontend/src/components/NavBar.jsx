// src/components/NavBar.jsx
import { Link } from "react-router-dom";
import LanguageSwitcher from "./LanguageSwitcher";

export default function NavBar() {
  return (
    <header className="navbar">
      <div className="navbar-in" style={{ gridTemplateColumns: "1fr auto" }}>
        {/* عنوان بسيط يرجّع للرئيسية */}
        <Link to="/" className="brand" style={{ gap: 8, fontWeight: 800 }}>
          🧱 <span>لوحة التحكم</span>
        </Link>

        {/* مبدّل اللغة فقط (احذف السطر لو مش عايزه) */}
        <div className="nav-right">
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}
    