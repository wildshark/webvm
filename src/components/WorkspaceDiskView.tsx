import React, { useState } from 'react';
import { CheckCircle2, Copy, FolderTree, HardDrive, RefreshCw } from 'lucide-react';
import { PlanTier, Tenant, Workspace } from '../types';
import { formatBytes, PLAN_DESCRIPTIONS, PLAN_LIMITS_BYTES } from '../utils/formatters';

interface WorkspaceDiskViewProps {
  tenant: Tenant;
  workspace?: Workspace;
  onChangePlan: (tenantId: number, plan: PlanTier) => void;
  onReprovisionRootfs: (tenantId: number) => void;
  onToggleWasmThreads: (tenantId: number) => void;
}

export const WorkspaceDiskView: React.FC<WorkspaceDiskViewProps> = ({
  tenant,
  workspace,
  onChangePlan,
  onReprovisionRootfs,
  onToggleWasmThreads,
}) => {
  const [actionMsg, setActionMsg] = useState('');

  const storageUsed = workspace?.storage_used ?? 0;
  const usagePct = Math.min(100, Math.round((storageUsed / tenant.storage_limit) * 100));

  const handleRebuild = () => {
    onReprovisionRootfs(tenant.id);
    setActionMsg(
      `Executed copy('/images/base-alpine.img', '/storage/tenants/${tenant.slug}/rootfs.img'). Persistent /files/ directory preserved.`
    );
  };

  const configPayload = workspace
    ? JSON.stringify(
        {
          tenant_id: tenant.id,
          slug: tenant.slug,
          image_path: workspace.image_path,
          storage_limit_bytes: tenant.storage_limit,
          ...workspace.config_json,
        },
        null,
        2
      )
    : '{}';

  return (
    <div className="space-y-6">
      {actionMsg && (
        <div className="p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{actionMsg}</span>
        </div>
      )}

      {/* Top Row: Directory Layout + Virtual Disk Provisioning */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-semibold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <FolderTree className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <span>Tenant Directory Structure</span>
            </h2>
            <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
              {tenant.slug}
            </span>
          </div>

          <pre className="p-4 rounded-lg bg-slate-950 text-slate-200 font-mono text-xs leading-relaxed overflow-x-auto border border-slate-800">
{`/storage/tenants/
└── ${tenant.slug}/
    ├── rootfs.img        (${workspace?.rootfs_size_mb ?? 142} MB Alpine 3.20 WebVM image)
    ├── files/            (Persistent workspace files, ${formatBytes(storageUsed)} total)
    └── config.json       (WASM runtime & isolation manifest)`}
          </pre>

          <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Instant PHP Provisioning Hook
            </div>
            <code className="block font-mono text-xs text-sky-700 dark:text-sky-400">
              {`copy('/images/base-alpine.img', '/storage/tenants/${tenant.slug}/rootfs.img');`}
            </code>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <button
              type="button"
              onClick={handleRebuild}
              className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-medium text-slate-800 dark:text-slate-100 flex items-center gap-2 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset rootfs.img from Master Alpine</span>
            </button>

            <button
              type="button"
              onClick={() => onToggleWasmThreads(tenant.id)}
              className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              WASM Threads: {workspace?.config_json.wasm_threads ? 'Enabled' : 'Disabled'}
            </button>
          </div>
        </div>

        {/* Storage Quota Tiers */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-semibold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <span>Storage Plan & Quota Allocation</span>
            </h2>
            <span className="font-mono text-xs text-slate-600 dark:text-slate-400 tabular-nums">
              {usagePct}% used
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs tabular-nums">
              <span className="text-slate-600 dark:text-slate-400">
                du -sb /storage/tenants/{tenant.id}
              </span>
              <span className="font-mono font-medium text-slate-900 dark:text-white">
                {formatBytes(storageUsed)} / {formatBytes(tenant.storage_limit, 0)}
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  usagePct > 85 ? 'bg-amber-500' : 'bg-sky-600 dark:bg-sky-500'
                }`}
                style={{ width: `${usagePct}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(['Starter', 'Business', 'Professional', 'Enterprise'] as PlanTier[]).map((tier) => {
              const isCurrent = tenant.plan === tier;
              return (
                <button
                  key={tier}
                  type="button"
                  onClick={() => {
                    onChangePlan(tenant.id, tier);
                    setActionMsg(
                      `Updated ${tenant.company_name} storage limit to ${tier} (${formatBytes(
                        PLAN_LIMITS_BYTES[tier],
                        0
                      )}).`
                    );
                  }}
                  className={`p-3.5 rounded-lg border text-left transition-colors ${
                    isCurrent
                      ? 'border-sky-600 bg-sky-50/70 dark:bg-sky-950/40 dark:border-sky-500'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-900 dark:text-white">
                      {tier}
                    </span>
                    <span className="font-mono text-xs font-semibold text-sky-700 dark:text-sky-400 tabular-nums">
                      {formatBytes(PLAN_LIMITS_BYTES[tier], 0)}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    {PLAN_DESCRIPTIONS[tier]}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* config.json Manifest Inspector */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-semibold text-sm text-slate-900 dark:text-white">
            /storage/tenants/{tenant.slug}/config.json
          </h3>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText(configPayload);
              setActionMsg('Copied config.json manifest to clipboard.');
            }}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Copy Manifest</span>
          </button>
        </div>
        <pre className="p-4 rounded-lg bg-slate-950 text-slate-200 font-mono text-xs overflow-x-auto border border-slate-800">
          {configPayload}
        </pre>
      </div>
    </div>
  );
};
