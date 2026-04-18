import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import api from '../api/axios';
import ChartPanel from '../components/ui/ChartPanel';
import Loading from '../components/ui/Loading';
import StatCard from '../components/ui/StatCard';

const downloadFile = async (url, filename) => {
  const { data } = await api.get(url, { responseType: 'blob' });
  const href = URL.createObjectURL(data);
  const link = document.createElement('a');
  link.href = href;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(href);
};

function PercentBar({ answer }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between gap-3 text-sm">
        <span className="min-w-0 break-words font-medium text-ink">{answer.answer}</span>
        <span className="shrink-0 text-slate-500">{answer.count} ({answer.percentage}%)</span>
      </div>
      <div className="h-2 rounded bg-slate-100">
        <div className="h-2 rounded bg-ocean" style={{ width: `${Math.min(answer.percentage, 100)}%` }} />
      </div>
    </div>
  );
}

function ImportantQuestionCard({ item }) {
  return (
    <div className="rounded border border-slate-200 bg-white p-4 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-ocean">{item.code}</p>
        <p className="rounded bg-slate-100 px-2 py-1 text-right text-xs font-semibold text-slate-600">
          Top: {item.topAnswer} ({item.topPercentage}%)
        </p>
      </div>
      <h3 className="mt-2 break-words text-sm font-semibold text-ink">{item.question}</h3>
      <div className="mt-4 space-y-3">
        {item.answers.map((answer) => <PercentBar key={answer.answer} answer={answer} />)}
      </div>
    </div>
  );
}

export default function Reports() {
  const [analytics, setAnalytics] = useState(null);
  const [filters, setFilters] = useState({ sector: '', district: '', startDate: '', endDate: '' });
  const [sectors, setSectors] = useState([]);

  const load = async () => {
    const [analyticsRes, sectorRes] = await Promise.all([api.get('/analytics', { params: filters }), api.get('/sectors?includeInactive=true')]);
    setAnalytics(analyticsRes.data.analytics);
    setSectors(sectorRes.data.sectors);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!analytics) return <Loading label="Generating analysis..." />;

  const query = new URLSearchParams(filters).toString();
  const weakestGap = analytics.gapAnalysis?.[0];
  const strongestFactor = analytics.factorSummary?.[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <h1 className="text-2xl font-bold text-ink">Reports and Insights</h1>
          <p className="text-slate-500">Clear analysis from selected, yes/no, and multiple-choice survey answers.</p>
        </div>
        <div className="no-print flex flex-col gap-2 sm:flex-row">
          <button onClick={() => window.print()} className="rounded border border-slate-300 bg-white px-4 py-2 text-sm font-semibold">Print report</button>
          <button onClick={() => downloadFile(`/exports/responses.xlsx?${query}`, 'analysis-data.xlsx')} className="rounded bg-ocean px-4 py-2 text-sm font-semibold text-white">Download Excel</button>
        </div>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); load(); }} className="no-print grid gap-3 rounded border border-slate-200 bg-white p-4 shadow-soft sm:grid-cols-2 xl:grid-cols-5">
        <select className="rounded border border-slate-300 px-3 py-2 text-sm" value={filters.sector} onChange={(e) => setFilters({ ...filters, sector: e.target.value })}>
          <option value="">All sectors</option>
          {sectors.map((sector) => <option key={sector._id} value={sector._id}>{sector.name}</option>)}
        </select>
        <input className="rounded border border-slate-300 px-3 py-2 text-sm" placeholder="District" value={filters.district} onChange={(e) => setFilters({ ...filters, district: e.target.value })} />
        <input type="date" className="rounded border border-slate-300 px-3 py-2 text-sm" value={filters.startDate} onChange={(e) => setFilters({ ...filters, startDate: e.target.value })} />
        <input type="date" className="rounded border border-slate-300 px-3 py-2 text-sm" value={filters.endDate} onChange={(e) => setFilters({ ...filters, endDate: e.target.value })} />
        <button className="rounded bg-ink px-4 py-2 text-sm font-semibold text-white">Generate</button>
      </form>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Responses analyzed" value={analytics.totalResponses} />
        <StatCard label="Readiness average" value={`${analytics.readinessStats.average}%`} />
        <StatCard label="Strongest area" value={strongestFactor?.score ? `${strongestFactor.score}%` : '-'} helper={strongestFactor?.label} />
        <StatCard label="Largest gap" value={weakestGap ? `${weakestGap.gap}%` : '-'} helper={weakestGap?.factor} />
      </div>

      <section className="rounded border border-slate-200 bg-white p-5 shadow-soft">
        <h2 className="text-lg font-semibold text-ink">Summary findings</h2>
        <ul className="mt-4 space-y-2 text-slate-700">
          {analytics.summaryFindings.map((item) => <li key={item}>- {item}</li>)}
        </ul>
      </section>

      <div className="grid gap-5 xl:grid-cols-2">
        <ChartPanel title="Readiness ranking by sector">
          <ResponsiveContainer>
            <BarChart data={analytics.readinessRanking}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="sector" hide />
              <YAxis />
              <Tooltip />
              <Bar dataKey="averageReadiness" fill="#0f7c90" />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>
        <ChartPanel title="Readiness factors">
          <ResponsiveContainer>
            <BarChart data={analytics.factorSummary || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" hide />
              <YAxis />
              <Tooltip />
              <Bar dataKey="score" fill="#18a8a8" />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>
        <ChartPanel title="Most common barriers">
          <ResponsiveContainer>
            <BarChart data={analytics.commonBarriers}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="answer" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#efb036" />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>
        <ChartPanel title="Security concerns">
          <ResponsiveContainer>
            <BarChart data={analytics.securityConcerns}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="answer" hide />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#6b8afd" />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>
      </div>

      <section className="rounded border border-slate-200 bg-white p-5 shadow-soft">
        <h2 className="text-lg font-semibold text-ink">Important question analysis</h2>
        <p className="mt-1 text-sm text-slate-500">Only selected, yes/no, and multiple-choice questions are shown here, using real Somali answer labels.</p>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {(analytics.importantQuestionAnalysis || []).map((item) => <ImportantQuestionCard key={item.code} item={item} />)}
        </div>
      </section>

      <section className="rounded border border-slate-200 bg-white p-5 shadow-soft">
        <h2 className="text-lg font-semibold text-ink">Sector comparison</h2>
        <div className="mt-4 space-y-3 md:hidden">
          {(analytics.sectorComparison || []).map((item) => (
            <article key={item.sector} className="rounded border border-slate-200 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-ink">{item.sector}</h3>
                  <p className="text-sm text-slate-500">{item.responses} responses</p>
                </div>
                <span className="rounded bg-ocean/10 px-2 py-1 text-sm font-semibold text-ocean">{item.averageReadiness}%</span>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Awareness</p><p className="mt-1 text-sm text-ink">{item.cloudAwareness}%</p></div>
                <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Technology</p><p className="mt-1 text-sm text-ink">{item.technologyUse}%</p></div>
                <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Infrastructure</p><p className="mt-1 text-sm text-ink">{item.infrastructureReadiness}%</p></div>
                <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Backup</p><p className="mt-1 text-sm text-ink">{item.backupPractices}%</p></div>
                <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Willingness</p><p className="mt-1 text-sm text-ink">{item.willingnessToAdopt}%</p></div>
              </div>
            </article>
          ))}
        </div>
        <div className="mt-4 hidden overflow-x-auto md:block">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left">
              <tr>
                <th className="p-3">Sector</th>
                <th className="p-3">Responses</th>
                <th className="p-3">Awareness</th>
                <th className="p-3">Technology</th>
                <th className="p-3">Infrastructure</th>
                <th className="p-3">Backup</th>
                <th className="p-3">Willingness</th>
                <th className="p-3">Readiness</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(analytics.sectorComparison || []).map((item) => (
                <tr key={item.sector}>
                  <td className="p-3 font-semibold text-ink">{item.sector}</td>
                  <td className="p-3">{item.responses}</td>
                  <td className="p-3">{item.cloudAwareness}%</td>
                  <td className="p-3">{item.technologyUse}%</td>
                  <td className="p-3">{item.infrastructureReadiness}%</td>
                  <td className="p-3">{item.backupPractices}%</td>
                  <td className="p-3">{item.willingnessToAdopt}%</td>
                  <td className="p-3 font-semibold text-ocean">{item.averageReadiness}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded border border-slate-200 bg-white p-5 shadow-soft">
        <h2 className="text-lg font-semibold text-ink">Gap analysis</h2>
        <div className="mt-4 space-y-3 md:hidden">
          {(analytics.gapAnalysis || []).map((item) => (
            <article key={item.factor} className="rounded border border-slate-200 p-4">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-semibold text-ink">{item.factor}</h3>
                <span className="rounded bg-slate-100 px-2 py-1 text-sm font-semibold text-slate-700">{item.gap}% gap</span>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Current</p><p className="mt-1 text-ink">{item.current}%</p></div>
                <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Ideal</p><p className="mt-1 text-ink">{item.ideal}%</p></div>
                <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Gap</p><p className="mt-1 text-ink">{item.gap}%</p></div>
              </div>
            </article>
          ))}
        </div>
        <div className="mt-4 hidden overflow-x-auto md:block">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left">
              <tr>
                <th className="p-3">Factor</th>
                <th className="p-3">Current</th>
                <th className="p-3">Ideal</th>
                <th className="p-3">Gap</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(analytics.gapAnalysis || []).map((item) => (
                <tr key={item.factor}>
                  <td className="p-3 font-semibold text-ink">{item.factor}</td>
                  <td className="p-3">{item.current}%</td>
                  <td className="p-3">{item.ideal}%</td>
                  <td className="p-3">{item.gap}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded border border-slate-200 bg-white p-5 shadow-soft">
        <h2 className="text-lg font-semibold text-ink">Recommendation summary</h2>
        <ul className="mt-4 space-y-2 text-slate-700">
          {analytics.recommendations.map((item) => <li key={item}>- {item}</li>)}
        </ul>
      </section>

      <section className="rounded border border-slate-200 bg-white p-5 shadow-soft">
        <h2 className="text-lg font-semibold text-ink">Python chart files</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {Object.entries(analytics.charts || {}).filter(([, src]) => src).map(([name, src]) => (
            <img key={name} src={src} alt={name} className="w-full rounded border border-slate-200" />
          ))}
        </div>
      </section>
    </div>
  );
}
