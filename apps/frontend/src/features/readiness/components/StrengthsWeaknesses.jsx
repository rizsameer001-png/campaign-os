export default function StrengthsWeaknesses({ strengths, weaknesses }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-white p-5 rounded-xl border border-gray-100">
        <h4 className="text-sm font-semibold text-green-700 mb-2">Strengths</h4>
        <ul className="space-y-1 text-sm text-gray-600">
          {strengths.map((s, i) => <li key={i}>• {s}</li>)}
        </ul>
      </div>
      <div className="bg-white p-5 rounded-xl border border-gray-100">
        <h4 className="text-sm font-semibold text-red-700 mb-2">Weaknesses</h4>
        <ul className="space-y-1 text-sm text-gray-600">
          {weaknesses.map((w, i) => <li key={i}>• {w}</li>)}
        </ul>
      </div>
    </div>
  );
}
