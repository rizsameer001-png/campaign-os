import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../../../lib/api';
import FormField, { inputClasses } from '../../../components/common/FormField';
import Button from '../../../components/common/Button';

export default function VerifyOtpPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  if (!state?.userId) {
    navigate('/register');
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/verify-otp', { userId: state.userId, otp });
      navigate('/login', { state: { justVerified: true } });
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setResending(true);
    try {
      await api.post('/auth/resend-otp', { userId: state.userId });
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 w-full max-w-sm">
        <h1 className="text-xl font-semibold mb-2 text-center">Verify your phone</h1>
        <p className="text-sm text-gray-500 text-center mb-6">Enter the 6-digit code we sent via SMS.</p>

        <form onSubmit={handleSubmit}>
          <FormField label="OTP Code" error={error}>
            <input
              className={inputClasses(error)}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              maxLength={6}
              required
            />
          </FormField>
          <Button type="submit" loading={loading} className="w-full mb-3">
            Verify
          </Button>
        </form>

        <Button variant="ghost" className="w-full" onClick={handleResend} loading={resending}>
          Resend code
        </Button>
      </div>
    </div>
  );
}
