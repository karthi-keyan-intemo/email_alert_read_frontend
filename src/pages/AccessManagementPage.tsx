import { useEffect, useState, type ReactNode } from 'react';

import { useAuth } from '../context/AuthContext';
import { accessApi, ManagedPermission, ManagedRole, ManagedUser } from '../services/accessApi';

type Tab = 'users' | 'roles' | 'permissions';
type Dialog = 'create-user' | 'edit-user' | 'reset-password' | 'edit-role' | 'edit-permission' | null;

function Dialog({ title, children, onClose, onSubmit, submitLabel }: { title: string; children: ReactNode; onClose: () => void; onSubmit: () => void; submitLabel: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between gap-4"><h3 className="text-xl font-semibold text-slate-900">{title}</h3><button type="button" onClick={onClose} className="text-sm text-slate-500 hover:text-slate-900">Close</button></div>
        <div className="mt-5 space-y-4">{children}</div>
        <div className="mt-6 flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700">Cancel</button><button type="button" onClick={onSubmit} className="rounded-lg bg-sky-700 px-4 py-2 text-sm font-semibold text-white">{submitLabel}</button></div>
      </div>
    </div>
  );
}

function RoleCheckboxes({ roles, selected, onChange }: { roles: ManagedRole[]; selected: string[]; onChange: (ids: string[]) => void }) {
  return <fieldset><legend className="text-sm font-medium text-slate-700">Roles</legend><div className="mt-2 grid gap-2 sm:grid-cols-2">{roles.map((role) => <label key={role.id} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700"><input type="checkbox" checked={selected.includes(role.id)} onChange={(event) => onChange(event.target.checked ? [...selected, role.id] : selected.filter((id) => id !== role.id))} />{role.name}</label>)}</div></fieldset>;
}

export function AccessManagementPage() {
  const { hasPermission } = useAuth();
  const [tab, setTab] = useState<Tab>('users');
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [roles, setRoles] = useState<ManagedRole[]>([]);
  const [permissions, setPermissions] = useState<ManagedPermission[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [description, setDescription] = useState('');
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>([]);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [activeUser, setActiveUser] = useState<ManagedUser | null>(null);
  const [activeRole, setActiveRole] = useState<ManagedRole | null>(null);
  const [activePermission, setActivePermission] = useState<ManagedPermission | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    const [nextUsers, nextRoles, nextPermissions] = await Promise.all([accessApi.users(), accessApi.roles(), accessApi.permissions()]);
    setUsers(nextUsers); setRoles(nextRoles); setPermissions(nextPermissions);
  };

  useEffect(() => { void refresh().catch((loadError) => setError(loadError instanceof Error ? loadError.message : 'Unable to load access data.')); }, []);

  if (!hasPermission('ACCESS_MANAGE')) return <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-700">Access denied.</div>;

  const closeDialog = () => { setDialog(null); setActiveUser(null); setActiveRole(null); setActivePermission(null); };
  const run = async (operation: () => Promise<unknown>) => { try { await operation(); setError(null); closeDialog(); await refresh(); } catch (operationError) { setError(operationError instanceof Error ? operationError.message : 'Unable to complete the request.'); } };
  const openCreateUser = () => { setName(''); setEmail(''); setPassword(''); setSelectedRoleIds([]); setDialog('create-user'); };
  const openEditUser = (user: ManagedUser) => { setActiveUser(user); setName(user.full_name); setEmail(user.email); setSelectedRoleIds(roles.filter((role) => user.roles.includes(role.name)).map((role) => role.id)); setDialog('edit-user'); };
  const openResetPassword = (user: ManagedUser) => { setActiveUser(user); setPassword(''); setDialog('reset-password'); };
  const openEditRole = (role: ManagedRole) => { setActiveRole(role); setName(role.name); setDescription(role.description || ''); setSelectedPermissionIds(permissions.filter((permission) => role.permissions.includes(permission.name)).map((permission) => permission.id)); setDialog('edit-role'); };
  const openEditPermission = (permission: ManagedPermission) => { setActivePermission(permission); setName(permission.name); setDescription(permission.description || ''); setDialog('edit-permission'); };
  const create = async () => { if (tab === 'roles') await run(() => accessApi.createRole({ name, description, permission_ids: selectedPermissionIds })); if (tab === 'permissions') await run(() => accessApi.createPermission({ name, description })); setName(''); setDescription(''); setSelectedPermissionIds([]); };
  const tabs: Tab[] = ['users', 'roles', 'permissions'];

  return <section className="mx-auto max-w-7xl space-y-5 p-4 md:p-6 lg:p-8">
    <div className="space-y-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm uppercase tracking-[0.18em] text-sky-700">Admin</p><h2 className="text-2xl font-semibold text-slate-900">Access Management</h2></div><div className="flex gap-2">{tabs.map((item) => <button key={item} type="button" onClick={() => setTab(item)} className={`rounded-lg px-3 py-2 text-sm font-medium ${tab === item ? 'bg-slate-900 text-white' : 'border border-slate-300 text-slate-700'}`}>{item[0].toUpperCase() + item.slice(1)}</button>)}</div></div>
    <div className="flex flex-wrap gap-3">
      {tab === 'users' ? <button type="button" onClick={openCreateUser} className="rounded-lg bg-sky-700 px-4 py-2 text-sm font-semibold text-white">Add User</button> : null}
      {tab !== 'users' ? <input value={name} onChange={(event) => setName(event.target.value)} placeholder={tab === 'roles' ? 'Role name' : 'Permission name'} className="rounded-lg border border-slate-300 px-3 py-2" /> : null}
      {tab !== 'users' ? <input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Description" className="rounded-lg border border-slate-300 px-3 py-2" /> : null}
      {/* {tab === 'roles' ? <div className="flex flex-wrap items-center gap-2">{permissions.map((permission) => <label key={permission.id} className="flex items-center gap-1 text-sm"><input type="checkbox" checked={selectedPermissionIds.includes(permission.id)} onChange={(event) => setSelectedPermissionIds((current) => event.target.checked ? [...current, permission.id] : current.filter((id) => id !== permission.id))} />{permission.name}</label>)}</div> : null} */}
      {tab !== 'users' ? <button type="button" onClick={() => void create()} className="rounded-lg bg-sky-700 px-4 py-2 text-sm font-semibold text-white">Create {tab.slice(0, -1)}</button> : null}
    </div>
    {error ? <p className="text-sm text-rose-700">{error}</p> : null}
    {tab === 'users' ? <div className="divide-y divide-slate-200">{users.map((user) => <div key={user.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div><div className="font-medium text-slate-900">{user.full_name}</div><div className="text-sm text-slate-600">{user.email} · {user.roles.join(', ') || 'No roles'} · {user.is_active ? 'Active' : 'Inactive'}</div></div><div className="flex gap-2"><button type="button" onClick={() => openEditUser(user)} className="rounded border border-slate-300 px-3 py-1.5 text-sm">Edit</button><button type="button" onClick={() => openResetPassword(user)} className="rounded border border-slate-300 px-3 py-1.5 text-sm">Reset Password</button><button type="button" onClick={() => void run(() => accessApi.toggleUser(user))} className="rounded border border-slate-300 px-3 py-1.5 text-sm">{user.is_active ? 'Deactivate' : 'Activate'}</button></div></div>)}</div> : null}
    {tab === 'roles' ? <div className="divide-y divide-slate-200">{roles.map((role) => <div key={role.id} className="flex items-center justify-between py-3"><div><div className="font-medium">{role.name}</div><div className="text-sm text-slate-600">{role.description || 'No description'} · {role.permissions.join(', ') || 'No permissions'}</div></div><div className="flex gap-2"><button type="button" onClick={() => openEditRole(role)} className="rounded border border-slate-300 px-3 py-1.5 text-sm">Edit</button><button type="button" onClick={() => void run(() => accessApi.deleteRole(role.id))} className="rounded border border-rose-300 px-3 py-1.5 text-sm text-rose-700">Delete</button></div></div>)}</div> : null}
    {tab === 'permissions' ? <div className="divide-y divide-slate-200">{permissions.map((permission) => <div key={permission.id} className="flex items-center justify-between py-3"><div><div className="font-medium">{permission.name}</div><div className="text-sm text-slate-600">{permission.description || 'No description'}</div></div><div className="flex gap-2"><button type="button" onClick={() => openEditPermission(permission)} className="rounded border border-slate-300 px-3 py-1.5 text-sm">Edit</button><button type="button" onClick={() => void run(() => accessApi.deletePermission(permission.id))} className="rounded border border-rose-300 px-3 py-1.5 text-sm text-rose-700">Delete</button></div></div>)}</div> : null}
    {dialog === 'create-user' ? <Dialog title="Add User" onClose={closeDialog} onSubmit={() => void run(() => accessApi.createUser({ email, full_name: name, password, role_ids: selectedRoleIds }))} submitLabel="Create User"><label className="block text-sm font-medium text-slate-700">Full name<input value={name} onChange={(event) => setName(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label><label className="block text-sm font-medium text-slate-700">Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label><label className="block text-sm font-medium text-slate-700">Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label><RoleCheckboxes roles={roles} selected={selectedRoleIds} onChange={setSelectedRoleIds} /></Dialog> : null}
    {dialog === 'edit-user' && activeUser ? <Dialog title={`Edit ${activeUser.full_name}`} onClose={closeDialog} onSubmit={() => void run(() => accessApi.updateUser(activeUser.id, { email, full_name: name, role_ids: selectedRoleIds }))} submitLabel="Save Changes"><label className="block text-sm font-medium text-slate-700">Full name<input value={name} onChange={(event) => setName(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label><label className="block text-sm font-medium text-slate-700">Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label><RoleCheckboxes roles={roles} selected={selectedRoleIds} onChange={setSelectedRoleIds} /></Dialog> : null}
    {dialog === 'reset-password' && activeUser ? <Dialog title={`Reset password for ${activeUser.full_name}`} onClose={closeDialog} onSubmit={() => void run(() => accessApi.resetPassword(activeUser.id, password))} submitLabel="Reset Password"><label className="block text-sm font-medium text-slate-700">New password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label></Dialog> : null}
    {dialog === 'edit-role' && activeRole ? <Dialog title={`Edit ${activeRole.name}`} onClose={closeDialog} onSubmit={() => void run(() => accessApi.updateRole(activeRole.id, { name, description, permission_ids: selectedPermissionIds }))} submitLabel="Save Changes"><label className="block text-sm font-medium text-slate-700">Role name<input value={name} onChange={(event) => setName(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label><label className="block text-sm font-medium text-slate-700">Description<input value={description} onChange={(event) => setDescription(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label><div className="flex flex-wrap gap-2">{permissions.map((permission) => <label key={permission.id} className="flex items-center gap-1 text-sm"><input type="checkbox" checked={selectedPermissionIds.includes(permission.id)} onChange={(event) => setSelectedPermissionIds((current) => event.target.checked ? [...current, permission.id] : current.filter((id) => id !== permission.id))} />{permission.name}</label>)}</div></Dialog> : null}
    {dialog === 'edit-permission' && activePermission ? <Dialog title={`Edit ${activePermission.name}`} onClose={closeDialog} onSubmit={() => void run(() => accessApi.updatePermission(activePermission.id, { name, description }))} submitLabel="Save Changes"><label className="block text-sm font-medium text-slate-700">Permission name<input value={name} onChange={(event) => setName(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label><label className="block text-sm font-medium text-slate-700">Description<input value={description} onChange={(event) => setDescription(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label></Dialog> : null}
    </div>
  </section>;
}
