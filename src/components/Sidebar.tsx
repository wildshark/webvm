import React from 'react';
import {
  Building2,
  Database,
  FolderOpen,
  HardDrive,
  Server,
  ShieldCheck,
  Terminal,
  Users,
  X,
} from 'lucide-react';
import { NavSection, Tenant, UserAccount, UserRole, Workspace } from '../types';
import { formatBytes, formatRoleLabel } from '../utils/formatters';

interface SidebarProps {
  activeSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  onSwitchRole: (role: UserRole) => void;
  currentUser: UserAccount;
  currentTenant: Tenant;
  currentWorkspace?: Workspace;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

interface NavItem {
  id: NavSection;
  label: string;
  icon: React.FC<{ className?: string }>;
  roles: Array<'super_admin' | 'tenant_admin' | 'user'>;
  group: 'Workspace' | 'Tenant Administration' | 'Platform Operations';
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'webvm',
    label: 'Alpine WebVM',
    icon: Terminal,
    roles: ['super_admin', 'tenant_admin', 'user'],
    group: 'Workspace',
  },
  {
    id: 'files',
    label: 'File Manager',
    icon: FolderOpen,
    roles: ['super_admin', 'tenant_admin', 'user'],
    group: 'Workspace',
  },
  {
    id: 'profile',
    label: '2FA & Profile',
    icon: ShieldCheck,
    roles: ['super_admin', 'tenant_admin', 'user'],
    group: 'Workspace',
  },
  {
    id: 'tenant-users',
    label: 'Tenant Users',
    icon: Users,
    roles: ['super_admin', 'tenant_admin'],
    group: 'Tenant Administration',
  },
  {
    id: 'workspace-disk',
    label: 'Workspace & Disk',
    icon: HardDrive,
    roles: ['super_admin', 'tenant_admin'],
    group: 'Tenant Administration',
  },
  {
    id: 'tenants',
    label: 'Tenants Directory',
    icon: Building2,
    roles: ['super_admin'],
    group: 'Platform Operations',
  },
  {
    id: 'infrastructure',
    label: 'Docker & VPS Stack',
    icon: Server,
    roles: ['super_admin'],
    group: 'Platform Operations',
  },
  {
    id: 'database-logs',
    label: 'SQLite & Audit Logs',
    icon: Database,
    roles: ['super_admin'],
    group: 'Platform Operations',
  },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeSection,
  onSelectSection,
  onSwitchRole,
  currentUser,
  currentTenant,
  currentWorkspace,
  mobileOpen,
  onCloseMobile,
}) => {
  const visibleItems = NAV_ITEMS.filter((item) =>
    item.roles.includes(currentUser.role)
  );

  const groups: Array<'Workspace' | 'Tenant Administration' | 'Platform Operations'> = [
    'Workspace',
    'Tenant Administration',
    'Platform Operations',
  ];

  const storageUsed = currentWorkspace?.storage_used ?? 0;
  const storageLimit = currentTenant.storage_limit;
  const usagePct = Math.min(100, Math.round((storageUsed / storageLimit) * 100));

  const content = (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 w-64 shrink-0">
      {/* Brand Header */}
      <div className="h-16 px-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-7 h-7 rounded-md bg-slate-900 dark:bg-sky-500 text-white flex items-center justify-center shrink-0">
            <Terminal className="w-4 h-4" />
          </span>
          <span className="font-display font-bold text-sm tracking-tight text-slate-900 dark:text-white truncate">
            iQuipe Cloud
          </span>
        </div>
        <button
          type="button"
          onClick={onCloseMobile}
          className="lg:hidden p-1.5 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          aria-label="Close navigation"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Role-scoped Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        <div className="md:hidden px-1 pb-2 border-b border-slate-200 dark:border-slate-800">
          <label className="block text-[11px] font-semibold text-slate-400 dark:text-slate-500 mb-1.5 px-2">
            Role Perspective
          </label>
          <select
            value={currentUser.role}
            onChange={(e) => {
              onSwitchRole(e.target.value as UserRole);
              onCloseMobile();
            }}
            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-medium text-slate-800 dark:text-slate-200"
          >
            <option value="user">Tenant User</option>
            <option value="tenant_admin">Tenant Admin</option>
            <option value="super_admin">Super Admin</option>
          </select>
        </div>

        {groups.map((group) => {
          const items = visibleItems.filter((i) => i.group === group);
          if (items.length === 0) return null;
          return (
            <div key={group} className="space-y-1">
              <div className="px-3 text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                {group}
              </div>
              {items.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onSelectSection(item.id);
                      onCloseMobile();
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                      isActive
                        ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive
                          ? 'text-sky-600 dark:text-sky-400'
                          : 'text-slate-400 dark:text-slate-500'
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Active Tenant Isolation Context */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
        <div>
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="font-medium text-slate-900 dark:text-slate-100 truncate">
              {currentTenant.company_name}
            </span>
            <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400 shrink-0">
              {currentTenant.slug}
            </span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            {currentTenant.plan} Plan · {formatRoleLabel(currentUser.role)}
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
            <span>Disk Usage</span>
            <span>
              {formatBytes(storageUsed)} / {formatBytes(storageLimit, 0)}
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                usagePct > 85
                  ? 'bg-amber-500'
                  : 'bg-sky-600 dark:bg-sky-500'
              }`}
              style={{ width: `${usagePct}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:block shrink-0">{content}</aside>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/50"
            onClick={onCloseMobile}
          />
          <div className="relative z-10">{content}</div>
        </div>
      )}
    </>
  );
};
