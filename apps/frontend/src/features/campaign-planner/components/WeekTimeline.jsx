const STATUS_STYLES = {
  pending: 'bg-gray-100 text-gray-600',
  in_progress: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-green-100 text-green-700',
};

const CATEGORY_LABELS = { digital: 'Digital', ground: 'Ground', milestone: 'Milestone', custom: 'Custom' };

export default function WeekTimeline({ weeks, onToggleStatus }) {
  return (
    <div className="space-y-4">
      {weeks.map((week) => (
        <div key={week.weekNumber} className="bg-white p-5 rounded-xl border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Week {week.weekNumber}: {week.theme}</h3>
            <span className="text-xs text-gray-500">
              ₹{week.budgetAllocation?.digital + week.budgetAllocation?.ground + week.budgetAllocation?.events + week.budgetAllocation?.miscellaneous}
            </span>
          </div>
          <div className="space-y-2">
            {week.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 w-16">{CATEGORY_LABELS[item.category]}</span>
                  <span>{item.title}</span>
                </div>
                <select
                  className={`text-xs rounded-full px-2 py-1 border-0 ${STATUS_STYLES[item.status]}`}
                  value={item.status}
                  onChange={(e) => onToggleStatus(week.weekNumber, item.id, e.target.value)}
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
