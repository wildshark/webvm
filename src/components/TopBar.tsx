import React from 'react';
import { Lock, Menu, Moon, Sun } from 'lucide-react';
import { NavSection, Tenant, UserAccount, UserRole } from '../types';
import { formatRoleLabel } from '../utils/formatters';

interface TopBarProps {
  activeSection: NavSection;
  currentUser: UserAccount;
  currentTenant: Tenant;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onSwitchRole: (role: UserRole) => void;
  onLockSession: () => void;
  onOpenMobileNav: () => void;
}

const SECTION_TITLES: Record<NavSection, string> = {
  webvm: 'Alpine Linux WebVM',
  files: 'Tenant File Manager',
  'tenant-users': 'Tenant Users & 2FA',
  'workspace-disk': 'Workspace & Virtual Disk',
  tenants: 'Multi-Tenant Directory',
  infrastructure: 'Docker & VPS Infrastructure',
  'database-logs': 'SQLite Tables & Audit Logs',
  profile: 'Profile & 2FA Security',
};

export const TopBar: React.FC<TopBarProps> = ({
  activeSection,
  currentUser,
  currentTenant,
  darkMode,
  onToggleDarkMode,
  onSwitchRole,
  onLockSession,
  onOpenMobileNav,
}) => {
  return (
    <header className="h-16 px-4 sm:px-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 shrink-0">
      {/* Left: Mobile Trigger + Breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileNav}
          className="lg:hidden p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
          aria-label="Open navigation menu"
        >
          <Menu className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 text-sm min-w-0">
          <span className="hidden sm:inline text-slate-400 dark:text-slate-500 font-mono text-xs whitespace-nowrap">
            {currentTenant.slug}
          </span>
          <span className="hidden sm:inline text-slate-300 dark:text-slate-700" aria-hidden="true">
            /
          </span>
          <h1 className="font-display font-semibold text-slate-900 dark:text-white truncate">
            {SECTION_TITLES[activeSection]}
          </h1>
        </div>
      </div>

      {/* Right: Role Perspective Switcher + Theme + Lock 2FA Gate */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="hidden md:flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800">
          {(['user', 'tenant_admin', 'super_admin'] as UserRole[]).map((role) => {
            const active = currentUser.role === role;
            return (
              <button
                key={role}
                type="button"
                onClick={() => onSwitchRole(role)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  active
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {formatRoleLabel(role)}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onToggleDarkMode}
          className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shrink-0"
          aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          title={darkMode ? 'Light mode' : 'Dark mode'}
        >
          {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        <div className="hidden sm:flex items-center gap-2.5 pl-2 border-l border-slate-200 dark:border-slate-800">
          <img
            src={currentUser.avatar}
            alt={currentUser.fullname}
            referrerPolicy="no-referrer"
            className="w-7 h-7 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0"
          />
          <span className="text-xs font-medium text-slate-700 dark:text-slate-200 whitespace-nowrap max-w-[120px] truncate">
            {currentUser.fullname}
          </span>
        </div>

        <button
          type="button"
          onClick={onLockSession}
          className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Test 2FA Gate</span>
        </button>
      </div>
    </header>
  );
};
