import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../lib/api';
import FormField, { inputClasses } from '../../../components/common/FormField';
import Button from '../../../components/common/Button';

const INITIAL = { title: '', budget: '', electionType: 'assembly', state: '', constituency: '', daysUntilElection: '', targetVoterSegment: '' };

export default function PlanGeneratorPage() {
  const navigate = useNavigate();
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
      const { data } = await api.post('/ai/campaign-plans', {
        ...form,
        budget: Number(form.budget),
        daysUntilElection: Number(form.daysUntilElection),
      });
      navigate(`/campaign-planner/${data.data.id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not generate plan');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-lg font-semibold mb-4">AI Campaign Planner</h1>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-gray-100">
        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

        <FormField label="Plan Title (optional)">
          <input className={inputClasses(false)} value={form.title} onChange={(e) => update('title', e.target.value)} />
        </FormField>

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

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Budget (INR)">
            <input type="number" className={inputClasses(false)} value={form.budget} onChange={(e) => update('budget', e.target.value)} required min="0" />
          </FormField>
          <FormField label="Days Until Election">
            <input type="number" className={inputClasses(false)} value={form.daysUntilElection} onChange={(e) => update('daysUntilElection', e.target.value)} required min="1" />
          </FormField>
        </div>

        <FormField label="Target Voter Segment (optional)">
          <input className={inputClasses(false)} value={form.targetVoterSegment} onChange={(e) => update('targetVoterSegment', e.target.value)} />
        </FormField>

        <Button type="submit" loading={loading} className="w-full">
          Generate Plan
        </Button>
      </form>
    </div>
  );
}
