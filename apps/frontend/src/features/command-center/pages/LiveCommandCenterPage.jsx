import { useEffect, useState } from 'react';
import { api } from '../../../lib/api';

function KpiCard({ label, value, alert }) {
  return (
    <div className={`bg-white p-5 rounded-xl border ${alert ? 'border-red-200' : 'border-gray-100'}`}>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-semibold ${alert ? 'text-red-600' : ''}`}>{value}</p>
    </div>
  );
}

export default function LiveCommandCenterPage() {
  const [snapshot, setSnapshot] = useState(null);

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000); // LCC-M-002: 30s polling
    return () => clearInterval(interval);
  }, []);

  async function load() {
    const { data } = await api.get('/dashboard');
    setSnapshot(data.data);
  }

  if (!snapshot) return <p className="text-sm text-gray-500">Loading…</p>;

  return (
    <div>
      <h1 className="text-lg font-semibold mb-4">Live Campaign Command Center</h1>

      {(snapshot.sentimentScore < -20 || snapshot.boothCoveragePercent < 50) && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          Attention: {snapshot.sentimentScore < -20 ? 'sentiment is trending negative' : 'booth coverage is below 50%'}.
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Total Volunteers" value={snapshot.totalVolunteers} />
        <KpiCard label="Active (24h)" value={snapshot.activeVolunteers24h} />
        <KpiCard label="Booth Coverage" value={`${snapshot.boothCoveragePercent}%`} alert={snapshot.boothCoveragePercent < 50} />
        <KpiCard label="Sentiment Score" value={snapshot.sentimentScore} alert={snapshot.sentimentScore < -20} />
        <KpiCard label="Booth Reports" value={snapshot.surveyCount} />
        <KpiCard label="Social Reach" value={snapshot.socialReach.toLocaleString()} />
        <KpiCard label="Funds Utilized" value={`${snapshot.fundsUtilizedPercent}%`} />
      </div>
    </div>
  );
}
