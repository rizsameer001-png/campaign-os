import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../../lib/api';
import Button from '../../../components/common/Button';

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  inactive: 'bg-gray-100 text-gray-500',
};

export default function VolunteerListPage() {
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const { data } = await api.get('/volunteers');
    setVolunteers(data.data);
    setLoading(false);
  }

  async function handleReview(id, decision) {
    await api.put(`/volunteers/${id}/review`, { decision });
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold">Volunteers</h1>
        <Link to="/volunteers/invite"><Button>Invite Volunteer</Button></Link>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : volunteers.length === 0 ? (
        <p className="text-sm text-gray-500">No volunteers yet.</p>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 divide-y">
          {volunteers.map((v) => (
            <div key={v.id} className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm font-medium">{v.name}</p>
                <p className="text-xs text-gray-500">{v.email} · Booth: {v.assignedBooth || '—'}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs rounded-full px-2 py-1 ${STATUS_COLORS[v.status]}`}>{v.status}</span>
                {v.status === 'pending' && (
                  <>
                    <Button variant="secondary" onClick={() => handleReview(v.id, 'approve')}>Approve</Button>
                    <Button variant="danger" onClick={() => handleReview(v.id, 'reject')}>Reject</Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
