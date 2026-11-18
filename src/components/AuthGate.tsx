import React, { useEffect, useState } from 'react';
import { ArrowRight, KeyRound, Lock, ShieldAlert, ShieldCheck, Terminal } from 'lucide-react';
import { Tenant, UserAccount } from '../types';
import { computeTotpCode, formatRoleLabel, getTotpSecondsRemaining } from '../utils/formatters';

interface AuthGateProps {
  users: UserAccount[];
  tenants: Tenant[];
  onAuthenticated: (user: UserAccount) => void;
  onFailedAttempt: (email: string, reason: string) => void;
}

export const AuthGate: React.FC<AuthGateProps> = ({
  users,
  tenants,
  onAuthenticated,
  onFailedAttempt,
}) => {
  const [step, setStep] = useState<'credentials' | 'totp'>('credentials');
  const [email, setEmail] = useState('daniel@iquipedigital.io');
  const [password, setPassword] = useState('Alpine#2026!');
  const [pendingUser, setPendingUser] = useState<UserAccount | null>(null);
  const [otpInput, setOtpInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const handleCredentialsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const matched = users.find(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase()
    );
    if (!matched) {
      setErrorMsg('No account found in SQLite users table for that email.');
      onFailedAttempt(email, 'Unknown email address');
      return;
    }
    if (!password.trim()) {
      setErrorMsg('Password is required.');
      return;
    }
    if (matched.status === 'locked') {
      setErrorMsg('This user account is locked by a Tenant Administrator.');
      onFailedAttempt(matched.email, 'User account locked');
      return;
    }
    const tenant = tenants.find((t) => t.id === matched.tenant_id);
    if (tenant && tenant.status === 'suspended') {
      setErrorMsg(`Tenant "${tenant.company_name}" is currently suspended.`);
      onFailedAttempt(matched.email, 'Tenant suspended');
      return;
    }
    setPendingUser(matched);
    setOtpInput('');
    setStep('totp');
  };

  const handleTotpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingUser) return;
    setErrorMsg('');
    const expectedCode = computeTotpCode(pendingUser.ga_secret, Date.now());
    const cleaned = otpInput.replace(/\s+/g, '');
    if (cleaned !== expectedCode) {
      setErrorMsg('Invalid 6-digit Google Authenticator code. WebVM access remains blocked.');
      onFailedAttempt(pendingUser.email, 'Invalid Google Authenticator TOTP code');
      return;
    }
    onAuthenticated(pendingUser);
  };

  const handleQuickPreset = (user: UserAccount) => {
    setEmail(user.email);
    setPassword('Alpine#2026!');
    setErrorMsg('');
  };

  const expectedCodeForPending = pendingUser
    ? computeTotpCode(pendingUser.ga_secret, now)
    : '';
  const secondsLeft = getTotpSecondsRemaining(now);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-center py-10 px-4 sm:px-8">
      <div className="max-w-5xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Left Architecture & Session Contract Panel */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-7 flex flex-col justify-between">
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2.5 text-slate-900 dark:text-white font-display font-bold text-xl tracking-tight">
                <span className="w-8 h-8 rounded-lg bg-slate-900 dark:bg-sky-500 text-white flex items-center justify-center shrink-0">
                  <Terminal className="w-4 h-4" />
                </span>
                <span>iQuipe Cloud Workspace</span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                Secure Multi-Tenant Alpine WebVM Platform Powered by WebAssembly.
              </p>
            </div>

            <div className="border-t border-slate-200 dark:border-slate-800 pt-5 space-y-3">
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                PHP 8.3 Session Security Gate
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Access to any tenant rootfs image and WebVM terminal is strictly blocked until both credentials and a valid 6-digit Google Authenticator TOTP code are verified.
              </p>

              <div className="rounded-lg bg-slate-950 text-slate-200 p-3.5 font-mono text-xs space-y-1 border border-slate-800">
                <div className="text-slate-400">Active Session State</div>
                <div>$_SESSION['user_id'] = {pendingUser ? pendingUser.id : 'null'}</div>
                <div>$_SESSION['tenant_id'] = {pendingUser ? pendingUser.tenant_id : 'null'}</div>
                <div>$_SESSION['role'] = {pendingUser ? `'${pendingUser.role}'` : 'null'}</div>
                <div className="text-amber-400">$_SESSION['authenticated'] = false</div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 dark:border-slate-800 pt-5 mt-6">
            <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2.5">
              Preset Role Accounts
            </div>
            <div className="space-y-2">
              {users.slice(0, 3).map((u) => {
                const isSelected = email.toLowerCase() === u.email.toLowerCase();
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleQuickPreset(u)}
                    className={`w-full text-left px-3 py-2 rounded-lg border text-xs transition-colors flex items-center justify-between gap-2 ${
                      isSelected
                        ? 'border-sky-600 bg-sky-50/70 dark:bg-sky-950/40 dark:border-sky-500 text-slate-900 dark:text-white'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span className="truncate font-medium">{u.fullname}</span>
                    <span className="text-slate-500 dark:text-slate-400 whitespace-nowrap shrink-0">
                      {formatRoleLabel(u.role)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Sign-In & Mandatory 2FA Form */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-7 sm:p-9 flex flex-col justify-center">
          <div className="flex items-center gap-3 text-xs font-medium text-slate-500 dark:text-slate-400 mb-6">
            <span className={step === 'credentials' ? 'text-sky-600 dark:text-sky-400 font-semibold' : ''}>
              1. Email & Password
            </span>
            <span aria-hidden="true">/</span>
            <span className={step === 'totp' ? 'text-sky-600 dark:text-sky-400 font-semibold' : ''}>
              2. Google Authenticator 2FA
            </span>
            <span aria-hidden="true">/</span>
            <span>3. Mount Alpine WebVM</span>
          </div>

          {step === 'credentials' ? (
            <form onSubmit={handleCredentialsSubmit} className="space-y-5">
              <div>
                <h1 className="text-2xl font-display font-bold tracking-tight text-slate-900 dark:text-white">
                  Sign in to Workspace
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Authenticate against the SQLite user registry before 2FA verification.
                </p>
              </div>

              {errorMsg && (
                <div className="p-3.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300 flex items-start gap-2.5">
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label htmlFor="auth-email" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Work Email
                  </label>
                  <input
                    id="auth-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    placeholder="name@company.com"
                  />
                </div>

                <div>
                  <label htmlFor="auth-password" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Password
                  </label>
                  <input
                    id="auth-password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    placeholder="••••••••••••"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between gap-4">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  PHP 8.3 Session · No JWT required
                </span>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
                >
                  <span>Continue to 2FA</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleTotpSubmit} className="space-y-5">
              <div>
                <h1 className="text-2xl font-display font-bold tracking-tight text-slate-900 dark:text-white">
                  Mandatory Google Authenticator
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Enter the 6-digit TOTP code for <span className="font-medium text-slate-800 dark:text-slate-200">{pendingUser?.email}</span> to unlock your Alpine WebVM.
                </p>
              </div>

              {errorMsg && (
                <div className="p-3.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300 flex items-start gap-2.5">
                  <Lock className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div>
                <label htmlFor="auth-totp" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  6-Digit Verification Code
                </label>
                <input
                  id="auth-totp"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  autoFocus
                  required
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono text-2xl tracking-[0.4em] text-center text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 tabular-nums"
                  placeholder="000000"
                />
              </div>

              {/* Authenticator Companion Widget for Testing */}
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <div className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                    <span>Authenticator Device Token</span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                    Secret: {pendingUser?.ga_secret} · {secondsLeft}s remaining
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-lg font-semibold tracking-widest text-slate-900 dark:text-slate-100 tabular-nums">
                    {expectedCodeForPending}
                  </span>
                  <button
                    type="button"
                    onClick={() => setOtpInput(expectedCodeForPending)}
                    className="px-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors whitespace-nowrap shrink-0"
                  >
                    Auto-Fill Code
                  </button>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setStep('credentials');
                    setErrorMsg('');
                  }}
                  className="px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verify 2FA & Launch WebVM</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
