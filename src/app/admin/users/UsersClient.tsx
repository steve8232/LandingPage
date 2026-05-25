'use client';

import { useMemo, useState } from 'react';
import { Mail, ShieldCheck, User as UserIcon, Loader2, Plus } from 'lucide-react';

export interface AdminUserRowDTO {
  userId: string;
  email: string | null;
  role: 'admin' | 'user';
  createdAt: string;
  ownedCount: number;
  collabCount: number;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString();
}

export default function UsersClient({
  initialUsers,
  currentUserId,
  totalAdmins: initialTotalAdmins,
}: {
  initialUsers: AdminUserRowDTO[];
  currentUserId: string;
  totalAdmins: number;
}) {
  const [users, setUsers] = useState<AdminUserRowDTO[]>(initialUsers);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  // Invite form state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'user'>('user');
  const [inviting, setInviting] = useState(false);

  const totalAdmins = useMemo(
    () => users.filter((u) => u.role === 'admin').length || initialTotalAdmins,
    [users, initialTotalAdmins]
  );

  async function handleRoleChange(u: AdminUserRowDTO, next: 'admin' | 'user') {
    if (u.role === next) return;
    setBusyId(u.userId);
    setError('');
    setInfo('');
    try {
      const res = await fetch(`/api/admin/users/${u.userId}/role`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ role: next }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || `Update failed (${res.status})`);
      setUsers((prev) => prev.map((x) => (x.userId === u.userId ? { ...x, role: next } : x)));
      setInfo(`${u.email ?? 'User'} is now ${next}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setBusyId(null);
    }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    const email = inviteEmail.trim().toLowerCase();
    if (!email) return;
    setInviting(true);
    setError('');
    setInfo('');
    try {
      const res = await fetch('/api/admin/users/invite', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, role: inviteRole }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || `Invite failed (${res.status})`);
      const u = json.user as { id: string; email: string; role: 'admin' | 'user' };
      setUsers((prev) => {
        if (prev.some((x) => x.userId === u.id)) {
          return prev.map((x) => (x.userId === u.id ? { ...x, role: u.role } : x));
        }
        return [
          { userId: u.id, email: u.email, role: u.role, createdAt: new Date().toISOString(), ownedCount: 0, collabCount: 0 },
          ...prev,
        ];
      });
      setInviteEmail('');
      setInviteRole('user');
      setInfo(json.alreadyExisted ? `Updated existing account ${u.email}.` : `Invite sent to ${u.email}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invite failed');
    } finally {
      setInviting(false);
    }
  }

  return (
    <div className="space-y-6">
      {(error || info) && (
        <div
          className={`p-3 rounded-lg text-sm border ${
            error
              ? 'bg-red-50 border-red-200 text-red-700'
              : 'bg-emerald-50 border-emerald-200 text-emerald-700'
          }`}
        >
          {error || info}
        </div>
      )}

      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Mail className="w-4 h-4 text-orange-600" />
          <h2 className="font-semibold text-gray-900">Invite a user</h2>
        </div>
        <form onSubmit={handleInvite} className="flex flex-wrap items-center gap-2">
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="email@example.com"
            disabled={inviting}
            className="flex-1 min-w-[14rem] px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            required
          />
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value as 'admin' | 'user')}
            disabled={inviting}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
          <button
            type="submit"
            disabled={inviting || !inviteEmail.trim()}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Send invite
          </button>
        </form>
        <p className="mt-2 text-xs text-gray-500">
          Supabase sends a magic-link invite. Existing accounts are role-updated instead of re-invited.
        </p>
      </section>

      <UserTable
        users={users}
        currentUserId={currentUserId}
        totalAdmins={totalAdmins}
        busyId={busyId}
        onRoleChange={handleRoleChange}
      />
    </div>
  );
}

function UserTable({
  users,
  currentUserId,
  totalAdmins,
  busyId,
  onRoleChange,
}: {
  users: AdminUserRowDTO[];
  currentUserId: string;
  totalAdmins: number;
  busyId: string | null;
  onRoleChange: (u: AdminUserRowDTO, next: 'admin' | 'user') => void;
}) {
  return (
    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Pages owned</th>
              <th className="px-4 py-3 font-medium">Memberships</th>
              <th className="px-4 py-3 font-medium">Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                  No users yet.
                </td>
              </tr>
            ) : (
              users.map((u) => {
                const isMe = u.userId === currentUserId;
                const wouldStrandAdmins =
                  isMe && u.role === 'admin' && totalAdmins <= 1;
                const isBusy = busyId === u.userId;
                return (
                  <tr key={u.userId} className="border-b border-gray-50 last:border-0">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      <div className="flex items-center gap-2">
                        {u.role === 'admin' ? (
                          <ShieldCheck className="w-4 h-4 text-orange-600 shrink-0" />
                        ) : (
                          <UserIcon className="w-4 h-4 text-gray-400 shrink-0" />
                        )}
                        <span className="truncate">{u.email ?? '—'}</span>
                        {isMe && (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
                            you
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={u.role}
                        disabled={isBusy || wouldStrandAdmins}
                        onChange={(e) => onRoleChange(u, e.target.value as 'admin' | 'user')}
                        className="px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50"
                        title={wouldStrandAdmins ? 'Promote another admin first' : ''}
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                      {isBusy && (
                        <Loader2 className="inline ml-2 w-3 h-3 animate-spin text-gray-400" />
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{u.ownedCount}</td>
                    <td className="px-4 py-3 text-gray-700">{u.collabCount}</td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(u.createdAt)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
