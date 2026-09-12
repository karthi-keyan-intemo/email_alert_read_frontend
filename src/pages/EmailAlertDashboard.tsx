import { useEffect, useMemo, useState } from 'react';

import { AlertDetails } from '../components/AlertDetails';
import { AlertTable } from '../components/AlertTable';
import { DateFilter } from '../components/DateFilter';
import { SummaryCards } from '../components/SummaryCards';
import { fetchEmailAlerts, syncEmailAlerts } from '../services/emailAlertApi';
import { EmailAlertItem } from '../types/emailAlert';

function formatLocalDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

const today = formatLocalDate(new Date());
const defaultFromDate = (() => {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return formatLocalDate(date);
})();

export function EmailAlertDashboard() {
  const [alerts, setAlerts] = useState<EmailAlertItem[]>([]);
  const [fromDate, setFromDate] = useState(defaultFromDate);
  const [toDate, setToDate] = useState(today);
  const [searchValue, setSearchValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<EmailAlertItem | null>(null);
  const [sortField, setSortField] = useState<'alert_timestamp' | 'environment' | 'source_name' | 'error_type'>('alert_timestamp');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const loadAlerts = async (nextFromDate = fromDate, nextToDate = toDate) => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchEmailAlerts({
        from_date: nextFromDate || undefined,
        to_date: nextToDate || undefined,
      });
      setAlerts(result);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load email alerts. Please try again.');
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAlerts();
  }, []);

  const filteredAlerts = useMemo(() => {
    const trimmedSearch = searchValue.trim().toLowerCase();

    const normalizedAlerts = [...alerts].filter((alert) => {
      if (!trimmedSearch) {
        return true;
      }

      const haystack = [
        alert.source_name,
        alert.error_message,
        alert.email_subject,
        alert.environment,
        alert.requests.map((request) => request.request_id).join(' '),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(trimmedSearch);
    });

    return normalizedAlerts.sort((left, right) => {
      const direction = sortDirection === 'asc' ? 1 : -1;

      switch (sortField) {
        case 'environment': {
          const leftValue = (left.environment || '').toLowerCase();
          const rightValue = (right.environment || '').toLowerCase();
          return leftValue.localeCompare(rightValue) * direction;
        }
        case 'source_name': {
          const leftValue = (left.source_name || '').toLowerCase();
          const rightValue = (right.source_name || '').toLowerCase();
          return leftValue.localeCompare(rightValue) * direction;
        }
        case 'error_type': {
          const leftValue = left.error_type.toLowerCase();
          const rightValue = right.error_type.toLowerCase();
          return leftValue.localeCompare(rightValue) * direction;
        }
        case 'alert_timestamp':
        default: {
          const leftTime = left.alert_timestamp ? new Date(left.alert_timestamp).getTime() : 0;
          const rightTime = right.alert_timestamp ? new Date(right.alert_timestamp).getTime() : 0;
          return (leftTime - rightTime) * direction;
        }
      }
    });
  }, [alerts, searchValue, sortDirection, sortField]);

  const summary = useMemo(() => {
    const totalAlerts = filteredAlerts.length;
    const unknownErrors = filteredAlerts.filter((alert) => alert.error_type === 'UNKNOWN').length;
    const responseValidationErrors = filteredAlerts.filter((alert) => alert.error_type === 'RESPONSE_VALIDATION').length;
    const totalRequests = filteredAlerts.reduce((count, alert) => count + alert.requests.length, 0);

    return {
      totalAlerts,
      unknownErrors,
      responseValidationErrors,
      totalRequests,
    };
  }, [filteredAlerts]);

  const handleApply = () => {
    setSyncMessage(null);
    void loadAlerts(fromDate, toDate);
  };

  const handleClear = () => {
    setSyncMessage(null);
    setFromDate('');
    setToDate('');
    void loadAlerts('', '');
  };

  const handleSync = async () => {
    if (syncing) {
      return;
    }

    if (!fromDate || !toDate) {
      setSyncMessage('Please select both dates before syncing.');
      return;
    }

    if (fromDate > toDate) {
      setSyncMessage('From date cannot be later than To date.');
      return;
    }

    setSyncing(true);
    setSyncMessage(null);

    try {
      const result = await syncEmailAlerts(fromDate, toDate);
      let refreshedAlerts: EmailAlertItem[];

      try {
        refreshedAlerts = await fetchEmailAlerts({
          from_date: fromDate,
          to_date: toDate,
        });
      } catch {
        setSyncMessage('Sync completed, but alerts could not be refreshed. Please try again.');
        return;
      }

      setAlerts(refreshedAlerts);
      setSelectedAlert((currentAlert) => {
        if (!currentAlert) {
          return null;
        }

        return refreshedAlerts.find((alert) => alert.id === currentAlert.id) || null;
      });
      setError(null);
      setSyncMessage(`Sync completed. ${result.alerts_created} new alerts processed.`);
    } catch {
      setSyncMessage('Unable to sync email alerts. Please try again.');
    } finally {
      setSyncing(false);
    }
  };

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'));
      return;
    }

    setSortField(field);
    setSortDirection('desc');
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-2xl border border-slate-200 bg-white px-5 py-6 shadow-sm">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-700">Operations</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">Email Alert Dashboard</h1>
          <p className="mt-1 text-slate-600">Monitor and review Spot Rates email alerts</p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => void handleSync()}
              disabled={syncing}
              className="rounded-lg bg-sky-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:bg-sky-400"
            >
              {syncing ? '⟳ Syncing...' : '↻ Sync Now'}
            </button>
            {syncMessage ? <span className="text-sm text-slate-700">{syncMessage}</span> : null}
          </div>
        </header>

        <DateFilter
          fromDate={fromDate}
          toDate={toDate}
          onFromDateChange={setFromDate}
          onToDateChange={setToDate}
          onApply={handleApply}
          onClear={handleClear}
          loading={loading}
        />

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700">Search alerts</label>
              <input
                type="search"
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="Search source, error, subject, environment..."
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => handleSort('alert_timestamp')} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                Sort: Alert Time
              </button>
              <button type="button" onClick={() => handleSort('environment')} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                Sort: Environment
              </button>
              <button type="button" onClick={() => handleSort('source_name')} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                Sort: Source
              </button>
              <button type="button" onClick={() => handleSort('error_type')} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                Sort: Error Type
              </button>
            </div>
          </div>
        </div>

        <SummaryCards
          totalAlerts={summary.totalAlerts}
          unknownErrors={summary.unknownErrors}
          responseValidationErrors={summary.responseValidationErrors}
          totalRequests={summary.totalRequests}
        />

        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="animate-pulse space-y-3">
              <div className="h-6 w-40 rounded bg-slate-200" />
              <div className="h-20 rounded bg-slate-200" />
              <div className="h-20 rounded bg-slate-200" />
              <div className="h-20 rounded bg-slate-200" />
            </div>
          </div>
        ) : error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-700 shadow-sm">
            <div className="text-lg font-semibold">Unable to load email alerts. Please try again.</div>
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">No alerts found</h2>
            <p className="mt-2 text-slate-600">Try changing the selected date range.</p>
          </div>
        ) : (
          <AlertTable
            alerts={filteredAlerts}
            onOpenDetails={setSelectedAlert}
            onRequestClick={setSelectedAlert}
          />
        )}
      </div>

      {selectedAlert ? (
        <AlertDetails
          alert={selectedAlert}
          onClose={() => setSelectedAlert(null)}
          onAlertUpdated={(updatedAlert) => {
            setAlerts((currentAlerts) =>
              currentAlerts.map((alert) => (alert.id === updatedAlert.id ? updatedAlert : alert)),
            );
            setSelectedAlert(updatedAlert);
          }}
        />
      ) : null}
    </div>
  );
}
