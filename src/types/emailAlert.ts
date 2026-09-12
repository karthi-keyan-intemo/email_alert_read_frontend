export type ErrorType = 'UNKNOWN' | 'RESPONSE_VALIDATION';

export interface EmailAlertRequest {
  id: string;
  request_id: string;
  created_at: string;
}

export interface EmailAlertItem {
  id: string;
  message_id: string | null;
  azure_task: string | null;
  email_subject: string;
  error_type: ErrorType;
  environment: string | null;
  source_name: string | null;
  error_message: string | null;
  alert_timestamp: string | null;
  email_received_at: string | null;
  sender_email: string | null;
  original_body: string | null;
  created_at: string;
  requests: EmailAlertRequest[];
}

export interface EmailAlertAzureTaskUpdateRequest {
  azure_task: string | null;
}

export interface EmailAlertAzureTaskUpdateResponse {
  id: string;
  azure_task: string | null;
}

export interface EmailAlertReadResponse {
  emails_found: number;
  alerts_created: number;
  alerts_skipped: number;
}
