// مكون موحد للأزرار - موحد تماماً في كل التطبيق
export default function Button({
  children,
  variant = "primary", // primary | secondary | ghost | danger
  className = "",
  disabled = false,
  onClick,
  type = "button",
  block = false,
  as: Component = "button",
  ...props
}) {
  const baseClass = "btn";
  const variantClass = variant !== "primary" ? `btn--${variant}` : "";
  const blockClass = block ? "btn--block" : "";
  const classes = [baseClass, variantClass, blockClass, className]
    .filter(Boolean)
    .join(" ");

  const buttonProps = Component === "button" ? { type, disabled } : {};

  return (
    <Component
      className={classes}
      disabled={disabled}
      onClick={onClick}
      {...buttonProps}
      {...props}
    >
      {children}
    </Component>
  );
}
