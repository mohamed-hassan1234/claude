import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  BarChart3,
  CalendarRange,
  CheckCircle2,
  CircleGauge,
  Filter,
  PieChart as PieChartIcon,
  RefreshCw,
  Search,
  TrendingUp
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import api from '../api/axios';
import ChartPanel from '../components/ui/ChartPanel';
import EmptyState from '../components/ui/EmptyState';
import Loading from '../components/ui/Loading';
import StatCard from '../components/ui/StatCard';

const OVERVIEW_TAB_ID = 'overview';
const FINAL_TAB_ID = 'final-report';
const COLORS = ['#0f7c90', '#14b8a6', '#64748b', '#f59e0b', '#ef4444', '#6366f1', '#84cc16', '#0ea5e9'];
const PANEL_CLASS = 'rounded border border-slate-200 bg-white p-4 shadow-soft sm:p-5';
const numberFormatter = new Intl.NumberFormat('en-US');

const formatCount = (value) => numberFormatter.format(Number(value || 0));
const formatPercent = (value) => `${Number(value || 0).toFixed(Number(value || 0) % 1 === 0 ? 0 : 1)}%`;
const compactLabel = (value, max = 22) => {
  const text = String(value || 'N/A');
  return text.length > max ? `${text.slice(0, max - 3)}...` : text;
};

const getLabel = (item = {}) =>
  item.label ||
  item.answer ||
  item.name ||
  item.band ||
  item.sector ||
  item.district ||
  item.topic ||
  item.theme ||
  item.keyword ||
  item.question ||
  'N/A';

const getValue = (item = {}) =>
  Number(
    item.count ??
      item.value ??
      item.responses ??
      item.submissions ??
      item.averageReadiness ??
      item.score ??
      item.percentage ??
      0
  );

const toChartRows = (rows = [], options = {}) =>
  (Array.isArray(rows) ? rows : [])
    .map((item) => ({
      ...item,
      label: options.label ? options.label(item) : getLabel(item),
      value: options.value ? Number(options.value(item) || 0) : getValue(item)
    }))
    .filter((item) => item.label && Number.isFinite(item.value));

const sortRows = (rows = []) => [...rows].sort((left, right) => getValue(right) - getValue(left));

const buildQueryParams = (filters) => {
  const params = {};
  if (filters.sector) params.sector = filters.sector;
  if (filters.district) params.district = filters.district;
  if (filters.startDate) params.startDate = filters.startDate;
  if (filters.endDate) params.endDate = filters.endDate;
  return params;
};

const buildCacheKey = (tab, filters) => `${tab}::${new URLSearchParams(buildQueryParams(filters)).toString()}`;

function useMediaQuery(query) {
  const getMatch = () => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia(query).matches;
  };

  const [matches, setMatches] = useState(getMatch);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const mediaQuery = window.matchMedia(query);
    const handleChange = (event) => setMatches(event.matches);

    setMatches(mediaQuery.matches);
    mediaQuery.addEventListener?.('change', handleChange);
    return () => mediaQuery.removeEventListener?.('change', handleChange);
  }, [query]);

  return matches;
}

function ScopeChip({ label }) {
  return <span className="rounded bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">{label}</span>;
}

function FilterHeader({ filters, sectors, districts, onChange, onClear, onRefresh, refreshing }) {
  const hasFilters = Object.values(filters).some(Boolean);
  const selectedSector = sectors.find((sector) => (sector._id || sector.name) === filters.sector);

  return (
    <section className="relative rounded border border-slate-200 bg-white shadow-soft">
      <div className="border-b border-slate-200 p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">Analytics and Reports</p>
            <h1 className="mt-2 text-2xl font-bold text-ink sm:text-3xl">Cloud readiness intelligence</h1>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-500">
              Survey results organized into clear KPIs, distribution charts, rankings, and decision-ready findings.
            </p>
          </div>
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex w-full items-center justify-center gap-2 rounded border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-teal-600 hover:text-teal-700 sm:w-auto"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-4">
        <label className="block">
          <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-600">
            <Filter size={15} />
            Sector
          </span>
          <select
            value={filters.sector}
            onChange={(event) => onChange('sector', event.target.value)}
            className="w-full rounded border border-slate-300 bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-teal-600"
          >
            <option value="">All sectors</option>
            {sectors.map((sector) => (
              <option key={sector._id || sector.name} value={sector._id || sector.name}>
                {sector.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-600">
            <Search size={15} />
            District
          </span>
          <select
            value={filters.district}
            onChange={(event) => onChange('district', event.target.value)}
            className="w-full rounded border border-slate-300 bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-teal-600"
          >
            <option value="">All districts</option>
            {districts.map((district) => (
              <option key={district} value={district}>
                {district}
              </option>
            ))}
          </select>
        </label>

        <DateField label="Start date" value={filters.startDate} onChange={(value) => onChange('startDate', value)} />
        <DateField label="End date" value={filters.endDate} onChange={(value) => onChange('endDate', value)} />
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-slate-200 px-4 py-3 sm:px-6">
        {hasFilters ? (
          <>
            {filters.sector ? <ScopeChip label={`Sector: ${selectedSector?.name || filters.sector}`} /> : null}
            {filters.district ? <ScopeChip label={`District: ${filters.district}`} /> : null}
            {filters.startDate ? <ScopeChip label={`From: ${filters.startDate}`} /> : null}
            {filters.endDate ? <ScopeChip label={`To: ${filters.endDate}`} /> : null}
            <button
              type="button"
              onClick={onClear}
              className="rounded border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
            >
              Clear
            </button>
          </>
        ) : (
          <p className="text-sm text-slate-500">Showing all available responses.</p>
        )}
      </div>
    </section>
  );
}

function DateField({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-600">
        <CalendarRange size={15} />
        {label}
      </span>
      <input
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded border border-slate-300 bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-teal-600"
      />
    </label>
  );
}

function TabBar({ tabs, activeTab, onSelect }) {
  return (
    <section className="rounded border border-slate-200 bg-white p-2 shadow-soft">
      <div className="sm:hidden">
        <select
          value={activeTab}
          onChange={(event) => onSelect(event.target.value)}
          className="w-full rounded border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-ink outline-none transition focus:border-teal-600"
        >
          {tabs.map((tab) => (
            <option key={tab.id} value={tab.id}>
              {tab.label}
            </option>
          ))}
        </select>
      </div>
      <div className="hidden overflow-x-auto sm:block">
        <div className="flex min-w-max gap-2">
          {tabs.map((tab) => {
            const active = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSelect(tab.id)}
                className={`rounded px-4 py-2.5 text-sm font-semibold transition ${
                  active ? 'bg-teal-700 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function SectionHeader({ eyebrow, title, description, icon: Icon = BarChart3 }) {
  return (
    <section className="rounded border border-slate-200 bg-white p-5 shadow-soft sm:p-6">
      <div className="flex gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded bg-teal-50 text-teal-700">
          <Icon size={22} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">{eyebrow}</p>
          <h2 className="mt-1 text-xl font-bold text-ink sm:text-2xl">{title}</h2>
          {description ? <p className="mt-2 max-w-4xl text-sm leading-7 text-slate-500">{description}</p> : null}
        </div>
      </div>
    </section>
  );
}

function KpiGrid({ items = [], limit }) {
  const visibleItems = limit ? items.slice(0, limit) : items;

  if (!visibleItems.length) return null;

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {visibleItems.map((item, index) => (
        <StatCard key={`${item.label}-${index}`} label={item.label} value={item.value} helper={item.helper} />
      ))}
    </div>
  );
}

function SmartBarChart({ title, description, data, horizontal = false, color = '#0f7c90', valueName = 'Responses', height = 'h-80' }) {
  const isCompact = useMediaQuery('(max-width: 767px)');
  const rows = toChartRows(data).slice(0, 12);

  if (!rows.length) {
    return <EmptyState title={title} message="No chart data is available for the selected filters." />;
  }

  return (
    <ChartPanel title={title} description={description} height={height}>
      <ResponsiveContainer>
        <BarChart
          data={rows}
          layout={horizontal ? 'vertical' : 'horizontal'}
          margin={{ top: 8, right: 20, left: horizontal ? 8 : 0, bottom: horizontal ? 8 : 28 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          {horizontal ? (
            <>
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
              <YAxis
                type="category"
                dataKey="label"
                width={isCompact ? 104 : 158}
                tick={{ fontSize: isCompact ? 11 : 12 }}
                tickFormatter={(value) => compactLabel(value, isCompact ? 14 : 24)}
              />
            </>
          ) : (
            <>
              <XAxis
                dataKey="label"
                interval={0}
                tick={{ fontSize: isCompact ? 11 : 12 }}
                tickFormatter={(value) => compactLabel(value, isCompact ? 10 : 16)}
                angle={rows.length > 4 ? -24 : 0}
                textAnchor={rows.length > 4 ? 'end' : 'middle'}
              />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
            </>
          )}
          <Tooltip formatter={(value) => [formatCount(value), valueName]} labelFormatter={(value) => value} />
          <Bar dataKey="value" name={valueName} fill={color} radius={horizontal ? [0, 6, 6, 0] : [6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartPanel>
  );
}

function DonutChart({ title, description, data, valueName = 'Responses', height = 'h-80' }) {
  const rows = toChartRows(data).slice(0, 8);

  if (!rows.length) {
    return <EmptyState title={title} message="No distribution data is available for the selected filters." />;
  }

  return (
    <ChartPanel title={title} description={description} height={height}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={rows}
            dataKey="value"
            nameKey="label"
            innerRadius="52%"
            outerRadius="78%"
            paddingAngle={2}
            label={({ label, percent }) => `${compactLabel(label, 12)} ${formatPercent(percent * 100)}`}
          >
            {rows.map((entry, index) => (
              <Cell key={`${entry.label}-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value, name, item) => [formatCount(value), item.payload.label || valueName]} />
          <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
    </ChartPanel>
  );
}

function TrendChart({ title, description, data, lineKey = 'value', valueName = 'Responses' }) {
  const rows = (Array.isArray(data) ? data : [])
    .map((item) => ({
      label: item.date || item.label || item.day || item.period || 'N/A',
      value: Number(item[lineKey] ?? item.value ?? item.responses ?? item.submissions ?? item.count ?? 0)
    }))
    .filter((item) => item.label);

  if (!rows.length) {
    return <EmptyState title={title} message="No trend data is available for the selected filters." />;
  }

  return (
    <ChartPanel title={title} description={description} height="h-80">
      <ResponsiveContainer>
        <LineChart data={rows} margin={{ top: 8, right: 20, left: 0, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="label" tick={{ fontSize: 12 }} tickFormatter={(value) => compactLabel(value, 12)} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
          <Tooltip formatter={(value) => [formatCount(value), valueName]} />
          <Line type="monotone" dataKey="value" name={valueName} stroke="#0f7c90" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    </ChartPanel>
  );
}

function InsightList({ title, items = [], tone = 'slate', icon: Icon = CheckCircle2 }) {
  const toneClass =
    tone === 'rose'
      ? 'border-rose-200 bg-rose-50 text-rose-900'
      : tone === 'amber'
        ? 'border-amber-200 bg-amber-50 text-amber-900'
        : 'border-slate-200 bg-slate-50 text-slate-700';

  return (
    <section className={PANEL_CLASS}>
      <div className="mb-4 flex items-center gap-2">
        <Icon size={18} className="text-teal-700" />
        <h3 className="text-base font-semibold text-ink">{title}</h3>
      </div>
      <div className="space-y-3">
        {items.length ? (
          items.map((item, index) => (
            <div key={`${item}-${index}`} className={`rounded border px-4 py-3 text-sm leading-7 ${toneClass}`}>
              {item}
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-500">No insight text is available for this selection.</p>
        )}
      </div>
    </section>
  );
}

function RankingTable({ title, description, rows = [] }) {
  const tableRows = sortRows(rows).slice(0, 12);

  if (!tableRows.length) {
    return <EmptyState title={title} message="No table data is available for the selected filters." />;
  }

  return (
    <section className={PANEL_CLASS}>
      <div className="mb-4">
        <h3 className="text-base font-semibold text-ink">{title}</h3>
        {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500">
              <th className="py-3 pr-4 font-semibold">Label</th>
              <th className="py-3 pr-4 font-semibold">Count / Score</th>
              <th className="py-3 pr-4 font-semibold">Percent</th>
            </tr>
          </thead>
          <tbody>
            {tableRows.map((row, index) => (
              <tr key={`${getLabel(row)}-${index}`} className="border-b border-slate-100 last:border-b-0">
                <td className="py-3 pr-4 font-medium text-ink">{getLabel(row)}</td>
                <td className="py-3 pr-4 text-slate-600">{formatCount(getValue(row))}</td>
                <td className="py-3 pr-4 text-slate-600">{row.percentage !== undefined ? formatPercent(row.percentage) : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function NarrativePanel({ title = 'Interpretation', text, items = [] }) {
  return (
    <section className={PANEL_CLASS}>
      <h3 className="text-base font-semibold text-ink">{title}</h3>
      {text ? <p className="mt-3 rounded border border-teal-100 bg-teal-50 px-4 py-4 text-sm leading-7 text-slate-700">{text}</p> : null}
      {items.length ? (
        <div className="mt-4 space-y-3">
          {items.map((item, index) => (
            <div key={`${item}-${index}`} className="rounded border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-7 text-slate-700">
              {item}
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function OverviewView({ report }) {
  const charts = report.charts || {};
  const sectorRows = toChartRows(charts.sectorRanking, {
    label: (item) => item.sector || item.name || item.label,
    value: (item) => item.averageReadiness ?? item.score ?? item.value ?? item.count
  });
  const readinessRows = toChartRows(charts.readinessBands);
  const awarenessRows = toChartRows(charts.awarenessDistribution);
  const willingnessRows = toChartRows(charts.willingnessDistribution);
  const barrierRows = toChartRows(charts.barrierRanking);
  const securityRows = toChartRows(charts.securityTrust);

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Overview"
        title={report.title || 'Survey overview'}
        description={report.executiveSummary}
        icon={CircleGauge}
      />

      <KpiGrid items={report.summaryCards || []} limit={8} />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <SmartBarChart
          title="Sector Readiness Ranking"
          description="Average cloud readiness by sector."
          data={sectorRows}
          horizontal
          valueName="Readiness score"
          height="h-96"
        />
        <DonutChart title="Readiness Bands" description="Low, medium, and high readiness split." data={readinessRows} />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <DonutChart title="Awareness Distribution" description="How respondents answered the cloud awareness question." data={awarenessRows} />
        <DonutChart title="Adoption Willingness" description="Willingness to adopt cloud solutions." data={willingnessRows} />
        <DonutChart title="Security Trust" description="Trust levels around cloud storage and security." data={securityRows} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <TrendChart title="Daily Response Trend" description="Survey submissions across the available days." data={charts.dailyResponses} />
        <SmartBarChart
          title="Top Barriers"
          description="Most common challenges reported by respondents."
          data={barrierRows}
          horizontal
          color="#ef4444"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <InsightList title="Key Findings" items={report.insightSummary || []} icon={TrendingUp} />
        <RankingTable
          title="Common Answer Patterns"
          description="Dominant answers from important survey questions."
          rows={(report.commonPatterns || []).map((item) => ({ ...item, label: item.question, count: item.percentage }))}
        />
      </div>
    </div>
  );
}

function QuestionSummary({ report }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard label="Responses" value={formatCount(report.totalResponses || 0)} helper="Valid answers for this question" />
      <StatCard label="Completion" value={formatPercent(report.responseCompletionRate)} helper="Share of filtered respondents" />
      <StatCard label="Question Code" value={String(report.code || '').toUpperCase()} helper={report.section || 'Survey question'} />
      <StatCard
        label={report.chartPreset === 'open_text' ? 'Top Theme' : 'Leading Answer'}
        value={report.dominantAnswer ? getLabel(report.dominantAnswer) : 'No data'}
        helper={report.dominantAnswer ? `${formatPercent(report.dominantAnswer.percentage)} share` : 'No dominant item'}
      />
    </div>
  );
}

function HighlightCards({ items = [] }) {
  if (!items.length) return null;

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item, index) => (
        <div key={`${item.label}-${index}`} className="rounded border border-slate-200 bg-white p-4 shadow-soft">
          <p className="text-sm font-semibold text-slate-500">{item.label}</p>
          <p className="mt-2 break-words text-lg font-bold text-ink">{item.value || 'No data'}</p>
          {item.helper ? <p className="mt-2 text-sm text-slate-500">{item.helper}</p> : null}
        </div>
      ))}
    </div>
  );
}

function TextQuestionView({ report }) {
  const keywordRows = toChartRows(report.keywords, {
    label: (item) => item.keyword,
    value: (item) => item.count
  });
  const themeRows = toChartRows(report.topThemes, {
    label: (item) => item.theme,
    value: (item) => item.count
  });

  return (
    <div className="space-y-6">
      <QuestionHeader report={report} />
      <QuestionSummary report={report} />
      <HighlightCards items={report.highlights || []} />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <SmartBarChart title="Keyword Frequency" description="Most repeated words in open-ended answers." data={keywordRows} horizontal />
        <DonutChart title="Theme Share" description="Grouped themes from written responses." data={themeRows} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <RankingTable title="Grouped Themes" description="Open answers grouped into repeated ideas." rows={report.groupedCategories || []} />
        <NarrativePanel text={report.interpretation} items={report.insightSummary || []} />
      </div>
    </div>
  );
}

function ClosedQuestionView({ report }) {
  const rows = sortRows(report.frequencyBreakdown || []);
  const chartTitle =
    report.chartPreset === 'likert'
      ? 'Likert Response Ranking'
      : report.chartPreset === 'yes_no'
        ? 'Yes / No Split'
        : 'Answer Distribution';

  return (
    <div className="space-y-6">
      <QuestionHeader report={report} />
      <QuestionSummary report={report} />
      <HighlightCards items={report.highlights || []} />

      {report.chartPreset === 'yes_no' ? <YesNoCards summary={report.yesNoSummary} /> : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <SmartBarChart title={chartTitle} description="Exact response counts for this question." data={rows} horizontal={rows.length > 4} />
        <DonutChart title="Percentage Share" description="A quick distribution view for presentations." data={rows} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <RankingTable title="Frequency Table" description="Counts and percentages for every visible answer." rows={rows} />
        <NarrativePanel text={report.interpretation} items={report.insightSummary || []} />
      </div>
    </div>
  );
}

function QuestionHeader({ report }) {
  return (
    <SectionHeader
      eyebrow={String(report.code || '').toUpperCase()}
      title={report.title}
      description={`${report.section || 'Survey section'} - ${String(report.questionType || report.chartPreset || 'question').replace(/_/g, ' ')}`}
      icon={PieChartIcon}
    />
  );
}

function YesNoCards({ summary }) {
  if (!summary) return null;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="rounded border border-teal-200 bg-teal-50 p-5">
        <p className="text-sm font-semibold text-teal-800">Haa</p>
        <p className="mt-2 text-3xl font-bold text-teal-950">{formatPercent(summary.yesPercentage)}</p>
        <p className="mt-2 text-sm text-teal-800">{formatCount(summary.yesCount)} responses</p>
      </div>
      <div className="rounded border border-rose-200 bg-rose-50 p-5">
        <p className="text-sm font-semibold text-rose-800">Maya</p>
        <p className="mt-2 text-3xl font-bold text-rose-950">{formatPercent(summary.noPercentage)}</p>
        <p className="mt-2 text-sm text-rose-800">{formatCount(summary.noCount)} responses</p>
      </div>
    </div>
  );
}

function QuestionReportView({ report }) {
  if (!report.totalResponses) {
    return (
      <div className="space-y-6">
        <QuestionHeader report={report} />
        <EmptyState title="No answers found" message={report.interpretation || 'Try a different filter selection.'} />
      </div>
    );
  }

  return report.chartPreset === 'open_text' ? <TextQuestionView report={report} /> : <ClosedQuestionView report={report} />;
}

function FinalReportView({ report }) {
  const readinessDistribution = toChartRows(report.cloudReadinessSummary?.distribution, {
    label: (item) => item.band || item.label || item.name,
    value: (item) => item.count ?? item.value ?? item.percentage
  });
  const readinessRanking = toChartRows(report.readinessRanking, {
    label: (item) => item.sector || item.label,
    value: (item) => item.averageReadiness ?? item.score ?? item.value
  });
  const topBarriers = toChartRows(report.topBarriers, {
    label: (item) => item.answer || item.label,
    value: (item) => item.count ?? item.value ?? item.percentage
  });
  const generatedAt = report.generatedAt ? new Date(report.generatedAt) : null;

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Final Report" title={report.title} description={report.executiveSummary} icon={TrendingUp} />

      {generatedAt ? (
        <p className="text-sm text-slate-500">
          Generated {generatedAt.toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Overall Readiness" value={formatPercent(report.cloudReadinessSummary?.overallAverage)} helper="Average cloud readiness score" />
        <StatCard label="Strongest Factor" value={report.cloudReadinessSummary?.strongestFactor || 'No factor'} />
        <StatCard label="Weakest Factor" value={report.cloudReadinessSummary?.weakestFactor || 'No factor'} />
        <StatCard label="Recommendations" value={formatCount(report.recommendations?.length || 0)} helper="Action points in this report" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <DonutChart title="Readiness Distribution" description={report.cloudReadinessSummary?.summaryText} data={readinessDistribution} />
        <SmartBarChart
          title="Sector Readiness Ranking"
          description="Best and weakest sector readiness positions."
          data={readinessRanking}
          horizontal
          valueName="Readiness score"
          height="h-96"
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <SmartBarChart title="Top Challenges" description="Main barriers blocking cloud adoption." data={topBarriers} horizontal color="#ef4444" />
        <RankingTable title="Barrier Details" description="Exact barrier values from the filtered report." rows={report.topBarriers || []} />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <InsightList title="Key Findings" items={report.keyFindings || []} icon={CheckCircle2} />
        <InsightList title="Problems" items={report.topProblems || []} tone="rose" icon={AlertCircle} />
        <InsightList title="Opportunities" items={report.topOpportunities || report.topPatterns || []} tone="amber" icon={TrendingUp} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <InsightList title="Recommendations" items={report.recommendations || []} icon={CheckCircle2} />
        <NarrativePanel title="Conclusion" text={report.conclusion} />
      </div>
    </div>
  );
}

function ActiveError({ message, onRetry }) {
  return (
    <section className="rounded border border-rose-200 bg-rose-50 p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <AlertCircle className="mt-0.5 text-rose-600" size={18} />
          <div>
            <h3 className="text-base font-semibold text-rose-900">Unable to load reports</h3>
            <p className="mt-1 text-sm text-rose-800">{message}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onRetry}
          className="rounded border border-rose-300 px-3 py-2 text-sm font-semibold text-rose-900 transition hover:border-rose-400"
        >
          Try again
        </button>
      </div>
    </section>
  );
}

export default function Reports() {
  const [questions, setQuestions] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [filters, setFilters] = useState({ sector: '', district: '', startDate: '', endDate: '' });
  const [activeTab, setActiveTab] = useState(OVERVIEW_TAB_ID);
  const [metaReloadKey, setMetaReloadKey] = useState(0);
  const [metaLoading, setMetaLoading] = useState(true);
  const [metaError, setMetaError] = useState('');
  const [tabCache, setTabCache] = useState({});
  const [tabErrors, setTabErrors] = useState({});
  const [loadingKey, setLoadingKey] = useState('');

  const questionTabs = useMemo(
    () =>
      [...questions]
        .filter((question) => /^q\d+$/i.test(String(question.code || '')))
        .sort((left, right) => (left.order || 0) - (right.order || 0))
        .map((question) => ({ ...question, code: String(question.code || '').toLowerCase() })),
    [questions]
  );

  const tabs = useMemo(
    () => [
      { id: OVERVIEW_TAB_ID, label: 'Overview' },
      ...questionTabs.map((question) => ({ id: question.code, label: String(question.code || '').toUpperCase() })),
      { id: FINAL_TAB_ID, label: 'Final Report' }
    ],
    [questionTabs]
  );

  const activeCacheKey = useMemo(() => buildCacheKey(activeTab, filters), [activeTab, filters]);
  const activePayload = activeCacheKey ? tabCache[activeCacheKey] : null;
  const activeError = activeCacheKey ? tabErrors[activeCacheKey] : '';
  const refreshing = loadingKey === activeCacheKey;

  useEffect(() => {
    let cancelled = false;

    const loadMeta = async () => {
      setMetaLoading(true);
      setMetaError('');

      try {
        const [questionsResponse, sectorsResponse, filtersResponse] = await Promise.all([
          api.get('/questions?includeInactive=true'),
          api.get('/sectors?includeInactive=true'),
          api.get('/analytics/filter-options')
        ]);

        if (cancelled) return;
        setQuestions(questionsResponse.data.questions || []);
        setSectors(sectorsResponse.data.sectors || []);
        setDistricts(filtersResponse.data.filters?.districts || []);
      } catch (error) {
        if (cancelled) return;
        setMetaError(error.response?.data?.message || 'Failed to load report metadata.');
      } finally {
        if (!cancelled) setMetaLoading(false);
      }
    };

    loadMeta();
    return () => {
      cancelled = true;
    };
  }, [metaReloadKey]);

  useEffect(() => {
    if (!activeTab && tabs.length) setActiveTab(tabs[0].id);
  }, [tabs, activeTab]);

  useEffect(() => {
    if (!activeTab || metaLoading || tabCache[activeCacheKey]) return undefined;

    let cancelled = false;

    const loadActiveTab = async () => {
      setLoadingKey(activeCacheKey);

      try {
        const params = buildQueryParams(filters);
        let response;
        let payload;

        if (activeTab === OVERVIEW_TAB_ID) {
          response = await api.get('/analytics/overview', { params });
          payload = { type: 'overview', data: response.data.overviewReport };
        } else if (activeTab === FINAL_TAB_ID) {
          response = await api.get('/analytics/final-report', { params });
          payload = { type: 'final', data: response.data.finalReport };
        } else {
          response = await api.get(`/analytics/questions/${activeTab}`, { params });
          payload = { type: 'question', data: response.data.questionReport };
        }

        if (cancelled) return;
        setTabCache((current) => ({ ...current, [activeCacheKey]: payload }));
        setTabErrors((current) => {
          const next = { ...current };
          delete next[activeCacheKey];
          return next;
        });
      } catch (error) {
        if (cancelled) return;
        setTabErrors((current) => ({
          ...current,
          [activeCacheKey]: error.response?.data?.message || 'Failed to load analytics for this tab.'
        }));
      } finally {
        if (!cancelled) setLoadingKey((current) => (current === activeCacheKey ? '' : current));
      }
    };

    loadActiveTab();
    return () => {
      cancelled = true;
    };
  }, [activeTab, activeCacheKey, filters, metaLoading, tabCache]);

  const handleFilterChange = (key, value) => setFilters((current) => ({ ...current, [key]: value }));
  const clearFilters = () => setFilters({ sector: '', district: '', startDate: '', endDate: '' });
  const retryMetaLoad = () => setMetaReloadKey((current) => current + 1);

  const refreshActiveTab = () => {
    if (!activeCacheKey) return;
    setTabCache((current) => {
      const next = { ...current };
      delete next[activeCacheKey];
      return next;
    });
    setTabErrors((current) => {
      const next = { ...current };
      delete next[activeCacheKey];
      return next;
    });
  };

  if (metaLoading) return <Loading label="Loading reports and analytics..." />;
  if (metaError) return <ActiveError message={metaError} onRetry={retryMetaLoad} />;

  return (
    <div className="space-y-6">
      <FilterHeader
        filters={filters}
        sectors={sectors}
        districts={districts}
        onChange={handleFilterChange}
        onClear={clearFilters}
        onRefresh={refreshActiveTab}
        refreshing={refreshing}
      />

      <TabBar tabs={tabs} activeTab={activeTab} onSelect={setActiveTab} />

      {activeError ? <ActiveError message={activeError} onRetry={refreshActiveTab} /> : null}

      {!activePayload && refreshing ? (
        <Loading
          label={`Loading ${
            activeTab === OVERVIEW_TAB_ID ? 'overview' : activeTab === FINAL_TAB_ID ? 'final report' : String(activeTab).toUpperCase()
          } analysis...`}
        />
      ) : null}

      {activePayload?.type === 'overview' ? <OverviewView report={activePayload.data} /> : null}
      {activePayload?.type === 'question' ? <QuestionReportView report={activePayload.data} /> : null}
      {activePayload?.type === 'final' ? <FinalReportView report={activePayload.data} /> : null}
    </div>
  );
}
