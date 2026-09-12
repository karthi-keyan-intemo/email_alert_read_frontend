const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = localStorage.getItem('email_alert_access_token');
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type') && options.body) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  if (response.status === 401) {
    localStorage.removeItem('email_alert_access_token');
    localStorage.removeItem('email_alert_user');
    if (window.location.pathname !== '/login') window.location.assign('/login');
  }
  return response;
}