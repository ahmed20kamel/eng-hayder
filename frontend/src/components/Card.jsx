// مكون موحد للبطاقات - مع تنسيق محسّن للأزرار
export default function Card({
  children,
  title,
  subtitle,
  actions,
  className = "",
  page = false,
  ...props
}) {
  const cardClass = page ? "card card--page" : "card";
  const classes = [cardClass, className].filter(Boolean).join(" ");

  return (
    <div className={classes} {...props}>
      {(title || subtitle || actions) && (
        <div className="card-header">
          <div className="card-header__content">
            {title && <h3 className="card-header__title">{title}</h3>}
            {subtitle && <div className="card-header__subtitle">{subtitle}</div>}
          </div>
          {actions && (
            <div className="card-header__actions">
              {actions}
            </div>
          )}
        </div>
      )}
      {children && <div className="card-body">{children}</div>}
    </div>
  );
}
