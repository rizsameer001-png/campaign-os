import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../../lib/api';
import Button from '../../../components/common/Button';

export default function LandingPage() {
  const [services, setServices] = useState([]);

  useEffect(() => {
    api.get('/public/services').then(({ data }) => setServices(data.data));
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100 px-6 py-4 flex justify-between items-center">
        <span className="font-semibold text-brand-700">Election Campaign OS</span>
        <div className="flex gap-3">
          <Link to="/login" className="text-sm text-gray-600 hover:text-brand-600">Log in</Link>
          <Link to="/register"><Button>Get Started</Button></Link>
        </div>
      </header>

      <section className="max-w-3xl mx-auto text-center py-20 px-4">
        <h1 className="text-3xl font-bold mb-4">Run a data-driven campaign, end to end</h1>
        <p className="text-gray-600 mb-8">
          Readiness scoring, constituency intelligence, AI campaign planning, and volunteer
          management — built for Indian election campaigns.
        </p>
        <Link to="/register"><Button>Start Your Campaign</Button></Link>
      </section>

      <section className="max-w-5xl mx-auto px-4 pb-20">
        <h2 className="text-xl font-semibold mb-6 text-center">Our Services</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {services.map((s) => (
            <div key={s.id} className="p-5 rounded-xl border border-gray-100">
              <h3 className="font-semibold mb-2">{s.title}</h3>
              <p className="text-sm text-gray-500 mb-3">{s.description}</p>
              <ul className="text-xs text-gray-400 space-y-1">
                {s.features.slice(0, 3).map((f, i) => <li key={i}>• {f}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-gray-100 py-6 text-center text-xs text-gray-400">
        Election Campaign OS
      </footer>
    </div>
  );
}
