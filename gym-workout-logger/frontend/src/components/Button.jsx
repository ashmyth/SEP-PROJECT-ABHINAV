export default function Button({
  children,
  variant = "primary",
  size,
  block,
  className = "",
  type = "button",
  ...rest
}) {
  const classes = [
    "btn",
    `btn-${variant}`,
    size === "lg" ? "btn-lg" : "",
    block ? "btn-block" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <button className={classes} type={type} {...rest}>
      {children}
    </button>
  );
}
