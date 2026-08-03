export default function RecommendationsList({ recommendations }) {
  return (
    <div className="bg-white p-5 rounded-xl border border-gray-100">
      <h4 className="text-sm font-semibold mb-3">AI Recommendations</h4>
      <ol className="space-y-2 text-sm text-gray-700 list-decimal list-inside">
        {recommendations.map((r, i) => <li key={i}>{r}</li>)}
      </ol>
    </div>
  );
}
