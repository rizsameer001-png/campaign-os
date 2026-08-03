export default function QuotaMeter({ quota }) {
  if (!quota) return null;
  const percent = Math.min(100, Math.round(quota.percentUsed));

  return (
    <div className="mb-4 p-3 rounded-lg bg-gray-50 border border-gray-100">
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>Monthly AI usage</span>
        <span>₹{quota.spent.toFixed(2)} / ₹{quota.quota}</span>
      </div>
      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full ${percent >= 80 ? 'bg-yellow-500' : 'bg-brand-600'}`} style={{ width: `${percent}%` }} />
      </div>
      {quota.warning && <p className="text-xs text-yellow-700 mt-1">You're approaching your monthly AI quota.</p>}
    </div>
  );
}
