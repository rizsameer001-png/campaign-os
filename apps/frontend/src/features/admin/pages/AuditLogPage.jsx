import { useEffect, useState } from 'react';
import { api } from '../../../lib/api';

export default function AuditLogPage() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    api.get('/admin/audit-logs').then(({ data }) => setLogs(data.data));
  }, []);

  return (
    <div>
      <h1 className="text-lg font-semibold mb-4">Audit Log</h1>
      <div className="bg-white rounded-xl border border-gray-100 divide-y">
        {logs.map((log) => (
          <div key={log.id} className="p-4 text-sm">
            <div className="flex justify-between">
              <span className="font-medium">{log.action}</span>
              <span className="text-xs text-gray-400">{new Date(log.createdAt).toLocaleString()}</span>
            </div>
            <p className="text-xs text-gray-500">
              {log.user?.name ?? 'System'} · {log.entityType} {log.entityId ? `#${log.entityId.slice(0, 8)}` : ''}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
