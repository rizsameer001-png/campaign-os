import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../../lib/api';

export default function ReadinessHistoryPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/readiness/reports').then(({ data }) => setReports(data.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-gray-500">Loading…</p>;

  return (
    <div>
      <h1 className="text-lg font-semibold mb-4">My Readiness Reports</h1>
      {reports.length === 0 ? (
        <p className="text-sm text-gray-500">No reports yet. Run the Readiness Engine to generate one.</p>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 divide-y">
          {reports.map((r) => (
            <Link key={r.id} to={`/readiness/reports/${r.id}`} className="flex items-center justify-between p-4 hover:bg-gray-50">
              <div>
                <p className="text-sm font-medium">{r.input?.constituency}, {r.input?.state}</p>
                <p className="text-xs text-gray-500">{new Date(r.createdAt).toLocaleDateString()}</p>
              </div>
              <span className="text-lg font-semibold text-brand-600">{r.overallScore}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
