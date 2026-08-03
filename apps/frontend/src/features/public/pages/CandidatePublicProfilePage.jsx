import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../../lib/api';
import Button from '../../../components/common/Button';

export default function CandidatePublicProfilePage() {
  const { slug } = useParams();
  const [profile, setProfile] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [supportEmail, setSupportEmail] = useState('');
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    api.get(`/public/candidate/${slug}`).then(({ data }) => {
      if (!data.data) setNotFound(true);
      else setProfile(data.data);
    });
  }, [slug]);

  async function handleSupport(e) {
    e.preventDefault();
    await api.post(`/public/candidate/${slug}/support`, { email: supportEmail });
    setSupported(true);
  }

  if (notFound) return <p className="text-center mt-20 text-gray-500">This profile isn't public.</p>;
  if (!profile) return <p className="text-center mt-20 text-gray-500">Loading…</p>;

  return (
    <div className="max-w-2xl mx-auto py-16 px-4">
      <div className="flex items-center gap-4 mb-6">
        {profile.profilePhotoUrl && <img src={profile.profilePhotoUrl} alt={profile.name} className="w-20 h-20 rounded-full object-cover" />}
        <div>
          <h1 className="text-xl font-semibold">{profile.name}</h1>
          <p className="text-sm text-gray-500">{profile.constituencyName}, {profile.state} · {profile.party}</p>
        </div>
      </div>

      {profile.bio && <p className="text-gray-700 mb-6">{profile.bio}</p>}

      {profile.manifestoSummary && (
        <div className="bg-gray-50 p-4 rounded-xl mb-6">
          <h3 className="text-sm font-semibold mb-2">Vision</h3>
          <p className="text-sm text-gray-600">{profile.manifestoSummary}</p>
        </div>
      )}

      {supported ? (
        <p className="text-sm text-green-600">Thanks for your support!</p>
      ) : (
        <form onSubmit={handleSupport} className="flex gap-2">
          <input
            type="email"
            placeholder="Your email"
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
            value={supportEmail}
            onChange={(e) => setSupportEmail(e.target.value)}
            required
          />
          <Button type="submit">Support</Button>
        </form>
      )}
    </div>
  );
}
