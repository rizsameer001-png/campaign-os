import { useState } from 'react';
import { api } from '../../../lib/api';
import FormField, { inputClasses } from '../../../components/common/FormField';
import Button from '../../../components/common/Button';

const INITIAL = {
  state: '',
  constituency: '',
  electionType: 'assembly',
  budget: '',
  party: 'Independent',
  socialMediaScore: 5,
  volunteerCount: '',
  pastVictory: false,
  pastVictoryDetails: '',
};

export default function ReadinessForm({ onCalculated }) {
  const [form, setForm] = useState(INITIAL);
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
      const { data } = await api.post('/readiness/calculate', {
        ...form,
        budget: Number(form.budget),
        socialMediaScore: Number(form.socialMediaScore),
        volunteerCount: Number(form.volunteerCount),
      });
      onCalculated(data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not calculate readiness score');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-gray-100 max-w-xl">
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <div className="grid grid-cols-2 gap-3">
        <FormField label="State">
          <input className={inputClasses(false)} value={form.state} onChange={(e) => update('state', e.target.value)} required />
        </FormField>
        <FormField label="Constituency">
          <input className={inputClasses(false)} value={form.constituency} onChange={(e) => update('constituency', e.target.value)} required />
        </FormField>
      </div>

      <FormField label="Election Type">
        <select className={inputClasses(false)} value={form.electionType} onChange={(e) => update('electionType', e.target.value)}>
          <option value="assembly">Assembly</option>
          <option value="general">General</option>
          <option value="local">Local</option>
        </select>
      </FormField>

      <FormField label="Budget (INR)" hint="e.g. 5000000 for ₹50 lakh">
        <input type="number" className={inputClasses(false)} value={form.budget} onChange={(e) => update('budget', e.target.value)} required min="0" />
      </FormField>

      <FormField label="Party / Independent">
        <input className={inputClasses(false)} value={form.party} onChange={(e) => update('party', e.target.value)} />
      </FormField>

      <FormField label={`Social Media Presence: ${form.socialMediaScore}/10`}>
        <input
          type="range"
          min="1"
          max="10"
          className="w-full"
          value={form.socialMediaScore}
          onChange={(e) => update('socialMediaScore', e.target.value)}
        />
      </FormField>

      <FormField label="Volunteer Count">
        <input type="number" className={inputClasses(false)} value={form.volunteerCount} onChange={(e) => update('volunteerCount', e.target.value)} required min="0" />
      </FormField>

      <label className="flex items-center gap-2 text-sm text-gray-600 mb-4">
        <input type="checkbox" checked={form.pastVictory} onChange={(e) => update('pastVictory', e.target.checked)} />
        Won a previous election
      </label>

      {form.pastVictory && (
        <FormField label="Past Victory Details">
          <textarea className={inputClasses(false)} rows={2} value={form.pastVictoryDetails} onChange={(e) => update('pastVictoryDetails', e.target.value)} />
        </FormField>
      )}

      <Button type="submit" loading={loading} className="w-full">
        Calculate Readiness Score
      </Button>
    </form>
  );
}
