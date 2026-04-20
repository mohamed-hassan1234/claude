import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import EmptyState from '../components/ui/EmptyState';
import Loading from '../components/ui/Loading';

const downloadFile = async (url, filename) => {
  const { data } = await api.get(url, { responseType: 'blob' });
  const href = URL.createObjectURL(data);
  const link = document.createElement('a');
  link.href = href;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(href);
};

export default function Responses() {
  const [responses, setResponses] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [filters, setFilters] = useState({ search: '', sector: '', district: '', startDate: '', endDate: '' });
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async (page = 1) => {
    setLoading(true);
    const params = { ...filters, page, limit: 10 };
    const [responseRes, sectorRes] = await Promise.all([api.get('/responses', { params }), api.get('/sectors?includeInactive=true')]);
    setResponses(responseRes.data.responses);
    setPagination(responseRes.data.pagination);
    setSectors(sectorRes.data.sectors);
    setLoading(false);
  };

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submitFilters = (event) => {
    event.preventDefault();
    load(1);
  };

  const resetFilters = () => {
    const nextFilters = { search: '', sector: '', district: '', startDate: '', endDate: '' };
    setFilters(nextFilters);
    setSelected([]);
    setLoading(true);
    Promise.all([api.get('/responses', { params: { ...nextFilters, page: 1, limit: 10 } }), api.get('/sectors?includeInactive=true')]).then(
      ([responseRes, sectorRes]) => {
        setResponses(responseRes.data.responses);
        setPagination(responseRes.data.pagination);
        setSectors(sectorRes.data.sectors);
        setLoading(false);
      }
    );
  };

  const toggleSelected = (id, checked) => {
    setSelected((current) => (checked ? Array.from(new Set([...current, id])) : current.filter((item) => item !== id)));
  };

  const remove = async (id) => {
    if (!confirm('Delete this response?')) return;
    await api.delete(`/responses/${id}`);
    load(pagination.page);
  };

  const bulkDelete = async () => {
    if (!selected.length || !confirm(`Delete ${selected.length} selected responses?`)) return;
    await api.post('/responses/bulk-delete', { ids: selected });
    setSelected([]);
    load(pagination.page);
  };

  const query = new URLSearchParams(filters).toString();
  const sectorLabel = (sector) => sector?.name || (typeof sector === 'string' ? sector : '-') || '-';

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <h1 className="text-2xl font-bold text-ink">Survey Responses</h1>
          <p className="text-slate-500">Search, filter, export, view, edit, and delete submitted surveys.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button onClick={() => downloadFile(`/exports/responses.xlsx?${query}`, 'survey-responses.xlsx')} className="w-full rounded bg-ocean px-4 py-2 text-sm font-semibold text-white sm:w-auto">
            Excel
          </button>
          <button onClick={() => downloadFile(`/exports/responses.csv?${query}`, 'survey-responses.csv')} className="w-full rounded border border-slate-300 bg-white px-4 py-2 text-sm font-semibold sm:w-auto">
            CSV
          </button>
        </div>
      </div>

      <form onSubmit={submitFilters} className="grid gap-3 rounded border border-slate-200 bg-white p-4 shadow-soft sm:grid-cols-2 xl:grid-cols-6">
        <input className="rounded border border-slate-300 px-3 py-2 text-sm sm:col-span-2 xl:col-span-2" placeholder="Search" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
        <select className="rounded border border-slate-300 px-3 py-2 text-sm" value={filters.sector} onChange={(e) => setFilters({ ...filters, sector: e.target.value })}>
          <option value="">All sectors</option>
          {sectors.map((sector) => <option key={sector._id} value={sector._id}>{sector.name}</option>)}
        </select>
        <input className="rounded border border-slate-300 px-3 py-2 text-sm" placeholder="District" value={filters.district} onChange={(e) => setFilters({ ...filters, district: e.target.value })} />
        <input type="date" className="rounded border border-slate-300 px-3 py-2 text-sm" value={filters.startDate} onChange={(e) => setFilters({ ...filters, startDate: e.target.value })} />
        <input type="date" className="rounded border border-slate-300 px-3 py-2 text-sm" value={filters.endDate} onChange={(e) => setFilters({ ...filters, endDate: e.target.value })} />
        <div className="flex flex-col gap-2 sm:flex-row sm:col-span-2 xl:col-span-1">
          <button className="rounded bg-ink px-4 py-2 text-sm font-semibold text-white">Apply</button>
          <button type="button" onClick={resetFilters} className="rounded border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700">Clear</button>
        </div>
      </form>

      {selected.length ? (
        <button onClick={bulkDelete} className="w-full rounded border border-red-300 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 sm:w-auto">
          Delete selected ({selected.length})
        </button>
      ) : null}

      {loading ? <Loading /> : responses.length === 0 ? <EmptyState /> : (
        <div className="space-y-4">
          <div className="space-y-3 md:hidden">
            {responses.map((item) => (
              <article key={item._id} className="rounded border border-slate-200 bg-white p-4 shadow-soft">
                <div className="flex items-start justify-between gap-3">
                  <label className="flex min-w-0 flex-1 items-start gap-3">
                    <input type="checkbox" className="mt-1" checked={selected.includes(item._id)} onChange={(e) => toggleSelected(item._id, e.target.checked)} />
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-ink">{item.organizationName}</p>
                      <p className="text-sm text-slate-500">{item.respondentName || 'Anonymous'}</p>
                    </div>
                  </label>
                  <span className="rounded bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">{item._id.slice(-6)}</span>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Sector</p>
                    <p className="mt-1 text-sm text-ink">{sectorLabel(item.sector)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">District</p>
                    <p className="mt-1 text-sm text-ink">{item.district || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Submission date</p>
                    <p className="mt-1 text-sm text-ink">{new Date(item.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Technology</p>
                    <p className="mt-1 text-sm text-ink">{item.answers?.q8 || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Awareness</p>
                    <p className="mt-1 text-sm text-ink">{item.awarenessLevel || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Willingness</p>
                    <p className="mt-1 text-sm text-ink">{item.willingnessToAdopt || '-'}</p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Link className="rounded border border-slate-300 px-3 py-2 text-center text-sm font-medium text-slate-700" to={`/admin/responses/${item._id}`}>View</Link>
                  <button className="rounded border border-red-300 px-3 py-2 text-sm font-medium text-red-700" onClick={() => remove(item._id)}>Delete</button>
                </div>
              </article>
            ))}
          </div>

          <div className="hidden overflow-hidden rounded border border-slate-200 bg-white shadow-soft md:block">
            <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-slate-600">
                <tr>
                  <th className="p-3"><input type="checkbox" checked={responses.length > 0 && selected.length === responses.length} onChange={(e) => setSelected(e.target.checked ? responses.map((item) => item._id) : [])} /></th>
                  <th className="p-3">ID</th>
                  <th className="p-3">Respondent / organization</th>
                  <th className="p-3">Sector</th>
                  <th className="p-3">District</th>
                  <th className="p-3">Submission date</th>
                  <th className="p-3">Technology</th>
                  <th className="p-3">Awareness</th>
                  <th className="p-3">Willingness</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {responses.map((item) => (
                  <tr key={item._id}>
                    <td className="p-3"><input type="checkbox" checked={selected.includes(item._id)} onChange={(e) => toggleSelected(item._id, e.target.checked)} /></td>
                    <td className="p-3 font-mono text-xs">{item._id.slice(-6)}</td>
                    <td className="p-3">
                      <p className="font-semibold text-ink">{item.organizationName}</p>
                      <p className="text-slate-500">{item.respondentName || 'Anonymous'}</p>
                    </td>
                    <td className="p-3">{sectorLabel(item.sector)}</td>
                    <td className="p-3">{item.district}</td>
                    <td className="p-3">{new Date(item.createdAt).toLocaleDateString()}</td>
                    <td className="p-3">{item.answers?.q8 || '-'}</td>
                    <td className="p-3">{item.awarenessLevel}</td>
                    <td className="p-3">{item.willingnessToAdopt}</td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <Link className="rounded border border-slate-300 px-3 py-1" to={`/admin/responses/${item._id}`}>View</Link>
                        <button className="rounded border border-red-300 px-3 py-1 text-red-700" onClick={() => remove(item._id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>

          <div className="flex flex-col gap-3 rounded border border-slate-200 bg-white px-4 py-3 text-sm shadow-soft sm:flex-row sm:items-center sm:justify-between">
            <span>{pagination.total} total responses</span>
            <div className="flex items-center justify-between gap-2 sm:justify-end">
              <button disabled={pagination.page <= 1} onClick={() => load(pagination.page - 1)} className="rounded border border-slate-300 px-3 py-1 disabled:opacity-40">Previous</button>
              <span className="px-2 py-1 text-center">Page {pagination.page} of {pagination.pages}</span>
              <button disabled={pagination.page >= pagination.pages} onClick={() => load(pagination.page + 1)} className="rounded border border-slate-300 px-3 py-1 disabled:opacity-40">Next</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
