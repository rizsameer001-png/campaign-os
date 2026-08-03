import { useState } from 'react';
import { api } from '../../../lib/api';
import FormField, { inputClasses } from '../../../components/common/FormField';
import Button from '../../../components/common/Button';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/public/contact', form);
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 w-full max-w-md">
        <h1 className="text-xl font-semibold mb-6">Contact Us</h1>
        {submitted ? (
          <p className="text-sm text-green-600">Thanks — we'll be in touch soon.</p>
        ) : (
          <form onSubmit={handleSubmit}>
            <FormField label="Name">
              <input className={inputClasses(false)} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
            </FormField>
            <FormField label="Email">
              <input type="email" className={inputClasses(false)} value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required />
            </FormField>
            <FormField label="Message">
              <textarea className={inputClasses(false)} rows={4} value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} required />
            </FormField>
            <Button type="submit" loading={loading} className="w-full">Send</Button>
          </form>
        )}
      </div>
    </div>
  );
}
