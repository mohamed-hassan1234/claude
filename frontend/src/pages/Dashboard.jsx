import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import api from '../api/axios';
import ChartPanel from '../components/ui/ChartPanel';
import Loading from '../components/ui/Loading';
import StatCard from '../components/ui/StatCard';

const colors = ['#0f7c90', '#18a8a8', '#6b8afd', '#efb036', '#e05252'];

export default function Dashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    const load = () => api.get('/dashboard/stats').then((res) => setData(res.data));
    load();
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, []);

  if (!data) return <Loading />;

  const cards = data.cards;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Dashboard</h1>
        <p className="text-slate-500">Live district-level cloud readiness overview.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Total responses" value={cards.totalResponses} />
        <StatCard label="Total sectors" value={cards.totalSectors} />
        <StatCard label="Total districts" value={cards.totalDistricts} />
        <StatCard label="Daily submissions" value={cards.dailySubmissions} />
        <StatCard label="Readiness average" value={`${cards.readinessAverage}%`} />
        <StatCard label="Adoption willingness" value={`${cards.adoptionWillingnessPercentage}%`} />
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <ChartPanel title="Sector ranking">
          <ResponsiveContainer>
            <BarChart data={data.charts.sectorRanking}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="sector" hide />
              <YAxis />
              <Tooltip />
              <Bar dataKey="averageReadiness" fill="#0f7c90" name="Avg readiness" />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>
        <ChartPanel title="Readiness bands">
          <ResponsiveContainer>
            <PieChart>
              <Pie data={data.charts.readinessBands} dataKey="value" nameKey="name" outerRadius={95} label>
                {data.charts.readinessBands.map((entry, index) => <Cell key={entry.name} fill={colors[index % colors.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartPanel>
        <ChartPanel title="District responses">
          <ResponsiveContainer>
            <BarChart data={data.charts.districtCounts}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="district" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="responses" fill="#18a8a8" />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>
        <ChartPanel title="Daily submission trend">
          <ResponsiveContainer>
            <LineChart data={data.charts.dailyTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="submissions" stroke="#0f7c90" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </ChartPanel>
      </div>
    </div>
  );
}
