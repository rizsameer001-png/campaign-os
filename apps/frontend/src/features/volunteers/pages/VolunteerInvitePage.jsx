import { useState } from 'react';
import { api } from '../../../lib/api';
import FormField, { inputClasses } from '../../../components/common/FormField';
import Button from '../../../components/common/Button';

export default function VolunteerInvitePage() {
  const [email, setEmail] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/volunteers/invite', { email });
      setResult(data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not send invitation');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md">
      <h1 className="text-lg font-semibold mb-4">Invite a Volunteer</h1>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-gray-100">
        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
        <FormField label="Volunteer's Email">
          <input type="email" className={inputClasses(false)} value={email} onChange={(e) => setEmail(e.target.value)} required />
        </FormField>
        <Button type="submit" loading={loading} className="w-full">Send Invitation</Button>
      </form>

      {result && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg text-xs text-gray-600 break-all">
          <p className="font-medium mb-1">Dev note: since no SMTP is configured, here's the invite link directly:</p>
          {window.location.origin}/volunteer-signup?token={result.token}
        </div>
      )}
    </div>
  );
}
