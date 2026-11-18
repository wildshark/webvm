import { useEffect, useState } from 'react';
import { AuthGate } from './components/AuthGate';
import { DatabaseLogsView } from './components/DatabaseLogsView';
import { FileManagerView } from './components/FileManagerView';
import { InfrastructureView } from './components/InfrastructureView';
import { ProfileSecurityView } from './components/ProfileSecurityView';
import { Sidebar } from './components/Sidebar';
import { TenantsDirectoryView } from './components/TenantsDirectoryView';
import { TenantUsersView } from './components/TenantUsersView';
import { TopBar } from './components/TopBar';
import { WebVMView } from './components/WebVMView';
import { WorkspaceDiskView } from './components/WorkspaceDiskView';
import {
  AVATARS,
  INITIAL_AUDIT_LOGS,
  INITIAL_FILES,
  INITIAL_TENANTS,
  INITIAL_USERS,
  INITIAL_WORKSPACES,
} from './data/initialData';
import {
  AuditLogEntry,
  NavSection,
  PhpSessionState,
  PlanTier,
  Tenant,
  UserAccount,
  UserRole,
  VirtualFile,
  Workspace,
} from './types';
import { generateBase32Secret, PLAN_LIMITS_BYTES } from './utils/formatters';

function formatNowTimestamp(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export default function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const [tenants, setTenants] = useState<Tenant[]>(INITIAL_TENANTS);
  const [users, setUsers] = useState<UserAccount[]>(INITIAL_USERS);
  const [workspaces, setWorkspaces] = useState<Workspace[]>(INITIAL_WORKSPACES);
  const [files, setFiles] = useState<VirtualFile[]>(INITIAL_FILES);
  const [logs, setLogs] = useState<AuditLogEntry[]>(INITIAL_AUDIT_LOGS);

  const [activeUserId, setActiveUserId] = useState<number>(103); // Daniel Okoro (Tenant User)
  const [activeTenantId, setActiveTenantId] = useState<number>(1);
  const [activeSection, setActiveSection] = useState<NavSection>('webvm');

  const [session, setSession] = useState<PhpSessionState>({
    user_id: 103,
    tenant_id: 1,
    role: 'user',
    authenticated: true,
    ga_verified: true,
    session_id: 'phpsess_9f84a2c1e7b03d',
    issued_at: '2026-11-17 19:10:02',
  });

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [darkMode]);

  const currentUser = users.find((u) => u.id === activeUserId) ?? users[0];
  const currentTenant = tenants.find((t) => t.id === activeTenantId) ?? tenants[0];
  const currentWorkspace = workspaces.find((w) => w.tenant_id === currentTenant.id);

  const appendAuditLog = (
    actorEmail: string,
    role: UserRole,
    tenantSlug: string,
    event: string,
    detail: string,
    outcome: AuditLogEntry['outcome']
  ) => {
    setLogs((prev) => [
      {
        id: (prev[0]?.id ?? 9084) + 1,
        timestamp: formatNowTimestamp(),
        actor_email: actorEmail,
        role,
        tenant_slug: tenantSlug,
        event,
        detail,
        outcome,
      },
      ...prev,
    ]);
  };

  const handleAuthenticated = (authenticatedUser: UserAccount) => {
    const tenant = tenants.find((t) => t.id === authenticatedUser.tenant_id) ?? tenants[0];
    setActiveUserId(authenticatedUser.id);
    setActiveTenantId(tenant.id);
    setSession({
      user_id: authenticatedUser.id,
      tenant_id: tenant.id,
      role: authenticatedUser.role,
      authenticated: true,
      ga_verified: true,
      session_id: `phpsess_${Math.random().toString(36).slice(2, 14)}`,
      issued_at: formatNowTimestamp(),
    });
    setActiveSection(authenticatedUser.role === 'super_admin' ? 'tenants' : 'webvm');
    setIsLocked(false);
    appendAuditLog(
      authenticatedUser.email,
      authenticatedUser.role,
      tenant.slug,
      '2FA Session Verified',
      'Google Authenticator TOTP validated; $_SESSION[authenticated] = true',
      'verified'
    );
  };

  const handleFailedAuthAttempt = (email: string, reason: string) => {
    appendAuditLog(
      email || 'anonymous',
      'user',
      'auth-gate',
      'WebVM Access Blocked',
      reason,
      'blocked'
    );
  };

  const handleSwitchRole = (targetRole: UserRole) => {
    const matched =
      users.find((u) => u.role === targetRole && u.tenant_id === 1) ??
      users.find((u) => u.role === targetRole) ??
      users[0];

    setActiveUserId(matched.id);
    setActiveTenantId(matched.tenant_id);
    setSession((prev) => ({
      ...prev,
      user_id: matched.id,
      tenant_id: matched.tenant_id,
      role: matched.role,
    }));

    // Ensure activeSection is permitted for the selected role
    if (
      targetRole === 'user' &&
      ['tenant-users', 'workspace-disk', 'tenants', 'infrastructure', 'database-logs'].includes(
        activeSection
      )
    ) {
      setActiveSection('webvm');
    } else if (
      targetRole === 'tenant_admin' &&
      ['tenants', 'infrastructure', 'database-logs'].includes(activeSection)
    ) {
      setActiveSection('tenant-users');
    } else if (targetRole === 'super_admin' && activeSection === 'webvm') {
      setActiveSection('tenants');
    }
  };

  const handleLockSession = () => {
    setSession((prev) => ({ ...prev, authenticated: false, ga_verified: false }));
    setIsLocked(true);
  };

  // Virtual File Operations (shared between Alpine WebVM & File Manager)
  const handleCreateFile = (
    path: string,
    name: string,
    type: 'file' | 'dir',
    content = '',
    customSize?: number
  ) => {
    const size =
      type === 'dir' ? 4096 : customSize ?? new Blob([content]).size;
    const newEntry: VirtualFile = {
      id: `f-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      tenant_id: currentTenant.id,
      path,
      name,
      type,
      size,
      permissions: type === 'dir' ? 'drwxr-xr-x' : '-rw-r--r--',
      updated_at: formatNowTimestamp().slice(0, 16),
      content: type === 'file' ? content : undefined,
    };

    setFiles((prev) => [...prev, newEntry]);
    setWorkspaces((prev) =>
      prev.map((w) =>
        w.tenant_id === currentTenant.id
          ? { ...w, storage_used: w.storage_used + size }
          : w
      )
    );
  };

  const handleUpdateFileContent = (fileId: string, content: string) => {
    const target = files.find((f) => f.id === fileId);
    if (!target) return;
    const newSize = new Blob([content]).size;
    const delta = newSize - target.size;

    setFiles((prev) =>
      prev.map((f) =>
        f.id === fileId
          ? {
              ...f,
              content,
              size: newSize,
              updated_at: formatNowTimestamp().slice(0, 16),
            }
          : f
      )
    );
    setWorkspaces((prev) =>
      prev.map((w) =>
        w.tenant_id === target.tenant_id
          ? { ...w, storage_used: Math.max(0, w.storage_used + delta) }
          : w
      )
    );
  };

  const handleDeleteFile = (fileId: string) => {
    const target = files.find((f) => f.id === fileId);
    if (!target) return;
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
    setWorkspaces((prev) =>
      prev.map((w) =>
        w.tenant_id === target.tenant_id
          ? { ...w, storage_used: Math.max(0, w.storage_used - target.size) }
          : w
      )
    );
  };

  // Tenant Admin User Management
  const handleCreateUser = (payload: {
    fullname: string;
    email: string;
    role: UserRole;
    assigned_quota_mb: number;
    ga_secret: string;
  }) => {
    const nextId = Math.max(...users.map((u) => u.id)) + 1;
    const newUser: UserAccount = {
      id: nextId,
      tenant_id: currentTenant.id,
      fullname: payload.fullname,
      email: payload.email,
      role: payload.role,
      password_hash: `$2y$12$${Math.random().toString(36).slice(2, 18)}`,
      ga_secret: payload.ga_secret,
      ga_verified: false,
      status: 'active',
      avatar: payload.role === 'tenant_admin' ? AVATARS.tenant_admin : AVATARS.user,
      assigned_quota_mb: payload.assigned_quota_mb,
      last_login: 'Never',
    };
    setUsers((prev) => [...prev, newUser]);
    appendAuditLog(
      currentUser.email,
      currentUser.role,
      currentTenant.slug,
      'User Created',
      `Inserted ${payload.email} (${payload.role}) into SQLite users table with 2FA secret`,
      'provisioned'
    );
  };

  const handleToggleUserStatus = (userId: number) => {
    const target = users.find((u) => u.id === userId);
    if (!target) return;
    const nextStatus = target.status === 'active' ? 'locked' : 'active';
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, status: nextStatus } : u))
    );
    appendAuditLog(
      currentUser.email,
      currentUser.role,
      currentTenant.slug,
      nextStatus === 'locked' ? 'User Locked' : 'User Unlocked',
      `Set users.status = '${nextStatus}' for ${target.email}`,
      nextStatus === 'locked' ? 'blocked' : 'info'
    );
  };

  const handleResetPassword = (userId: number) => {
    const target = users.find((u) => u.id === userId);
    if (!target) return;
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? { ...u, password_hash: `$2y$12$${Math.random().toString(36).slice(2, 22)}` }
          : u
      )
    );
    appendAuditLog(
      currentUser.email,
      currentUser.role,
      currentTenant.slug,
      'Password Hash Reset',
      `Rotated bcrypt password_hash for ${target.email}`,
      'info'
    );
  };

  const handleUpdateUserQuota = (userId: number, quotaMb: number) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, assigned_quota_mb: quotaMb } : u))
    );
  };

  // Workspace & Plan Operations
  const handleChangePlan = (tenantId: number, plan: PlanTier) => {
    const t = tenants.find((item) => item.id === tenantId);
    setTenants((prev) =>
      prev.map((item) =>
        item.id === tenantId
          ? { ...item, plan, storage_limit: PLAN_LIMITS_BYTES[plan] }
          : item
      )
    );
    if (t) {
      appendAuditLog(
        currentUser.email,
        currentUser.role,
        t.slug,
        'Storage Plan Updated',
        `Updated tenants.storage_limit to ${plan} (${PLAN_LIMITS_BYTES[plan]} bytes)`,
        'info'
      );
    }
  };

  const handleReprovisionRootfs = (tenantId: number) => {
    const t = tenants.find((item) => item.id === tenantId);
    if (!t) return;
    appendAuditLog(
      currentUser.email,
      currentUser.role,
      t.slug,
      'Rootfs Re-provisioned',
      `Copied /images/base-alpine.img to /storage/tenants/${t.slug}/rootfs.img`,
      'provisioned'
    );
  };

  const handleToggleWasmThreads = (tenantId: number) => {
    setWorkspaces((prev) =>
      prev.map((w) =>
        w.tenant_id === tenantId
          ? {
              ...w,
              config_json: {
                ...w.config_json,
                wasm_threads: !w.config_json.wasm_threads,
              },
            }
          : w
      )
    );
  };

  // Super Admin Tenant Provisioning
  const handleProvisionTenant = (payload: {
    company_name: string;
    plan: PlanTier;
    admin_name: string;
    admin_email: string;
  }) => {
    const nextTenantId = Math.max(...tenants.map((t) => t.id)) + 1;
    const slug = `tenant-${String(nextTenantId).padStart(3, '0')}`;
    const now = formatNowTimestamp();

    const newTenant: Tenant = {
      id: nextTenantId,
      slug,
      company_name: payload.company_name,
      plan: payload.plan,
      storage_limit: PLAN_LIMITS_BYTES[payload.plan],
      status: 'active',
      created_at: now,
    };

    const newWorkspace: Workspace = {
      id: Math.max(...workspaces.map((w) => w.id)) + 1,
      tenant_id: nextTenantId,
      image_path: `/storage/tenants/${slug}/rootfs.img`,
      storage_used: 148897792, // ~142 MB base rootfs
      created_at: now,
      alpine_version: '3.20.3',
      rootfs_size_mb: 142,
      config_json: {
        memory_limit_mb: 512,
        wasm_threads: true,
        network_bridge: 'isolated-veth0',
        allow_ssh_client: true,
        base_image: '/images/base-alpine.img',
      },
    };

    const newAdmin: UserAccount = {
      id: Math.max(...users.map((u) => u.id)) + 1,
      tenant_id: nextTenantId,
      fullname: payload.admin_name,
      email: payload.admin_email,
      role: 'tenant_admin',
      password_hash: `$2y$12$${Math.random().toString(36).slice(2, 18)}`,
      ga_secret: generateBase32Secret(),
      ga_verified: false,
      status: 'active',
      avatar: AVATARS.tenant_admin,
      assigned_quota_mb: 2048,
      last_login: 'Never',
    };

    const starterReadme: VirtualFile = {
      id: `f-${Date.now()}`,
      tenant_id: nextTenantId,
      path: '/workspace',
      name: 'README.md',
      type: 'file',
      size: 248,
      permissions: '-rw-r--r--',
      updated_at: now.slice(0, 16),
      content: `# ${payload.company_name} (${slug})\n\nProvisioned from /images/base-alpine.img\nPlan: ${payload.plan}\n`,
    };

    setTenants((prev) => [...prev, newTenant]);
    setWorkspaces((prev) => [...prev, newWorkspace]);
    setUsers((prev) => [...prev, newAdmin]);
    setFiles((prev) => [...prev, starterReadme]);
    setActiveTenantId(nextTenantId);

    appendAuditLog(
      currentUser.email,
      currentUser.role,
      slug,
      'Tenant Provisioned',
      `Created ${payload.company_name} (${payload.plan}) and copied base-alpine.img to /storage/tenants/${slug}/rootfs.img`,
      'provisioned'
    );
  };

  const handleToggleTenantStatus = (tenantId: number) => {
    const target = tenants.find((t) => t.id === tenantId);
    if (!target) return;
    const nextStatus = target.status === 'active' ? 'suspended' : 'active';
    setTenants((prev) =>
      prev.map((t) => (t.id === tenantId ? { ...t, status: nextStatus } : t))
    );
    appendAuditLog(
      currentUser.email,
      currentUser.role,
      target.slug,
      nextStatus === 'suspended' ? 'Tenant Suspended' : 'Tenant Activated',
      `Set tenants.status = '${nextStatus}' for ${target.company_name}`,
      nextStatus === 'suspended' ? 'blocked' : 'verified'
    );
  };

  const handleUpdateProfile = (userId: number, fullname: string) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, fullname } : u))
    );
  };

  const handleRotateGaSecret = (userId: number) => {
    const newSecret = generateBase32Secret();
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, ga_secret: newSecret } : u))
    );
    appendAuditLog(
      currentUser.email,
      currentUser.role,
      currentTenant.slug,
      '2FA Secret Rotated',
      `Generated new Google Authenticator Base32 secret for ${currentUser.email}`,
      'info'
    );
  };

  if (isLocked) {
    return (
      <AuthGate
        users={users}
        tenants={tenants}
        onAuthenticated={handleAuthenticated}
        onFailedAttempt={handleFailedAuthAttempt}
      />
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <Sidebar
        activeSection={activeSection}
        onSelectSection={setActiveSection}
        onSwitchRole={handleSwitchRole}
        currentUser={currentUser}
        currentTenant={currentTenant}
        currentWorkspace={currentWorkspace}
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        <TopBar
          activeSection={activeSection}
          currentUser={currentUser}
          currentTenant={currentTenant}
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode((d) => !d)}
          onSwitchRole={handleSwitchRole}
          onLockSession={handleLockSession}
          onOpenMobileNav={() => setMobileNavOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1440px] w-full mx-auto">
          {activeSection === 'webvm' && (
            <WebVMView
              tenant={currentTenant}
              workspace={currentWorkspace}
              session={session}
              files={files}
              onCreateFile={handleCreateFile}
              onUpdateFileContent={handleUpdateFileContent}
              onDeleteFile={handleDeleteFile}
              onNavigateFiles={() => setActiveSection('files')}
            />
          )}

          {activeSection === 'files' && (
            <FileManagerView
              tenant={currentTenant}
              workspace={currentWorkspace}
              files={files}
              onCreateFile={handleCreateFile}
              onUpdateFileContent={handleUpdateFileContent}
              onDeleteFile={handleDeleteFile}
            />
          )}

          {activeSection === 'tenant-users' && (
            <TenantUsersView
              tenant={currentTenant}
              users={users}
              onCreateUser={handleCreateUser}
              onToggleUserStatus={handleToggleUserStatus}
              onResetPassword={handleResetPassword}
              onUpdateUserQuota={handleUpdateUserQuota}
            />
          )}

          {activeSection === 'workspace-disk' && (
            <WorkspaceDiskView
              tenant={currentTenant}
              workspace={currentWorkspace}
              onChangePlan={handleChangePlan}
              onReprovisionRootfs={handleReprovisionRootfs}
              onToggleWasmThreads={handleToggleWasmThreads}
            />
          )}

          {activeSection === 'tenants' && (
            <TenantsDirectoryView
              tenants={tenants}
              workspaces={workspaces}
              users={users}
              activeTenantId={activeTenantId}
              onSelectTenant={(tenantId) => setActiveTenantId(tenantId)}
              onProvisionTenant={handleProvisionTenant}
              onToggleTenantStatus={handleToggleTenantStatus}
            />
          )}

          {activeSection === 'infrastructure' && (
            <InfrastructureView tenantCount={tenants.length} />
          )}

          {activeSection === 'database-logs' && (
            <DatabaseLogsView
              tenants={tenants}
              users={users}
              workspaces={workspaces}
              logs={logs}
            />
          )}

          {activeSection === 'profile' && (
            <ProfileSecurityView
              user={currentUser}
              tenant={currentTenant}
              session={session}
              onUpdateProfile={handleUpdateProfile}
              onRotateGaSecret={handleRotateGaSecret}
            />
          )}
        </main>
      </div>
    </div>
  );
}
