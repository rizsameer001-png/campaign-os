import { useEffect, useState } from 'react';
import { api } from '../../../lib/api';
import FormField, { inputClasses } from '../../../components/common/FormField';
import Button from '../../../components/common/Button';

export default function ProfileSettingsPage() {
  const [profile, setProfile] = useState(null);
  const [completion, setCompletion] = useState(0);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    api.get('/auth/me').then(({ data }) => setProfile(data.data));
    api.get('/candidate/me/completion').then(({ data }) => setCompletion(data.data.percent));
  }, []);

  if (!profile) return <p className="text-sm text-gray-500">Loading profile…</p>;

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const { data } = await api.put('/candidate/me', {
        name: profile.name,
        bio: profile.bio,
      });
      setProfile((p) => ({ ...p, ...data.data }));
      setMessage('Profile updated.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-lg font-semibold mb-1">Profile</h1>
      <p className="text-sm text-gray-500 mb-4">Profile completion: {completion}%</p>
      <div className="h-2 bg-gray-200 rounded-full mb-6 overflow-hidden">
        <div className="h-full bg-brand-600" style={{ width: `${completion}%` }} />
      </div>

      {message && <p className="mb-4 text-sm text-green-600">{message}</p>}

      <form onSubmit={handleSave} className="bg-white p-6 rounded-xl border border-gray-100">
        <FormField label="Name">
          <input
            className={inputClasses(false)}
            value={profile.name || ''}
            onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
          />
        </FormField>

        <FormField label="Bio" hint="Shown on your public candidate profile">
          <textarea
            className={inputClasses(false)}
            rows={4}
            value={profile.bio || ''}
            onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))}
          />
        </FormField>

        <FormField label="Email">
          <input className={inputClasses(false)} value={profile.email} disabled />
        </FormField>
        <p className="text-xs text-gray-500 -mt-3 mb-4">
          Changing email requires OTP verification — use the email change flow separately.
        </p>

        <Button type="submit" loading={saving}>
          Save changes
        </Button>
      </form>
    </div>
  );
}
