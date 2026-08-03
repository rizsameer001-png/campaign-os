export default function FormField({ label, error, children, hint }) {
  return (
    <label className="block mb-4">
      <span className="block text-sm font-medium text-gray-700 mb-1">{label}</span>
      {children}
      {hint && !error && <span className="block text-xs text-gray-500 mt-1">{hint}</span>}
      {error && <span className="block text-xs text-red-600 mt-1">{error}</span>}
    </label>
  );
}

export function inputClasses(hasError) {
  return `w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 ${
    hasError ? 'border-red-400' : 'border-gray-300'
  }`;
}
