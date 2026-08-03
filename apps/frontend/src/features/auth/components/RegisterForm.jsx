import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../../lib/api';
import FormField, { inputClasses } from '../../../components/common/FormField';
import Button from '../../../components/common/Button';

const INITIAL_FORM = {
  name: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  state: '',
  constituency: '',
  party: 'Independent',
  acceptedTerms: false,
};

export default function RegisterForm() {
  const navigate = useNavigate();
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');
    setErrors({});
    setLoading(true);
    try {
      // AUTH-C-008: recaptchaToken would come from a mounted reCAPTCHA v3
      // widget in production (components/forms/RecaptchaWrapper.jsx).
      const payload = { ...form, recaptchaToken: 'dev-placeholder-token' };
      const { data } = await api.post('/auth/register', payload);
      navigate('/verify-otp', { state: { userId: data.data.userId } });
    } catch (err) {
      const res = err.response?.data;
      if (res?.errors?.length) {
        const fieldErrors = {};
        res.errors.forEach((e) => (fieldErrors[e.field] = e.message));
        setErrors(fieldErrors);
      } else {
        setFormError(res?.message || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md">
      {formError && <p className="mb-4 text-sm text-red-600">{formError}</p>}

      <FormField label="Full Name" error={errors.name}>
        <input className={inputClasses(errors.name)} value={form.name} onChange={(e) => update('name', e.target.value)} required />
      </FormField>

      <FormField label="Email" error={errors.email}>
        <input type="email" className={inputClasses(errors.email)} value={form.email} onChange={(e) => update('email', e.target.value)} required />
      </FormField>

      <FormField label="Phone" error={errors.phone} hint="Used for OTP verification">
        <input className={inputClasses(errors.phone)} value={form.phone} onChange={(e) => update('phone', e.target.value)} required />
      </FormField>

      <div className="grid grid-cols-2 gap-3">
        <FormField label="State" error={errors.state}>
          <input className={inputClasses(errors.state)} value={form.state} onChange={(e) => update('state', e.target.value)} required />
        </FormField>
        <FormField label="Constituency" error={errors.constituency}>
          <input className={inputClasses(errors.constituency)} value={form.constituency} onChange={(e) => update('constituency', e.target.value)} required />
        </FormField>
      </div>

      <FormField label="Party Affiliation" error={errors.party}>
        <input className={inputClasses(errors.party)} value={form.party} onChange={(e) => update('party', e.target.value)} placeholder="Independent" />
      </FormField>

      <FormField label="Password" error={errors.password} hint="8+ chars, upper, lower, number, special character">
        <input type="password" className={inputClasses(errors.password)} value={form.password} onChange={(e) => update('password', e.target.value)} required />
      </FormField>

      <FormField label="Confirm Password" error={errors.confirmPassword}>
        <input type="password" className={inputClasses(errors.confirmPassword)} value={form.confirmPassword} onChange={(e) => update('confirmPassword', e.target.value)} required />
      </FormField>

      <label className="flex items-start gap-2 text-sm text-gray-600 mb-4">
        <input
          type="checkbox"
          className="mt-1"
          checked={form.acceptedTerms}
          onChange={(e) => update('acceptedTerms', e.target.checked)}
        />
        <span>
          I accept the Terms of Service and Privacy Policy
          {errors.acceptedTerms && <span className="block text-xs text-red-600">{errors.acceptedTerms}</span>}
        </span>
      </label>

      <Button type="submit" loading={loading} className="w-full">
        Create account
      </Button>

      <p className="mt-4 text-sm text-center">
        Already have an account?{' '}
        <Link to="/login" className="text-brand-600 hover:underline">
          Log in
        </Link>
      </p>
    </form>
  );
}
