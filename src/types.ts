export type UserRole = 'super_admin' | 'tenant_admin' | 'user';

export type PlanTier = 'Starter' | 'Business' | 'Professional' | 'Enterprise';

export type NavSection =
  | 'webvm'
  | 'files'
  | 'tenant-users'
  | 'workspace-disk'
  | 'tenants'
  | 'infrastructure'
  | 'database-logs'
  | 'profile';

export interface Tenant {
  id: number;
  slug: string;
  company_name: string;
  plan: PlanTier;
  storage_limit: number; // bytes
  status: 'active' | 'suspended';
  created_at: string;
}

export interface UserAccount {
  id: number;
  tenant_id: number;
  fullname: string;
  email: string;
  role: UserRole;
  password_hash: string;
  ga_secret: string;
  ga_verified: boolean;
  status: 'active' | 'locked';
  avatar: string;
  assigned_quota_mb: number;
  last_login: string;
}

export interface Workspace {
  id: number;
  tenant_id: number;
  image_path: string;
  storage_used: number; // bytes
  created_at: string;
  alpine_version: string;
  rootfs_size_mb: number;
  config_json: {
    memory_limit_mb: number;
    wasm_threads: boolean;
    network_bridge: string;
    allow_ssh_client: boolean;
    base_image: string;
  };
}

export interface VirtualFile {
  id: string;
  tenant_id: number;
  path: string; // e.g., "/workspace" or "/workspace/src"
  name: string;
  type: 'file' | 'dir';
  size: number; // bytes
  permissions: string;
  updated_at: string;
  content?: string;
}

export interface AuditLogEntry {
  id: number;
  timestamp: string;
  actor_email: string;
  role: UserRole;
  tenant_slug: string;
  event: string;
  detail: string;
  outcome: 'verified' | 'blocked' | 'provisioned' | 'info';
}

export interface PhpSessionState {
  user_id: number;
  tenant_id: number;
  role: UserRole;
  authenticated: boolean;
  ga_verified: boolean;
  session_id: string;
  issued_at: string;
}

export interface TerminalTab {
  id: string;
  title: string;
  cwd: string;
  lines: TerminalLine[];
}

export interface TerminalLine {
  id: string;
  kind: 'prompt' | 'output' | 'error' | 'system';
  cwd?: string;
  command?: string;
  text: string;
}
