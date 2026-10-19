const variants = {
  primary: "btn",
  outline: "btn-outline",
  danger: "inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50",
};

export default function Button({ variant = "primary", className = "", loading = false, children, ...props }) {
  return (
    <button className={`${variants[variant]} ${className}`} disabled={loading || props.disabled} {...props}>
      {loading ? "Please wait..." : children}
    </button>
  );
}
