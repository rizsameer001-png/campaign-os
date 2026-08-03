import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../../lib/api';
import FormField, { inputClasses } from '../../../components/common/FormField';
import Button from '../../../components/common/Button';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';
  const [form, setForm] = useState({ newPassword: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, ...form });
      navigate('/login', { state: { justReset: true } });
    } catch (err) {
      setError(err.response?.data?.message || 'Reset failed. The link may have expired.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 w-full max-w-sm">
        <h1 className="text-xl font-semibold mb-6 text-center">Set a new password</h1>
        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
        <form onSubmit={handleSubmit}>
          <FormField label="New Password">
            <input
              type="password"
              className={inputClasses(false)}
              value={form.newPassword}
              onChange={(e) => setForm((f) => ({ ...f, newPassword: e.target.value }))}
              required
            />
          </FormField>
          <FormField label="Confirm Password">
            <input
              type="password"
              className={inputClasses(false)}
              value={form.confirmPassword}
              onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
              required
            />
          </FormField>
          <Button type="submit" loading={loading} className="w-full">
            Reset password
          </Button>
        </form>
      </div>
    </div>
  );
}
