import React, { useState } from 'react';
import { Box, Check, Cpu, HardDrive, Layers, Server } from 'lucide-react';
import { DOCKER_SERVICES } from '../data/initialData';

interface InfrastructureViewProps {
  tenantCount: number;
}

export const InfrastructureView: React.FC<InfrastructureViewProps> = ({
  tenantCount,
}) => {
  const [copiedCompose, setCopiedCompose] = useState(false);

  const dockerComposeYaml = `services:
  web:
    image: nginx:1.27-alpine
    ports: ["443:443"]
    volumes: ["./nginx.conf:/etc/nginx/conf.d/default.conf:ro"]

  php:
    image: php:8.3-fpm-alpine
    volumes:
      - ./app:/var/www/html
      - /storage/tenants:/storage/tenants
      - /images/base-alpine.img:/images/base-alpine.img:ro

  worker:
    image: php:8.3-cli-alpine
    command: php /var/www/html/worker.php
    volumes:
      - /storage/tenants:/storage/tenants

  sqlite-backup:
    image: alpine:3.20
    command: crond -f -l 8
    volumes:
      - ./data:/var/lib/iquipe
      - ./backups:/backups`;

  const handleCopyCompose = () => {
    navigator.clipboard?.writeText(dockerComposeYaml);
    setCopiedCompose(true);
    setTimeout(() => setCopiedCompose(false), 1800);
  };

  return (
    <div className="space-y-6">
      {/* Architecture Highlight: 4 Containers vs 100 Containers */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-display font-semibold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Box className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                <span>Lean 4-Container Docker Stack</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Alpine WebVM executes in the browser via WebAssembly, eliminating the need for 100 separate Linux containers on the host.
              </p>
            </div>
            <span className="font-mono text-xs font-semibold text-emerald-700 dark:text-emerald-400 whitespace-nowrap shrink-0">
              4 / 4 Running
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  <th className="py-2.5 pr-4">Service</th>
                  <th className="py-2.5 pr-4">Image</th>
                  <th className="py-2.5 pr-4">Role</th>
                  <th className="py-2.5 text-right">Allocation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
                {DOCKER_SERVICES.map((svc) => (
                  <tr key={svc.service}>
                    <td className="py-3 pr-4 font-mono font-semibold text-slate-900 dark:text-white">
                      {svc.service}
                    </td>
                    <td className="py-3 pr-4 font-mono text-sky-700 dark:text-sky-400 whitespace-nowrap">
                      {svc.image}
                    </td>
                    <td className="py-3 pr-4 text-slate-600 dark:text-slate-300">
                      {svc.purpose}
                    </td>
                    <td className="py-3 text-right font-mono text-slate-700 dark:text-slate-300 whitespace-nowrap tabular-nums">
                      {svc.cpu} · {svc.memory}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recommended Host VPS Profile */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-5">
          <div>
            <h2 className="font-display font-semibold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Server className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <span>VPS Host Profile (100-Tenant Target)</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Server handles PHP 8.3 auth, SQLite metadata, tenant provisioning, and persistent file storage.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <div className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5" />
                <span>Compute</span>
              </div>
              <div className="font-display font-semibold text-sm text-slate-900 dark:text-white mt-1 tabular-nums">
                8 vCPU · 16 GB RAM
              </div>
            </div>
            <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <div className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5" />
                <span>Storage</span>
              </div>
              <div className="font-display font-semibold text-sm text-slate-900 dark:text-white mt-1 tabular-nums">
                250 GB NVMe SSD
              </div>
            </div>
            <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <div className="text-slate-500 dark:text-slate-400">Host OS</div>
              <div className="font-mono font-medium text-slate-900 dark:text-white mt-1">
                Ubuntu 24.04 LTS
              </div>
            </div>
            <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <div className="text-slate-500 dark:text-slate-400">Tenant Density</div>
              <div className="font-mono font-medium text-slate-900 dark:text-white mt-1 tabular-nums">
                {tenantCount} / 100 tenants
              </div>
            </div>
          </div>

          {/* Version 1 & Version 2 Capability Matrix */}
          <div className="border-t border-slate-200 dark:border-slate-800 pt-4 space-y-2.5 text-xs">
            <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
              <span>Platform Capability Roadmap</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 mb-1">
                  Version 1 (Active)
                </div>
                <ul className="space-y-1 text-slate-600 dark:text-slate-400">
                  <li>Alpine Shell & File Manager</li>
                  <li>Upload / Download & Quotas</li>
                  <li>Multi-Tenant Isolation</li>
                  <li>Git, Nano, Vim, Python, Node, PHP</li>
                </ul>
              </div>
              <div>
                <div className="text-[11px] font-semibold text-sky-700 dark:text-sky-400 mb-1">
                  Version 2 (Planned)
                </div>
                <ul className="space-y-1 text-slate-600 dark:text-slate-400">
                  <li>VS Code Web Integration</li>
                  <li>Multi-Pane Terminal Tabs</li>
                  <li>APK Package Manager UI</li>
                  <li>Workspace Sharing & Teams</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* docker-compose.yml Inspector */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-semibold text-sm text-slate-900 dark:text-white">
            docker-compose.yml (4-Container Production Topology)
          </h3>
          <button
            type="button"
            onClick={handleCopyCompose}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5"
          >
            {copiedCompose && <Check className="w-3.5 h-3.5 text-emerald-600" />}
            <span>{copiedCompose ? 'Copied' : 'Copy YAML'}</span>
          </button>
        </div>
        <pre className="p-4 rounded-lg bg-slate-950 text-slate-200 font-mono text-xs overflow-x-auto border border-slate-800 leading-relaxed">
          {dockerComposeYaml}
        </pre>
      </div>
    </div>
  );
};
