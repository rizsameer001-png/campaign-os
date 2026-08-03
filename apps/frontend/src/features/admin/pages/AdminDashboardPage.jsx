import { useEffect, useState } from 'react';
import { api } from '../../../lib/api';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/admin/dashboard').then(({ data }) => setStats(data.data));
  }, []);

  if (!stats) return <p className="text-sm text-gray-500">Loading…</p>;

  return (
    <div>
      <h1 className="text-lg font-semibold mb-4">Platform Overview</h1>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <Stat label="Candidates" value={stats.totalCandidates} />
        <Stat label="Active Campaigns" value={stats.activeCampaigns} />
        <Stat label="Volunteers" value={stats.totalVolunteers} />
        <Stat label="AI Requests Today" value={stats.aiRequestsToday} />
        <Stat label="Pending Approvals" value={stats.pendingApprovals} alert={stats.pendingApprovals > 0} />
      </div>

      <div className="bg-white rounded-xl border border-gray-100">
        <h3 className="font-semibold p-4 border-b border-gray-100">Recent Signups</h3>
        <div className="divide-y">
          {stats.recentSignups.map((u) => (
            <div key={u.id} className="flex justify-between p-4 text-sm">
              <span>{u.name} ({u.email})</span>
              <span className="text-gray-400">{u.role}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, alert }) {
  return (
    <div className={`bg-white p-4 rounded-xl border ${alert ? 'border-yellow-300' : 'border-gray-100'}`}>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-xl font-semibold ${alert ? 'text-yellow-700' : ''}`}>{value}</p>
    </div>
  );
}
