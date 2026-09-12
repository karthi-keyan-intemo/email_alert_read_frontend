import { useEffect, useState } from 'react';

import { AlertDetails } from '../components/AlertDetails';
import { AlertTable } from '../components/AlertTable';
import { DateRangeDialog } from '../components/DateRangeDialog';
import { SummaryCards } from '../components/SummaryCards';
import { exportEmailAlerts, fetchEmailAlerts, syncEmailAlerts } from '../services/emailAlertApi';
import { EmailAlertItem, PaginatedEmailAlerts } from '../types/emailAlert';
import { useAuth } from '../context/AuthContext';

type AlertFilters = {
  environment: string;
  source_name: string;
  error_type: string;
  email_subject: string;
  error_message: string;
  azure_task: string;
  request_id: string;
  alert_timestamp_from: string;
  alert_timestamp_to: string;
};

const emptyFilters: AlertFilters = { environment: '', source_name: '', error_type: '', email_subject: '', error_message: '', azure_task: '', request_id: '', alert_timestamp_from: '', alert_timestamp_to: '' };

function formatLocalDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

const today = formatLocalDate(new Date());
const yesterday = (() => {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return formatLocalDate(date);
})();
export function EmailAlertDashboard() {
  const { hasPermission } = useAuth();
  const [alerts, setAlerts] = useState<EmailAlertItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [summary, setSummary] = useState({ total_alerts: 0, unknown_errors: 0, response_validation_errors: 0, total_requests: 0 });
  const [filters, setFilters] = useState<AlertFilters>(emptyFilters);
  const [debouncedFilters, setDebouncedFilters] = useState<AlertFilters>(emptyFilters);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [syncOpen, setSyncOpen] = useState(false);
  const [syncFromDate, setSyncFromDate] = useState(yesterday);
  const [syncToDate, setSyncToDate] = useState(today);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportFromDate, setExportFromDate] = useState(yesterday);
  const [exportToDate, setExportToDate] = useState(today);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<EmailAlertItem | null>(null);
  const [sortField, setSortField] = useState<'alert_timestamp' | 'email_received_at' | 'environment' | 'source_name' | 'error_type' | 'created_at' | 'email_subject' | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const loadAlerts = async (nextPage = currentPage, nextPageSize = pageSize) => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchEmailAlerts({
        page: nextPage,
        page_size: nextPageSize,
        ...debouncedFilters,
        ...(sortField ? { sort_by: sortField } : {}),
        sort_order: sortOrder,
      });
      setAlerts(result.items);
      setCurrentPage(result.page);
      setTotalPages(result.total_pages);
      setSummary(result.summary);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load email alerts. Please try again.');
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { const timer = window.setTimeout(() => setDebouncedFilters(filters), 350); return () => window.clearTimeout(timer); }, [filters]);

  useEffect(() => { void loadAlerts(currentPage, pageSize); }, [currentPage, pageSize, debouncedFilters, sortField, sortOrder]);

  const handleSync = async (fromDate: string, toDate: string) => {
    if (syncing) {
      return;
    }

    setSyncing(true);
    setSyncMessage(null);
    setSyncError(null);

    try {
      const result = await syncEmailAlerts(fromDate, toDate);
      let refreshedAlerts: PaginatedEmailAlerts;

      try {
        refreshedAlerts = await fetchEmailAlerts({
          page: 1,
          page_size: pageSize,
          ...debouncedFilters,
          ...(sortField ? { sort_by: sortField } : {}),
          sort_order: sortOrder,
        });
      } catch {
        setSyncMessage('Sync completed, but alerts could not be refreshed. Please try again.');
        return;
      }

      setSyncOpen(false);
      setCurrentPage(1);
      setAlerts(refreshedAlerts.items);
      setTotalPages(refreshedAlerts.total_pages);
      setSummary(refreshedAlerts.summary);
      setSelectedAlert((currentAlert) => {
        if (!currentAlert) {
          return null;
        }

        return refreshedAlerts.items.find((alert) => alert.id === currentAlert.id) || null;
      });
      setError(null);
      setSyncMessage(`Sync completed. ${result.alerts_created} new alerts processed.`);
    } catch {
      setSyncMessage('Unable to sync email alerts. Please try again.');
      setSyncError('Unable to sync email alerts. Please try again.');
    } finally {
      setSyncing(false);
    }
  };

  const handleExport = async (fromDate: string, toDate: string) => {
    setExporting(true);
    setExportError(null);
    try {
      const result = await exportEmailAlerts(fromDate, toDate);
      const link = document.createElement('a');
      link.href = URL.createObjectURL(result.blob);
      link.download = result.filename || `email_alerts_${fromDate}_to_${toDate}.xlsx`;
      link.click();
      URL.revokeObjectURL(link.href);
      setExportOpen(false);
    } catch (exportLoadError) {
      setExportError(exportLoadError instanceof Error ? exportLoadError.message : 'Unable to export email alerts.');
    } finally { setExporting(false); }
  };

  const handleSort = (field: Exclude<typeof sortField, null>) => {
    if (sortField === field) {
      if (sortOrder === 'asc') setSortOrder('desc');
      else { setSortField(null); setSortOrder('desc'); }
      return;
    }

    setSortField(field);
    setSortOrder('desc');
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters((current) => ({ ...current, [field]: value }));
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-8xl space-y-6">
        <header className="rounded-2xl border border-slate-200 bg-white px-5 py-6 shadow-sm">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-700">Operations</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">Email Alert Dashboard</h1>
          <p className="mt-1 text-slate-600">Monitor and review Spot Rates email alerts</p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            {hasPermission('ALERT_SYNC') ? <button
              type="button"
              onClick={() => { setSyncError(null); setSyncOpen(true); }}
              disabled={syncing}
              className="rounded-lg bg-sky-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:bg-sky-400"
            >
              {syncing ? '⟳ Syncing...' : '↻ Sync Now'}
            </button> : null}
            {syncMessage ? <span className="text-sm text-slate-700">{syncMessage}</span> : null}
            {hasPermission('ALERT_EXPORT') ? <button type="button" onClick={() => { setExportError(null); setExportOpen(true); }} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Export</button> : null}
          </div>
        </header>

        <SummaryCards
          totalAlerts={summary.total_alerts}
          unknownErrors={summary.unknown_errors}
          responseValidationErrors={summary.response_validation_errors}
          totalRequests={summary.total_requests}
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
        ) : alerts.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">No alerts found</h2>
            <p className="mt-2 text-slate-600">Try changing the selected date range.</p>
          </div>
        ) : (
          <AlertTable
            alerts={alerts}
            filters={filters}
            onFilterChange={handleFilterChange}
            sortField={sortField || ''}
            sortOrder={sortOrder}
            onSort={(field) => handleSort(field as Exclude<typeof sortField, null>)}
            onOpenDetails={setSelectedAlert}
            onRequestClick={setSelectedAlert}
          />
        )}

        <button type="button" onClick={() => { setFilters(emptyFilters); setCurrentPage(1); }} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Clear Column Filters</button>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <label className="flex items-center gap-2 text-sm text-slate-700">Page size
            <select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setCurrentPage(1); }} className="rounded border border-slate-300 px-2 py-1">
              {[20, 50, 100].map((size) => <option key={size} value={size}>{size}</option>)}
            </select>
          </label>
          <div className="flex items-center gap-3 text-sm text-slate-700">
            <button type="button" disabled={currentPage <= 1 || loading} onClick={() => setCurrentPage((page) => page - 1)} className="rounded border border-slate-300 px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-50">Previous</button>
            <span>Page {totalPages ? currentPage : 0} of {totalPages}</span>
            <button type="button" disabled={currentPage >= totalPages || loading} onClick={() => setCurrentPage((page) => page + 1)} className="rounded border border-slate-300 px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-50">Next</button>
          </div>
        </div>
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
      {syncOpen ? <DateRangeDialog title="Sync Email Alerts" confirmLabel="Sync" initialFromDate={syncFromDate} initialToDate={syncToDate} loading={syncing} error={syncError} onCancel={() => setSyncOpen(false)} onConfirm={(fromDate, toDate) => { setSyncFromDate(fromDate); setSyncToDate(toDate); void handleSync(fromDate, toDate); }} /> : null}
      {exportOpen ? <DateRangeDialog title="Export alerts" confirmLabel="Export" initialFromDate={exportFromDate} initialToDate={exportToDate} loading={exporting} error={exportError} onCancel={() => setExportOpen(false)} onConfirm={(fromDate, toDate) => { setExportFromDate(fromDate); setExportToDate(toDate); void handleExport(fromDate, toDate); }} /> : null}
    </div>
  );
}
