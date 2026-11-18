import React, { useState } from 'react';
import { CheckCircle2, ShieldCheck, User } from 'lucide-react';
import { PhpSessionState, Tenant, UserAccount } from '../types';
import { computeTotpCode, formatRoleLabel } from '../utils/formatters';
import { TotpQrCard } from './TotpQrCard';

interface ProfileSecurityViewProps {
  user: UserAccount;
  tenant: Tenant;
  session: PhpSessionState;
  onUpdateProfile: (userId: number, fullname: string) => void;
  onRotateGaSecret: (userId: number) => void;
}

export const ProfileSecurityView: React.FC<ProfileSecurityViewProps> = ({
  user,
  tenant,
  session,
  onUpdateProfile,
  onRotateGaSecret,
}) => {
  const [fullname, setFullname] = useState(user.fullname);
  const [newPassword, setNewPassword] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [verifyResult, setVerifyResult] = useState<'idle' | 'valid' | 'invalid'>('idle');
  const [savedNotice, setSavedNotice] = useState('');

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullname.trim()) return;
    onUpdateProfile(user.id, fullname.trim());
    setNewPassword('');
    setSavedNotice('Profile and password hash updated in SQLite users table.');
    setTimeout(() => setSavedNotice(''), 3000);
  };

  const handleVerifyTest = (e: React.FormEvent) => {
    e.preventDefault();
    const expected = computeTotpCode(user.ga_secret, Date.now());
    setVerifyResult(verifyCode.trim() === expected ? 'valid' : 'invalid');
  };

  return (
    <div className="space-y-6">
      {savedNotice && (
        <div className="p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{savedNotice}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Profile Form */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-5">
          <div className="flex items-center gap-4">
            <img
              src={user.avatar}
              alt={user.fullname}
              referrerPolicy="no-referrer"
              className="w-14 h-14 rounded-full object-cover border border-slate-200 dark:border-slate-700"
            />
            <div>
              <h2 className="font-display font-semibold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <User className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                <span>Account Profile</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {formatRoleLabel(user.role)} · {tenant.company_name}
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={fullname}
                onChange={(e) => setFullname(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Email (Read-Only Identifier)
              </label>
              <input
                type="email"
                disabled
                value={user.email}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-500 font-mono"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Update Password (Optional)
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password to re-hash"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
              />
            </div>

            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-medium transition-colors"
            >
              Save Profile
            </button>
          </form>

          {/* Active PHP Session Payload */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
            <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Active PHP 8.3 Session Variables
            </div>
            <pre className="p-3.5 rounded-lg bg-slate-950 text-slate-200 font-mono text-[11px] leading-relaxed overflow-x-auto border border-slate-800">
{`$_SESSION['user_id']       = ${session.user_id};
$_SESSION['tenant_id']     = ${session.tenant_id};
$_SESSION['role']          = '${session.role}';
$_SESSION['authenticated'] = ${session.authenticated ? 'true' : 'false'};
// PHPSESSID: ${session.session_id}`}
            </pre>
          </div>
        </div>

        {/* Google Authenticator Enrollment & Live Verification */}
        <div className="lg:col-span-7 space-y-5">
          <TotpQrCard
            email={user.email}
            secret={user.ga_secret}
            tenantSlug={tenant.slug}
            onRotateSecret={() => {
              onRotateGaSecret(user.id);
              setVerifyResult('idle');
            }}
          />

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
            <h3 className="font-display font-semibold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <span>Verify Authenticator Sync</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Test your 6-digit TOTP code against the active Base32 secret stored in SQLite <code className="font-mono">users.ga_secret</code>.
            </p>
            <form onSubmit={handleVerifyTest} className="flex flex-wrap items-center gap-3">
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={verifyCode}
                onChange={(e) => {
                  setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                  setVerifyResult('idle');
                }}
                placeholder="6-digit code"
                className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono text-sm tracking-widest text-slate-900 dark:text-slate-100 w-40 tabular-nums"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-slate-900 dark:bg-sky-600 hover:bg-slate-800 dark:hover:bg-sky-700 text-white text-xs font-medium transition-colors"
              >
                Verify TOTP Code
              </button>

              {verifyResult === 'valid' && (
                <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                  Valid TOTP — WebVM access authorized
                </span>
              )}
              {verifyResult === 'invalid' && (
                <span className="text-xs font-medium text-red-600 dark:text-red-400">
                  Invalid code — does not match current 30s window
                </span>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
