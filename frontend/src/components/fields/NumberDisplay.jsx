// مكون موحد لعرض الأرقام
import { formatNumber, formatMoney, formatMoneyDecimal, formatMoneyArabic, toArabicDigits } from "../../utils/formatters";
import { useTranslation } from "react-i18next";

export default function NumberDisplay({
  value,
  type = "number", // number | money | moneyDecimal | moneyArabic
  decimals = 2,
  showArabic = false,
  className = "",
  ...props
}) {
  const { i18n } = useTranslation();
  const locale = i18n.language === "ar" ? "ar" : "en-US";

  const { t } = useTranslation();
  let formatted = t("empty_value");

  if (value !== null && value !== undefined && value !== "") {
    switch (type) {
      case "money":
        formatted = formatMoney(value);
        break;
      case "moneyDecimal":
        formatted = formatMoneyDecimal(value);
        break;
      case "moneyArabic":
        formatted = formatMoneyArabic(value);
        break;
      default:
        formatted = formatNumber(value, { decimals, locale });
    }
  }

  return (
    <span className={className} {...props}>
      {formatted}
      {showArabic && type === "number" && formatted !== t("empty_value") && (
        <span className="mini" style={{ display: "block", marginTop: 4 }}>
          {toArabicDigits(formatted)}
        </span>
      )}
    </span>
  );
}

