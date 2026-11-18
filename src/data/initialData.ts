import { AuditLogEntry, Tenant, UserAccount, VirtualFile, Workspace } from '../types';
import { PLAN_LIMITS_BYTES } from '../utils/formatters';

export const AVATARS = {
  super_admin: '/src/assets/images/avatar_super_admin_1794974033649.jpg',
  tenant_admin: '/src/assets/images/avatar_tenant_admin_1794974033968.jpg',
  user: '/src/assets/images/avatar_tenant_user_1794974033967.jpg',
};

export const INITIAL_TENANTS: Tenant[] = [
  {
    id: 1,
    slug: 'tenant-001',
    company_name: 'iQuipe Digital Labs',
    plan: 'Enterprise',
    storage_limit: PLAN_LIMITS_BYTES.Enterprise,
    status: 'active',
    created_at: '2026-08-14 09:12:00',
  },
  {
    id: 2,
    slug: 'tenant-002',
    company_name: 'Northstar FinTech Ltd',
    plan: 'Professional',
    storage_limit: PLAN_LIMITS_BYTES.Professional,
    status: 'active',
    created_at: '2026-09-02 14:35:00',
  },
  {
    id: 3,
    slug: 'tenant-003',
    company_name: 'Helios Robotics Studio',
    plan: 'Business',
    storage_limit: PLAN_LIMITS_BYTES.Business,
    status: 'active',
    created_at: '2026-10-11 11:04:00',
  },
  {
    id: 4,
    slug: 'tenant-004',
    company_name: 'Vanguard EduTech',
    plan: 'Starter',
    storage_limit: PLAN_LIMITS_BYTES.Starter,
    status: 'suspended',
    created_at: '2026-10-29 17:48:00',
  },
];

export const INITIAL_USERS: UserAccount[] = [
  {
    id: 101,
    tenant_id: 1,
    fullname: 'Marcus Vance',
    email: 'admin@iquipedigital.io',
    role: 'super_admin',
    password_hash: '$2y$12$R9h/cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jWMUW',
    ga_secret: 'JBSWY3DPEHPK3PXP',
    ga_verified: true,
    status: 'active',
    avatar: AVATARS.super_admin,
    assigned_quota_mb: 10240,
    last_login: '2026-11-17 19:42:10',
  },
  {
    id: 102,
    tenant_id: 1,
    fullname: 'Elena Rostova',
    email: 'elena@iquipedigital.io',
    role: 'tenant_admin',
    password_hash: '$2y$12$KIX9x5v9kM1P8aR2W6h0xe7pP4uZ8qM2R5sW9vL3yN1tB6mJ4qK2a',
    ga_secret: 'MFRGGZDFMZTWQ2LK',
    ga_verified: true,
    status: 'active',
    avatar: AVATARS.tenant_admin,
    assigned_quota_mb: 5120,
    last_login: '2026-11-17 18:15:44',
  },
  {
    id: 103,
    tenant_id: 1,
    fullname: 'Daniel Okoro',
    email: 'daniel@iquipedigital.io',
    role: 'user',
    password_hash: '$2y$12$T2mQ8pZ1wN4vB7cX9yK3ze8rA5tY2uI6oP1lK9jH4gF7dS3aQ6wE2',
    ga_secret: 'KRSXG5CTMVRXEZLU',
    ga_verified: true,
    status: 'active',
    avatar: AVATARS.user,
    assigned_quota_mb: 2048,
    last_login: '2026-11-17 19:10:02',
  },
  {
    id: 201,
    tenant_id: 2,
    fullname: 'Claire Sterling',
    email: 'claire@northstarfin.com',
    role: 'tenant_admin',
    password_hash: '$2y$12$P9wL4mK2nB7vC3xZ8aQ1se6dF5gH9jK2lM4nB7vC3xZ8aQ1sE5rT8',
    ga_secret: 'NBSWY3DPFQQFO33S',
    ga_verified: true,
    status: 'active',
    avatar: AVATARS.tenant_admin,
    assigned_quota_mb: 4096,
    last_login: '2026-11-17 16:28:19',
  },
  {
    id: 202,
    tenant_id: 2,
    fullname: 'Tariq Al-Mansoor',
    email: 'tariq@northstarfin.com',
    role: 'user',
    password_hash: '$2y$12$H4jK9lM2nB7vC3xZ8aQ1se6dF5gH9jK2lM4nB7vC3xZ8aQ1sE5rT8',
    ga_secret: 'ORSXG5A5ORXXIZLP',
    ga_verified: false,
    status: 'active',
    avatar: AVATARS.user,
    assigned_quota_mb: 2048,
    last_login: '2026-11-16 11:45:00',
  },
  {
    id: 301,
    tenant_id: 3,
    fullname: 'Sora Takahashi',
    email: 'sora@heliosrobotics.dev',
    role: 'tenant_admin',
    password_hash: '$2y$12$V7cX3zA8qW1eR5tY9uI2oe4pA6sD8fG1hJ3kL5mN7bV9cX2zQ4wE6',
    ga_secret: 'GEZDGNBVGY3TQOJQ',
    ga_verified: true,
    status: 'active',
    avatar: AVATARS.tenant_admin,
    assigned_quota_mb: 3072,
    last_login: '2026-11-17 13:05:33',
  },
];

export const INITIAL_WORKSPACES: Workspace[] = [
  {
    id: 1,
    tenant_id: 1,
    image_path: '/storage/tenants/tenant-001/rootfs.img',
    storage_used: 3489660928, // ~3.25 GB
    created_at: '2026-08-14 09:12:03',
    alpine_version: '3.20.3',
    rootfs_size_mb: 142,
    config_json: {
      memory_limit_mb: 1024,
      wasm_threads: true,
      network_bridge: 'isolated-veth0',
      allow_ssh_client: true,
      base_image: '/images/base-alpine.img',
    },
  },
  {
    id: 2,
    tenant_id: 2,
    image_path: '/storage/tenants/tenant-002/rootfs.img',
    storage_used: 4617089843, // ~4.30 GB
    created_at: '2026-09-02 14:35:04',
    alpine_version: '3.20.3',
    rootfs_size_mb: 142,
    config_json: {
      memory_limit_mb: 768,
      wasm_threads: true,
      network_bridge: 'isolated-veth0',
      allow_ssh_client: true,
      base_image: '/images/base-alpine.img',
    },
  },
  {
    id: 3,
    tenant_id: 3,
    image_path: '/storage/tenants/tenant-003/rootfs.img',
    storage_used: 4402341478, // ~4.10 GB (approaching 5GB quota)
    created_at: '2026-10-11 11:04:05',
    alpine_version: '3.20.3',
    rootfs_size_mb: 142,
    config_json: {
      memory_limit_mb: 512,
      wasm_threads: true,
      network_bridge: 'isolated-veth0',
      allow_ssh_client: false,
      base_image: '/images/base-alpine.img',
    },
  },
  {
    id: 4,
    tenant_id: 4,
    image_path: '/storage/tenants/tenant-004/rootfs.img',
    storage_used: 268435456, // 256 MB
    created_at: '2026-10-29 17:48:04',
    alpine_version: '3.20.3',
    rootfs_size_mb: 142,
    config_json: {
      memory_limit_mb: 512,
      wasm_threads: false,
      network_bridge: 'isolated-veth0',
      allow_ssh_client: false,
      base_image: '/images/base-alpine.img',
    },
  },
];

export const INITIAL_FILES: VirtualFile[] = [
  {
    id: 'f-1',
    tenant_id: 1,
    path: '/workspace',
    name: 'src',
    type: 'dir',
    size: 4096,
    permissions: 'drwxr-xr-x',
    updated_at: '2026-11-17 18:10',
  },
  {
    id: 'f-2',
    tenant_id: 1,
    path: '/workspace',
    name: 'scripts',
    type: 'dir',
    size: 4096,
    permissions: 'drwxr-xr-x',
    updated_at: '2026-11-16 14:22',
  },
  {
    id: 'f-3',
    tenant_id: 1,
    path: '/workspace',
    name: 'healthcheck.php',
    type: 'file',
    size: 642,
    permissions: '-rw-r--r--',
    updated_at: '2026-11-17 19:01',
    content: `<?php
// Tenant Workspace Diagnostic (PHP 8.3 CLI)
$tenant = getenv('TENANT_SLUG') ?: 'tenant-001';
$diskFree = disk_free_space('/workspace');
echo json_encode([
    'tenant' => $tenant,
    'php_version' => PHP_VERSION,
    'alpine_kernel' => php_uname('s') . ' ' . php_uname('r'),
    'status' => 'nominal'
], JSON_PRETTY_PRINT) . PHP_EOL;
`,
  },
  {
    id: 'f-4',
    tenant_id: 1,
    path: '/workspace',
    name: 'telemetry_parser.py',
    type: 'file',
    size: 518,
    permissions: '-rw-r--r--',
    updated_at: '2026-11-17 17:45',
    content: `#!/usr/bin/env python3
import os, platform

def summarize_workspace():
    root = "/workspace"
    entries = os.listdir(root) if os.path.exists(root) else []
    print(f"Alpine Python {platform.python_version()} | Entries: {len(entries)}")

if __name__ == "__main__":
    summarize_workspace()
`,
  },
  {
    id: 'f-5',
    tenant_id: 1,
    path: '/workspace',
    name: 'worker.mjs',
    type: 'file',
    size: 384,
    permissions: '-rw-r--r--',
    updated_at: '2026-11-15 11:30',
    content: `// Node.js 20 Alpine WebVM Worker Script
import os from 'node:os';

console.log('Node runtime:', process.version);
console.log('Arch:', os.arch(), 'Host:', os.hostname());
`,
  },
  {
    id: 'f-6',
    tenant_id: 1,
    path: '/workspace',
    name: 'README.md',
    type: 'file',
    size: 412,
    permissions: '-rw-r--r--',
    updated_at: '2026-11-14 09:00',
    content: `# iQuipe Digital — Tenant-001 Workspace

Mounted rootfs: /storage/tenants/tenant-001/rootfs.img
Base image:     /images/base-alpine.img (Alpine Linux 3.20)
Toolchain:      BusyBox, Git, Nano, Vim, Python 3.12, PHP 8.3 CLI, Node.js 20, OpenSSH, curl, wget
`,
  },
  {
    id: 'f-7',
    tenant_id: 1,
    path: '/workspace/src',
    name: 'session_guard.php',
    type: 'file',
    size: 488,
    permissions: '-rw-r--r--',
    updated_at: '2026-11-17 16:08',
    content: `<?php
session_start();
if (empty($_SESSION['authenticated']) || $_SESSION['authenticated'] !== true) {
    http_response_code(403);
    exit('2FA Google Authenticator verification required.');
}
`,
  },
  {
    id: 'f-8',
    tenant_id: 1,
    path: '/workspace/scripts',
    name: 'backup_sqlite.sh',
    type: 'file',
    size: 296,
    permissions: '-rwxr-xr-x',
    updated_at: '2026-11-12 08:15',
    content: `#!/bin/sh
set -e
sqlite3 /var/lib/iquipe/platform.db ".backup '/backups/platform-$(date +%F).sqlite'"
echo "Backup completed."
`,
  },
  // Tenant 2 sample files
  {
    id: 'f-201',
    tenant_id: 2,
    path: '/workspace',
    name: 'ledger_reconcile.py',
    type: 'file',
    size: 420,
    permissions: '-rw-r--r--',
    updated_at: '2026-11-17 15:20',
    content: `#!/usr/bin/env python3
print("Northstar FinTech — Ledger Checksum Verified")
`,
  },
  {
    id: 'f-202',
    tenant_id: 2,
    path: '/workspace',
    name: 'config.json',
    type: 'file',
    size: 210,
    permissions: '-rw-r--r--',
    updated_at: '2026-11-16 10:12',
    content: `{\n  "tenant": "tenant-002",\n  "isolation": "strict",\n  "2fa_required": true\n}\n`,
  },
  // Tenant 3 sample files
  {
    id: 'f-301',
    tenant_id: 3,
    path: '/workspace',
    name: 'kinematics.mjs',
    type: 'file',
    size: 310,
    permissions: '-rw-r--r--',
    updated_at: '2026-11-17 12:40',
    content: `console.log("Helios Robotics WebVM Simulation Ready");\n`,
  },
];

export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 9084,
    timestamp: '2026-11-17 19:42:10',
    actor_email: 'admin@iquipedigital.io',
    role: 'super_admin',
    tenant_slug: 'tenant-001',
    event: '2FA Session Verified',
    detail: 'Google Authenticator TOTP validated; $_SESSION[authenticated] = true',
    outcome: 'verified',
  },
  {
    id: 9083,
    timestamp: '2026-11-17 19:10:02',
    actor_email: 'daniel@iquipedigital.io',
    role: 'user',
    tenant_slug: 'tenant-001',
    event: 'WebVM Rootfs Mounted',
    detail: 'Mounted /storage/tenants/tenant-001/rootfs.img via WebAssembly runtime',
    outcome: 'info',
  },
  {
    id: 9082,
    timestamp: '2026-11-17 18:55:19',
    actor_email: 'tariq@northstarfin.com',
    role: 'user',
    tenant_slug: 'tenant-002',
    event: 'WebVM Access Blocked',
    detail: 'Rejected attempt before Google Authenticator TOTP verification',
    outcome: 'blocked',
  },
  {
    id: 9081,
    timestamp: '2026-11-17 17:30:00',
    actor_email: 'worker@php-cli',
    role: 'super_admin',
    tenant_slug: 'platform',
    event: 'Storage Quota Scan',
    detail: 'Executed du -sb /storage/tenants/* across 4 active workspace directories',
    outcome: 'info',
  },
  {
    id: 9080,
    timestamp: '2026-11-17 16:00:00',
    actor_email: 'sqlite-backup@alpine',
    role: 'super_admin',
    tenant_slug: 'platform',
    event: 'SQLite Snapshot',
    detail: 'Hot backup of tenants, users, and workspaces tables archived (4.8 MB)',
    outcome: 'provisioned',
  },
  {
    id: 9079,
    timestamp: '2026-11-16 09:14:22',
    actor_email: 'admin@iquipedigital.io',
    role: 'super_admin',
    tenant_slug: 'tenant-004',
    event: 'Tenant Suspended',
    detail: 'Set tenants.status = suspended for Vanguard EduTech; WebVM locks enforced',
    outcome: 'blocked',
  },
];

export const ALPINE_TOOLCHAIN = [
  { name: 'Alpine Linux', version: '3.20.3', category: 'Base OS' },
  { name: 'BusyBox', version: '1.36.1', category: 'Coreutils & Shell' },
  { name: 'PHP CLI', version: '8.3.13', category: 'Runtime' },
  { name: 'Python', version: '3.12.7', category: 'Runtime' },
  { name: 'Node.js', version: '20.18.0', category: 'Runtime' },
  { name: 'Git', version: '2.45.2', category: 'VCS' },
  { name: 'Nano / Vim', version: '8.2 / 9.1', category: 'Editors' },
  { name: 'OpenSSH Client', version: '9.7p1', category: 'Networking' },
  { name: 'curl / wget', version: '8.10.1', category: 'Transfer' },
];

export const DOCKER_SERVICES = [
  {
    service: 'web',
    image: 'nginx:1.27-alpine',
    purpose: 'TLS termination, static WebAssembly asset delivery, PHP-FPM FastCGI proxy',
    cpu: '0.8 vCPU',
    memory: '512 MB',
    state: 'Running',
  },
  {
    service: 'php',
    image: 'php:8.3-fpm-alpine',
    purpose: 'Session auth, Google Authenticator TOTP validation, Tenant & File APIs',
    cpu: '2.4 vCPU',
    memory: '2.1 GB',
    state: 'Running',
  },
  {
    service: 'worker',
    image: 'php:8.3-cli-alpine',
    purpose: 'Async rootfs.img provisioning from base-alpine.img & du -sb quota polling',
    cpu: '1.2 vCPU',
    memory: '640 MB',
    state: 'Running',
  },
  {
    service: 'sqlite-backup',
    image: 'alpine:3.20',
    purpose: 'Hourly atomic SQLite .backup snapshots & encrypted off-host retention',
    cpu: '0.2 vCPU',
    memory: '128 MB',
    state: 'Running',
  },
];
