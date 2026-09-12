import {
  EmailAlertAzureTaskUpdateRequest,
  EmailAlertAzureTaskUpdateResponse,
  EmailAlertItem,
  EmailAlertReadResponse,
  PaginatedEmailAlerts,
  AnalyticsResponse,
} from '../types/emailAlert';
import { apiFetch } from './apiClient';

export interface FetchEmailAlertsParams {
  from_date?: string;
  to_date?: string;
  page?: number;
  page_size?: number;
  environment?: string;
  source_name?: string;
  error_type?: string;
  email_subject?: string;
  error_message?: string;
  azure_task?: string;
  request_id?: string;
  alert_timestamp_from?: string;
  alert_timestamp_to?: string;
  email_received_at_from?: string;
  email_received_at_to?: string;
  sort_by?: 'alert_timestamp' | 'email_received_at' | 'environment' | 'source_name' | 'error_type' | 'created_at' | 'email_subject';
  sort_order?: 'asc' | 'desc';
}

export async function fetchEmailAlerts(params: FetchEmailAlertsParams = {}): Promise<PaginatedEmailAlerts> {
  const searchParams = new URLSearchParams();

  if (params.from_date) {
    searchParams.set('from_date', params.from_date);
  }

  if (params.to_date) {
    searchParams.set('to_date', params.to_date);
  }
  if (params.page) searchParams.set('page', String(params.page));
  if (params.page_size) searchParams.set('page_size', String(params.page_size));
  for (const key of ['environment', 'source_name', 'error_type', 'email_subject', 'error_message', 'azure_task', 'request_id', 'alert_timestamp_from', 'alert_timestamp_to', 'email_received_at_from', 'email_received_at_to'] as const) {
    if (params[key]) searchParams.set(key, params[key] as string);
  }
  if (params.sort_by) searchParams.set('sort_by', params.sort_by);
  if (params.sort_order) searchParams.set('sort_order', params.sort_order);

  const queryString = searchParams.toString();
  const response = await apiFetch(`/api/email-alerts${queryString ? `?${queryString}` : ''}`);

  if (!response.ok) {
    throw new Error('Unable to load email alerts. Please try again.');
  }

  return (await response.json()) as PaginatedEmailAlerts;
}

export async function fetchAnalytics(params: Pick<FetchEmailAlertsParams, 'from_date' | 'to_date' | 'environment' | 'source_name' | 'error_type' | 'error_message' | 'azure_task'>): Promise<AnalyticsResponse> {
  const query = new URLSearchParams();
  for (const key of ['from_date', 'to_date', 'environment', 'source_name', 'error_type', 'error_message', 'azure_task'] as const) {
    if (params[key]) query.set(key, params[key] as string);
  }
  const response = await apiFetch(`/api/email-alerts/analytics?${query.toString()}`);
  if (!response.ok) throw new Error('Unable to load analytics. Please try again.');
  return await response.json() as AnalyticsResponse;
}

export async function exportEmailAlerts(fromDate: string, toDate: string): Promise<{ blob: Blob; filename: string | null }> {
  const searchParams = new URLSearchParams({ from_date: fromDate, to_date: toDate });
  const response = await apiFetch(`/api/email-alerts/export?${searchParams.toString()}`);
  if (!response.ok) {
    throw new Error('Unable to export email alerts. Please try again.');
  }

  const disposition = response.headers.get('Content-Disposition');
  const filename = disposition?.match(/filename="?([^";]+)"?/i)?.[1] || null;
  return { blob: await response.blob(), filename };
}

export async function syncEmailAlerts(fromDate: string, toDate: string): Promise<EmailAlertReadResponse> {
  const response = await apiFetch('/api/email-alerts/read', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from_date: fromDate,
      to_date: toDate,
    }),
  });

  if (!response.ok) {
    throw new Error('Unable to sync email alerts. Please try again.');
  }

  return (await response.json()) as EmailAlertReadResponse;
}

export async function updateAzureTask(
  alertId: string,
  azureTask: string | null,
): Promise<EmailAlertAzureTaskUpdateResponse> {
  const payload: EmailAlertAzureTaskUpdateRequest = {
    azure_task: azureTask,
  };

  const response = await apiFetch(`/api/email-alerts/${alertId}/azure-task`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();

    if (response.status === 404) {
      throw new Error('Alert not found.');
    }

    if (errorText) {
      console.error(errorText);
    }

    throw new Error('Unable to update Azure task. Please try again.');
  }

  return (await response.json()) as EmailAlertAzureTaskUpdateResponse;
}
