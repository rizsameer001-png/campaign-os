import { useEffect, useState } from 'react';
import { api } from '../../../lib/api';

export default function CampaignMonitoringPage() {
  const [campaigns, setCampaigns] = useState([]);
  const [flags, setFlags] = useState([]);

  useEffect(() => {
    api.get('/admin/campaigns').then(({ data }) => setCampaigns(data.data));
    api.get('/admin/campaigns/flags/list').then(({ data }) => setFlags(data.data));
  }, []);

  return (
    <div>
      <h1 className="text-lg font-semibold mb-4">Campaign Monitoring</h1>

      {flags.length > 0 && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm">
          <p className="font-medium text-yellow-800 mb-1">{flags.length} campaign(s) flagged</p>
          {flags.map((f) => (
            <p key={f.candidateId} className="text-yellow-700 text-xs">{f.candidateName}: {f.flags.join(', ')}</p>
          ))}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 divide-y">
        {campaigns.map((c) => (
          <div key={c.candidateId} className="flex items-center justify-between p-4 text-sm">
            <div>
              <p className="font-medium">{c.candidateName}</p>
              <p className="text-xs text-gray-500">{c.constituency}, {c.state}</p>
            </div>
            <div className="flex gap-4 text-xs text-gray-600">
              <span>Readiness: {c.readinessScore ?? '—'}</span>
              <span>Volunteers: {c.volunteerCount}</span>
              <span>Coverage: {c.boothCoverage ?? '—'}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
