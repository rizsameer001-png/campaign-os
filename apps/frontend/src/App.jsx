import { useEffect, useState } from 'react';
import AppRouter from './routes/AppRouter';
import { api } from './lib/api';
import { useAuthStore } from './store/authStore';

export default function App() {
  const setSession = useAuthStore((s) => s.setSession);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Silent session restore: if a valid httpOnly refresh cookie exists,
    // this issues a fresh access token without the user re-entering credentials.
    api
      .post('/auth/refresh')
      .then(({ data }) => setSession({ accessToken: data.data.accessToken, user: data.data.user }))
      .catch(() => {})
      .finally(() => setChecking(false));
  }, [setSession]);

  if (checking) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-gray-500">Loading…</div>;
  }

  return <AppRouter />;
}
