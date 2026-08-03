import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { api } from '../../../lib/api';
import { useAuthStore } from '../../../store/authStore';

export default function CandidateDashboardPage() {
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState({ items: [], unreadCount: 0 });

  useEffect(() => {
    api.get('/notifications').then(({ data }) => setNotifications(data.data));
  }, []);

  return (
    <div>
      <h1 className="text-lg font-semibold mb-1">Welcome back, {user?.name}</h1>
      <p className="text-sm text-gray-500 mb-6">
        Booth coverage and sentiment widgets land here in Part 3 —
        Readiness, Constituency, and AI tools are live now.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-100">
          <p className="text-xs text-gray-500 mb-1">Unread notifications</p>
          <p className="text-2xl font-semibold">{notifications.unreadCount}</p>
        </div>
        <Link to="/readiness" className="bg-white p-5 rounded-xl border border-gray-100 hover:border-brand-300">
          <p className="text-xs text-gray-500 mb-1">Readiness Engine</p>
          <p className="text-sm font-medium text-brand-600">Calculate your score →</p>
        </Link>
        <Link to="/campaign-planner/new" className="bg-white p-5 rounded-xl border border-gray-100 hover:border-brand-300">
          <p className="text-xs text-gray-500 mb-1">Campaign Planner</p>
          <p className="text-sm font-medium text-brand-600">Generate a plan →</p>
        </Link>
      </div>

      {notifications.items.length > 0 && (
        <div className="mt-6 bg-white rounded-xl border border-gray-100 divide-y">
          {notifications.items.map((n) => (
            <div key={n.id} className="p-4 text-sm">
              <p className="font-medium">{n.title}</p>
              <p className="text-gray-500">{n.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
