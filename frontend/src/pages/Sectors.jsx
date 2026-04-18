import { useEffect, useState } from 'react';
import api from '../api/axios';
import Modal from '../components/ui/Modal';

export default function Sectors() {
  const [sectors, setSectors] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', isActive: true });

  const load = () => api.get('/sectors?includeInactive=true').then((res) => setSectors(res.data.sectors));

  useEffect(() => {
    load();
  }, []);

  const save = async (event) => {
    event.preventDefault();
    if (editing) await api.put(`/sectors/${editing._id}`, form);
    else await api.post('/sectors', form);
    setEditing(null);
    setForm({ name: '', description: '', isActive: true });
    load();
  };

  const startEdit = (sector) => {
    setEditing(sector);
    setForm({ name: sector.name, description: sector.description || '', isActive: sector.isActive });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-bold text-ink">Sector Management</h1>
          <p className="text-slate-500">Add, edit, deactivate, or delete sector categories.</p>
        </div>
        <button onClick={() => setEditing({})} className="w-full rounded bg-ocean px-4 py-2 text-sm font-semibold text-white sm:w-auto">Add sector</button>
      </div>
      <div className="space-y-3 md:hidden">
        {sectors.map((sector) => (
          <article key={sector._id} className="rounded border border-slate-200 bg-white p-4 shadow-soft">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="font-semibold text-ink">{sector.name}</h2>
                <p className="mt-1 text-sm text-slate-500">{sector.description || 'No description added.'}</p>
              </div>
              <span className={`rounded px-2 py-1 text-xs font-semibold ${sector.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                {sector.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button onClick={() => startEdit(sector)} className="rounded border border-slate-300 px-3 py-2 text-sm">Edit</button>
              <button onClick={async () => { if (confirm('Delete sector?')) { await api.delete(`/sectors/${sector._id}`); load(); } }} className="rounded border border-red-300 px-3 py-2 text-sm text-red-700">Delete</button>
            </div>
          </article>
        ))}
      </div>
      <div className="hidden overflow-hidden rounded border border-slate-200 bg-white shadow-soft md:block">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left">
            <tr><th className="p-3">Name</th><th className="p-3">Status</th><th className="p-3">Actions</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sectors.map((sector) => (
              <tr key={sector._id}>
                <td className="p-3 font-semibold text-ink">{sector.name}</td>
                <td className="p-3">{sector.isActive ? 'Active' : 'Inactive'}</td>
                <td className="p-3">
                  <div className="flex gap-2">
                    <button onClick={() => startEdit(sector)} className="rounded border border-slate-300 px-3 py-1">Edit</button>
                    <button onClick={async () => { if (confirm('Delete sector?')) { await api.delete(`/sectors/${sector._id}`); load(); } }} className="rounded border border-red-300 px-3 py-1 text-red-700">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editing ? (
        <Modal title={editing._id ? 'Edit sector' : 'Add sector'} onClose={() => setEditing(null)}>
          <form onSubmit={save} className="space-y-4">
            <input required className="w-full rounded border border-slate-300 px-3 py-2" placeholder="Sector name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <textarea className="w-full rounded border border-slate-300 px-3 py-2" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /> Active</label>
            <button className="rounded bg-ocean px-4 py-2 font-semibold text-white">Save</button>
          </form>
        </Modal>
      ) : null}
    </div>
  );
}
