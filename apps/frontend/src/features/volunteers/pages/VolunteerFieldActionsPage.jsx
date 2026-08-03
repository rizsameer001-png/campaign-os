import { useState } from 'react';
import { api } from '../../../lib/api';
import FormField, { inputClasses } from '../../../components/common/FormField';
import Button from '../../../components/common/Button';

export default function VolunteerFieldActionsPage() {
  const [boothId, setBoothId] = useState('');
  const [rally, setRally] = useState({ rallyName: '', location: '', crowdEstimate: '' });
  const [message, setMessage] = useState('');

  function getGeolocation() {
    return new Promise((resolve) => {
      if (!navigator.geolocation) return resolve(undefined);
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => resolve(undefined)
      );
    });
  }

  async function handleAttendance(status) {
    const geolocation = await getGeolocation();
    await api.post('/attendance', { status, geolocation });
    setMessage(`Attendance marked: ${status}`);
  }

  async function handleCheckIn(e) {
    e.preventDefault();
    const geolocation = await getGeolocation();
    await api.post('/booths/checkin', { boothId, geolocation });
    setMessage(`Checked in to booth ${boothId}`);
  }

  async function handleRallyReport(e) {
    e.preventDefault();
    await api.post('/rallies/report', { ...rally, crowdEstimate: Number(rally.crowdEstimate) || undefined });
    setMessage('Rally report submitted');
    setRally({ rallyName: '', location: '', crowdEstimate: '' });
  }

  return (
    <div className="max-w-md space-y-6">
      <h1 className="text-lg font-semibold">Field Actions</h1>
      {message && <p className="text-sm text-green-600">{message}</p>}

      <div className="bg-white p-5 rounded-xl border border-gray-100">
        <h3 className="font-semibold mb-3">Mark Attendance</h3>
        <div className="flex gap-2">
          <Button onClick={() => handleAttendance('present')}>Present</Button>
          <Button variant="secondary" onClick={() => handleAttendance('late')}>Late</Button>
          <Button variant="danger" onClick={() => handleAttendance('absent')}>Absent</Button>
        </div>
      </div>

      <form onSubmit={handleCheckIn} className="bg-white p-5 rounded-xl border border-gray-100">
        <h3 className="font-semibold mb-3">Booth Check-In</h3>
        <FormField label="Booth ID">
          <input className={inputClasses(false)} value={boothId} onChange={(e) => setBoothId(e.target.value)} required />
        </FormField>
        <Button type="submit">Check In</Button>
      </form>

      <form onSubmit={handleRallyReport} className="bg-white p-5 rounded-xl border border-gray-100">
        <h3 className="font-semibold mb-3">Rally Report</h3>
        <FormField label="Rally Name">
          <input className={inputClasses(false)} value={rally.rallyName} onChange={(e) => setRally((r) => ({ ...r, rallyName: e.target.value }))} required />
        </FormField>
        <FormField label="Location">
          <input className={inputClasses(false)} value={rally.location} onChange={(e) => setRally((r) => ({ ...r, location: e.target.value }))} required />
        </FormField>
        <FormField label="Estimated Crowd">
          <input type="number" className={inputClasses(false)} value={rally.crowdEstimate} onChange={(e) => setRally((r) => ({ ...r, crowdEstimate: e.target.value }))} />
        </FormField>
        <Button type="submit">Submit Report</Button>
      </form>
    </div>
  );
}
