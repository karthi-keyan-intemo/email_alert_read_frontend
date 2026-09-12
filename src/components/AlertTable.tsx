import { EmailAlertItem } from '../types/emailAlert';
import { ErrorTypeBadge } from './ErrorTypeBadge';

interface AlertTableProps {
  alerts: EmailAlertItem[];
  filters: { environment: string; source_name: string; error_type: string; email_subject: string; error_message: string; azure_task: string; request_id: string; alert_timestamp_from: string; alert_timestamp_to: string };
  onFilterChange: (field: string, value: string) => void;
  sortField: string;
  sortOrder: 'asc' | 'desc';
  onSort: (field: string) => void;
  onOpenDetails: (alert: EmailAlertItem) => void;
  onRequestClick: (alert: EmailAlertItem) => void;
}

function formatAlertSummary(value: string | null) {
  if (!value) return 'No error message';

  const clean = value.replace(/\s+/g, ' ').trim();
  return clean.length > 120 ? `${clean.slice(0, 117)}...` : clean;
}

function formatDate(value: string | null) {
  if (!value) return '—';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

export function AlertTable({ alerts, filters, onFilterChange, sortField, sortOrder, onSort, onOpenDetails, onRequestClick }: AlertTableProps) {
  const sortIndicator = (field: string) => sortField === field ? (sortOrder === 'asc' ? ' ↑' : ' ↓') : ' ↕';
  const filterInput = (field: string, placeholder: string) => <input value={filters[field as keyof typeof filters]} onChange={(event) => onFilterChange(field, event.target.value)} placeholder={placeholder} className="mt-2 w-full min-w-24 rounded border border-slate-300 px-2 py-1 text-xs font-normal text-slate-700" />;
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="min-w-56 px-4 py-3 font-semibold"><button type="button" onClick={() => onSort('email_subject')}>Alert / Subject{sortIndicator('email_subject')}</button>{filterInput('email_subject', 'Search subject')}{filterInput('error_message', 'Search error')}</th>
              <th className="min-w-36 px-4 py-3 font-semibold"><button type="button" onClick={() => onSort('environment')}>Environment{sortIndicator('environment')}</button><select value={filters.environment} onChange={(event) => onFilterChange('environment', event.target.value)} className="mt-2 w-full rounded border border-slate-300 px-2 py-1 text-xs font-normal"><option value="">All</option><option value="STAGING">STAGING</option><option value="PRODUCTION">PRODUCTION</option></select></th>
              <th className="min-w-36 px-4 py-3 font-semibold"><button type="button" onClick={() => onSort('source_name')}>Source{sortIndicator('source_name')}</button>{filterInput('source_name', 'Search source')}</th>
              <th className="min-w-44 px-4 py-3 font-semibold"><button type="button" onClick={() => onSort('error_type')}>Error Type{sortIndicator('error_type')}</button><select value={filters.error_type} onChange={(event) => onFilterChange('error_type', event.target.value)} className="mt-2 w-full rounded border border-slate-300 px-2 py-1 text-xs font-normal"><option value="">All</option><option value="UNKNOWN">UNKNOWN</option><option value="RESPONSE_VALIDATION">RESPONSE_VALIDATION</option></select></th>
              <th className="min-w-48 px-4 py-3 font-semibold">Azure Task{filterInput('azure_task', 'Search task')}</th>
              <th className="min-w-48 px-4 py-3 font-semibold"><button type="button" onClick={() => onSort('alert_timestamp')}>Alert Time{sortIndicator('alert_timestamp')}</button><div className="mt-2 grid gap-1"><input type="date" value={filters.alert_timestamp_from} onChange={(event) => onFilterChange('alert_timestamp_from', event.target.value)} className="w-full rounded border border-slate-300 px-1 py-1 text-xs font-normal" /><input type="date" value={filters.alert_timestamp_to} onChange={(event) => onFilterChange('alert_timestamp_to', event.target.value)} className="w-full rounded border border-slate-300 px-1 py-1 text-xs font-normal" /></div></th>
              <th className="min-w-36 px-4 py-3 font-semibold">Requests{filterInput('request_id', 'Request ID')}</th>
              <th className="px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200">
            {alerts.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                  No alerts found.
                </td>
              </tr>
            ) : (
              alerts.map((alert) => (
                <tr key={alert.id} className="hover:bg-slate-50">
                  <td className="px-4 py-4 align-top">
                    <button
                      type="button"
                      onClick={() => onOpenDetails(alert)}
                      className="text-left text-slate-800 transition hover:text-sky-700"
                    >
                      <div className="font-medium">{alert.email_subject}</div>
                      <div className="mt-1 max-w-md text-slate-600">{formatAlertSummary(alert.error_message)}</div>
                    </button>
                  </td>
                  <td className="px-4 py-4 align-top">
                    {alert.environment ? (
                      <span className="inline-flex rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-sky-700">
                        {alert.environment}
                      </span>
                    ) : (
                      <span className="text-slate-500">—</span>
                    )}
                  </td>
                  <td className="px-4 py-4 align-top text-slate-700">{alert.source_name || '—'}</td>
                  <td className="px-4 py-4 align-top"><ErrorTypeBadge type={alert.error_type} /></td>
                  <td className="px-4 py-4 align-top">
                    <div className="max-w-[16rem] text-slate-700">
                      {alert.azure_task ? (
                        <span className="line-clamp-2">{alert.azure_task.length > 40 ? `${alert.azure_task.slice(0, 37)}...` : alert.azure_task}</span>
                      ) : (
                        <span className="italic text-slate-400">Not assigned</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 align-top text-slate-700">{formatDate(alert.alert_timestamp)}</td>
                  <td className="px-4 py-4 align-top">
                    <button
                      type="button"
                      onClick={() => onRequestClick(alert)}
                      className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-700 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700"
                    >
                      {alert.requests.length} Request{alert.requests.length === 1 ? '' : 's'}
                    </button>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <button
                      type="button"
                      onClick={() => onOpenDetails(alert)}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
