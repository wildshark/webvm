import React, { useEffect, useMemo, useState } from 'react';
import { Check, Copy, RefreshCw, ShieldCheck } from 'lucide-react';
import {
  buildQrMatrix,
  computeTotpCode,
  getTotpSecondsRemaining,
} from '../utils/formatters';

interface TotpQrCardProps {
  email: string;
  secret: string;
  tenantSlug: string;
  onRotateSecret?: () => void;
  compact?: boolean;
}

export const TotpQrCard: React.FC<TotpQrCardProps> = ({
  email,
  secret,
  tenantSlug,
  onRotateSecret,
  compact = false,
}) => {
  const [now, setNow] = useState(Date.now());
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const otpUri = `otpauth://totp/iQuipe:${encodeURIComponent(email)}?secret=${secret}&issuer=iQuipe%20Cloud%20Workspace&tenant=${tenantSlug}`;
  const matrix = useMemo(() => buildQrMatrix(otpUri), [otpUri]);
  const liveCode = computeTotpCode(secret, now);
  const secondsLeft = getTotpSecondsRemaining(now);

  const handleCopySecret = () => {
    navigator.clipboard?.writeText(secret);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 1800);
  };

  const handleCopyCode = () => {
    navigator.clipboard?.writeText(liveCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 1800);
  };

  return (
    <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 p-5">
      <div className={`flex ${compact ? 'flex-col gap-4' : 'flex-col sm:flex-row items-start sm:items-center gap-6'}`}>
        <div className="shrink-0 p-3 bg-white border border-slate-200 rounded-lg">
          <svg
            width={compact ? 112 : 136}
            height={compact ? 112 : 136}
            viewBox="0 0 21 21"
            aria-label="Google Authenticator Enrollment QR Code"
            className="block"
          >
            <rect width="21" height="21" fill="#FFFFFF" />
            {matrix.map((row, r) =>
              row.map((filled, c) =>
                filled ? (
                  <rect key={`${r}-${c}`} x={c} y={r} width="1" height="1" fill="#0F172A" />
                ) : null
              )
            )}
          </svg>
        </div>

        <div className="flex-1 min-w-0 space-y-3">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
              <ShieldCheck className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
              <span>Google Authenticator TOTP</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Account: <span className="font-mono text-slate-700 dark:text-slate-300">{email}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-xs text-slate-800 dark:text-slate-200 truncate">
              {secret}
            </div>
            <button
              type="button"
              onClick={handleCopySecret}
              className="px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
            >
              {copiedSecret ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSecret ? 'Copied' : 'Copy Key'}</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-3">
              <div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">Live 6-digit token</div>
                <div className="font-mono text-lg font-semibold tracking-widest text-slate-900 dark:text-slate-100 tabular-nums">
                  {liveCode.slice(0, 3)} {liveCode.slice(3)}
                </div>
              </div>
              <button
                type="button"
                onClick={handleCopyCode}
                className="px-2.5 py-1.5 text-xs font-medium rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors whitespace-nowrap shrink-0"
              >
                {copiedCode ? 'Copied' : 'Copy Code'}
              </button>
            </div>

            <div className="flex items-center gap-3">
              <span className="font-mono text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                Refreshes in {secondsLeft}s
              </span>
              {onRotateSecret && (
                <button
                  type="button"
                  onClick={onRotateSecret}
                  className="px-2.5 py-1.5 text-xs font-medium rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Rotate Secret</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
