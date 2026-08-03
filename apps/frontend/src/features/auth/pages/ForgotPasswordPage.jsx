import { useState } from 'react';
import { api } from '../../../lib/api';
import FormField, { inputClasses } from '../../../components/common/FormField';
import Button from '../../../components/common/Button';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
    } finally {
      setLoading(false);
      setSubmitted(true); // always show the same state — don't leak whether the email exists
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 w-full max-w-sm">
        <h1 className="text-xl font-semibold mb-6 text-center">Reset your password</h1>
        {submitted ? (
          <p className="text-sm text-gray-600 text-center">
            If that email exists, a reset link has been sent. Check your inbox.
          </p>
        ) : (
          <form onSubmit={handleSubmit}>
            <FormField label="Email">
              <input
                type="email"
                className={inputClasses(false)}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </FormField>
            <Button type="submit" loading={loading} className="w-full">
              Send reset link
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
