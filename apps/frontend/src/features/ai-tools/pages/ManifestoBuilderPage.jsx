import { useState } from 'react';
import { api } from '../../../lib/api';
import FormField, { inputClasses } from '../../../components/common/FormField';
import Button from '../../../components/common/Button';

export default function ManifestoBuilderPage() {
  const [form, setForm] = useState({ constituencyName: '', state: '', keyIssuesText: '', partyIdeology: '', targetDemographics: '' });
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
      const keyIssues = form.keyIssuesText.split(',').map((s) => s.trim()).filter(Boolean);
      const { data } = await api.post('/ai/manifesto', { ...form, keyIssues });
      setResult(data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not generate manifesto');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-lg font-semibold mb-4">AI Manifesto Builder</h1>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-gray-100 mb-6">
        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Constituency (optional)">
            <input className={inputClasses(false)} value={form.constituencyName} onChange={(e) => update('constituencyName', e.target.value)} />
          </FormField>
          <FormField label="State (optional)">
            <input className={inputClasses(false)} value={form.state} onChange={(e) => update('state', e.target.value)} />
          </FormField>
        </div>

        <FormField label="Key Issues" hint="Comma-separated, e.g. water supply, road infrastructure, jobs">
          <input className={inputClasses(false)} value={form.keyIssuesText} onChange={(e) => update('keyIssuesText', e.target.value)} required />
        </FormField>

        <FormField label="Party Ideology (optional)">
          <input className={inputClasses(false)} value={form.partyIdeology} onChange={(e) => update('partyIdeology', e.target.value)} />
        </FormField>

        <FormField label="Target Demographics (optional)">
          <input className={inputClasses(false)} value={form.targetDemographics} onChange={(e) => update('targetDemographics', e.target.value)} />
        </FormField>

        <Button type="submit" loading={loading} className="w-full">Generate Manifesto</Button>
      </form>

      {result && (
        <div className="space-y-4">
          {result.sections.map((section, i) => (
            <div key={i} className="bg-white p-5 rounded-xl border border-gray-100">
              <h3 className="font-semibold mb-2">{section.title}</h3>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{section.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
