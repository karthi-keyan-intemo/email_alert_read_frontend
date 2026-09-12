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

export interface EmailAlertSummary {
  total_alerts: number;
  unknown_errors: number;
  response_validation_errors: number;
  total_requests: number;
}

export interface PaginatedEmailAlerts {
  items: EmailAlertItem[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
  summary: EmailAlertSummary;
}

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  roles: string[];
  permissions: string[];
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: AuthUser;
}

export interface AnalyticsResponse {
  summary: AnalyticsSummary;
  trend: TrendPoint[];
  error_type_distribution: ErrorTypeDistribution[];
  by_source: SourceAnalytics[];
  by_environment: EnvironmentAnalytics[];
  top_errors: TopRecurringError[];
  source_error_type: SourceErrorType[];
  recent_alerts: EmailAlertItem[];
}

export interface AnalyticsSummary {
  total_alerts: number;
  total_requests: number;
  unknown_errors: number;
  response_validation_errors: number;
  unique_sources: number;
  unique_environments: number;
}

export interface TrendPoint {
  date: string;
  total: number;
  unknown: number;
  response_validation: number;
}

export interface ErrorTypeDistribution {
  error_type: string;
  count: number;
}

export interface SourceAnalytics {
  source_name: string | null;
  alerts: number;
  requests: number;
  unknown: number;
  response_validation: number;
}

export interface EnvironmentAnalytics {
  environment: string | null;
  alerts: number;
  requests: number;
  percentage: number;
}

export interface TopRecurringError {
  error_message: string | null;
  count: number;
  sources: string[];
}

export interface SourceErrorType {
  source_name: string | null;
  error_type: string;
  count: number;
}
