export default function Button({
  children,
  variant = 'primary',
  loading = false,
  className = '',
  disabled,
  ...props
}) {
  const base = 'inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    primary: 'bg-brand-600 text-white hover:bg-brand-700',
    secondary: 'bg-white text-gray-900 border border-gray-300 hover:bg-gray-50',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    ghost: 'text-gray-700 hover:bg-gray-100',
  };

  return (
    <button className={`${base} ${variants[variant]} ${className}`} disabled={disabled || loading} {...props}>
      {loading ? 'Please wait…' : children}
    </button>
  );
}
