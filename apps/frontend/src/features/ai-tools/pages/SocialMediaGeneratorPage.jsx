import { useState } from 'react';
import { api } from '../../../lib/api';
import FormField, { inputClasses } from '../../../components/common/FormField';
import Button from '../../../components/common/Button';

const INITIAL = { topic: '', platform: 'Twitter/X', tone: 'Inspirational', language: 'Hinglish', variantCount: 2 };

export default function SocialMediaGeneratorPage() {
  const [form, setForm] = useState(INITIAL);
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
      const { data } = await api.post('/ai/social', form);
      setResult(data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not generate posts');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-lg font-semibold mb-4">AI Social Media Generator</h1>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-gray-100 mb-6">
        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

        <FormField label="Topic">
          <input className={inputClasses(false)} value={form.topic} onChange={(e) => update('topic', e.target.value)} required />
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Platform">
            <select className={inputClasses(false)} value={form.platform} onChange={(e) => update('platform', e.target.value)}>
              <option>Twitter/X</option>
              <option>Facebook</option>
              <option>Instagram</option>
              <option>WhatsApp</option>
            </select>
          </FormField>
          <FormField label="Language">
            <select className={inputClasses(false)} value={form.language} onChange={(e) => update('language', e.target.value)}>
              <option>Hindi</option>
              <option>English</option>
              <option>Hinglish</option>
            </select>
          </FormField>
        </div>

        <FormField label="Tone">
          <input className={inputClasses(false)} value={form.tone} onChange={(e) => update('tone', e.target.value)} />
        </FormField>

        <Button type="submit" loading={loading} className="w-full">Generate Posts</Button>
      </form>

      {result && (
        <div className="space-y-3">
          {result.variants.map((v, i) => (
            <div key={i} className="bg-white p-4 rounded-xl border border-gray-100">
              <p className="text-xs text-gray-400 mb-1">Variant {i + 1}</p>
              <p className="text-sm">{v.text}</p>
              {v.hashtags?.length > 0 && (
                <p className="text-xs text-brand-600 mt-2">{v.hashtags.map((h) => `#${h}`).join(' ')}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
