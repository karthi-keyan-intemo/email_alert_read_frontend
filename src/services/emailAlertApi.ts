import {
  EmailAlertAzureTaskUpdateRequest,
  EmailAlertAzureTaskUpdateResponse,
  EmailAlertItem,
  EmailAlertReadResponse,
} from '../types/emailAlert';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export interface FetchEmailAlertsParams {
  from_date?: string;
  to_date?: string;
}

export async function fetchEmailAlerts(params: FetchEmailAlertsParams = {}): Promise<EmailAlertItem[]> {
  const searchParams = new URLSearchParams();

  if (params.from_date) {
    searchParams.set('from_date', params.from_date);
  }

  if (params.to_date) {
    searchParams.set('to_date', params.to_date);
  }

  const queryString = searchParams.toString();
  const url = `${API_BASE_URL}/api/email-alerts${queryString ? `?${queryString}` : ''}`;

  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Unable to load email alerts. Please try again.');
  }

  return (await response.json()) as EmailAlertItem[];
}

export async function syncEmailAlerts(fromDate: string, toDate: string): Promise<EmailAlertReadResponse> {
  const response = await fetch(`${API_BASE_URL}/api/email-alerts/read`, {
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

  const response = await fetch(`${API_BASE_URL}/api/email-alerts/${alertId}/azure-task`, {
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
