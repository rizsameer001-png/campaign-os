import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../lib/api';
import Button from '../common/Button';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', roles: ['candidate', 'volunteer'] },
  { to: '/readiness', label: 'Readiness Engine', roles: ['candidate'] },
  { to: '/constituency', label: 'Constituency Intel', roles: ['candidate', 'volunteer'] },
  { to: '/campaign-planner', label: 'Campaign Planner', roles: ['candidate'] },
  { to: '/ai-tools', label: 'AI Tools Hub', roles: ['candidate'] },
  { to: '/command-center', label: 'Command Center', roles: ['candidate'] },
  { to: '/volunteers', label: 'Volunteers', roles: ['candidate'] },
  { to: '/tasks', label: 'Tasks', roles: ['candidate', 'volunteer'] },
  { to: '/booths', label: 'Booth Coverage', roles: ['candidate'] },
  { to: '/field-actions', label: 'Field Actions', roles: ['volunteer'] },
  { to: '/profile', label: 'Profile', roles: ['candidate', 'volunteer'] },
];

export default function DashboardShell() {
  const { user, clearSession } = useAuthStore();
  const navigate = useNavigate();
  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(user?.role));

  async function handleLogout() {
    try {
      await api.post('/auth/logout');
    } finally {
      clearSession();
      navigate('/login');
    }
  }

  return (
    <div className="min-h-screen flex">
      <aside className="w-60 bg-white border-r border-gray-200 flex flex-col">
        <div className="px-4 py-5 font-semibold text-brand-700">Campaign OS</div>
        <nav className="flex-1 px-2 space-y-1">
          {visibleItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="block rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-brand-50 hover:text-brand-700"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 mb-2">{user?.name}</p>
          <Button variant="secondary" className="w-full" onClick={handleLogout}>
            Log out
          </Button>
        </div>
      </aside>
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}
