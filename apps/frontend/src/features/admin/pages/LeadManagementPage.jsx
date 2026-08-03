import { useEffect, useState } from 'react';
import { api } from '../../../lib/api';
import { inputClasses } from '../../../components/common/FormField';

const STATUS_COLORS = {
  new: 'bg-blue-100 text-blue-700',
  contacted: 'bg-yellow-100 text-yellow-700',
  qualified: 'bg-green-100 text-green-700',
  lost: 'bg-red-100 text-red-700',
  converted: 'bg-purple-100 text-purple-700',
};

export default function LeadManagementPage() {
  const [leads, setLeads] = useState([]);

  useEffect(() => { load(); }, []);

  async function load() {
    const { data } = await api.get('/admin/leads');
    setLeads(data.data);
  }

  async function handleStatusChange(id, status) {
    await api.put(`/admin/leads/${id}`, { status });
    load();
  }

  return (
    <div>
      <h1 className="text-lg font-semibold mb-4">Leads</h1>
      <div className="bg-white rounded-xl border border-gray-100 divide-y">
        {leads.map((lead) => (
          <div key={lead.id} className="flex items-center justify-between p-4 text-sm">
            <div>
              <p className="font-medium">{lead.name}</p>
              <p className="text-xs text-gray-500">{lead.email} · {lead.source}</p>
            </div>
            <select
              className={`text-xs rounded-full px-2 py-1 border-0 ${STATUS_COLORS[lead.status]}`}
              value={lead.status}
              onChange={(e) => handleStatusChange(lead.id, e.target.value)}
            >
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="qualified">Qualified</option>
              <option value="lost">Lost</option>
              <option value="converted">Converted</option>
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}
