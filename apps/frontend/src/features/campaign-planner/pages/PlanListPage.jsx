import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../../lib/api';
import Button from '../../../components/common/Button';

export default function PlanListPage() {
  const [plans, setPlans] = useState([]);

  useEffect(() => {
    api.get('/ai/campaign-plans').then(({ data }) => setPlans(data.data));
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold">Campaign Plans</h1>
        <Link to="/campaign-planner/new"><Button>New Plan</Button></Link>
      </div>

      {plans.length === 0 ? (
        <p className="text-sm text-gray-500">No campaign plans yet.</p>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 divide-y">
          {plans.map((p) => (
            <Link key={p.id} to={`/campaign-planner/${p.id}`} className="flex items-center justify-between p-4 hover:bg-gray-50">
              <div>
                <p className="text-sm font-medium">{p.title}</p>
                <p className="text-xs text-gray-500">{p.constituency}, {p.state}</p>
              </div>
              <span className="text-xs text-gray-400 capitalize">{p.status}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
