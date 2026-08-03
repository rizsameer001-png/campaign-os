import { Link } from 'react-router-dom';

const TOOLS = [
  { to: '/ai-tools/speech', title: 'Speech Generator', description: 'Rally, door-to-door, or press speeches in Hindi, English, or regional language.' },
  { to: '/ai-tools/manifesto', title: 'Manifesto Builder', description: 'Sectioned manifesto drafted from constituency data and key issues.' },
  { to: '/ai-tools/opposition', title: 'Opposition Tracker', description: 'Summarize and compare against opponent public statements you provide.' },
  { to: '/ai-tools/social', title: 'Social Media Generator', description: 'Platform-optimized posts with hashtags, A/B variants.' },
];

export default function AiToolsHubPage() {
  return (
    <div>
      <h1 className="text-lg font-semibold mb-4">AI Tools Hub</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {TOOLS.map((tool) => (
          <Link key={tool.to} to={tool.to} className="bg-white p-5 rounded-xl border border-gray-100 hover:border-brand-300">
            <h3 className="font-semibold mb-1">{tool.title}</h3>
            <p className="text-sm text-gray-500">{tool.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
