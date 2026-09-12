import { apiFetch } from './apiClient';

export interface ManagedUser { id: string; email: string; full_name: string; roles: string[]; permissions: string[]; is_active: boolean; created_at: string; }
export interface ManagedRole { id: string; name: string; description: string | null; permissions: string[]; }
export interface ManagedPermission { id: string; name: string; description: string | null; }

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await apiFetch(path, options);
  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { detail?: string } | null;
    throw new Error(payload?.detail || 'Unable to complete access-management request.');
  }
  return response.status === 204 ? undefined as T : await response.json() as T;
}

export const accessApi = {
  users: () => request<ManagedUser[]>('/api/users'),
  createUser: (body: object) => request<ManagedUser>('/api/users', { method: 'POST', body: JSON.stringify(body) }),
  toggleUser: (user: ManagedUser) => request<ManagedUser>(`/api/users/${user.id}`, { method: 'PATCH', body: JSON.stringify({ is_active: !user.is_active }) }),
  updateUser: (id: string, body: object) => request<ManagedUser>(`/api/users/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  resetPassword: (id: string, password: string) => request<void>(`/api/users/${id}/reset-password`, { method: 'POST', body: JSON.stringify({ password }) }),
  roles: () => request<ManagedRole[]>('/api/roles'),
  createRole: (body: object) => request<ManagedRole>('/api/roles', { method: 'POST', body: JSON.stringify(body) }),
  deleteRole: (id: string) => request<void>(`/api/roles/${id}`, { method: 'DELETE' }),
  updateRole: (id: string, body: object) => request<ManagedRole>(`/api/roles/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  permissions: () => request<ManagedPermission[]>('/api/permissions'),
  createPermission: (body: object) => request<ManagedPermission>('/api/permissions', { method: 'POST', body: JSON.stringify(body) }),
  deletePermission: (id: string) => request<void>(`/api/permissions/${id}`, { method: 'DELETE' }),
  updatePermission: (id: string, body: object) => request<ManagedPermission>(`/api/permissions/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
};