import { useState } from 'react';

import { updateAzureTask } from '../services/emailAlertApi';
import { EmailAlertItem } from '../types/emailAlert';
import { ErrorTypeBadge } from './ErrorTypeBadge';

interface AlertDetailsProps {
  alert: EmailAlertItem | null;
  onClose: () => void;
  onAlertUpdated: (updatedAlert: EmailAlertItem) => void;
}

function formatDate(value: string | null) {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

function formatMultiline(value: string | null) {
  if (!value) return '—';

  return value.split('\n').map((line, index) => (
    <span key={`${line}-${index}`} className="block">
      {line || ' '}
    </span>
  ));
}

export function AlertDetails({ alert, onClose, onAlertUpdated }: AlertDetailsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftAzureTask, setDraftAzureTask] = useState(alert?.azure_task ?? '');
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (!alert) {
    return null;
  }

  const handleEditStart = () => {
    setDraftAzureTask(alert.azure_task ?? '');
    setStatusMessage(null);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setDraftAzureTask(alert.azure_task ?? '');
    setStatusMessage(null);
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (saving) {
      return;
    }

    setSaving(true);
    setStatusMessage(null);

    try {
      const normalizedValue = draftAzureTask.trim();
      const updated = await updateAzureTask(alert.id, normalizedValue === '' ? null : normalizedValue);

      const updatedAlert: EmailAlertItem = {
        ...alert,
        azure_task: updated.azure_task,
      };

      onAlertUpdated(updatedAlert);
      setIsEditing(false);
      setStatusMessage('Azure task updated successfully.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to update Azure task. Please try again.';
      setStatusMessage(message);
      setDraftAzureTask(draftAzureTask);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-[2px]" onClick={onClose}>
      <aside
        className="absolute right-0 top-0 h-full w-full max-w-2xl overflow-y-auto border-l border-slate-200 bg-white p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Alert detail</p>
            <h3 className="mt-1 text-2xl font-semibold text-slate-900">{alert.email_subject}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Close
          </button>
        </div>

        <div className="space-y-5">
          <div className="flex flex-wrap gap-3">
            <ErrorTypeBadge type={alert.error_type} />
            {alert.environment ? (
              <span className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-sky-700">
                {alert.environment}
              </span>
            ) : null}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="text-xs uppercase tracking-wide text-slate-500">Source Name</div>
              <div className="mt-2 text-sm font-medium text-slate-900">{alert.source_name || '—'}</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="text-xs uppercase tracking-wide text-slate-500">Alert Timestamp</div>
              <div className="mt-2 text-sm font-medium text-slate-900">{formatDate(alert.alert_timestamp)}</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="text-xs uppercase tracking-wide text-slate-500">Email Received At</div>
              <div className="mt-2 text-sm font-medium text-slate-900">{formatDate(alert.email_received_at)}</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="text-xs uppercase tracking-wide text-slate-500">Sender Email</div>
              <div className="mt-2 text-sm font-medium text-slate-900">{alert.sender_email || '—'}</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 md:col-span-2">
              <div className="mb-2 flex items-center justify-between gap-3">
                <div className="text-xs uppercase tracking-wide text-slate-500">Azure Task</div>
                {!isEditing ? (
                  <button
                    type="button"
                    onClick={handleEditStart}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    Edit
                  </button>
                ) : null}
              </div>

              {isEditing ? (
                <div className="space-y-3">
                  <textarea
                    value={draftAzureTask}
                    onChange={(event) => setDraftAzureTask(event.target.value)}
                    rows={5}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                    placeholder="Enter Azure task"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={handleSave}
                      className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                    >
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900">
                  {alert.azure_task || 'Not assigned'}
                </div>
              )}

              {statusMessage ? (
                <div className="mt-2 text-sm text-slate-700">{statusMessage}</div>
              ) : null}
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="text-xs uppercase tracking-wide text-slate-500">Message ID</div>
              <div className="mt-2 break-all text-sm font-medium text-slate-900">{alert.message_id || '—'}</div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Request IDs</div>
            <div className="flex flex-wrap gap-2">
              {alert.requests.length > 0 ? (
                alert.requests.map((request) => (
                  <span
                    key={request.id}
                    className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 font-mono text-xs text-slate-700"
                  >
                    {request.request_id}
                  </span>
                ))
              ) : (
                <span className="text-sm text-slate-500">No request IDs</span>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Error Message</div>
            <div className="max-h-80 overflow-auto whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-950 p-3 font-mono text-sm text-slate-100">
              {formatMultiline(alert.error_message)}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Original Email Body</div>
            <div className="max-h-80 overflow-auto whitespace-pre-wrap rounded-lg border border-slate-200 bg-white p-3 font-mono text-sm text-slate-700">
              {formatMultiline(alert.original_body)}
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
