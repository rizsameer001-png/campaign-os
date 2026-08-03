const PILLARS = [
  { key: 'organizationScore', label: 'Organization', weight: '25%' },
  { key: 'digitalScore', label: 'Digital Presence', weight: '20%' },
  { key: 'resourcesScore', label: 'Campaign Resources', weight: '15%' },
  { key: 'voterScore', label: 'Voter Intelligence', weight: '20%' },
  { key: 'visibilityScore', label: 'Candidate Visibility', weight: '20%' },
];

export default function ScoreBreakdown({ report }) {
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-100">
      <div className="flex items-baseline justify-between mb-4">
        <h3 className="font-semibold">Pillar Breakdown</h3>
        <span className="text-2xl font-bold text-brand-600">{report.overallScore}/100</span>
      </div>
      <p className="text-sm text-gray-500 mb-4">{report.interpretation}</p>

      <div className="space-y-3">
        {PILLARS.map((p) => (
          <div key={p.key}>
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>{p.label} <span className="text-gray-400">({p.weight})</span></span>
              <span>{report[p.key]}/100</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-brand-600" style={{ width: `${report[p.key]}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
