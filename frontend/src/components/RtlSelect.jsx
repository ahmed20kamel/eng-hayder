// src/components/RtlSelect.jsx
import Select from "react-select";

export default function RtlSelect({
  options = [],          // [{ value, label }]
  value,                 // string | number
  onChange,              // (value) => void
  placeholder = "اختر...",
  isDisabled = false,
  isClearable = true,
  className = "",
}) {
  const findOption = (v) => options.find(o => o.value === v) || null;

  return (
    <div className={`rtl-select ${className}`} dir="rtl">
      <Select
        classNamePrefix="rs"               // نستخدمه في index.css
        options={options}
        value={findOption(value)}
        onChange={(opt) => onChange(opt ? opt.value : "")}
        placeholder={placeholder}
        isDisabled={isDisabled}
        isClearable={isClearable}
        isSearchable
        menuPortalTarget={document.body}   // القايمة فوق أي overflow
        styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
      />
    </div>
  );
}
