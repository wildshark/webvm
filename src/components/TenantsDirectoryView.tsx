import React, { useState } from 'react';
import {
  ArrowUpRight,
  Building2,
  PauseCircle,
  PlayCircle,
  Plus,
  Search,
  X,
} from 'lucide-react';
import { PlanTier, Tenant, UserAccount, Workspace } from '../types';
import { formatBytes, PLAN_DESCRIPTIONS, PLAN_LIMITS_BYTES } from '../utils/formatters';

interface TenantsDirectoryViewProps {
  tenants: Tenant[];
  workspaces: Workspace[];
  users: UserAccount[];
  activeTenantId: number;
  onSelectTenant: (tenantId: number) => void;
  onProvisionTenant: (payload: {
    company_name: string;
    plan: PlanTier;
    admin_name: string;
    admin_email: string;
  }) => void;
  onToggleTenantStatus: (tenantId: number) => void;
}

export const TenantsDirectoryView: React.FC<TenantsDirectoryViewProps> = ({
  tenants,
  workspaces,
  users,
  activeTenantId,
  onSelectTenant,
  onProvisionTenant,
  onToggleTenantStatus,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');
  const [showProvisionModal, setShowProvisionModal] = useState(false);

  const [companyName, setCompanyName] = useState('');
  const [plan, setPlan] = useState<PlanTier>('Business');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');

  const filtered = tenants.filter((t) => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      return (
        t.company_name.toLowerCase().includes(q) ||
        t.slug.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalStorageUsed = workspaces.reduce((sum, w) => sum + w.storage_used, 0);
  const totalStorageAllocated = tenants.reduce((sum, t) => sum + t.storage_limit, 0);
  const activeCount = tenants.filter((t) => t.status === 'active').length;

  const handleProvisionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !adminName.trim() || !adminEmail.trim()) return;
    onProvisionTenant({
      company_name: companyName.trim(),
      plan,
      admin_name: adminName.trim(),
      admin_email: adminEmail.trim().toLowerCase(),
    });
    setCompanyName('');
    setPlan('Business');
    setAdminName('');
    setAdminEmail('');
    setShowProvisionModal(false);
  };

  return (
    <div className="space-y-6">
      {/* KPI Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <div className="text-xs text-slate-500 dark:text-slate-400">Provisioned Tenants</div>
          <div className="text-2xl font-display font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
            {tenants.length} <span className="text-sm font-normal text-slate-500">/ 100 target</span>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <div className="text-xs text-slate-500 dark:text-slate-400">Active Workspaces</div>
          <div className="text-2xl font-display font-bold text-emerald-700 dark:text-emerald-400 mt-1 tabular-nums">
            {activeCount}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <div className="text-xs text-slate-500 dark:text-slate-400">Total Disk Consumed</div>
          <div className="text-2xl font-display font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
            {formatBytes(totalStorageUsed)}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <div className="text-xs text-slate-500 dark:text-slate-400">Allocated Pool Quota</div>
          <div className="text-2xl font-display font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
            {formatBytes(totalStorageAllocated, 0)}
          </div>
        </div>
      </div>

      {/* Directory Controls & Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search company or tenant ID..."
                className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-slate-100 w-56 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800">
              {(['all', 'active', 'suspended'] as const).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1 rounded-md text-xs font-medium capitalize transition-colors ${
                    statusFilter === status
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowProvisionModal(true)}
            className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-medium transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Provision Tenant</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                <th className="py-3 px-4">Tenant</th>
                <th className="py-3 px-4">Rootfs Image Path</th>
                <th className="py-3 px-4">Plan</th>
                <th className="py-3 px-4 text-right">Storage Used</th>
                <th className="py-3 px-4 text-right">Users</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
              {filtered.map((t) => {
                const ws = workspaces.find((w) => w.tenant_id === t.id);
                const userCount = users.filter((u) => u.tenant_id === t.id).length;
                const used = ws?.storage_used ?? 0;
                const pct = Math.min(100, Math.round((used / t.storage_limit) * 100));
                const isSelected = t.id === activeTenantId;

                return (
                  <tr
                    key={t.id}
                    className={`transition-colors ${
                      isSelected
                        ? 'bg-sky-50/50 dark:bg-sky-950/20'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-900 dark:text-white">
                        {t.company_name}
                      </div>
                      <div className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                        {t.slug} · id={t.id}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400">
                      {ws?.image_path ?? `/storage/tenants/${t.slug}/rootfs.img`}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {t.plan}
                      </span>
                      <span className="text-slate-400 ml-1 tabular-nums">
                        ({formatBytes(t.storage_limit, 0)})
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums">
                      <div className="text-slate-800 dark:text-slate-200">
                        {formatBytes(used)}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {pct}% of quota
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700 dark:text-slate-300">
                      {userCount}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`font-medium ${
                          t.status === 'active'
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}
                      >
                        {t.status === 'active' ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onSelectTenant(t.id)}
                          className={`px-2.5 py-1 rounded border text-xs font-medium inline-flex items-center gap-1 transition-colors ${
                            isSelected
                              ? 'border-sky-600 bg-sky-600 text-white'
                              : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                          }`}
                        >
                          <span>{isSelected ? 'Inspecting' : 'Inspect'}</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onToggleTenantStatus(t.id)}
                          className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 inline-flex items-center gap-1"
                        >
                          {t.status === 'active' ? (
                            <>
                              <PauseCircle className="w-3 h-3" />
                              <span>Suspend</span>
                            </>
                          ) : (
                            <>
                              <PlayCircle className="w-3 h-3" />
                              <span>Activate</span>
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Provision New Tenant Modal */}
      {showProvisionModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-lg w-full p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-semibold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-sky-600" />
                <span>Provision New Tenant WebVM</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowProvisionModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleProvisionSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Company Name
                </label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Acme Cloud Systems"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Storage Limit Plan
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {(['Starter', 'Business', 'Professional', 'Enterprise'] as PlanTier[]).map(
                    (tier) => (
                      <button
                        key={tier}
                        type="button"
                        onClick={() => setPlan(tier)}
                        className={`p-3 rounded-lg border text-left transition-colors ${
                          plan === tier
                            ? 'border-sky-600 bg-sky-50/70 dark:bg-sky-950/40 dark:border-sky-500'
                            : 'border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        <div className="flex justify-between font-semibold text-slate-900 dark:text-white">
                          <span>{tier}</span>
                          <span className="font-mono text-sky-700 dark:text-sky-400">
                            {formatBytes(PLAN_LIMITS_BYTES[tier], 0)}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {PLAN_DESCRIPTIONS[tier]}
                        </div>
                      </button>
                    )
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Initial Tenant Admin Name
                  </label>
                  <input
                    type="text"
                    required
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    placeholder="Jane Doe"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Admin Email
                  </label>
                  <input
                    type="email"
                    required
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="jane@acme.io"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 text-slate-300 font-mono text-[11px] border border-slate-800">
                copy('/images/base-alpine.img', "/storage/tenants/tenant-00{tenants.length + 1}/rootfs.img");
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowProvisionModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-medium"
                >
                  Provision WebVM
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
