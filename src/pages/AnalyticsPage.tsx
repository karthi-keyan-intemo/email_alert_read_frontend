import { useEffect, useState } from 'react';
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { AlertCircle, BarChart3, CalendarDays, ChartNoAxesCombined, Globe2, Inbox, ListChecks, Server, TriangleAlert } from 'lucide-react';

import { DateFilter } from '../components/DateFilter';
import { fetchAnalytics } from '../services/emailAlertApi';
import { AnalyticsResponse } from '../types/emailAlert';

const COLORS = {
  total: '#0284c7',
  unknown: '#f59e0b',
  validation: '#e11d48',
  requests: '#0f766e',
};
const PIE_COLORS = [COLORS.unknown, COLORS.validation];

function formatLocalDate(value: Date) {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
}

const today = formatLocalDate(new Date());
const lastWeek = formatLocalDate(new Date(Date.now() - 6 * 86400000));

function ChartCard({ title, icon: Icon, children, className = '' }: { title: string; icon: typeof BarChart3; children: React.ReactNode; className?: string }) {
  return <section className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}><div className="mb-5 flex items-center gap-2"><Icon className="h-5 w-5 text-sky-700" aria-hidden="true" /><h2 className="text-lg font-semibold text-slate-900">{title}</h2></div>{children}</section>;
}

function MetricCard({ label, value, accent, icon: Icon }: { label: string; value: number; accent: string; icon: typeof BarChart3 }) {
  return <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className={`absolute inset-y-0 left-0 w-1 ${accent}`} /><div className="flex items-start justify-between gap-3 pl-2"><div><div className="text-sm font-medium text-slate-600">{label}</div><div className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{value.toLocaleString()}</div></div><Icon className="h-5 w-5 text-slate-400" aria-hidden="true" /></div></div>;
}

function ChartSkeleton() {
  return <div className="h-72 animate-pulse rounded-lg bg-slate-100" />;
}

function EmptyChart({ message = 'No alerts found for the selected date range.' }: { message?: string }) {
  return <div className="flex h-72 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 px-6 text-center text-sm text-slate-500">{message}</div>;
}

function shortLabel(value: string | null, length = 34) {
  if (!value) return 'Unknown';
  return value.length > length ? `${value.slice(0, length - 1)}...` : value;
}

export function AnalyticsPage() {
  const [fromDate, setFromDate] = useState(lastWeek);
  const [toDate, setToDate] = useState(today);
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async (from = fromDate, to = toDate) => {
    if (!from || !to) { setError('Please select both dates.'); return; }
    if (from > to) { setError('From date cannot be later than To date.'); return; }
    setLoading(true);
    setError(null);
    try {
      setData(await fetchAnalytics({ from_date: from, to_date: to }));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [fromDate, toDate]);

  const hasAlerts = Boolean(data?.summary.total_alerts);
  const sourceErrors = data?.by_source.map((source) => ({
    name: source.source_name || 'Unknown',
    unknown: source.unknown,
    response_validation: source.response_validation,
  })) || [];
  const requestSources = data?.by_source.map((source) => ({ name: source.source_name || 'Unknown', requests: source.requests })) || [];
  const recurringErrors = data?.top_errors.map((item) => ({ ...item, label: shortLabel(item.error_message, 42) })) || [];

  return <main className="mx-auto max-w-7xl space-y-6 p-4 md:p-6 lg:p-8">
    <header><p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-700">Insights</p><h1 className="mt-2 text-3xl font-semibold text-slate-900">Analytics</h1><p className="mt-1 text-slate-600">Understand alert volume, sources, environments, and recurring problems.</p></header>

    <DateFilter fromDate={fromDate} toDate={toDate} onFromDateChange={setFromDate} onToDateChange={setToDate} onClear={() => { setFromDate(lastWeek); setToDate(today); setError(null); }} />

    {error ? <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 p-5 text-rose-700"><span>{error}</span><button type="button" onClick={() => void load()} className="rounded-lg border border-rose-300 bg-white px-3 py-2 text-sm font-semibold text-rose-700">Retry</button></div> : null}

    {loading && !data ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">{Array.from({ length: 6 }, (_, index) => <div key={index} className="h-28 animate-pulse rounded-xl bg-slate-200" />)}</div> : null}

    {data ? <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <MetricCard label="Total Alerts" value={data.summary.total_alerts} accent="bg-sky-600" icon={Inbox} />
        <MetricCard label="Total Requests" value={data.summary.total_requests} accent="bg-teal-600" icon={ListChecks} />
        <MetricCard label="Unknown Errors" value={data.summary.unknown_errors} accent="bg-amber-500" icon={AlertCircle} />
        <MetricCard label="Validation Errors" value={data.summary.response_validation_errors} accent="bg-rose-600" icon={TriangleAlert} />
        <MetricCard label="Unique Sources" value={data.summary.unique_sources} accent="bg-indigo-600" icon={Server} />
        <MetricCard label="Environments" value={data.summary.unique_environments} accent="bg-slate-600" icon={Globe2} />
      </div>

      {!hasAlerts ? <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">No alerts found for the selected date range.</div> : <>
        <ChartCard title="Alert Trend" icon={ChartNoAxesCombined} className="min-w-0">
          {loading ? <ChartSkeleton /> : <ResponsiveContainer width="100%" height={320}><LineChart data={data.trend} margin={{ top: 8, right: 20, left: 0, bottom: 8 }}><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" /><XAxis dataKey="date" tick={{ fontSize: 12 }} tickLine={false} /><YAxis allowDecimals={false} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} /><Tooltip contentStyle={{ borderRadius: 10, borderColor: '#e2e8f0' }} /><Legend /><Line type="monotone" dataKey="total" name="Total Alerts" stroke={COLORS.total} strokeWidth={3} dot={false} /><Line type="monotone" dataKey="unknown" name="Unknown" stroke={COLORS.unknown} strokeWidth={2} dot={false} /><Line type="monotone" dataKey="response_validation" name="Validation" stroke={COLORS.validation} strokeWidth={2} dot={false} /></LineChart></ResponsiveContainer>}
        </ChartCard>

        <div className="grid gap-6 lg:grid-cols-2">
          <ChartCard title="Error Type Distribution" icon={TriangleAlert}>
            {data.error_type_distribution.every((item) => item.count === 0) ? <EmptyChart /> : <ResponsiveContainer width="100%" height={300}><PieChart><Pie data={data.error_type_distribution} dataKey="count" nameKey="error_type" cx="50%" cy="48%" innerRadius={72} outerRadius={108} paddingAngle={3}>{data.error_type_distribution.map((item, index) => <Cell key={item.error_type} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}</Pie><Tooltip formatter={(value, name) => [Number(value ?? 0).toLocaleString(), String(name ?? '')]} /><Legend /></PieChart></ResponsiveContainer>}
          </ChartCard>
          <ChartCard title="Alerts by Environment" icon={Globe2}>
            <ResponsiveContainer width="100%" height={300}><BarChart data={data.by_environment} layout="vertical" margin={{ top: 8, right: 20, left: 20, bottom: 8 }}><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" /><XAxis type="number" allowDecimals={false} /><YAxis type="category" dataKey="environment" width={90} tickFormatter={(value) => value || 'Unknown'} /><Tooltip /><Bar dataKey="alerts" name="Alerts" fill={COLORS.total} radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer>
          </ChartCard>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <ChartCard title="Alerts by Source" icon={Server}><ResponsiveContainer width="100%" height={320}><BarChart data={data.by_source} layout="vertical" margin={{ top: 8, right: 20, left: 20, bottom: 8 }}><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" /><XAxis type="number" allowDecimals={false} /><YAxis type="category" dataKey="source_name" width={90} tickFormatter={(value) => value || 'Unknown'} /><Tooltip /><Bar dataKey="alerts" name="Alerts" fill={COLORS.total} radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer></ChartCard>
          <ChartCard title="Requests by Source" icon={ListChecks}><ResponsiveContainer width="100%" height={320}><BarChart data={requestSources} layout="vertical" margin={{ top: 8, right: 20, left: 20, bottom: 8 }}><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" /><XAxis type="number" allowDecimals={false} /><YAxis type="category" dataKey="name" width={90} /><Tooltip /><Bar dataKey="requests" name="Requests" fill={COLORS.requests} radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer></ChartCard>
        </div>

        <ChartCard title="Errors by Source" icon={BarChart3}><ResponsiveContainer width="100%" height={340}><BarChart data={sourceErrors} margin={{ top: 8, right: 20, left: 0, bottom: 8 }}><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" /><XAxis dataKey="name" tick={{ fontSize: 12 }} /><YAxis allowDecimals={false} /><Tooltip /><Legend /><Bar dataKey="unknown" name="Unknown" stackId="errors" fill={COLORS.unknown} /><Bar dataKey="response_validation" name="Validation" stackId="errors" fill={COLORS.validation} radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></ChartCard>

        <ChartCard title="Top Recurring Errors" icon={AlertCircle}><ResponsiveContainer width="100%" height={Math.max(280, recurringErrors.length * 42)}><BarChart data={recurringErrors} layout="vertical" margin={{ top: 8, right: 20, left: 24, bottom: 8 }}><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" /><XAxis type="number" allowDecimals={false} /><YAxis type="category" dataKey="label" width={180} tick={{ fontSize: 11 }} /><Tooltip labelFormatter={(_, payload) => payload?.[0]?.payload?.error_message || ''} /><Bar dataKey="count" name="Occurrences" fill={COLORS.validation} radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer></ChartCard>

        <ChartCard title="Recent Alerts" icon={Inbox}><div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead><tr className="border-b text-slate-500"><th className="py-3 pr-4">Source</th><th className="pr-4">Environment</th><th className="pr-4">Error Type</th><th className="pr-4">Alert Timestamp</th><th>Requests</th></tr></thead><tbody>{data.recent_alerts.map((alert) => <tr key={alert.id} className="border-b border-slate-100"><td className="py-3 pr-4 font-medium text-slate-900">{alert.source_name || 'Unknown'}</td><td className="pr-4">{alert.environment || 'Unknown'}</td><td className="pr-4">{alert.error_type}</td><td className="pr-4">{alert.alert_timestamp ? new Date(alert.alert_timestamp).toLocaleString() : '—'}</td><td>{alert.requests.length}</td></tr>)}</tbody></table></div></ChartCard>
      </>}
    </> : null}
  </main>;
}
