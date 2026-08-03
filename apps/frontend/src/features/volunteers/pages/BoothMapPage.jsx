import { useEffect, useState } from 'react';
import { api } from '../../../lib/api';

const STATUS_COLORS = { green: 'bg-green-500', yellow: 'bg-yellow-500', red: 'bg-red-500' };

export default function BoothMapPage() {
  const [booths, setBooths] = useState([]);

  useEffect(() => {
    api.get('/booths/coverage-map').then(({ data }) => setBooths(data.data));
  }, []);

  return (
    <div>
      <h1 className="text-lg font-semibold mb-4">Booth Coverage</h1>
      {booths.length === 0 ? (
        <p className="text-sm text-gray-500">No booths assigned yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {booths.map((b) => (
            <div key={b.boothId} className="bg-white p-4 rounded-xl border border-gray-100 flex items-center gap-3">
              <span className={`w-3 h-3 rounded-full ${STATUS_COLORS[b.status]}`} />
              <div>
                <p className="text-sm font-medium">Booth {b.boothId}</p>
                <p className="text-xs text-gray-500">{b.volunteerCount} volunteer(s)</p>
                <p className="text-xs text-gray-400">
                  {b.lastCheckIn ? `Last check-in: ${new Date(b.lastCheckIn).toLocaleString()}` : 'No check-ins yet'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
