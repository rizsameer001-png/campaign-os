import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../store/authStore';
import { api } from '../../../lib/api';
import  Button  from "../../../components/common/Button";
//aman
const ADMIN_NAV = [
  { to: '/admin', label: 'Dashboard' },
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/campaigns', label: 'Campaigns' },
  { to: '/admin/leads', label: 'Leads' },
  { to: '/admin/ai-usage', label: 'AI Usage' },
  { to: '/admin/audit-log', label: 'Audit Log' },
];

export default function AdminShell() {
  const { user, clearSession } = useAuthStore();
  const navigate = useNavigate();

  async function handleLogout() {
    try { await api.post('/auth/logout'); } finally { clearSession(); navigate('/login'); }
  }

  return (
    <div className="min-h-screen flex">
      <aside className="w-60 bg-gray-900 text-white flex flex-col">
        <div className="px-4 py-5 font-semibold">Admin Panel</div>
        <nav className="flex-1 px-2 space-y-1">
          {ADMIN_NAV.map((item) => (
            <Link key={item.to} to={item.to} className="block rounded-lg px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-800">
          <p className="text-xs text-gray-400 mb-2">{user?.name} ({user?.role})</p>
          <Button variant="secondary" className="w-full" onClick={handleLogout}>Log out</Button>
        </div>
      </aside>
      <main className="flex-1 p-6 bg-gray-50">
        <Outlet />
      </main>
    </div>
  );
}
