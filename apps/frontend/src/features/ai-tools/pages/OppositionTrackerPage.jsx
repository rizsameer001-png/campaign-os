import { useState } from 'react';
import { api } from '../../../lib/api';
import FormField, { inputClasses } from '../../../components/common/FormField';
import Button from '../../../components/common/Button';

export default function OppositionTrackerPage() {
  const [form, setForm] = useState({ opponentName: '', publicStatements: '', ownPositions: '' });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/ai/opposition', form);
      setResult(data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not generate analysis');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-lg font-semibold mb-1">Opposition Tracker</h1>
      <p className="text-sm text-gray-500 mb-4">
        Paste in publicly available statements or news excerpts about your opponent — this tool doesn't scrape automatically.
      </p>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-gray-100 mb-6">
        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

        <FormField label="Opponent Name">
          <input className={inputClasses(false)} value={form.opponentName} onChange={(e) => update('opponentName', e.target.value)} required />
        </FormField>

        <FormField label="Public Statements / News Excerpts">
          <textarea className={inputClasses(false)} rows={5} value={form.publicStatements} onChange={(e) => update('publicStatements', e.target.value)} required />
        </FormField>

        <FormField label="Your Own Positions (optional, for comparison)">
          <textarea className={inputClasses(false)} rows={3} value={form.ownPositions} onChange={(e) => update('ownPositions', e.target.value)} />
        </FormField>

        <Button type="submit" loading={loading} className="w-full">Analyze</Button>
      </form>

      {result && (
        <div className="bg-white p-5 rounded-xl border border-gray-100 whitespace-pre-wrap text-sm">
          {result.analysis}
        </div>
      )}
    </div>
  );
}
