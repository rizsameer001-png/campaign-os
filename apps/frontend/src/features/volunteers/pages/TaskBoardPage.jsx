import { useEffect, useState } from 'react';
import { api } from '../../../lib/api';
import FormField, { inputClasses } from '../../../components/common/FormField';
import Button from '../../../components/common/Button';

const STATUS_STYLES = { pending: 'bg-gray-100 text-gray-600', in_progress: 'bg-yellow-100 text-yellow-700', completed: 'bg-green-100 text-green-700' };

export default function TaskBoardPage() {
  const [tasks, setTasks] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [form, setForm] = useState({ templateKey: '', title: '', volunteerId: '', priority: 'medium' });
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    load();
    api.get('/tasks/templates').then(({ data }) => setTemplates(data.data));
    api.get('/volunteers').then(({ data }) => setVolunteers(data.data));
  }, []);

  async function load() {
    const { data } = await api.get('/tasks');
    setTasks(data.data);
  }

  async function handleCreate(e) {
    e.preventDefault();
    const payload = form.templateKey
      ? { templateKey: form.templateKey, volunteerId: form.volunteerId || undefined, priority: form.priority }
      : { title: form.title, volunteerId: form.volunteerId || undefined, priority: form.priority };
    await api.post('/tasks', payload);
    setShowForm(false);
    setForm({ templateKey: '', title: '', volunteerId: '', priority: 'medium' });
    load();
  }

  async function handleStatusChange(taskId, status) {
    await api.put(`/tasks/${taskId}`, { status });
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold">Tasks</h1>
        <Button onClick={() => setShowForm((s) => !s)}>{showForm ? 'Cancel' : 'New Task'}</Button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white p-5 rounded-xl border border-gray-100 mb-6">
          <FormField label="Template (optional)">
            <select className={inputClasses(false)} value={form.templateKey} onChange={(e) => setForm((f) => ({ ...f, templateKey: e.target.value }))}>
              <option value="">Custom task</option>
              {templates.map((t) => <option key={t.key} value={t.key}>{t.title}</option>)}
            </select>
          </FormField>
          {!form.templateKey && (
            <FormField label="Title">
              <input className={inputClasses(false)} value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required />
            </FormField>
          )}
          <FormField label="Assign to Volunteer (optional)">
            <select className={inputClasses(false)} value={form.volunteerId} onChange={(e) => setForm((f) => ({ ...f, volunteerId: e.target.value }))}>
              <option value="">Unassigned</option>
              {volunteers.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </FormField>
          <Button type="submit">Create Task</Button>
        </form>
      )}

      <div className="bg-white rounded-xl border border-gray-100 divide-y">
        {tasks.map((task) => (
          <div key={task.id} className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium">{task.title}</p>
              <p className="text-xs text-gray-500">{task.volunteer?.name || 'Unassigned'} · {task.priority}</p>
            </div>
            <select
              className={`text-xs rounded-full px-2 py-1 border-0 ${STATUS_STYLES[task.status]}`}
              value={task.status}
              onChange={(e) => handleStatusChange(task.id, e.target.value)}
            >
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}
