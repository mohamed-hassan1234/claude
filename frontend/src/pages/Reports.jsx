import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import api from '../api/axios';
import EmptyState from '../components/ui/EmptyState';
import ChartPanel from '../components/ui/ChartPanel';
import Loading from '../components/ui/Loading';
import StatCard from '../components/ui/StatCard';

const TAB_ITEMS = [
  { id: 'overview', label: 'Overview' },
  { id: 'responses', label: 'Response Analysis' },
  { id: 'sectors', label: 'Sector Comparison' },
  { id: 'districts', label: 'District Comparison' },
  { id: 'readiness', label: 'Readiness Analysis' },
  { id: 'gaps', label: 'Gap Analysis' },
  { id: 'infrastructure', label: 'Infrastructure Analysis' },
  { id: 'security', label: 'Security & Trust' },
  { id: 'barriers', label: 'Barriers' },
  { id: 'business', label: 'Business Needs' },
  { id: 'recommendations', label: 'Recommendations' },
  { id: 'exports', label: 'Export Center' },
  { id: 'presentation', label: 'Presentation Report' }
];

const CHART_COLORS = ['#0f7c90', '#18a8a8', '#4f46e5', '#efb036', '#d14343', '#1d9b5e', '#0ea5e9'];
const STATUS_STYLES = {
  good: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  warning: 'border-amber-200 bg-amber-50 text-amber-700',
  critical: 'border-rose-200 bg-rose-50 text-rose-700'
};
const BAND_COLORS = { Low: '#d14343', Medium: '#efb036', High: '#1d9b5e' };

const downloadFile = async (url, filename) => {
  const { data } = await api.get(url, { responseType: 'blob' });
  const href = URL.createObjectURL(data);
  const link = document.createElement('a');
  link.href = href;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(href);
};

const cleanFilters = (filters) =>
  Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== '' && value !== null && value !== undefined));

const numberValue = (value) => Number(value || 0);
const percent = (value, digits = 0) => `${numberValue(value).toFixed(digits)}%`;

const normalizeAnalytics = (raw = {}) => {
  const sectorRows = Array.isArray(raw.sectorComparison) ? raw.sectorComparison : raw.sectorComparison?.rows || [];
  const districtRows = raw.districtComparison?.rows || [];
  const factorSummary = raw.factorSummary || raw.readiness?.factorBreakdown || [];
  const totals = {
    totalResponses: raw.totals?.totalResponses ?? raw.totalResponses ?? 0,
    totalSectorsCovered: raw.totals?.totalSectorsCovered ?? raw.descriptiveStatistics?.responsesBySector ?? 0,
    totalDistrictsCovered: raw.totals?.totalDistrictsCovered ?? raw.descriptiveStatistics?.responsesByDistrict ?? 0,
    responsesToday: raw.totals?.responsesToday ?? 0,
    responsesThisWeek: raw.totals?.responsesThisWeek ?? 0,
    averageCloudReadinessScore: raw.totals?.averageCloudReadinessScore ?? raw.readinessStats?.average ?? 0,
    awarenessRate: raw.totals?.awarenessRate ?? raw.awarenessDistribution?.[0]?.percentage ?? 0,
    adoptionWillingnessRate: raw.totals?.adoptionWillingnessRate ?? raw.willingnessDistribution?.[0]?.percentage ?? 0,
    cloudToolsUsageRate: raw.totals?.cloudToolsUsageRate ?? 0,
    backupPracticeRate: raw.totals?.backupPracticeRate ?? 0,
    infrastructureStabilityRate: raw.totals?.infrastructureStabilityRate ?? factorSummary.find((item) => item.factor === 'infrastructureReadiness')?.score ?? 0,
    securityTrustRate: raw.totals?.securityTrustRate ?? factorSummary.find((item) => item.factor === 'securityTrust')?.score ?? 0,
    lowReadinessCount: raw.totals?.lowReadinessCount ?? 0,
    mediumReadinessCount: raw.totals?.mediumReadinessCount ?? 0,
    highReadinessCount: raw.totals?.highReadinessCount ?? 0
  };

  return {
    generatedAt: raw.generatedAt || '',
    filterOptions: raw.filterOptions || {
      districts: [],
      awarenessLevels: ['Haa', 'Maya'],
      willingnessLevels: ['Haa', 'Maya', 'Waxaa ku xiran qiimaha'],
      readinessLevels: ['Low', 'Medium', 'High']
    },
    totals,
    overview: raw.overview || {
      totals,
      insightCards: [],
      executiveSummary: raw.summaryFindings?.[0] || '',
      timeSeries: { dailyResponses: [], readinessTrend: [], awarenessTrend: [] },
      readinessBands: []
    },
    questionAnalysis: raw.questionAnalysis || [],
    sectorComparison: {
      rows: sectorRows,
      readinessLeaderboard: raw.sectorComparison?.readinessLeaderboard || raw.readinessRanking || sectorRows,
      stackedReadiness: raw.sectorComparison?.stackedReadiness || [],
      heatmap: raw.sectorComparison?.heatmap || { columns: [], rows: [] },
      highlights: raw.sectorComparison?.highlights || {}
    },
    districtComparison: {
      rows: districtRows,
      ranking: raw.districtComparison?.ranking || districtRows,
      heatmap: raw.districtComparison?.heatmap || { columns: [], rows: [] },
      highlights: raw.districtComparison?.highlights || {}
    },
    readiness: raw.readiness || {
      overallAverage: raw.readinessStats?.average || 0,
      distribution: [],
      sectorLeaderboard: raw.readinessRanking || sectorRows,
      districtLeaderboard: districtRows,
      responseRanking: [],
      radar: factorSummary.map((item) => ({ factor: item.label, score: item.score })),
      factorBreakdown: factorSummary,
      lowReadinessAlerts: [],
      highReadinessOpportunities: [],
      interpretation: '',
      explanation: ''
    },
    gapAnalysis: raw.gapAnalysis?.overall ? raw.gapAnalysis : { overall: raw.gapAnalysis || [], progressToIdeal: raw.gapAnalysis || [], sectorGaps: [], districtGaps: [], narrative: [] },
    infrastructure: raw.infrastructure || {
      internetAvailability: [],
      internetQuality: [],
      electricityAvailability: [],
      interruptionFrequency: [],
      internetImpact: [],
      sectorComparison: [],
      heatmap: { columns: [], rows: [] },
      riskSummary: [],
      mostAffectedInternet: [],
      mostAffectedPower: []
    },
    security: raw.security || {
      trustLevels: [],
      securityConcerns: raw.securityConcerns || [],
      sectorTrustComparison: [],
      topConcernLeaderboard: raw.securityConcerns || [],
      fearSummary: [],
      trustBuildingRecommendations: []
    },
    barriers: raw.barriers || {
      overallRanking: raw.commonBarriers || [],
      challengeFrequency: raw.commonBarriers || [],
      topFiveChallenges: raw.commonBarriers?.slice(0, 5) || [],
      bySector: [],
      byDistrict: [],
      mostCommonBarrier: raw.commonBarriers?.[0]?.answer || 'No dominant barrier'
    },
    businessNeeds: raw.businessNeeds || {
      digitalNeeds: [],
      willingness: raw.willingnessDistribution || [],
      openEndedQuestions: {},
      themeCards: [],
      groupedTopicBlocks: [],
      keywordChart: [],
      insightSummaries: [],
      mostCommonRecommendationTheme: 'No dominant theme'
    },
    recommendationBlocks: raw.recommendationBlocks || {
      overall: [],
      sectorSpecific: [],
      districtSpecific: [],
      summary: raw.recommendations || []
    },
    reportView: raw.reportView || {
      title: 'Somalia Cloud Computing Survey Analytics Report',
      subtitle: `${totals.totalResponses} filtered responses`,
      executiveSummary: raw.summaryFindings?.[0] || '',
      keyFindings: raw.summaryFindings || [],
      readinessRanking: raw.readinessRanking || [],
      topBarriers: raw.commonBarriers || [],
      topOpportunities: [],
      recommendations: raw.recommendations || [],
      conclusion: ''
    },
    chartFiles: raw.chartFiles || raw.charts || {},
    summaryFindings: raw.summaryFindings || [],
    recommendations: raw.recommendations || [],
    factorSummary
  };
};

function StatusPill({ status, children }) {
  return <span className={`inline-flex rounded border px-2 py-1 text-xs font-semibold ${STATUS_STYLES[status] || STATUS_STYLES.warning}`}>{children}</span>;
}

function InsightCard({ label, value, helper }) {
  return (
    <div className="rounded border border-slate-200 bg-white p-4 shadow-soft">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 break-words text-xl font-bold text-ink">{value || '-'}</p>
      {helper ? <p className="mt-2 text-sm text-slate-500">{helper}</p> : null}
    </div>
  );
}

function SectionLead({ title, description }) {
  return (
    <div className="mb-4">
      <h2 className="text-xl font-bold text-ink">{title}</h2>
      {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
    </div>
  );
}

function BulletList({ items = [] }) {
  if (!items.length) {
    return <EmptyState title="No insights yet" message="This view will populate when responses match the current filters." />;
  }

  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item} className="rounded border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-soft">
          {item}
        </li>
      ))}
    </ul>
  );
}

function ProgressRows({ items = [], valueKey = 'percentage', labelKey = 'answer' }) {
  if (!items.length) return <EmptyState title="No distribution data" message="No answers matched the selected filters." />;

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={`${item[labelKey]}-${index}`} className="space-y-1">
          <div className="flex items-start justify-between gap-3 text-sm">
            <span className="min-w-0 break-words font-medium text-ink">{item[labelKey]}</span>
            <span className="shrink-0 text-slate-500">
              {item.count ?? item.value ?? 0}
              {item[valueKey] !== undefined ? ` (${percent(item[valueKey], 2)})` : ''}
            </span>
          </div>
          <div className="h-2 rounded bg-slate-100">
            <div className="h-2 rounded bg-ocean" style={{ width: `${Math.min(numberValue(item[valueKey] ?? item.count ?? 0), 100)}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function HeatmapGrid({ matrix, label = 'Name' }) {
  if (!matrix?.rows?.length || !matrix?.columns?.length) {
    return <EmptyState title="No heatmap data" message="Heatmap values will appear when grouped analytics are available." />;
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[760px]">
        <div
          className="grid"
          style={{ gridTemplateColumns: `minmax(220px, 1.3fr) repeat(${matrix.columns.length}, minmax(120px, 1fr))` }}
        >
          <div className="border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</div>
          {matrix.columns.map((column) => (
            <div key={column.key} className="border border-slate-200 bg-slate-50 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
              {column.label}
            </div>
          ))}
          {matrix.rows.map((row) => (
            <div key={row.name} className="contents">
              <div className="border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-ink">{row.name}</div>
              {row.values.map((value) => (
                <div
                  key={`${row.name}-${value.key}`}
                  className={`border border-slate-200 px-4 py-3 text-center text-sm font-semibold ${STATUS_STYLES[value.status] || STATUS_STYLES.warning}`}
                >
                  {percent(value.value)}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MetricTable({ columns, rows, title }) {
  if (!rows?.length) {
    return <EmptyState title={`No ${title.toLowerCase()} data`} message="Adjust the filters or collect more responses." />;
  }

  return (
    <div className="overflow-x-auto rounded border border-slate-200 bg-white shadow-soft">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr>
            {columns.map((column) => (
              <th key={column.key} className="px-3 py-3 text-left font-semibold text-slate-500">
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row, index) => (
            <tr key={`${row[columns[0].key]}-${index}`} className="bg-white">
              {columns.map((column) => (
                <td key={column.key} className="px-3 py-3 align-top text-slate-700">
                  {column.render ? column.render(row[column.key], row) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RecommendationCard({ item, labelKey = 'title', bodyKey = 'detail', meta }) {
  return (
    <article className="rounded border border-slate-200 bg-white p-4 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-ink">{item[labelKey]}</h3>
          {item[bodyKey] ? <p className="mt-2 text-sm text-slate-600">{item[bodyKey]}</p> : null}
        </div>
        {meta ? meta(item) : null}
      </div>
    </article>
  );
}

function ExportCard({ title, description, actionLabel, onClick }) {
  return (
    <div className="rounded border border-slate-200 bg-white p-5 shadow-soft">
      <h3 className="text-base font-semibold text-ink">{title}</h3>
      <p className="mt-2 text-sm text-slate-500">{description}</p>
      <button onClick={onClick} className="mt-4 rounded bg-ink px-4 py-2 text-sm font-semibold text-white">
        {actionLabel}
      </button>
    </div>
  );
}

function QuestionCard({ item }) {
  if (item.type === 'text') {
    const themes = item.textAnalysis?.themes || [];
    const keywords = item.textAnalysis?.keywords || [];
    return (
      <section className="rounded border border-slate-200 bg-white p-5 shadow-soft">
        <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ocean">{item.code}</p>
            <h3 className="mt-1 text-base font-semibold text-ink">{item.question}</h3>
            <p className="mt-1 text-sm text-slate-500">{item.totalResponses} text responses analyzed and grouped into themes.</p>
          </div>
          <StatusPill status="good">Open-ended analysis</StatusPill>
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-[1.15fr,0.85fr]">
          <div className="space-y-4">
            <div className="rounded border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-ink">Categorized summary</p>
              <p className="mt-2 text-sm text-slate-600">{item.interpretation}</p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {(themes.length ? themes : [{ theme: 'No dominant theme', count: 0, percentage: 0, keywords: [] }]).slice(0, 4).map((theme) => (
                <div key={theme.theme} className="rounded border border-slate-200 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-ink">{theme.theme}</p>
                    <span className="text-sm font-semibold text-ocean">{theme.count}</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-500">{percent(theme.percentage, 2)} of grouped answers</p>
                  {theme.keywords?.length ? <p className="mt-2 text-sm text-slate-600">{theme.keywords.join(', ')}</p> : null}
                </div>
              ))}
            </div>
            <div className="space-y-3">
              {(item.textAnalysis?.groupedTopics || []).slice(0, 4).map((topic) => (
                <div key={topic.topic} className="rounded border border-slate-200 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-ink">{topic.topic}</p>
                    <span className="text-sm font-semibold text-slate-500">{topic.count}</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{percent(topic.percentage, 2)} of matching responses.</p>
                  {topic.examples?.[0] ? <p className="mt-2 text-sm italic text-slate-500">"{topic.examples[0]}"</p> : null}
                </div>
              ))}
            </div>
          </div>

          <ChartPanel title="Keyword frequency" description="Common repeated terms from grouped text answers." height="h-72">
            {keywords.length ? (
              <ResponsiveContainer>
                <BarChart data={keywords.slice(0, 10)} layout="vertical" margin={{ top: 0, right: 10, left: 24, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="keyword" width={110} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 4, 4]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState title="No keyword data" message="This question does not yet have enough text to show repeated terms." />
            )}
          </ChartPanel>
        </div>
      </section>
    );
  }

  const answers = item.answers || [];
  const topAnswer = answers[0];

  return (
    <section className="rounded border border-slate-200 bg-white p-5 shadow-soft">
      <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-ocean">{item.code}</p>
          <h3 className="mt-1 text-base font-semibold text-ink">{item.question}</h3>
          <p className="mt-1 text-sm text-slate-500">{item.totalResponses} responses with real Somali answer labels.</p>
        </div>
        <div className="rounded border border-slate-200 bg-slate-50 px-3 py-2 text-right">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Top answer</p>
          <p className="mt-1 text-sm font-semibold text-ink">{topAnswer?.answer || 'No answer'}</p>
          <p className="text-xs text-slate-500">{topAnswer ? `${topAnswer.count} responses` : ''}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[1.2fr,0.8fr]">
        <ChartPanel title="Frequency breakdown" description="Bar chart of answer counts and respondent percentages." height="h-72" className="border-0 p-0 shadow-none">
          {answers.length ? (
            <ResponsiveContainer>
              <BarChart data={answers} layout="vertical" margin={{ top: 0, right: 16, left: 24, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="answer" width={120} tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#0f7c90" radius={[4, 4, 4, 4]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState title="No answer breakdown" message="No responses matched this question under the selected filters." />
          )}
        </ChartPanel>

        <ChartPanel title="Response share" description="Donut view for quick interpretation." height="h-72" className="border-0 p-0 shadow-none">
          {answers.length ? (
            <ResponsiveContainer>
              <PieChart>
                <Pie data={answers.slice(0, 6)} dataKey="count" nameKey="answer" innerRadius={58} outerRadius={94} paddingAngle={3}>
                  {answers.slice(0, 6).map((entry, index) => <Cell key={entry.answer} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState title="No share chart" message="No responses matched this question under the selected filters." />
          )}
        </ChartPanel>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[0.95fr,1.05fr]">
        <div className="rounded border border-slate-200 p-4">
          <p className="text-sm font-semibold text-ink">Interpretation</p>
          <p className="mt-2 text-sm text-slate-600">{item.interpretation}</p>
        </div>
        <div className="rounded border border-slate-200 p-4">
          <p className="text-sm font-semibold text-ink">Label list</p>
          <div className="mt-3">
            <ProgressRows items={answers} />
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Reports() {
  const [analytics, setAnalytics] = useState(null);
  const [sectors, setSectors] = useState([]);
  const [filters, setFilters] = useState({
    sector: '',
    district: '',
    startDate: '',
    endDate: '',
    readinessLevel: '',
    awarenessLevel: '',
    willingnessLevel: ''
  });
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const queryParams = useMemo(() => cleanFilters(filters), [filters]);
  const queryString = useMemo(() => new URLSearchParams(queryParams).toString(), [queryParams]);

  const loadAnalytics = useCallback(async (params) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/analytics', { params });
      setAnalytics(normalizeAnalytics(data.analytics));
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to generate analytics right now.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const loadSectors = async () => {
      const { data } = await api.get('/sectors?includeInactive=true');
      setSectors(data.sectors || []);
    };

    loadSectors();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => loadAnalytics(queryParams), 250);
    return () => clearTimeout(timer);
  }, [loadAnalytics, queryParams]);

  const data = useMemo(() => normalizeAnalytics(analytics || {}), [analytics]);

  if (!analytics && loading) return <Loading label="Building analytics and report insights..." />;

  const overviewCards = [
    { label: 'Total Responses', value: data.totals.totalResponses },
    { label: 'Total Sectors Covered', value: data.totals.totalSectorsCovered },
    { label: 'Total Districts Covered', value: data.totals.totalDistrictsCovered },
    { label: 'Responses Today', value: data.totals.responsesToday },
    { label: 'Responses This Week', value: data.totals.responsesThisWeek },
    { label: 'Average Cloud Readiness Score', value: percent(data.totals.averageCloudReadinessScore) },
    { label: 'Awareness Rate', value: percent(data.totals.awarenessRate) },
    { label: 'Adoption Willingness Rate', value: percent(data.totals.adoptionWillingnessRate) },
    { label: 'Cloud Tools Usage Rate', value: percent(data.totals.cloudToolsUsageRate) },
    { label: 'Backup Practice Rate', value: percent(data.totals.backupPracticeRate) },
    { label: 'Infrastructure Stability Rate', value: percent(data.totals.infrastructureStabilityRate) },
    { label: 'Security Trust Rate', value: percent(data.totals.securityTrustRate) }
  ];

  const exportButtons = [
    {
      title: 'Raw Excel data',
      description: 'Export the full response workbook with real Somali answer labels and no filters applied.',
      actionLabel: 'Download raw Excel',
      onClick: () => downloadFile('/exports/responses.xlsx', 'cloud-survey-raw-responses.xlsx')
    },
    {
      title: 'Filtered Excel data',
      description: 'Export only the records that match the current sector, district, date, and readiness filters.',
      actionLabel: 'Download filtered Excel',
      onClick: () => downloadFile(`/exports/responses.xlsx?${queryString}`, 'cloud-survey-filtered-responses.xlsx')
    },
    {
      title: 'Analytics summary Excel',
      description: 'Overview metrics, factor summary, question analysis, barriers, security, and business themes.',
      actionLabel: 'Download analytics summary',
      onClick: () => downloadFile(`/exports/analytics-summary.xlsx?${queryString}`, 'cloud-survey-analytics-summary.xlsx')
    },
    {
      title: 'Sector comparison Excel',
      description: 'Sector comparison metrics, sector gaps, and sector-specific barrier summaries.',
      actionLabel: 'Download sector comparison',
      onClick: () => downloadFile(`/exports/sector-comparison.xlsx?${queryString}`, 'cloud-survey-sector-comparison.xlsx')
    },
    {
      title: 'Readiness ranking Excel',
      description: 'Sector, district, response, and factor-level readiness ranking sheets for deeper review.',
      actionLabel: 'Download readiness ranking',
      onClick: () => downloadFile(`/exports/readiness-ranking.xlsx?${queryString}`, 'cloud-survey-readiness-ranking.xlsx')
    },
    {
      title: 'Report summary export',
      description: 'Presentation-ready executive summary, top findings, barriers, opportunities, and recommendations.',
      actionLabel: 'Download report summary',
      onClick: () => downloadFile(`/exports/report-summary.xlsx?${queryString}`, 'cloud-survey-report-summary.xlsx')
    }
  ];

  const renderOverview = () => (
    <div className="space-y-6">
      <SectionLead title="Overview Analytics" description="Executive-level signals, trend-style visuals, and quick insight cards that update with the active filters." />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {overviewCards.map((item) => <StatCard key={item.label} label={item.label} value={item.value} />)}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {(data.overview.insightCards || []).map((item) => (
          <InsightCard key={item.label} label={item.label} value={item.value} helper={item.helper} />
        ))}
      </div>

      <div className="rounded border border-slate-200 bg-white p-5 shadow-soft">
        <p className="text-sm font-semibold uppercase tracking-wide text-ocean">Executive summary</p>
        <p className="mt-3 text-sm leading-6 text-slate-700">{data.overview.executiveSummary}</p>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <ChartPanel title="Daily response flow" description="Submission volume over the most recent 14-day window.">
          {data.overview.timeSeries?.dailyResponses?.length ? (
            <ResponsiveContainer>
              <AreaChart data={data.overview.timeSeries.dailyResponses}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="responses" stroke="#0f7c90" fill="#a8dbdf" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState title="No response trend" message="Response dates are not available for the active filters." />
          )}
        </ChartPanel>

        <ChartPanel title="Readiness trend" description="Average readiness movement across the same window.">
          {data.overview.timeSeries?.readinessTrend?.length ? (
            <ResponsiveContainer>
              <LineChart data={data.overview.timeSeries.readinessTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="readiness" stroke="#4f46e5" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState title="No readiness trend" message="Readiness trend data is not available for the active filters." />
          )}
        </ChartPanel>

        <ChartPanel title="Readiness distribution" description="Low, medium, and high readiness counts.">
          {data.readiness.distribution?.length ? (
            <ResponsiveContainer>
              <PieChart>
                <Pie data={data.readiness.distribution} dataKey="count" nameKey="band" innerRadius={60} outerRadius={95} paddingAngle={3}>
                  {data.readiness.distribution.map((entry) => <Cell key={entry.band} fill={BAND_COLORS[entry.band] || '#0f7c90'} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState title="No readiness distribution" message="No readiness bands are available yet." />
          )}
        </ChartPanel>

        <ChartPanel title="Factor scorecard" description="Which readiness factors are strongest and weakest overall.">
          {data.factorSummary.length ? (
            <ResponsiveContainer>
              <BarChart data={data.factorSummary} layout="vertical" margin={{ top: 0, right: 8, left: 24, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="label" width={130} tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="score" fill="#18a8a8" radius={[4, 4, 4, 4]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState title="No factor scorecard" message="Factor scores will appear once responses are available." />
          )}
        </ChartPanel>

        <ChartPanel title="Sector readiness leaderboard" description="Highest-readiness sectors under the active filters.">
          {data.readiness.sectorLeaderboard?.length ? (
            <ResponsiveContainer>
              <BarChart data={data.readiness.sectorLeaderboard.slice(0, 8)} layout="vertical" margin={{ top: 0, right: 8, left: 24, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="sector" width={140} tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="averageReadiness" fill="#0f7c90" radius={[4, 4, 4, 4]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState title="No sector ranking" message="Sector ranking appears when sector-level data exists." />
          )}
        </ChartPanel>

        <ChartPanel title="Barrier ranking" description="Top blockers to cloud adoption in the filtered dataset.">
          {data.barriers.overallRanking?.length ? (
            <ResponsiveContainer>
              <BarChart data={data.barriers.overallRanking.slice(0, 6)} layout="vertical" margin={{ top: 0, right: 8, left: 24, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="answer" width={140} tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#d14343" radius={[4, 4, 4, 4]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState title="No barrier ranking" message="Barrier data will appear once responses match the filters." />
          )}
        </ChartPanel>
      </div>

      <BulletList items={data.summaryFindings} />
    </div>
  );

  const renderResponses = () => (
    <div className="space-y-6">
      <SectionLead title="Response Analysis" description="Detailed analysis for every survey question, including grouped open-ended answers, keyword frequency, answer charts, and interpretation text." />
      {data.questionAnalysis.length ? (
        <div className="space-y-6">
          {data.questionAnalysis.map((item) => <QuestionCard key={item.code} item={item} />)}
        </div>
      ) : (
        <EmptyState title="No question analysis yet" message="Analytics will appear here once survey responses are available." />
      )}
    </div>
  );

  const renderSectors = () => (
    <div className="space-y-6">
      <SectionLead title="Sector Comparison" description="Compare sectors across awareness, tools, backup, infrastructure, trust, willingness, and overall readiness." />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <InsightCard label="Best performing sector" value={data.sectorComparison.highlights.bestPerformingSector} helper="Highest average readiness score." />
        <InsightCard label="Weakest sector" value={data.sectorComparison.highlights.weakestSector} helper="Lowest average readiness score." />
        <InsightCard label="Highest willingness sector" value={data.sectorComparison.highlights.highestWillingnessSector} helper="Highest adoption willingness score." />
        <InsightCard label="Weakest infrastructure sector" value={data.sectorComparison.highlights.weakestInfrastructureSector} helper="Lowest infrastructure readiness score." />
        <InsightCard label="Biggest security concern sector" value={data.sectorComparison.highlights.biggestSecurityConcernSector} helper="Lowest security trust score." />
        <InsightCard label="Lowest backup readiness sector" value={data.sectorComparison.highlights.lowestBackupReadinessSector} helper="Weakest backup practices score." />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <ChartPanel title="Sector readiness ranking" description="Horizontal ranking by average cloud readiness.">
          {data.sectorComparison.readinessLeaderboard?.length ? (
            <ResponsiveContainer>
              <BarChart data={data.sectorComparison.readinessLeaderboard} layout="vertical" margin={{ top: 0, right: 8, left: 24, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="sector" width={140} tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="averageReadiness" fill="#0f7c90" radius={[4, 4, 4, 4]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState title="No sector ranking" message="No sector data is available for this filter set." />
          )}
        </ChartPanel>

        <ChartPanel title="Readiness mix by sector" description="Stacked readiness shares across low, medium, and high bands.">
          {data.sectorComparison.stackedReadiness?.length ? (
            <ResponsiveContainer>
              <BarChart data={data.sectorComparison.stackedReadiness}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="sector" hide />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Low" stackId="a" fill={BAND_COLORS.Low} />
                <Bar dataKey="Medium" stackId="a" fill={BAND_COLORS.Medium} />
                <Bar dataKey="High" stackId="a" fill={BAND_COLORS.High} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState title="No readiness mix" message="Readiness band shares appear when grouped sector data exists." />
          )}
        </ChartPanel>
      </div>

      <HeatmapGrid matrix={data.sectorComparison.heatmap} label="Sector" />

      <MetricTable
        title="sector comparison"
        columns={[
          { key: 'sector', label: 'Sector' },
          { key: 'responses', label: 'Responses' },
          { key: 'cloudAwareness', label: 'Awareness', render: (value) => percent(value) },
          { key: 'cloudToolsUse', label: 'Cloud tools', render: (value) => percent(value) },
          { key: 'backupPractices', label: 'Backup', render: (value) => percent(value) },
          { key: 'infrastructureReadiness', label: 'Infrastructure', render: (value) => percent(value) },
          { key: 'securityTrust', label: 'Trust', render: (value) => percent(value) },
          { key: 'willingnessToAdopt', label: 'Willingness', render: (value) => percent(value) },
          { key: 'averageReadiness', label: 'Readiness', render: (value) => <span className="font-semibold text-ocean">{percent(value)}</span> },
          { key: 'topBarrier', label: 'Top barrier' }
        ]}
        rows={data.sectorComparison.rows}
      />
    </div>
  );

  const renderDistricts = () => (
    <div className="space-y-6">
      <SectionLead title="District Comparison" description="District-level comparison of submissions, awareness, readiness, access, infrastructure stability, and willingness to adopt." />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <InsightCard label="Best district" value={data.districtComparison.highlights.bestDistrict} helper="Highest average readiness score." />
        <InsightCard label="Weakest district" value={data.districtComparison.highlights.weakestDistrict} helper="Lowest average readiness score." />
        <InsightCard label="Highest willingness district" value={data.districtComparison.highlights.highestWillingnessDistrict} helper="Highest willingness to adopt cloud solutions." />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <ChartPanel title="District readiness ranking" description="Ranking chart by average readiness score.">
          {data.districtComparison.ranking?.length ? (
            <ResponsiveContainer>
              <BarChart data={data.districtComparison.ranking.slice(0, 10)} layout="vertical" margin={{ top: 0, right: 8, left: 24, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="district" width={120} tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="averageReadiness" fill="#4f46e5" radius={[4, 4, 4, 4]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState title="No district ranking" message="District-level data does not exist for the selected filters." />
          )}
        </ChartPanel>

        <ChartPanel title="District comparison snapshot" description="Awareness, infrastructure, and willingness side by side.">
          {data.districtComparison.rows?.length ? (
            <ResponsiveContainer>
              <BarChart data={data.districtComparison.rows.slice(0, 8)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="district" hide />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="cloudAwareness" fill="#0f7c90" />
                <Bar dataKey="infrastructureReadiness" fill="#efb036" />
                <Bar dataKey="willingnessToAdopt" fill="#1d9b5e" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState title="No district comparison" message="District comparison appears when district data exists." />
          )}
        </ChartPanel>
      </div>

      <HeatmapGrid matrix={data.districtComparison.heatmap} label="District" />

      <MetricTable
        title="district comparison"
        columns={[
          { key: 'district', label: 'District' },
          { key: 'responses', label: 'Responses' },
          { key: 'cloudAwareness', label: 'Awareness', render: (value) => percent(value) },
          { key: 'technologyUse', label: 'Technology', render: (value) => percent(value) },
          { key: 'infrastructureReadiness', label: 'Infrastructure', render: (value) => percent(value) },
          { key: 'willingnessToAdopt', label: 'Willingness', render: (value) => percent(value) },
          { key: 'averageReadiness', label: 'Readiness', render: (value) => <span className="font-semibold text-ocean">{percent(value)}</span> }
        ]}
        rows={data.districtComparison.rows}
      />
    </div>
  );

  const renderReadiness = () => (
    <div className="space-y-6">
      <SectionLead title="Cloud Readiness Analysis" description="A major readiness workspace with distribution, factor radar, score interpretation, and opportunity or alert views." />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Overall readiness average" value={percent(data.readiness.overallAverage)} />
        <StatCard label="Low readiness responses" value={data.totals.lowReadinessCount} />
        <StatCard label="Medium readiness responses" value={data.totals.mediumReadinessCount} />
        <StatCard label="High readiness responses" value={data.totals.highReadinessCount} />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <ChartPanel title="Readiness distribution chart" description="Distribution across low, medium, and high readiness categories.">
          {data.readiness.distribution?.length ? (
            <ResponsiveContainer>
              <BarChart data={data.readiness.distribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="band" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {data.readiness.distribution.map((entry) => <Cell key={entry.band} fill={BAND_COLORS[entry.band] || '#0f7c90'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState title="No readiness distribution" message="No readiness distribution data is available." />
          )}
        </ChartPanel>

        <ChartPanel title="Radar score display" description="Cloud readiness factor profile across the current filtered dataset.">
          {data.readiness.radar?.length ? (
            <ResponsiveContainer>
              <RadarChart data={data.readiness.radar}>
                <PolarGrid />
                <PolarAngleAxis dataKey="factor" />
                <PolarRadiusAxis angle={30} domain={[0, 100]} />
                <Radar name="Score" dataKey="score" stroke="#0f7c90" fill="#0f7c90" fillOpacity={0.35} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState title="No radar data" message="Factor radar data is not available for the current filters." />
          )}
        </ChartPanel>

        <ChartPanel title="Low-readiness alert chart" description="Sectors that need the most support first.">
          {data.readiness.lowReadinessAlerts?.length ? (
            <ResponsiveContainer>
              <BarChart data={data.readiness.lowReadinessAlerts} layout="vertical" margin={{ top: 0, right: 8, left: 24, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="sector" width={140} tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="averageReadiness" fill="#d14343" radius={[4, 4, 4, 4]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState title="No alert sectors" message="Low-readiness alerts appear when grouped sector data is available." />
          )}
        </ChartPanel>

        <ChartPanel title="High-readiness opportunity chart" description="Sectors that can move faster into broader cloud adoption.">
          {data.readiness.highReadinessOpportunities?.length ? (
            <ResponsiveContainer>
              <BarChart data={data.readiness.highReadinessOpportunities} layout="vertical" margin={{ top: 0, right: 8, left: 24, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="sector" width={140} tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="averageReadiness" fill="#1d9b5e" radius={[4, 4, 4, 4]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState title="No opportunity sectors" message="Opportunity sectors appear when sector-level data is available." />
          )}
        </ChartPanel>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="rounded border border-slate-200 bg-white p-5 shadow-soft">
          <p className="text-sm font-semibold uppercase tracking-wide text-ocean">Interpretation</p>
          <p className="mt-3 text-sm leading-6 text-slate-700">{data.readiness.interpretation}</p>
          <p className="mt-3 text-sm leading-6 text-slate-600">{data.readiness.explanation}</p>
        </div>
        <MetricTable
          title="readiness factor breakdown"
          columns={[
            { key: 'label', label: 'Factor' },
            { key: 'score', label: 'Score', render: (value) => percent(value) }
          ]}
          rows={data.readiness.factorBreakdown}
        />
      </div>

      <MetricTable
        title="response ranking"
        columns={[
          { key: 'organizationName', label: 'Organization' },
          { key: 'sector', label: 'Sector' },
          { key: 'district', label: 'District' },
          { key: 'readinessBand', label: 'Band', render: (value) => <StatusPill status={value === 'High' ? 'good' : value === 'Medium' ? 'warning' : 'critical'}>{value}</StatusPill> },
          { key: 'readinessScore', label: 'Readiness', render: (value) => <span className="font-semibold text-ocean">{percent(value)}</span> }
        ]}
        rows={data.readiness.responseRanking}
      />
    </div>
  );

  const renderGaps = () => (
    <div className="space-y-6">
      <SectionLead title="Gap Analysis" description="Current state versus ideal cloud-ready state, with sector and district gaps highlighted using strong status signals." />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {(data.gapAnalysis.overall || []).map((item) => (
          <div key={item.factor} className="rounded border border-slate-200 bg-white p-4 shadow-soft">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-ink">{item.label}</p>
                <p className="mt-1 text-xs text-slate-500">Current {percent(item.current)} vs ideal {percent(item.ideal)}</p>
              </div>
              <StatusPill status={item.status}>{percent(item.gap)} gap</StatusPill>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <ChartPanel title="Gap bar chart" description="Distance from ideal for each readiness factor.">
          {data.gapAnalysis.overall?.length ? (
            <ResponsiveContainer>
              <BarChart data={data.gapAnalysis.overall}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" hide />
                <YAxis />
                <Tooltip />
                <Bar dataKey="gap" fill="#d14343" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState title="No gap chart" message="Gap analysis will appear here when data is available." />
          )}
        </ChartPanel>

        <ChartPanel title="Progress to ideal chart" description="Current score versus ideal target for each factor.">
          {data.gapAnalysis.progressToIdeal?.length ? (
            <ResponsiveContainer>
              <BarChart data={data.gapAnalysis.progressToIdeal}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" hide />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="current" fill="#0f7c90" />
                <Bar dataKey="ideal" fill="#cbd5e1" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState title="No progress chart" message="Progress-to-ideal data is not available." />
          )}
        </ChartPanel>
      </div>

      <MetricTable
        title="sector gaps"
        columns={[
          { key: 'sector', label: 'Sector' },
          { key: 'responses', label: 'Responses' },
          { key: 'averageReadiness', label: 'Readiness', render: (value) => percent(value) },
          { key: 'largestGapFactor', label: 'Largest gap factor' },
          { key: 'largestGap', label: 'Largest gap', render: (value) => <StatusPill status={numberValue(value) > 40 ? 'critical' : numberValue(value) > 20 ? 'warning' : 'good'}>{percent(value)}</StatusPill> }
        ]}
        rows={data.gapAnalysis.sectorGaps}
      />

      <MetricTable
        title="district gaps"
        columns={[
          { key: 'district', label: 'District' },
          { key: 'responses', label: 'Responses' },
          { key: 'averageReadiness', label: 'Readiness', render: (value) => percent(value) },
          { key: 'largestGapFactor', label: 'Largest gap factor' },
          { key: 'largestGap', label: 'Largest gap', render: (value) => <StatusPill status={numberValue(value) > 40 ? 'critical' : numberValue(value) > 20 ? 'warning' : 'good'}>{percent(value)}</StatusPill> }
        ]}
        rows={data.gapAnalysis.districtGaps}
      />

      <BulletList items={(data.gapAnalysis.narrative || []).filter(Boolean)} />
    </div>
  );

  const renderInfrastructure = () => (
    <div className="space-y-6">
      <SectionLead title="Infrastructure Analysis" description="Internet quality, electricity continuity, interruption frequency, and infrastructure readiness by sector." />

      <div className="grid gap-5 xl:grid-cols-2">
        <ChartPanel title="Internet quality" description="Distribution of reported internet quality levels.">
          {data.infrastructure.internetQuality?.length ? (
            <ResponsiveContainer>
              <BarChart data={data.infrastructure.internetQuality}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="answer" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#0ea5e9" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState title="No internet quality chart" message="No internet quality responses are available." />
          )}
        </ChartPanel>

        <ChartPanel title="Electricity continuity" description="Pie-style view of electricity availability.">
          {data.infrastructure.electricityAvailability?.length ? (
            <ResponsiveContainer>
              <PieChart>
                <Pie data={data.infrastructure.electricityAvailability} dataKey="count" nameKey="answer" innerRadius={58} outerRadius={94}>
                  {data.infrastructure.electricityAvailability.map((entry, index) => <Cell key={entry.answer} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState title="No electricity chart" message="No electricity continuity responses are available." />
          )}
        </ChartPanel>

        <ChartPanel title="Interruption frequency" description="How often power loss interrupts work.">
          {data.infrastructure.interruptionFrequency?.length ? (
            <ResponsiveContainer>
              <BarChart data={data.infrastructure.interruptionFrequency}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="answer" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#efb036" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState title="No interruption chart" message="No interruption frequency responses are available." />
          )}
        </ChartPanel>

        <ChartPanel title="Sector-wise infrastructure" description="Internet quality, electricity continuity, and readiness compared by sector.">
          {data.infrastructure.sectorComparison?.length ? (
            <ResponsiveContainer>
              <BarChart data={data.infrastructure.sectorComparison.slice(0, 8)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="sector" hide />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="internetQuality" fill="#0ea5e9" />
                <Bar dataKey="powerStability" fill="#efb036" />
                <Bar dataKey="infrastructureReadiness" fill="#0f7c90" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState title="No sector infrastructure chart" message="Sector infrastructure data is not available." />
          )}
        </ChartPanel>
      </div>

      <HeatmapGrid matrix={data.infrastructure.heatmap} label="Sector" />

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="rounded border border-slate-200 bg-white p-5 shadow-soft xl:col-span-2">
          <p className="text-sm font-semibold uppercase tracking-wide text-ocean">Infrastructure risk summary</p>
          <div className="mt-4">
            <BulletList items={data.infrastructure.riskSummary} />
          </div>
        </div>
        <div className="space-y-4">
          <div className="rounded border border-slate-200 bg-white p-4 shadow-soft">
            <p className="text-sm font-semibold text-ink">Most affected by internet issues</p>
            <div className="mt-3 space-y-2 text-sm text-slate-600">
              {(data.infrastructure.mostAffectedInternet || []).map((item) => <p key={item.sector}>{item.sector}: {percent(item.internetQuality)}</p>)}
            </div>
          </div>
          <div className="rounded border border-slate-200 bg-white p-4 shadow-soft">
            <p className="text-sm font-semibold text-ink">Most affected by power instability</p>
            <div className="mt-3 space-y-2 text-sm text-slate-600">
              {(data.infrastructure.mostAffectedPower || []).map((item) => <p key={item.sector}>{item.sector}: {percent(item.powerStability)}</p>)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSecurity = () => (
    <div className="space-y-6">
      <SectionLead title="Security & Trust Analysis" description="Trust in cloud storage, top security fears, sector trust differences, and trust-building recommendations." />

      <div className="grid gap-5 xl:grid-cols-2">
        <ChartPanel title="Trust level distribution" description="How respondents feel about storing data in the cloud.">
          {data.security.trustLevels?.length ? (
            <ResponsiveContainer>
              <PieChart>
                <Pie data={data.security.trustLevels} dataKey="count" nameKey="answer" innerRadius={60} outerRadius={95}>
                  {data.security.trustLevels.map((entry, index) => <Cell key={entry.answer} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState title="No trust chart" message="Trust distribution will appear once responses are available." />
          )}
        </ChartPanel>

        <ChartPanel title="Security concern frequency" description="Most repeated cloud security fears.">
          {data.security.securityConcerns?.length ? (
            <ResponsiveContainer>
              <BarChart data={data.security.securityConcerns} layout="vertical" margin={{ top: 0, right: 8, left: 24, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="answer" width={130} tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#d14343" radius={[4, 4, 4, 4]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState title="No concern chart" message="Security concern data is not available for the current filters." />
          )}
        </ChartPanel>
      </div>

      <ChartPanel title="Sector trust comparison" description="Compare security trust by sector.">
        {data.security.sectorTrustComparison?.length ? (
          <ResponsiveContainer>
            <BarChart data={data.security.sectorTrustComparison.slice(0, 10)} layout="vertical" margin={{ top: 0, right: 8, left: 24, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis type="category" dataKey="sector" width={140} tickLine={false} axisLine={false} />
              <Tooltip />
              <Bar dataKey="securityTrust" fill="#4f46e5" radius={[4, 4, 4, 4]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState title="No sector trust comparison" message="Sector trust comparison needs grouped sector data." />
        )}
      </ChartPanel>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="rounded border border-slate-200 bg-white p-5 shadow-soft xl:col-span-2">
          <p className="text-sm font-semibold uppercase tracking-wide text-ocean">Key security fears summary</p>
          <div className="mt-4">
            <BulletList items={data.security.fearSummary} />
          </div>
        </div>
        <div className="space-y-4">
          {(data.security.trustBuildingRecommendations || []).map((item) => (
            <div key={item} className="rounded border border-slate-200 bg-white p-4 shadow-soft">
              <p className="text-sm font-semibold text-ink">Trust-building recommendation</p>
              <p className="mt-2 text-sm text-slate-600">{item}</p>
            </div>
          ))}
        </div>
      </div>

      <MetricTable
        title="top concern leaderboard"
        columns={[
          { key: 'answer', label: 'Concern' },
          { key: 'count', label: 'Count' },
          { key: 'percentage', label: 'Respondent share', render: (value) => percent(value, 2) }
        ]}
        rows={data.security.topConcernLeaderboard}
      />
    </div>
  );

  const renderBarriers = () => (
    <div className="space-y-6">
      <SectionLead title="Barriers & Challenges Analysis" description="What blocks adoption most overall, by sector, and by district, with strong visuals and challenge summaries." />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {(data.barriers.topFiveChallenges || []).map((item) => (
          <InsightCard key={item.answer} label={item.answer} value={item.count} helper={`${percent(item.percentage, 2)} of respondents selected this challenge`} />
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <ChartPanel title="Barrier ranking chart" description="Overall ranking of adoption blockers.">
          {data.barriers.overallRanking?.length ? (
            <ResponsiveContainer>
              <BarChart data={data.barriers.overallRanking} layout="vertical" margin={{ top: 0, right: 8, left: 24, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="answer" width={140} tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#d14343" radius={[4, 4, 4, 4]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState title="No barrier ranking" message="Barrier ranking appears when challenge responses are available." />
          )}
        </ChartPanel>

        <ChartPanel title="Training and skills gap snapshot" description="Training need and skills gap rates by sector.">
          {data.barriers.bySector?.length ? (
            <ResponsiveContainer>
              <BarChart data={data.barriers.bySector.slice(0, 8)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="sector" hide />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="trainingNeedRate" fill="#efb036" />
                <Bar dataKey="skillsGapRate" fill="#4f46e5" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState title="No challenge comparison" message="Sector challenge comparison will appear when grouped sector data is available." />
          )}
        </ChartPanel>
      </div>

      <MetricTable
        title="sector challenges"
        columns={[
          { key: 'sector', label: 'Sector' },
          { key: 'topBarrier', label: 'Top barrier' },
          { key: 'trainingNeedRate', label: 'Training need', render: (value) => percent(value) },
          { key: 'skillsGapRate', label: 'Skills gap', render: (value) => percent(value) },
          { key: 'averageReadiness', label: 'Readiness', render: (value) => percent(value) }
        ]}
        rows={data.barriers.bySector}
      />

      <MetricTable
        title="district blockers"
        columns={[
          { key: 'district', label: 'District' },
          { key: 'topBarrier', label: 'Biggest adoption blocker by district' }
        ]}
        rows={data.barriers.byDistrict}
      />
    </div>
  );

  const renderBusinessNeeds = () => (
    <div className="space-y-6">
      <SectionLead title="Business Needs & Expectations" description="Digital needs, willingness, desired services, future views, recommendation themes, and grouped open-ended insights." />

      <div className="grid gap-5 xl:grid-cols-2">
        <ChartPanel title="Need for modern digital systems" description="How strongly respondents say they need modern digital tools.">
          {data.businessNeeds.digitalNeeds?.length ? (
            <ResponsiveContainer>
              <PieChart>
                <Pie data={data.businessNeeds.digitalNeeds} dataKey="count" nameKey="answer" innerRadius={58} outerRadius={94}>
                  {data.businessNeeds.digitalNeeds.map((entry, index) => <Cell key={entry.answer} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState title="No digital-needs chart" message="Digital needs data is not available for the current filters." />
          )}
        </ChartPanel>

        <ChartPanel title="Willingness to adopt" description="Cloud adoption willingness using real Somali response labels.">
          {data.businessNeeds.willingness?.length ? (
            <ResponsiveContainer>
              <PieChart>
                <Pie data={data.businessNeeds.willingness} dataKey="count" nameKey="answer" innerRadius={58} outerRadius={94}>
                  {data.businessNeeds.willingness.map((entry, index) => <Cell key={entry.answer} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState title="No willingness chart" message="Willingness data is not available for the current filters." />
          )}
        </ChartPanel>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {(data.businessNeeds.themeCards || []).map((item) => (
          <InsightCard key={item.theme} label={item.theme} value={item.count} helper="Recurring theme in open-ended responses." />
        ))}
      </div>

      <ChartPanel title="Keyword summary chart" description="Most repeated business-needs and recommendation keywords from open-ended answers.">
        {data.businessNeeds.keywordChart?.length ? (
          <ResponsiveContainer>
            <BarChart data={data.businessNeeds.keywordChart} layout="vertical" margin={{ top: 0, right: 8, left: 24, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis type="category" dataKey="keyword" width={130} tickLine={false} axisLine={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 4, 4]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState title="No keyword summary" message="Keyword summary needs open-ended responses." />
        )}
      </ChartPanel>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="rounded border border-slate-200 bg-white p-5 shadow-soft">
          <p className="text-sm font-semibold uppercase tracking-wide text-ocean">Grouped topic blocks</p>
          <div className="mt-4 space-y-3">
            {(data.businessNeeds.groupedTopicBlocks || []).map((topic, index) => (
              <div key={`${topic.question}-${topic.topic}-${index}`} className="rounded border border-slate-200 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{topic.question}</p>
                <p className="mt-1 font-semibold text-ink">{topic.topic}</p>
                <p className="mt-2 text-sm text-slate-500">{topic.count} grouped mentions</p>
                {topic.examples?.[0] ? <p className="mt-2 text-sm italic text-slate-600">"{topic.examples[0]}"</p> : null}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded border border-slate-200 bg-white p-5 shadow-soft">
          <p className="text-sm font-semibold uppercase tracking-wide text-ocean">Text insight summaries</p>
          <div className="mt-4">
            <BulletList items={data.businessNeeds.insightSummaries} />
          </div>
        </div>
      </div>
    </div>
  );

  const renderRecommendations = () => (
    <div className="space-y-6">
      <SectionLead title="Recommendations" description="Overall, sector-specific, and district-specific recommendations generated from readiness, barriers, trust, and open-ended feedback." />

      <div className="grid gap-4 xl:grid-cols-2">
        {(data.recommendationBlocks.overall || []).map((item) => (
          <RecommendationCard
            key={item.title}
            item={item}
            meta={(entry) => <StatusPill status={entry.priority === 'High' ? 'critical' : 'warning'}>{entry.priority}</StatusPill>}
          />
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="space-y-4">
          <SectionLead title="Sector-specific" description="Recommended next actions for weaker sectors." />
          {(data.recommendationBlocks.sectorSpecific || []).map((item) => (
            <RecommendationCard
              key={item.sector}
              item={{ title: item.sector, detail: item.recommendation, priority: item.priority }}
              meta={(entry) => <StatusPill status={entry.priority === 'High' ? 'critical' : 'warning'}>{entry.priority}</StatusPill>}
            />
          ))}
        </div>

        <div className="space-y-4">
          <SectionLead title="District-specific" description="Recommended next actions for weaker districts." />
          {(data.recommendationBlocks.districtSpecific || []).map((item) => (
            <RecommendationCard
              key={item.district}
              item={{ title: item.district, detail: item.recommendation, priority: item.priority }}
              meta={(entry) => <StatusPill status={entry.priority === 'High' ? 'critical' : 'warning'}>{entry.priority}</StatusPill>}
            />
          ))}
        </div>
      </div>
    </div>
  );

  const renderExports = () => (
    <div className="space-y-6">
      <SectionLead title="Export Center" description="Download raw, filtered, analytical, comparison, readiness, and presentation-ready report exports using the same real Somali answer labels visible on screen." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {exportButtons.map((item) => <ExportCard key={item.title} {...item} />)}
      </div>
    </div>
  );

  const renderPresentation = () => (
    <div className="space-y-6">
      <div className="rounded border border-slate-200 bg-white p-6 shadow-soft sm:p-8">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-ocean">Presentation Report View</p>
            <h2 className="mt-2 text-2xl font-bold text-ink">{data.reportView.title}</h2>
            <p className="mt-2 text-sm text-slate-500">{data.reportView.subtitle}</p>
          </div>
          <button onClick={() => window.print()} className="rounded border border-slate-300 bg-white px-4 py-2 text-sm font-semibold">
            Print presentation view
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Responses" value={data.totals.totalResponses} />
          <StatCard label="Readiness average" value={percent(data.totals.averageCloudReadinessScore)} />
          <StatCard label="Awareness rate" value={percent(data.totals.awarenessRate)} />
          <StatCard label="Willingness rate" value={percent(data.totals.adoptionWillingnessRate)} />
        </div>

        <div className="mt-6 rounded border border-slate-200 bg-slate-50 p-5">
          <p className="text-sm font-semibold text-ink">Executive summary</p>
          <p className="mt-3 text-sm leading-6 text-slate-700">{data.reportView.executiveSummary}</p>
        </div>

        <div className="mt-6 grid gap-5 xl:grid-cols-2">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-ocean">Key findings</p>
            <div className="mt-3">
              <BulletList items={data.reportView.keyFindings} />
            </div>
          </div>
          <ChartPanel title="Top charts" description="Readiness ranking in a presentation-friendly format." className="shadow-none">
            {data.reportView.readinessRanking?.length ? (
              <ResponsiveContainer>
                <BarChart data={data.reportView.readinessRanking} layout="vertical" margin={{ top: 0, right: 8, left: 24, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="sector" width={150} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Bar dataKey="averageReadiness" fill="#0f7c90" radius={[4, 4, 4, 4]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState title="No presentation chart" message="No readiness ranking data is available." />
            )}
          </ChartPanel>
        </div>

        {Object.values(data.chartFiles || {}).filter(Boolean).length ? (
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {Object.entries(data.chartFiles)
              .filter(([, src]) => src)
              .slice(0, 4)
              .map(([name, src]) => (
                <div key={name} className="rounded border border-slate-200 p-3">
                  <img src={src} alt={name} className="w-full rounded" />
                </div>
              ))}
          </div>
        ) : null}

        <div className="mt-6 grid gap-5 xl:grid-cols-3">
          <div className="rounded border border-slate-200 p-5">
            <p className="text-sm font-semibold uppercase tracking-wide text-ocean">Top barriers</p>
            <div className="mt-3 space-y-2 text-sm text-slate-600">
              {(data.reportView.topBarriers || []).map((item) => <p key={item.answer}>{item.answer}: {item.count}</p>)}
            </div>
          </div>
          <div className="rounded border border-slate-200 p-5">
            <p className="text-sm font-semibold uppercase tracking-wide text-ocean">Top opportunities</p>
            <div className="mt-3 space-y-2 text-sm text-slate-600">
              {(data.reportView.topOpportunities || []).map((item) => <p key={item.sector}>{item.sector}: {percent(item.averageReadiness)}</p>)}
            </div>
          </div>
          <div className="rounded border border-slate-200 p-5">
            <p className="text-sm font-semibold uppercase tracking-wide text-ocean">Conclusion</p>
            <p className="mt-3 text-sm leading-6 text-slate-700">{data.reportView.conclusion}</p>
          </div>
        </div>

        <div className="mt-6 rounded border border-slate-200 p-5">
          <p className="text-sm font-semibold uppercase tracking-wide text-ocean">Recommendations</p>
          <div className="mt-3">
            <BulletList items={data.reportView.recommendations} />
          </div>
        </div>
      </div>
    </div>
  );

  const tabContent = {
    overview: renderOverview(),
    responses: renderResponses(),
    sectors: renderSectors(),
    districts: renderDistricts(),
    readiness: renderReadiness(),
    gaps: renderGaps(),
    infrastructure: renderInfrastructure(),
    security: renderSecurity(),
    barriers: renderBarriers(),
    business: renderBusinessNeeds(),
    recommendations: renderRecommendations(),
    exports: renderExports(),
    presentation: renderPresentation()
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-ocean">Admin module</p>
          <h1 className="mt-1 text-2xl font-bold text-ink">Analytics & Reports</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-500">
            A richer analytics and reporting workspace for cloud survey responses, with sector comparison, district comparison, readiness, gaps, barriers, security, recommendations, exports, and presentation-ready summaries.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => downloadFile(`/exports/analytics-summary.xlsx?${queryString}`, 'cloud-survey-analytics-summary.xlsx')} className="rounded border border-slate-300 bg-white px-4 py-2 text-sm font-semibold">
            Analytics summary
          </button>
          <button onClick={() => downloadFile(`/exports/report-summary.xlsx?${queryString}`, 'cloud-survey-report-summary.xlsx')} className="rounded bg-ink px-4 py-2 text-sm font-semibold text-white">
            Presentation export
          </button>
        </div>
      </div>

      <section className="rounded border border-slate-200 bg-white p-4 shadow-soft sm:p-5">
        <div className="mb-4 flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-ink">Interactive filters</p>
            <p className="text-sm text-slate-500">Charts, cards, tables, insights, and recommendations update automatically when filters change.</p>
          </div>
          {loading && analytics ? <p className="text-sm font-medium text-ocean">Refreshing analytics...</p> : null}
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-8">
          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Sector</span>
            <select className="w-full rounded border border-slate-300 px-3 py-2 text-sm" value={filters.sector} onChange={(e) => setFilters((current) => ({ ...current, sector: e.target.value }))}>
              <option value="">All sectors</option>
              {sectors.map((sector) => <option key={sector._id} value={sector._id}>{sector.name}</option>)}
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">District</span>
            <select className="w-full rounded border border-slate-300 px-3 py-2 text-sm" value={filters.district} onChange={(e) => setFilters((current) => ({ ...current, district: e.target.value }))}>
              <option value="">All districts</option>
              {(data.filterOptions.districts || []).map((district) => <option key={district} value={district}>{district}</option>)}
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Start date</span>
            <input type="date" className="w-full rounded border border-slate-300 px-3 py-2 text-sm" value={filters.startDate} onChange={(e) => setFilters((current) => ({ ...current, startDate: e.target.value }))} />
          </label>

          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">End date</span>
            <input type="date" className="w-full rounded border border-slate-300 px-3 py-2 text-sm" value={filters.endDate} onChange={(e) => setFilters((current) => ({ ...current, endDate: e.target.value }))} />
          </label>

          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Readiness level</span>
            <select className="w-full rounded border border-slate-300 px-3 py-2 text-sm" value={filters.readinessLevel} onChange={(e) => setFilters((current) => ({ ...current, readinessLevel: e.target.value }))}>
              <option value="">All readiness bands</option>
              {(data.filterOptions.readinessLevels || []).map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Awareness level</span>
            <select className="w-full rounded border border-slate-300 px-3 py-2 text-sm" value={filters.awarenessLevel} onChange={(e) => setFilters((current) => ({ ...current, awarenessLevel: e.target.value }))}>
              <option value="">All awareness levels</option>
              {(data.filterOptions.awarenessLevels || []).map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Willingness level</span>
            <select className="w-full rounded border border-slate-300 px-3 py-2 text-sm" value={filters.willingnessLevel} onChange={(e) => setFilters((current) => ({ ...current, willingnessLevel: e.target.value }))}>
              <option value="">All willingness levels</option>
              {(data.filterOptions.willingnessLevels || []).map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>

          <div className="flex items-end">
            <button
              onClick={() => setFilters({ sector: '', district: '', startDate: '', endDate: '', readinessLevel: '', awarenessLevel: '', willingnessLevel: '' })}
              className="w-full rounded border border-slate-300 bg-white px-4 py-2 text-sm font-semibold"
            >
              Clear filters
            </button>
          </div>
        </div>
      </section>

      {error ? (
        <div className="rounded border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <div className="flex min-w-max gap-2">
          {TAB_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`rounded border px-4 py-2 text-sm font-semibold ${
                activeTab === item.id ? 'border-ocean bg-ocean text-white' : 'border-slate-200 bg-white text-slate-600 hover:text-ink'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div>{tabContent[activeTab]}</div>
    </div>
  );
}
