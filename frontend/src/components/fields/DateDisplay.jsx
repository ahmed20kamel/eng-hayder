// مكون موحد لعرض التاريخ
import { formatDate, getDayName } from "../../utils/formatters";
import { useTranslation } from "react-i18next";

export default function DateDisplay({
  value,
  showDayName = false,
  className = "",
  ...props
}) {
  const { i18n } = useTranslation();
  const locale = i18n.language;

  const formatted = formatDate(value, locale);
  const dayName = showDayName && value ? getDayName(value, locale) : null;

  return (
    <span className={className} {...props}>
      {formatted}
      {dayName && (
        <span className="mini" style={{ display: "block", marginTop: 4 }}>
          {dayName}
        </span>
      )}
    </span>
  );
}

