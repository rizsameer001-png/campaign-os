import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../../lib/api';
import { useAuthStore } from '../../../store/authStore';
import FormField, { inputClasses } from '../../../components/common/FormField';
import Button from '../../../components/common/Button';

export default function LoginForm() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const [form, setForm] = useState({ email: '', password: '', rememberMe: false });
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
      const { data } = await api.post('/auth/login', form);
      setSession({ accessToken: data.data.accessToken, user: data.data.user });
      navigate('/dashboard');
    } catch (err) {
      const res = err.response?.data;
      if (res?.errors?.length) {
        const fieldErrors = {};
        res.errors.forEach((e) => (fieldErrors[e.field] = e.message));
        setErrors(fieldErrors);
      } else {
        setFormError(res?.message || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm">
      {formError && <p className="mb-4 text-sm text-red-600">{formError}</p>}

      <FormField label="Email" error={errors.email}>
        <input
          type="email"
          className={inputClasses(errors.email)}
          value={form.email}
          onChange={(e) => update('email', e.target.value)}
          required
        />
      </FormField>

      <FormField label="Password" error={errors.password}>
        <input
          type="password"
          className={inputClasses(errors.password)}
          value={form.password}
          onChange={(e) => update('password', e.target.value)}
          required
        />
      </FormField>

      <label className="flex items-center gap-2 text-sm text-gray-600 mb-4">
        <input
          type="checkbox"
          checked={form.rememberMe}
          onChange={(e) => update('rememberMe', e.target.checked)}
        />
        Remember me for 30 days
      </label>

      <Button type="submit" loading={loading} className="w-full">
        Log in
      </Button>

      <div className="mt-4 flex justify-between text-sm">
        <Link to="/forgot-password" className="text-brand-600 hover:underline">
          Forgot password?
        </Link>
        <Link to="/register" className="text-brand-600 hover:underline">
          Create an account
        </Link>
      </div>
    </form>
  );
}
