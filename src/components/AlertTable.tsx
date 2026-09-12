import { EmailAlertItem } from '../types/emailAlert';
import { ErrorTypeBadge } from './ErrorTypeBadge';

interface AlertTableProps {
  alerts: EmailAlertItem[];
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

export function AlertTable({ alerts, onOpenDetails, onRequestClick }: AlertTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 font-semibold">Alert</th>
              <th className="px-4 py-3 font-semibold">Environment</th>
              <th className="px-4 py-3 font-semibold">Source</th>
              <th className="px-4 py-3 font-semibold">Error Type</th>
              <th className="px-4 py-3 font-semibold">Azure Task</th>
              <th className="px-4 py-3 font-semibold">Alert Time</th>
              <th className="px-4 py-3 font-semibold">Requests</th>
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
