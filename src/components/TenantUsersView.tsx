import React, { useState } from 'react';
import { KeyRound, Lock, Plus, QrCode, RotateCcw, Unlock, UserPlus, X } from 'lucide-react';
import { Tenant, UserAccount, UserRole } from '../types';
import { formatRoleLabel, generateBase32Secret } from '../utils/formatters';
import { TotpQrCard } from './TotpQrCard';

interface TenantUsersViewProps {
  tenant: Tenant;
  users: UserAccount[];
  onCreateUser: (payload: {
    fullname: string;
    email: string;
    role: UserRole;
    assigned_quota_mb: number;
    ga_secret: string;
  }) => void;
  onToggleUserStatus: (userId: number) => void;
  onResetPassword: (userId: number) => void;
  onUpdateUserQuota: (userId: number, quotaMb: number) => void;
}

export const TenantUsersView: React.FC<TenantUsersViewProps> = ({
  tenant,
  users,
  onCreateUser,
  onToggleUserStatus,
  onResetPassword,
  onUpdateUserQuota,
}) => {
  const tenantUsers = users.filter((u) => u.tenant_id === tenant.id);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [fullname, setFullname] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('user');
  const [quotaMb, setQuotaMb] = useState(1024);
  const [inspectQrUser, setInspectQrUser] = useState<UserAccount | null>(null);
  const [feedback, setFeedback] = useState('');

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullname.trim() || !email.trim()) return;
    onCreateUser({
      fullname: fullname.trim(),
      email: email.trim().toLowerCase(),
      role,
      assigned_quota_mb: quotaMb,
      ga_secret: generateBase32Secret(),
    });
    setFeedback(`Created user ${email.trim().toLowerCase()} with mandatory Google Authenticator secret.`);
    setFullname('');
    setEmail('');
    setRole('user');
    setQuotaMb(1024);
    setShowCreateModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-semibold text-base text-slate-900 dark:text-white">
            {tenant.company_name} — User Directory
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Scoped to <code className="font-mono">tenant_id = {tenant.id}</code> ({tenant.slug}). All accounts require a valid Google Authenticator TOTP code before WebVM mount.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-medium transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Create User</span>
        </button>
      </div>

      {feedback && (
        <div className="p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
          <span>{feedback}</span>
          <button type="button" onClick={() => setFeedback('')}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">2FA Secret</th>
                <th className="py-3 px-4 text-right">Storage Quota</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
              {tenantUsers.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={u.avatar}
                        alt={u.fullname}
                        referrerPolicy="no-referrer"
                        className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="font-medium text-slate-900 dark:text-slate-100 truncate">
                          {u.fullname}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate">
                          {u.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                    {formatRoleLabel(u.role)}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                      <span>{u.ga_secret.slice(0, 6)}••••</span>
                      <button
                        type="button"
                        onClick={() => setInspectQrUser(u)}
                        className="text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>Enroll QR</span>
                      </button>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <select
                      aria-label={`Assign storage quota for ${u.fullname}`}
                      value={u.assigned_quota_mb}
                      onChange={(e) => onUpdateUserQuota(u.id, Number(e.target.value))}
                      className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono text-xs text-slate-800 dark:text-slate-200 tabular-nums"
                    >
                      <option value={512}>512 MB</option>
                      <option value={1024}>1,024 MB</option>
                      <option value={2048}>2,048 MB</option>
                      <option value={5120}>5,120 MB</option>
                      <option value={10240}>10,240 MB</option>
                    </select>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span
                      className={`font-medium ${
                        u.status === 'active'
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {u.status === 'active' ? 'Active' : 'Locked'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          onResetPassword(u.id);
                          setFeedback(`Password hash rotated in SQLite for ${u.email}.`);
                        }}
                        className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 inline-flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Reset Password</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onToggleUserStatus(u.id)}
                        className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 inline-flex items-center gap-1"
                      >
                        {u.status === 'active' ? (
                          <>
                            <Lock className="w-3 h-3" />
                            <span>Lock</span>
                          </>
                        ) : (
                          <>
                            <Unlock className="w-3 h-3" />
                            <span>Unlock</span>
                          </>
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-md w-full p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-semibold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-sky-600" />
                <span>Create Tenant User</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={fullname}
                  onChange={(e) => setFullname(e.target.value)}
                  placeholder="Ada Lovelace"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={`dev@${tenant.slug}.local`}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Role
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                  >
                    <option value="user">Tenant User</option>
                    <option value="tenant_admin">Tenant Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Assigned Storage
                  </label>
                  <select
                    value={quotaMb}
                    onChange={(e) => setQuotaMb(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                  >
                    <option value={512}>512 MB</option>
                    <option value={1024}>1,024 MB</option>
                    <option value={2048}>2,048 MB</option>
                    <option value={5120}>5,120 MB</option>
                  </select>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-sky-600 shrink-0" />
                <span>A Base32 Google Authenticator secret will be generated automatically.</span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-medium"
                >
                  Save User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inspect User 2FA QR Modal */}
      {inspectQrUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-semibold text-base text-slate-900 dark:text-white">
                2FA Enrollment — {inspectQrUser.fullname}
              </h3>
              <button
                type="button"
                onClick={() => setInspectQrUser(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <TotpQrCard
              email={inspectQrUser.email}
              secret={inspectQrUser.ga_secret}
              tenantSlug={tenant.slug}
            />
          </div>
        </div>
      )}
    </div>
  );
};
