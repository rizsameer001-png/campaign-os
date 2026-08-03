import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../../../lib/api';
import FormField, { inputClasses } from '../../../components/common/FormField';
import Button from '../../../components/common/Button';

export default function VolunteerSignupPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';
  const [form, setForm] = useState({ name: '', phone: '', password: '', address: '', assignedBooth: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/volunteers/signup', { token, ...form });
      navigate('/login', { state: { justSignedUp: true } });
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed. The invite link may be invalid or expired.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 w-full max-w-sm">
        <h1 className="text-xl font-semibold mb-6 text-center">Join as a Volunteer</h1>
        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
        <form onSubmit={handleSubmit}>
          <FormField label="Full Name">
            <input className={inputClasses(false)} value={form.name} onChange={(e) => update('name', e.target.value)} required />
          </FormField>
          <FormField label="Phone">
            <input className={inputClasses(false)} value={form.phone} onChange={(e) => update('phone', e.target.value)} required />
          </FormField>
          <FormField label="Password">
            <input type="password" className={inputClasses(false)} value={form.password} onChange={(e) => update('password', e.target.value)} required />
          </FormField>
          <FormField label="Address (optional)">
            <input className={inputClasses(false)} value={form.address} onChange={(e) => update('address', e.target.value)} />
          </FormField>
          <FormField label="Preferred Booth (optional)">
            <input className={inputClasses(false)} value={form.assignedBooth} onChange={(e) => update('assignedBooth', e.target.value)} />
          </FormField>
          <Button type="submit" loading={loading} className="w-full">Sign Up</Button>
        </form>
      </div>
    </div>
  );
}
