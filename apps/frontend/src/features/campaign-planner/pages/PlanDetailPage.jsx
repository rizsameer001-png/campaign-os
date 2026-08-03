import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../../lib/api';
import WeekTimeline from '../components/WeekTimeline';

export default function PlanDetailPage() {
  const { id } = useParams();
  const [plan, setPlan] = useState(null);

  useEffect(() => {
    loadPlan();
  }, [id]);

  async function loadPlan() {
    const { data } = await api.get(`/ai/campaign-plans/${id}`);
    setPlan(data.data);
  }

  async function handleToggleStatus(weekNumber, itemId, status) {
    await api.put(`/ai/campaign-plans/${id}/item`, { weekNumber, itemId, status });
    loadPlan();
  }

  if (!plan) return <p className="text-sm text-gray-500">Loading…</p>;

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-lg font-semibold">{plan.title}</h1>
        <span className="text-sm text-gray-500">{plan.progress}% complete</span>
      </div>
      <p className="text-sm text-gray-500 mb-4">{plan.constituency}, {plan.state} · Budget ₹{Number(plan.budget).toLocaleString()}</p>

      <div className="h-2 bg-gray-100 rounded-full mb-6 overflow-hidden">
        <div className="h-full bg-brand-600" style={{ width: `${plan.progress}%` }} />
      </div>

      <WeekTimeline weeks={plan.planData.weeks} onToggleStatus={handleToggleStatus} />
    </div>
  );
}
