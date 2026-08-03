import { useState } from 'react';
import { api } from '../../../lib/api';
import FormField, { inputClasses } from '../../../components/common/FormField';
import Button from '../../../components/common/Button';
import QuotaMeter from '../components/QuotaMeter';

const INITIAL = { topic: '', audienceType: 'Rally', tone: 'Inspirational', language: 'English', duration: 'medium' };

export default function SpeechGeneratorPage() {
  const [form, setForm] = useState(INITIAL);
  const [result, setResult] = useState(null);
  const [quota, setQuota] = useState(null);
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
      const { data } = await api.post('/ai/speech', form);
      setResult(data.data);
      setQuota({ percentUsed: data.data.quotaWarning ? 85 : 0, spent: 0, quota: 500, warning: data.data.quotaWarning });
    } catch (err) {
      setError(err.response?.data?.message || 'Could not generate speech');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-lg font-semibold mb-4">AI Speech Generator</h1>
      <QuotaMeter quota={quota} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-gray-100">
          {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

          <FormField label="Topic">
            <input className={inputClasses(false)} value={form.topic} onChange={(e) => update('topic', e.target.value)} required />
          </FormField>

          <FormField label="Audience Type">
            <select className={inputClasses(false)} value={form.audienceType} onChange={(e) => update('audienceType', e.target.value)}>
              <option>Rally</option>
              <option>Door-to-door</option>
              <option>Press</option>
            </select>
          </FormField>

          <FormField label="Tone">
            <select className={inputClasses(false)} value={form.tone} onChange={(e) => update('tone', e.target.value)}>
              <option>Aggressive</option>
              <option>Inspirational</option>
              <option>Factual</option>
            </select>
          </FormField>

          <FormField label="Language">
            <select className={inputClasses(false)} value={form.language} onChange={(e) => update('language', e.target.value)}>
              <option>Hindi</option>
              <option>English</option>
              <option>Regional</option>
            </select>
          </FormField>

          <FormField label="Duration">
            <select className={inputClasses(false)} value={form.duration} onChange={(e) => update('duration', e.target.value)}>
              <option value="short">Short</option>
              <option value="medium">Medium</option>
              <option value="long">Long</option>
            </select>
          </FormField>

          <Button type="submit" loading={loading} className="w-full">Generate Speech</Button>
        </form>

        {result && (
          <div className="bg-white p-6 rounded-xl border border-gray-100 whitespace-pre-wrap text-sm">
            {result.content}
          </div>
        )}
      </div>
    </div>
  );
}
