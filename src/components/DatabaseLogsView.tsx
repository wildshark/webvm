import React, { useState } from 'react';
import { Database, ScrollText, Search } from 'lucide-react';
import { AuditLogEntry, Tenant, UserAccount, Workspace } from '../types';

interface DatabaseLogsViewProps {
  tenants: Tenant[];
  users: UserAccount[];
  workspaces: Workspace[];
  logs: AuditLogEntry[];
}

const TABLE_DDL: Record<'tenants' | 'users' | 'workspaces', string> = {
  tenants: `CREATE TABLE tenants (
    id INTEGER PRIMARY KEY,
    company_name TEXT,
    storage_limit INTEGER,
    status TEXT,
    created_at DATETIME
);`,
  users: `CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    tenant_id INTEGER,
    fullname TEXT,
    email TEXT UNIQUE,
    password_hash TEXT,
    ga_secret TEXT,
    status TEXT
);`,
  workspaces: `CREATE TABLE workspaces (
    id INTEGER PRIMARY KEY,
    tenant_id INTEGER,
    image_path TEXT,
    storage_used INTEGER,
    created_at DATETIME
);`,
};

export const DatabaseLogsView: React.FC<DatabaseLogsViewProps> = ({
  tenants,
  users,
  workspaces,
  logs,
}) => {
  const [activeTable, setActiveTable] = useState<'tenants' | 'users' | 'workspaces'>('tenants');
  const [logFilter, setLogFilter] = useState<'all' | 'verified' | 'blocked' | 'provisioned' | 'info'>('all');
  const [logSearch, setLogSearch] = useState('');

  const filteredLogs = logs.filter((entry) => {
    if (logFilter !== 'all' && entry.outcome !== logFilter) return false;
    if (logSearch.trim()) {
      const q = logSearch.trim().toLowerCase();
      return (
        entry.actor_email.toLowerCase().includes(q) ||
        entry.event.toLowerCase().includes(q) ||
        entry.detail.toLowerCase().includes(q) ||
        entry.tenant_slug.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* SQLite Schema & Live Table Browser */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            <h2 className="font-display font-semibold text-sm text-slate-900 dark:text-white">
              SQLite Platform Database Inspector
            </h2>
          </div>

          <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800">
            {(['tenants', 'users', 'workspaces'] as const).map((tbl) => (
              <button
                key={tbl}
                type="button"
                onClick={() => setActiveTable(tbl)}
                className={`px-3 py-1 rounded-md text-xs font-mono font-medium transition-colors ${
                  activeTable === tbl
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tbl}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
          <pre className="font-mono text-[11px] text-slate-700 dark:text-slate-300 overflow-x-auto">
            {TABLE_DDL[activeTable]}
          </pre>
        </div>

        <div className="overflow-x-auto">
          {activeTable === 'tenants' && (
            <table className="w-full text-left border-collapse text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
                  <th className="py-2.5 px-4">id</th>
                  <th className="py-2.5 px-4">company_name</th>
                  <th className="py-2.5 px-4 text-right">storage_limit</th>
                  <th className="py-2.5 px-4">status</th>
                  <th className="py-2.5 px-4 text-right">created_at</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {tenants.map((t) => (
                  <tr key={t.id}>
                    <td className="py-2.5 px-4 tabular-nums">{t.id}</td>
                    <td className="py-2.5 px-4">{t.company_name}</td>
                    <td className="py-2.5 px-4 text-right tabular-nums">{t.storage_limit}</td>
                    <td className="py-2.5 px-4">{t.status}</td>
                    <td className="py-2.5 px-4 text-right tabular-nums text-slate-500">{t.created_at}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTable === 'users' && (
            <table className="w-full text-left border-collapse text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
                  <th className="py-2.5 px-4">id</th>
                  <th className="py-2.5 px-4">tenant_id</th>
                  <th className="py-2.5 px-4">fullname</th>
                  <th className="py-2.5 px-4">email</th>
                  <th className="py-2.5 px-4">ga_secret</th>
                  <th className="py-2.5 px-4">status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className="py-2.5 px-4 tabular-nums">{u.id}</td>
                    <td className="py-2.5 px-4 tabular-nums">{u.tenant_id}</td>
                    <td className="py-2.5 px-4">{u.fullname}</td>
                    <td className="py-2.5 px-4">{u.email}</td>
                    <td className="py-2.5 px-4">{u.ga_secret.slice(0, 8)}••••</td>
                    <td className="py-2.5 px-4">{u.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTable === 'workspaces' && (
            <table className="w-full text-left border-collapse text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
                  <th className="py-2.5 px-4">id</th>
                  <th className="py-2.5 px-4">tenant_id</th>
                  <th className="py-2.5 px-4">image_path</th>
                  <th className="py-2.5 px-4 text-right">storage_used</th>
                  <th className="py-2.5 px-4 text-right">created_at</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {workspaces.map((w) => (
                  <tr key={w.id}>
                    <td className="py-2.5 px-4 tabular-nums">{w.id}</td>
                    <td className="py-2.5 px-4 tabular-nums">{w.tenant_id}</td>
                    <td className="py-2.5 px-4">{w.image_path}</td>
                    <td className="py-2.5 px-4 text-right tabular-nums">{w.storage_used}</td>
                    <td className="py-2.5 px-4 text-right tabular-nums text-slate-500">{w.created_at}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Security & Platform Audit Logs */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ScrollText className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            <h2 className="font-display font-semibold text-sm text-slate-900 dark:text-white">
              Security & Provisioning Audit Logs
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                placeholder="Filter logs..."
                className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs w-44"
              />
            </div>
            <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800">
              {(['all', 'verified', 'blocked', 'provisioned', 'info'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setLogFilter(f)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium capitalize transition-colors ${
                    logFilter === f
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                <th className="py-2.5 px-4">Timestamp</th>
                <th className="py-2.5 px-4">Actor</th>
                <th className="py-2.5 px-4">Scope</th>
                <th className="py-2.5 px-4">Event</th>
                <th className="py-2.5 px-4">Detail</th>
                <th className="py-2.5 px-4">Outcome</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-2.5 px-4 font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap tabular-nums">
                    {log.timestamp}
                  </td>
                  <td className="py-2.5 px-4 font-mono text-slate-800 dark:text-slate-200 whitespace-nowrap">
                    {log.actor_email}
                  </td>
                  <td className="py-2.5 px-4 font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                    {log.tenant_slug}
                  </td>
                  <td className="py-2.5 px-4 font-medium text-slate-900 dark:text-white whitespace-nowrap">
                    {log.event}
                  </td>
                  <td className="py-2.5 px-4 text-slate-600 dark:text-slate-300">
                    {log.detail}
                  </td>
                  <td className="py-2.5 px-4 whitespace-nowrap font-medium">
                    <span
                      className={
                        log.outcome === 'verified' || log.outcome === 'provisioned'
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : log.outcome === 'blocked'
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-sky-700 dark:text-sky-400'
                      }
                    >
                      {log.outcome === 'verified'
                        ? 'Verified'
                        : log.outcome === 'blocked'
                        ? 'Blocked'
                        : log.outcome === 'provisioned'
                        ? 'Provisioned'
                        : 'Info'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
