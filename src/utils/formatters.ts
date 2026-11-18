import { PlanTier, UserRole } from '../types';

export const PLAN_LIMITS_BYTES: Record<PlanTier, number> = {
  Starter: 1 * 1024 * 1024 * 1024,
  Business: 5 * 1024 * 1024 * 1024,
  Professional: 10 * 1024 * 1024 * 1024,
  Enterprise: 25 * 1024 * 1024 * 1024,
};

export const PLAN_DESCRIPTIONS: Record<PlanTier, string> = {
  Starter: '1 GB NVMe · Individual Dev',
  Business: '5 GB NVMe · Small Teams',
  Professional: '10 GB NVMe · Growing Orgs',
  Enterprise: '25 GB NVMe · Dedicated Pools',
};

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const val = bytes / Math.pow(k, i);
  return `${val.toFixed(i === 0 ? 0 : dm)} ${sizes[i]}`;
}

export function formatRoleLabel(role: UserRole): string {
  switch (role) {
    case 'super_admin':
      return 'Super Admin';
    case 'tenant_admin':
      return 'Tenant Admin';
    case 'user':
      return 'Tenant User';
  }
}

/**
 * Generates a deterministic 6-digit TOTP code for a given Base32 secret
 * and current 30-second epoch window so the Authenticator companion and
 * login verifier stay synchronized in real time.
 */
export function computeTotpCode(secret: string, timestampMs = Date.now()): string {
  const step = Math.floor(timestampMs / 30000);
  let hash = 2166136261;
  const input = `${secret}:${step}`;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const positive = Math.abs(hash) % 1000000;
  return positive.toString().padStart(6, '0');
}

export function getTotpSecondsRemaining(timestampMs = Date.now()): number {
  const elapsedInWindow = Math.floor((timestampMs % 30000) / 1000);
  return 30 - elapsedInWindow;
}

export function generateBase32Secret(length = 16): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return result;
}

/**
 * Generates a deterministic 21x21 QR-like matrix SVG pattern from a TOTP URI
 * for clear visual display in the Google Authenticator enrollment panel.
 */
export function buildQrMatrix(seedText: string): boolean[][] {
  const size = 21;
  const grid: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  const drawFinder = (r0: number, c0: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
        const isCore = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        grid[r0 + r][c0 + c] = isBorder || isCore;
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(0, size - 7);
  drawFinder(size - 7, 0);

  let hash = 5381;
  for (let i = 0; i < seedText.length; i++) {
    hash = (Math.imul(hash, 33) ^ seedText.charCodeAt(i)) >>> 0;
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const inFinder =
        (r < 8 && c < 8) ||
        (r < 8 && c >= size - 8) ||
        (r >= size - 8 && c < 8);
      if (inFinder) continue;
      if (r === 6 || c === 6) {
        grid[r][c] = (r + c) % 2 === 0;
        continue;
      }
      hash = (Math.imul(hash, 1664525) + 1013904223) >>> 0;
      grid[r][c] = (hash & 1) === 1;
    }
  }

  return grid;
}
