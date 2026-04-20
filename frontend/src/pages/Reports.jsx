import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CalendarRange, Filter, RefreshCw } from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
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
const CHART_COLORS = ['#0f7c90', '#14b8a6', '#84cc16', '#f59e0b', '#ef4444', '#6366f1', '#64748b'];
const PANEL_CLASS = 'rounded border border-slate-200 bg-white p-5 shadow-soft';
const numberFormatter = new Intl.NumberFormat('en-US');

const formatPercent = (value) => `${Number(value || 0).toFixed(Number(value || 0) % 1 === 0 ? 0 : 1)}%`;
const formatCount = (value) => numberFormatter.format(Number(value || 0));
const formatLabel = (item) => item?.label || item?.answer || item?.topic || item?.theme || item?.keyword || 'N/A';
const shortLabel = (value, max = 24) => {
  const text = String(value || '');
  return text.length > max ? `${text.slice(0, max - 3)}...` : text;
};

const buildQueryParams = (filters) => {
  const params = {};

  if (filters.sector) params.sector = filters.sector;
  if (filters.district) params.district = filters.district;
  if (filters.startDate) params.startDate = filters.startDate;
  if (filters.endDate) params.endDate = filters.endDate;

  return params;
};

const buildCacheKey = (tab, filters) => {
  const query = new URLSearchParams(buildQueryParams(filters)).toString();
  return `${tab}::${query}`;
};

const sortRows = (rows = []) => [...rows].sort((left, right) => (right.count || 0) - (left.count || 0));

function ActiveChip({ label }) {
  return <span className="rounded bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-600">{label}</span>;
}

function FiltersBar({ filters, sectors, districts, onChange, onClear, onRefresh, refreshing }) {
  const hasFilters = Object.values(filters).some(Boolean);
  const selectedSector = sectors.find((sector) => (sector._id || sector.name) === filters.sector);

  return (
    <section className="sticky top-0 z-20 -mx-2 rounded border border-slate-200 bg-slate-50/95 px-2 pb-2 pt-1 backdrop-blur sm:mx-0 sm:px-0">
      <div className="rounded border border-slate-200 bg-white p-5 shadow-soft sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-slate-500">Reports / Analytics</p>
            <h1 className="mt-2 text-2xl font-bold text-ink sm:text-3xl">Professional survey reporting</h1>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-500">
              Hal page oo keliya, tabs si nadiif ah loo habeeyay, iyo falanqeyn si degdeg ah u sharxeysa waxa xogtu ka
              sheegeyso jawaabaha la ururiyey.
            </p>
          </div>

          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center gap-2 rounded border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            Refresh Active Tab
          </button>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <label className="block">
            <span className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-600">
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
            <span className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-600">
              <Filter size={15} />
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

          <label className="block">
            <span className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-600">
              <CalendarRange size={15} />
              Start date
            </span>
            <input
              type="date"
              value={filters.startDate}
              onChange={(event) => onChange('startDate', event.target.value)}
              className="w-full rounded border border-slate-300 bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-teal-600"
            />
          </label>

          <label className="block">
            <span className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-600">
              <CalendarRange size={15} />
              End date
            </span>
            <input
              type="date"
              value={filters.endDate}
              onChange={(event) => onChange('endDate', event.target.value)}
              className="w-full rounded border border-slate-300 bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-teal-600"
            />
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {hasFilters ? (
            <>
              {filters.sector ? <ActiveChip label={`Sector: ${selectedSector?.name || filters.sector}`} /> : null}
              {filters.district ? <ActiveChip label={`District: ${filters.district}`} /> : null}
              {filters.startDate ? <ActiveChip label={`From: ${filters.startDate}`} /> : null}
              {filters.endDate ? <ActiveChip label={`To: ${filters.endDate}`} /> : null}
              <button
                type="button"
                onClick={onClear}
                className="rounded border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
              >
                Clear filters
              </button>
            </>
          ) : (
            <p className="text-sm text-slate-500">All sectors, all districts, and the full available date range are currently in view.</p>
          )}
        </div>
      </div>
    </section>
  );
}

function TabBar({ tabs, activeTab, onSelect }) {
  return (
    <section className="rounded border border-slate-200 bg-white shadow-soft">
      <div className="overflow-x-auto">
        <div className="flex min-w-max gap-2 p-2">
          {tabs.map((tab) => {
            const active = tab.id === activeTab;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSelect(tab.id)}
                className={`rounded px-4 py-2.5 text-sm font-semibold transition ${
                  active
                    ? 'bg-teal-700 text-white shadow-sm'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
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

function SectionIntro({ eyebrow, title, description }) {
  return (
    <section className="rounded border border-slate-200 bg-white p-6 shadow-soft sm:p-7">
      <p className="text-sm font-medium uppercase tracking-wide text-slate-500">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-bold leading-tight text-ink sm:text-3xl">{title}</h2>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">{description}</p>
    </section>
  );
}

function HighlightGrid({ items = [] }) {
  if (!items.length) {
    return null;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item, index) => (
        <div key={`${item.label}-${index}`} className="rounded border border-slate-200 bg-white p-4 shadow-soft">
          <p className="text-sm font-medium text-slate-500">{item.label}</p>
          <p className="mt-2 break-words text-xl font-bold text-ink">{item.value || 'Xog ma jirto'}</p>
          <p className="mt-2 text-sm text-slate-500">{item.helper || ' '}</p>
        </div>
      ))}
    </div>
  );
}

function FrequencyTable({ rows, title = 'Frequency breakdown', emptyMessage = 'Xog lagama helin filter-kan.' }) {
  const orderedRows = sortRows(rows);

  if (!orderedRows.length) {
    return <EmptyState title={title} message={emptyMessage} />;
  }

  return (
    <section className={PANEL_CLASS}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-ink">{title}</h3>
        <p className="mt-1 text-sm text-slate-500">All rows use the real Somali answers and grouped labels from the survey data.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500">
              <th className="py-3 pr-4 font-semibold">Answer / Theme</th>
              <th className="py-3 pr-4 font-semibold">Count</th>
              <th className="py-3 pr-4 font-semibold">Percentage</th>
            </tr>
          </thead>
          <tbody>
            {orderedRows.map((row, index) => (
              <tr key={`${formatLabel(row)}-${index}`} className="border-b border-slate-100 last:border-b-0">
                <td className="py-3 pr-4 font-medium text-ink">{formatLabel(row)}</td>
                <td className="py-3 pr-4 text-slate-600">{formatCount(row.count)}</td>
                <td className="py-3 pr-4 text-slate-600">{formatPercent(row.percentage)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function InterpretationPanel({ interpretation, insights }) {
  return (
    <section className={PANEL_CLASS}>
      <h3 className="text-lg font-semibold text-ink">Interpretation</h3>
      <p className="mt-3 rounded border border-teal-100 bg-teal-50 px-4 py-4 text-sm leading-7 text-slate-700">{interpretation}</p>

      <div className="mt-5">
        <h3 className="text-lg font-semibold text-ink">Insight Summary</h3>
        <ul className="mt-3 space-y-3">
          {(insights || []).map((item, index) => (
            <li key={`${item}-${index}`} className="flex gap-3 rounded border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              <span className="mt-0.5 h-2.5 w-2.5 rounded-full bg-teal-600" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function ThemeHighlights({ themes = [] }) {
  if (!themes.length) {
    return <EmptyState title="Top themes" message="Jawaabo furan oo ku filan lama helin si loo sameeyo theme cad." />;
  }

  return (
    <section className={PANEL_CLASS}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-ink">Top Themes</h3>
        <p className="mt-1 text-sm text-slate-500">Open-ended answers grouped into repeated ideas and major themes.</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1">
        {themes.map((theme) => (
          <div key={theme.theme} className="rounded border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-start justify-between gap-3">
              <h4 className="text-base font-semibold text-ink">{theme.theme}</h4>
              <span className="rounded bg-white px-2 py-1 text-xs font-semibold text-teal-700">{formatPercent(theme.percentage)}</span>
            </div>
            <p className="mt-2 text-sm text-slate-500">{formatCount(theme.count)} matching responses</p>
            {theme.keywords?.length ? <p className="mt-3 text-sm text-slate-600">{theme.keywords.join(', ')}</p> : null}
          </div>
        ))}
      </div>
    </section>
  );
}

function GroupedCategoryList({ groups = [] }) {
  if (!groups.length) {
    return <EmptyState title="Grouped categories" message="Jawaabo ku filan lama helin si loo sameeyo kooxo muuqda." />;
  }

  return (
    <section className={PANEL_CLASS}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-ink">Grouped Categories</h3>
        <p className="mt-1 text-sm text-slate-500">Similar responses are grouped together so the repeated topics are easier to read.</p>
      </div>

      <div className="space-y-3">
        {groups.map((group, index) => (
          <div key={`${group.topic}-${index}`} className="rounded border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h4 className="text-base font-semibold text-ink">{group.topic}</h4>
                <p className="mt-1 text-sm text-slate-500">{formatCount(group.count)} responses</p>
              </div>
              <span className="text-sm font-semibold text-teal-700">{formatPercent(group.percentage)}</span>
            </div>
            {group.examples?.length ? (
              <div className="mt-3 space-y-2">
                {group.examples.slice(0, 3).map((example, exampleIndex) => (
                  <p key={`${group.topic}-example-${exampleIndex}`} className="rounded border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
                    {example}
                  </p>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}

function MainBarChart({ title, description, data, labelKey = 'label', horizontal = false, color = '#0f7c90', name = 'Responses' }) {
  if (!data?.length) {
    return <EmptyState title={title} message="Xog jaantus lama helin filter-kan." />;
  }

  return (
    <ChartPanel title={title} description={description} height="h-80 sm:h-96">
      <ResponsiveContainer>
        <BarChart data={data} layout={horizontal ? 'vertical' : 'horizontal'} margin={{ top: 8, right: 16, left: 8, bottom: 16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          {horizontal ? (
            <>
              <XAxis type="number" allowDecimals={false} />
              <YAxis type="category" dataKey={labelKey} width={170} tickFormatter={(value) => shortLabel(value, 28)} />
            </>
          ) : (
            <>
              <XAxis
                dataKey={labelKey}
                interval={0}
                tickFormatter={(value) => shortLabel(value, 18)}
                angle={data.length > 4 ? -18 : 0}
                textAnchor={data.length > 4 ? 'end' : 'middle'}
                height={data.length > 4 ? 56 : 36}
              />
              <YAxis allowDecimals={false} />
            </>
          )}
          <Tooltip formatter={(value) => [formatCount(value), name]} labelFormatter={(value) => value} />
          <Bar dataKey="count" fill={color} radius={horizontal ? [0, 6, 6, 0] : [6, 6, 0, 0]} name={name} />
        </BarChart>
      </ResponsiveContainer>
    </ChartPanel>
  );
}

function SecondaryPieChart({ title, description, data, labelKey = 'label' }) {
  if (!data?.length) {
    return <EmptyState title={title} message="Xog qaybinta lama helin filter-kan." />;
  }

  return (
    <ChartPanel title={title} description={description} height="h-[28rem]">
      <div className="flex h-full flex-col">
        <div className="min-h-0 flex-1">
          <ResponsiveContainer>
            <PieChart>
              <Pie data={data} dataKey="count" nameKey={labelKey} innerRadius={72} outerRadius={110} paddingAngle={2}>
                {data.map((entry, index) => (
                  <Cell key={`${formatLabel(entry)}-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [formatCount(value), 'Responses']} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {data.slice(0, 6).map((item, index) => (
            <div key={`${formatLabel(item)}-${index}`} className="flex items-center gap-2 text-sm text-slate-600">
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
              <span className="min-w-0 truncate">{formatLabel(item)}</span>
              <span className="ml-auto font-medium text-slate-900">{formatCount(item.count)}</span>
            </div>
          ))}
        </div>
      </div>
    </ChartPanel>
  );
}

function TrendChart({ title, description, data, dataKey, stroke = '#0f7c90', type = 'line' }) {
  if (!data?.length) {
    return <EmptyState title={title} message="Waqti-taxane xog lama helin filter-kan." />;
  }

  return (
    <ChartPanel title={title} description={description} height="h-80 sm:h-96">
      <ResponsiveContainer>
        {type === 'area' ? (
          <AreaChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`${title}-gradient`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={stroke} stopOpacity={0.35} />
                <stop offset="95%" stopColor={stroke} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="date" />
            <YAxis allowDecimals={false} />
            <Tooltip formatter={(value) => [formatCount(value), title]} />
            <Area type="monotone" dataKey={dataKey} stroke={stroke} fill={`url(#${title}-gradient)`} strokeWidth={3} />
          </AreaChart>
        ) : (
          <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip formatter={(value) => [formatCount(value), title]} />
            <Line type="monotone" dataKey={dataKey} stroke={stroke} strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} />
          </LineChart>
        )}
      </ResponsiveContainer>
    </ChartPanel>
  );
}

function OverviewView({ report }) {
  const sectorRows = (report.charts?.sectorRanking || []).map((item) => ({
    ...item,
    label: item.sector,
    count: item.averageReadiness
  }));
  const barrierRows = (report.charts?.barrierRanking || []).map((item) => ({
    ...item,
    label: item.answer
  }));
  const awarenessRows = (report.charts?.awarenessDistribution || []).map((item) => ({
    ...item,
    label: item.answer
  }));
  const willingnessRows = (report.charts?.willingnessDistribution || []).map((item) => ({
    ...item,
    label: item.answer
  }));
  const readinessBands = (report.charts?.readinessBands || []).map((item) => ({
    ...item,
    label: item.name,
    count: item.count ?? item.value
  }));
  const trustRows = (report.charts?.securityTrust || []).map((item) => ({
    ...item,
    label: item.answer
  }));

  return (
    <div className="space-y-6">
      <SectionIntro
        eyebrow="Overview"
        title="Executive overview of the filtered survey data"
        description={report.executiveSummary}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {(report.summaryCards || []).map((card) => (
          <StatCard key={card.label} label={card.label} value={card.value} helper={card.helper} />
        ))}
      </div>

      <HighlightGrid items={report.highlightCards} />

      <div className="grid gap-5 xl:grid-cols-2">
        <SecondaryPieChart
          title="Readiness Bands"
          description="A quick view of low, medium, and high readiness distribution."
          data={readinessBands}
        />
        <MainBarChart
          title="Sector Readiness Ranking"
          description="Average readiness by sector from the current filters."
          data={sectorRows}
          labelKey="label"
          horizontal
          color="#0f7c90"
        />
        <TrendChart
          title="Daily Responses"
          description="Submission flow over time for the active filter set."
          data={report.charts?.dailyResponses || []}
          dataKey="responses"
          stroke="#14b8a6"
          type="area"
        />
        <TrendChart
          title="Awareness Trend"
          description="Awareness rate over the current reporting window."
          data={report.charts?.awarenessTrend || []}
          dataKey="awarenessRate"
          stroke="#84cc16"
        />
        <MainBarChart
          title="Barrier Ranking"
          description="Most common blockers affecting cloud adoption."
          data={barrierRows}
          labelKey="label"
          horizontal
          color="#ef4444"
        />
        <SecondaryPieChart
          title="Security Trust"
          description="How respondents currently feel about storing data in the cloud."
          data={trustRows}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <FrequencyTable rows={awarenessRows} title="Awareness Level Summary" emptyMessage="Awareness summary is not available for the active filters." />
        <FrequencyTable rows={willingnessRows} title="Adoption Willingness Summary" emptyMessage="Willingness summary is not available for the active filters." />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
        <section className={PANEL_CLASS}>
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-ink">Most Common Answer Patterns</h3>
            <p className="mt-1 text-sm text-slate-500">Top patterns pulled from the closed-ended survey questions.</p>
          </div>
          <div className="space-y-3">
            {(report.commonPatterns || []).length ? (
              report.commonPatterns.map((pattern) => (
                <div key={pattern.question} className="rounded border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-medium text-slate-500">{pattern.question}</p>
                  <p className="mt-2 text-base font-semibold text-ink">{pattern.answer}</p>
                  <p className="mt-1 text-sm text-slate-500">{formatPercent(pattern.percentage)} of recorded answers</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No dominant patterns are available for the current filters.</p>
            )}
          </div>
        </section>

        <section className={PANEL_CLASS}>
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-ink">Key Findings</h3>
            <p className="mt-1 text-sm text-slate-500">Quick talking points for presentation or stakeholder review.</p>
          </div>
          <div className="space-y-3">
            {(report.insightSummary || []).map((item, index) => (
              <div key={`${item}-${index}`} className="rounded border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-7 text-slate-700">
                {item}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function QuestionViewHeader({ report }) {
  return (
    <SectionIntro
      eyebrow={String(report.code || '').toUpperCase()}
      title={report.title}
      description="Question-specific analysis only. Charts, tables, interpretation, and insights below belong to this one survey question."
    />
  );
}

function SummaryCards({ report }) {
  const primary = report.dominantAnswer;

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <StatCard label="Total Responses" value={formatCount(report.totalResponses || 0)} helper="Filtered respondents who answered this question" />
      <StatCard label="Response Completion Rate" value={formatPercent(report.responseCompletionRate)} helper="Share of filtered respondents with a valid answer here" />
      <StatCard label="Question Code" value={String(report.code || '').toUpperCase()} helper={report.section || 'Survey question analysis'} />
      <StatCard label="Leading Answer" value={primary ? formatLabel(primary) : 'Xog ma jirto'} helper={primary ? `${formatPercent(primary.percentage)} share` : 'No dominant answer'} />
    </div>
  );
}

function QuestionReportView({ report }) {
  const rows = sortRows(report.frequencyBreakdown || []);
  const keywordRows = (report.keywords || []).map((item) => ({ ...item, label: item.keyword }));
  const groupedRows = (report.groupedCategories || []).map((item) => ({ ...item, label: item.topic }));

  if (!report.totalResponses) {
    return (
      <div className="space-y-6">
        <QuestionViewHeader report={report} />
        <EmptyState title="Jawaabo kuma jiraan qeybtan." message={report.interpretation || 'Fadlan dooro filter kale.'} />
      </div>
    );
  }

  if (report.chartPreset === 'open_text') {
    return (
      <div className="space-y-6">
        <QuestionViewHeader report={report} />
        <SummaryCards report={report} />
        <HighlightGrid items={report.highlights} />
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)]">
          <MainBarChart
            title="Keyword Frequency"
            description="Most repeated words across the filtered open-ended responses."
            data={keywordRows}
            labelKey="keyword"
            color="#0f7c90"
            name="Keyword count"
          />
          <ThemeHighlights themes={report.topThemes} />
        </div>
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
          <GroupedCategoryList groups={report.groupedCategories} />
          <InterpretationPanel interpretation={report.interpretation} insights={report.insightSummary} />
        </div>
        <FrequencyTable rows={groupedRows} title="Theme Frequency Breakdown" emptyMessage="Theme frequency data is not available for this question." />
      </div>
    );
  }

  if (report.chartPreset === 'yes_no') {
    return (
      <div className="space-y-6">
        <QuestionViewHeader report={report} />
        <SummaryCards report={report} />
        <HighlightGrid items={report.highlights} />
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded border border-teal-200 bg-teal-50 p-5">
            <p className="text-sm font-medium text-teal-800">Haa</p>
            <p className="mt-2 text-3xl font-bold text-teal-900">{formatPercent(report.yesNoSummary?.yesPercentage)}</p>
            <p className="mt-2 text-sm text-teal-800">{formatCount(report.yesNoSummary?.yesCount)} responses</p>
          </div>
          <div className="rounded border border-rose-200 bg-rose-50 p-5">
            <p className="text-sm font-medium text-rose-800">Maya</p>
            <p className="mt-2 text-3xl font-bold text-rose-900">{formatPercent(report.yesNoSummary?.noPercentage)}</p>
            <p className="mt-2 text-sm text-rose-800">{formatCount(report.yesNoSummary?.noCount)} responses</p>
          </div>
        </div>
        <div className="grid gap-5 xl:grid-cols-2">
          <MainBarChart
            title="Response Distribution"
            description="How many respondents selected Haa or Maya."
            data={rows}
            labelKey="label"
            color="#0f7c90"
          />
          <SecondaryPieChart
            title="Support Split"
            description="A presentation-friendly donut view of the same yes/no question."
            data={rows}
          />
        </div>
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
          <FrequencyTable rows={rows} />
          <InterpretationPanel interpretation={report.interpretation} insights={report.insightSummary} />
        </div>
      </div>
    );
  }

  if (report.chartPreset === 'likert') {
    return (
      <div className="space-y-6">
        <QuestionViewHeader report={report} />
        <SummaryCards report={report} />
        <HighlightGrid items={report.highlights} />
        <div className="grid gap-5 xl:grid-cols-2">
          <MainBarChart
            title="Likert Scale Ranking"
            description="Main chart for agreement, confidence, or attitude distribution."
            data={rows}
            labelKey="label"
            horizontal
            color="#0f7c90"
          />
          <MainBarChart
            title="Distribution"
            description="Secondary distribution chart kept focused on this one scale."
            data={rows}
            labelKey="label"
            color="#f59e0b"
          />
        </div>
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
          <FrequencyTable rows={rows} />
          <InterpretationPanel interpretation={report.interpretation} insights={report.insightSummary} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <QuestionViewHeader report={report} />
      <SummaryCards report={report} />
      <HighlightGrid items={report.highlights} />
      <div className="grid gap-5 xl:grid-cols-2">
        <MainBarChart
          title="Main Chart"
          description="Primary frequency chart for this question only."
          data={rows}
          labelKey="label"
          color="#0f7c90"
        />
        <SecondaryPieChart
          title="Secondary Distribution"
          description="A clean donut chart to support explanation and presentation."
          data={rows}
        />
      </div>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
        <FrequencyTable rows={rows} />
        <InterpretationPanel interpretation={report.interpretation} insights={report.insightSummary} />
      </div>
    </div>
  );
}

function InsightColumn({ title, items = [], tone = 'slate' }) {
  const toneClasses =
    tone === 'rose'
      ? 'border-rose-200 bg-rose-50'
      : tone === 'amber'
        ? 'border-amber-200 bg-amber-50'
        : 'border-slate-200 bg-slate-50';

  return (
    <section className={PANEL_CLASS}>
      <h3 className="text-lg font-semibold text-ink">{title}</h3>
      <div className="mt-4 space-y-3">
        {items.length ? (
          items.map((item, index) => (
            <div key={`${item}-${index}`} className={`rounded border p-4 text-sm leading-7 text-slate-700 ${toneClasses}`}>
              {item}
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-500">No summary items are available for this section yet.</p>
        )}
      </div>
    </section>
  );
}

function FinalReportView({ report }) {
  const readinessDistribution = (report.cloudReadinessSummary?.distribution || []).map((item) => ({
    ...item,
    label: item.band
  }));
  const readinessRankingRows = (report.readinessRanking || []).map((item) => ({
    ...item,
    label: item.sector,
    count: item.averageReadiness
  }));
  const topBarrierRows = (report.topBarriers || []).map((item) => ({
    ...item,
    label: item.answer
  }));
  const generatedAt = report.generatedAt ? new Date(report.generatedAt) : null;

  return (
    <div className="space-y-6">
      <SectionIntro
        eyebrow="Final Report"
        title={report.title}
        description={report.executiveSummary}
      />

      {generatedAt ? (
        <p className="text-sm text-slate-500">Generated {generatedAt.toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}</p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Overall Readiness" value={formatPercent(report.cloudReadinessSummary?.overallAverage)} helper="Average cloud readiness from the filtered dataset" />
        <StatCard label="Strongest Factor" value={report.cloudReadinessSummary?.strongestFactor || 'No factor'} />
        <StatCard label="Weakest Factor" value={report.cloudReadinessSummary?.weakestFactor || 'No factor'} />
        <StatCard label="Recommendations" value={formatCount(report.recommendations?.length || 0)} helper="Auto-generated action points" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)]">
        <section className={PANEL_CLASS}>
          <h3 className="text-lg font-semibold text-ink">Key Findings</h3>
          <ul className="mt-4 space-y-3">
            {(report.keyFindings || []).map((item, index) => (
              <li key={`${item}-${index}`} className="flex gap-3 rounded border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-7 text-slate-700">
                <span className="mt-0.5 h-2.5 w-2.5 rounded-full bg-teal-600" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <SecondaryPieChart
          title="Readiness Distribution"
          description={report.cloudReadinessSummary?.summaryText || 'Readiness band summary'}
          data={readinessDistribution}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <MainBarChart
          title="Readiness Ranking"
          description="Presentation-ready ranking of the strongest sectors in the current filter set."
          data={readinessRankingRows}
          labelKey="label"
          horizontal
          color="#0f7c90"
          name="Average readiness"
        />
        <FrequencyTable
          rows={topBarrierRows}
          title="Top Challenges"
          emptyMessage="No barrier ranking is available for this report."
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <InsightColumn title="Top 5 Patterns" items={report.topPatterns || []} />
        <InsightColumn title="Top 5 Problems" items={report.topProblems || []} tone="rose" />
        <InsightColumn title="Top 5 Opportunities" items={report.topOpportunities || []} tone="amber" />
      </div>

      <section className={PANEL_CLASS}>
        <h3 className="text-lg font-semibold text-ink">Recommendations</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {(report.recommendations || []).map((item, index) => (
            <div key={`${item}-${index}`} className="rounded border border-slate-200 bg-slate-50 p-4 text-sm leading-7 text-slate-700">
              {item}
            </div>
          ))}
        </div>
      </section>

      <section className={PANEL_CLASS}>
        <h3 className="text-lg font-semibold text-ink">Conclusion</h3>
        <p className="mt-3 text-sm leading-7 text-slate-700">{report.conclusion}</p>
      </section>
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
            <h3 className="text-base font-semibold text-rose-900">Unable to load this tab</h3>
            <p className="mt-1 text-sm text-rose-800">{message}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onRetry}
          className="rounded border border-rose-300 px-3 py-2 text-sm font-medium text-rose-900 transition hover:border-rose-400"
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
        .map((question) => ({
          ...question,
          code: String(question.code || '').toLowerCase()
        })),
    [questions]
  );

  const tabs = useMemo(
    () => [
      { id: OVERVIEW_TAB_ID, label: 'OVERVIEW' },
      ...questionTabs.map((question) => ({
        id: question.code,
        label: String(question.code || '').toUpperCase()
      })),
      { id: FINAL_TAB_ID, label: 'FINAL REPORT' }
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
    if (!activeTab && tabs.length) {
      setActiveTab(tabs[0].id);
    }
  }, [tabs, activeTab]);

  useEffect(() => {
    if (!activeTab || metaLoading) return;
    if (tabCache[activeCacheKey]) return;

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

        setTabCache((current) => ({
          ...current,
          [activeCacheKey]: payload
        }));

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
        if (!cancelled) {
          setLoadingKey((current) => (current === activeCacheKey ? '' : current));
        }
      }
    };

    loadActiveTab();

    return () => {
      cancelled = true;
    };
  }, [activeTab, activeCacheKey, filters, metaLoading, tabCache]);

  const handleFilterChange = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({ sector: '', district: '', startDate: '', endDate: '' });
  };

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

  const retryMetaLoad = () => {
    setMetaReloadKey((current) => current + 1);
  };

  if (metaLoading) {
    return <Loading label="Loading reports and analytics..." />;
  }

  if (metaError) {
    return <ActiveError message={metaError} onRetry={retryMetaLoad} />;
  }

  return (
    <div className="space-y-6">
      <FiltersBar
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
          label={`Loading ${activeTab === OVERVIEW_TAB_ID ? 'overview' : activeTab === FINAL_TAB_ID ? 'final report' : String(activeTab).toUpperCase()} analysis...`}
        />
      ) : null}

      {activePayload?.type === 'overview' ? <OverviewView report={activePayload.data} /> : null}
      {activePayload?.type === 'question' ? <QuestionReportView report={activePayload.data} /> : null}
      {activePayload?.type === 'final' ? <FinalReportView report={activePayload.data} /> : null}
    </div>
  );
}
