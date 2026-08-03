import { useEffect, useState } from 'react';
import { api } from '../../../lib/api';

export default function AiUsageMonitoringPage() {
  const [aggregate, setAggregate] = useState(null);

  useEffect(() => {
    api.get('/admin/ai-usage/aggregate').then(({ data }) => setAggregate(data.data));
  }, []);

  if (!aggregate) return <p className="text-sm text-gray-500">Loading…</p>;

  return (
    <div>
      <h1 className="text-lg font-semibold mb-4">AI Usage Monitoring</h1>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-gray-100">
          <p className="text-xs text-gray-500 mb-1">Requests Today</p>
          <p className="text-xl font-semibold">{aggregate.totalRequestsToday}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100">
          <p className="text-xs text-gray-500 mb-1">Error Rate</p>
          <p className="text-xl font-semibold">{aggregate.errorRate}%</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 mb-6">
        <h3 className="font-semibold p-4 border-b border-gray-100">Cost per Tool</h3>
        <div className="divide-y">
          {aggregate.costPerTool.map((t) => (
            <div key={t.toolType} className="flex justify-between p-4 text-sm">
              <span className="capitalize">{t.toolType.replace('_', ' ')}</span>
              <span>₹{t.totalCostInr.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100">
        <h3 className="font-semibold p-4 border-b border-gray-100">Top Users by Usage</h3>
        <div className="divide-y">
          {aggregate.topUsersByUsage.map((u) => (
            <div key={u.userId} className="flex justify-between p-4 text-sm">
              <span className="text-gray-500">{u.userId.slice(0, 8)}…</span>
              <span>{u._count} requests · ₹{(u._sum.costInr ?? 0).toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
