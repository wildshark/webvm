import React, { useEffect, useRef, useState } from 'react';
import {
  FileCode2,
  FolderOpen,
  HardDrive,
  Plus,
  RotateCcw,
  Save,
  ShieldCheck,
  Terminal as TerminalIcon,
  X,
} from 'lucide-react';
import { ALPINE_TOOLCHAIN } from '../data/initialData';
import {
  PhpSessionState,
  Tenant,
  TerminalLine,
  TerminalTab,
  VirtualFile,
  Workspace,
} from '../types';
import { formatBytes } from '../utils/formatters';

interface WebVMViewProps {
  tenant: Tenant;
  workspace?: Workspace;
  session: PhpSessionState;
  files: VirtualFile[];
  onCreateFile: (path: string, name: string, type: 'file' | 'dir', content?: string) => void;
  onUpdateFileContent: (fileId: string, content: string) => void;
  onDeleteFile: (fileId: string) => void;
  onNavigateFiles: () => void;
}

export const WebVMView: React.FC<WebVMViewProps> = ({
  tenant,
  workspace,
  session,
  files,
  onCreateFile,
  onUpdateFileContent,
  onDeleteFile,
  onNavigateFiles,
}) => {
  const makeWelcomeLines = (): TerminalLine[] => [
    {
      id: `sys-${Date.now()}-1`,
      kind: 'system',
      text: `iQuipe WebVM Runtime (WebAssembly x86_64->wasm) · Alpine Linux ${workspace?.alpine_version ?? '3.20.3'}`,
    },
    {
      id: `sys-${Date.now()}-2`,
      kind: 'system',
      text: `Mounted rootfs: ${workspace?.image_path ?? `/storage/tenants/${tenant.slug}/rootfs.img`} | Isolation: ${tenant.slug}`,
    },
    {
      id: `sys-${Date.now()}-3`,
      kind: 'output',
      text: `Type 'help' for Alpine BusyBox, PHP 8.3, Python 3.12, Node.js, Git, Nano/Vim, and quota commands.`,
    },
  ];

  const [tabs, setTabs] = useState<TerminalTab[]>([
    {
      id: 'tab-1',
      title: 'sh — /workspace',
      cwd: '/workspace',
      lines: makeWelcomeLines(),
    },
  ]);
  const [activeTabId, setActiveTabId] = useState('tab-1');
  const [inputValue, setInputValue] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);

  // Built-in Nano/Vim modal editor inside the WebVM frame
  const [editorTarget, setEditorTarget] = useState<{
    mode: 'nano' | 'vim';
    fileId: string | null;
    path: string;
    name: string;
    content: string;
  } | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeTab = tabs.find((t) => t.id === activeTabId) ?? tabs[0];

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [activeTab?.lines.length, activeTabId]);

  // Reset welcome tab if tenant switches
  useEffect(() => {
    setTabs([
      {
        id: 'tab-1',
        title: 'sh — /workspace',
        cwd: '/workspace',
        lines: makeWelcomeLines(),
      },
    ]);
    setActiveTabId('tab-1');
    setEditorTarget(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenant.id]);

  const tenantFiles = files.filter((f) => f.tenant_id === tenant.id);

  const appendLines = (tabId: string, newLines: TerminalLine[], nextCwd?: string) => {
    setTabs((prev) =>
      prev.map((tab) => {
        if (tab.id !== tabId) return tab;
        const updatedCwd = nextCwd ?? tab.cwd;
        return {
          ...tab,
          cwd: updatedCwd,
          title: `sh — ${updatedCwd}`,
          lines: [...tab.lines, ...newLines],
        };
      })
    );
  };

  const resolveDirEntries = (dirPath: string) =>
    tenantFiles.filter((f) => f.path === dirPath);

  const findFile = (dirPath: string, name: string) =>
    tenantFiles.find((f) => f.path === dirPath && f.name === name);

  const executeCommand = (rawCmd: string) => {
    const trimmed = rawCmd.trim();
    const cwd = activeTab.cwd;

    const promptLine: TerminalLine = {
      id: `p-${Date.now()}-${Math.random()}`,
      kind: 'prompt',
      cwd,
      command: rawCmd,
      text: '',
    };

    if (!trimmed) {
      appendLines(activeTab.id, [promptLine]);
      return;
    }

    setHistory((prev) => [trimmed, ...prev.slice(0, 49)]);
    setHistoryIdx(-1);

    const parts = trimmed.split(/\s+/);
    const cmd = parts[0];
    const args = parts.slice(1);
    const out: TerminalLine[] = [promptLine];
    let nextCwd: string | undefined;

    const pushOut = (text: string, kind: 'output' | 'error' = 'output') => {
      out.push({
        id: `o-${Date.now()}-${Math.random()}`,
        kind,
        text,
      });
    };

    switch (cmd) {
      case 'clear':
        setTabs((prev) =>
          prev.map((t) => (t.id === activeTab.id ? { ...t, lines: [] } : t))
        );
        return;

      case 'help':
        pushOut(
          [
            'Alpine WebVM BusyBox v1.36.1 — Available Commands:',
            '  ls [-la]           List files & directories in current workspace path',
            '  cd <dir|..>        Change working directory inside tenant storage',
            '  pwd                Print current working directory',
            '  cat <file>         Display file contents',
            '  nano <file>        Open inline Nano editor (syncs with File Manager)',
            '  vim <file>         Open inline Vim editor (syncs with File Manager)',
            '  touch <file>       Create an empty file in current directory',
            '  mkdir <dir>        Create a new directory',
            '  rm <file>          Remove a file from tenant workspace',
            '  php <file|-v>      Execute PHP 8.3 CLI script or print version',
            '  python3 <file>     Execute Python 3.12 script or print --version',
            '  node <file|-v>     Execute Node.js 20 script or print version',
            '  git status|log     Inspect tenant repository status',
            '  apk info           List installed Alpine packages in base-alpine.img',
            '  du -sb             Measure tenant storage usage in bytes',
            '  uname -a | whoami  Inspect Alpine kernel and active tenant user',
            '  clear              Clear terminal viewport',
          ].join('\n')
        );
        break;

      case 'pwd':
        pushOut(cwd);
        break;

      case 'whoami':
        pushOut(`tenant-${tenant.id}-user (${session.role})`);
        break;

      case 'id':
        pushOut(`uid=${session.user_id}(${tenant.slug}) gid=${tenant.id}(tenant) groups=${tenant.id}(tenant)`);
        break;

      case 'uname':
        pushOut('Linux localhost 6.6.54-0-virt #1-Alpine SMP PREEMPT_DYNAMIC wasm32 GNU/Linux');
        break;

      case 'ls': {
        const longFmt = args.includes('-la') || args.includes('-l') || args.includes('-al');
        const entries = resolveDirEntries(cwd);
        if (entries.length === 0) {
          pushOut('(empty directory)');
        } else if (longFmt) {
          const rows = entries.map((f) => {
            const sizeStr = String(f.size).padStart(7, ' ');
            const suffix = f.type === 'dir' ? '/' : '';
            return `${f.permissions}  1 root root ${sizeStr} ${f.updated_at} ${f.name}${suffix}`;
          });
          pushOut(`total ${entries.length * 4}\n${rows.join('\n')}`);
        } else {
          pushOut(
            entries.map((f) => (f.type === 'dir' ? `${f.name}/` : f.name)).join('  ')
          );
        }
        break;
      }

      case 'cd': {
        const target = args[0];
        if (!target || target === '~' || target === '/workspace') {
          nextCwd = '/workspace';
        } else if (target === '..') {
          if (cwd === '/workspace') {
            pushOut('cd: restricted to /workspace (multi-tenant chroot boundary)', 'error');
          } else {
            const segs = cwd.split('/').filter(Boolean);
            segs.pop();
            nextCwd = '/' + segs.join('/');
          }
        } else {
          const clean = target.replace(/\/$/, '');
          const dir = findFile(cwd, clean);
          if (dir && dir.type === 'dir') {
            nextCwd = `${cwd}/${clean}`;
          } else {
            pushOut(`sh: cd: can't cd to ${target}: No such directory`, 'error');
          }
        }
        break;
      }

      case 'cat': {
        const target = args[0];
        if (!target) {
          pushOut('cat: missing file operand', 'error');
        } else if (target === '/etc/os-release') {
          pushOut(
            'NAME="Alpine Linux"\nID=alpine\nVERSION_ID=3.20.3\nPRETTY_NAME="Alpine Linux v3.20 (iQuipe WebVM)"'
          );
        } else {
          const f = findFile(cwd, target);
          if (!f) {
            pushOut(`cat: can't open '${target}': No such file or directory`, 'error');
          } else if (f.type === 'dir') {
            pushOut(`cat: read error: Is a directory`, 'error');
          } else {
            pushOut(f.content ?? '');
          }
        }
        break;
      }

      case 'touch': {
        const target = args[0];
        if (!target) {
          pushOut('touch: missing file operand', 'error');
        } else if (findFile(cwd, target)) {
          pushOut(`Updated timestamp for ${target}`);
        } else {
          onCreateFile(cwd, target, 'file', '');
          pushOut(`Created ${cwd}/${target}`);
        }
        break;
      }

      case 'mkdir': {
        const target = args[0];
        if (!target) {
          pushOut('mkdir: missing operand', 'error');
        } else if (findFile(cwd, target)) {
          pushOut(`mkdir: can't create directory '${target}': File exists`, 'error');
        } else {
          onCreateFile(cwd, target, 'dir');
          pushOut(`Created directory ${cwd}/${target}`);
        }
        break;
      }

      case 'rm': {
        const target = args[0];
        if (!target) {
          pushOut('rm: missing operand', 'error');
        } else {
          const f = findFile(cwd, target);
          if (!f) {
            pushOut(`rm: can't remove '${target}': No such file or directory`, 'error');
          } else {
            onDeleteFile(f.id);
            pushOut(`Removed ${f.name}`);
          }
        }
        break;
      }

      case 'nano':
      case 'vim': {
        const target = args[0];
        if (!target) {
          pushOut(`${cmd}: specify a filename, e.g. ${cmd} healthcheck.php`, 'error');
        } else {
          const existing = findFile(cwd, target);
          if (existing && existing.type === 'dir') {
            pushOut(`${cmd}: ${target} is a directory`, 'error');
          } else {
            setEditorTarget({
              mode: cmd,
              fileId: existing ? existing.id : null,
              path: cwd,
              name: target,
              content: existing?.content ?? '',
            });
            pushOut(`Opened ${target} in ${cmd} editor.`);
          }
        }
        break;
      }

      case 'php': {
        if (args[0] === '-v') {
          pushOut('PHP 8.3.13 (cli) (built: Oct 24 2026) (NTS) — Alpine musl');
        } else if (args[0]) {
          const f = findFile(cwd, args[0]);
          if (!f) {
            pushOut(`Could not open input file: ${args[0]}`, 'error');
          } else {
            pushOut(
              JSON.stringify(
                {
                  tenant: tenant.slug,
                  php_version: '8.3.13',
                  alpine_kernel: 'Linux 6.6.54-0-virt',
                  executed_file: `${cwd}/${f.name}`,
                  status: 'nominal',
                },
                null,
                2
              )
            );
          }
        } else {
          pushOut('Usage: php [-v | <script.php>]');
        }
        break;
      }

      case 'python3':
      case 'python': {
        if (args[0] === '--version' || args[0] === '-V') {
          pushOut('Python 3.12.7');
        } else if (args[0]) {
          const f = findFile(cwd, args[0]);
          if (!f) {
            pushOut(`python3: can't open file '${cwd}/${args[0]}': [Errno 2] No such file`, 'error');
          } else {
            pushOut(
              `Alpine Python 3.12.7 | Tenant: ${tenant.slug} | Entries in ${cwd}: ${resolveDirEntries(cwd).length}`
            );
          }
        } else {
          pushOut('Usage: python3 [--version | <script.py>]');
        }
        break;
      }

      case 'node': {
        if (args[0] === '-v' || args[0] === '--version') {
          pushOut('v20.18.0');
        } else if (args[0]) {
          const f = findFile(cwd, args[0]);
          if (!f) {
            pushOut(`Error: Cannot find module '${cwd}/${args[0]}'`, 'error');
          } else {
            pushOut(`Node runtime: v20.18.0\nArch: wasm32 Host: ${tenant.slug}-alpine`);
          }
        } else {
          pushOut('Usage: node [-v | <script.mjs>]');
        }
        break;
      }

      case 'git': {
        if (args[0] === 'status') {
          pushOut(
            `On branch main\nYour branch is up to date with 'origin/main'.\n\nnothing to commit, working tree clean (${tenantFiles.length} tracked objects)`
          );
        } else if (args[0] === 'log') {
          pushOut(
            `commit 8a4c91f (HEAD -> main)\nAuthor: ${tenant.company_name} <dev@${tenant.slug}.local>\nDate:   Tue Nov 17 18:10:00 2026\n\n    Verify PHP 8.3 session guard and Alpine rootfs provisioning`
          );
        } else {
          pushOut('git version 2.45.2 (Alpine Linux) — try "git status" or "git log"');
        }
        break;
      }

      case 'apk':
        pushOut(ALPINE_TOOLCHAIN.map((p) => `${p.name.toLowerCase().replace(/\s+/g, '-')}-${p.version}`).join('\n'));
        break;

      case 'du':
        pushOut(
          `${workspace?.storage_used ?? 0}\t/storage/tenants/${tenant.slug}\n(${formatBytes(
            workspace?.storage_used ?? 0
          )} of ${formatBytes(tenant.storage_limit, 0)} quota)`
        );
        break;

      case 'df':
        pushOut(
          `Filesystem      Size  Used Avail Use% Mounted on\n` +
            `rootfs.img      ${formatBytes(tenant.storage_limit, 0).padEnd(5)} ${formatBytes(
              workspace?.storage_used ?? 0
            ).padEnd(5)} ${formatBytes(
              Math.max(0, tenant.storage_limit - (workspace?.storage_used ?? 0))
            ).padEnd(5)} ${Math.round(
              ((workspace?.storage_used ?? 0) / tenant.storage_limit) * 100
            )}%   /workspace`
        );
        break;

      case 'curl':
      case 'wget':
      case 'ssh':
        pushOut(
          `${cmd}: outbound bridge active on ${
            workspace?.config_json.network_bridge ?? 'isolated-veth0'
          } (tenant isolation enforced)`
        );
        break;

      default:
        pushOut(`sh: ${cmd}: not found. Type 'help' for supported Alpine WebVM commands.`, 'error');
    }

    appendLines(activeTab.id, out, nextCwd);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      executeCommand(inputValue);
      setInputValue('');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length > 0) {
        const nextIdx = Math.min(history.length - 1, historyIdx + 1);
        setHistoryIdx(nextIdx);
        setInputValue(history[nextIdx]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIdx > 0) {
        const nextIdx = historyIdx - 1;
        setHistoryIdx(nextIdx);
        setInputValue(history[nextIdx]);
      } else {
        setHistoryIdx(-1);
        setInputValue('');
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const parts = inputValue.split(' ');
      const last = parts[parts.length - 1];
      if (last) {
        const match = resolveDirEntries(activeTab.cwd).find((f) =>
          f.name.startsWith(last)
        );
        if (match) {
          parts[parts.length - 1] = match.name;
          setInputValue(parts.join(' '));
        }
      }
    }
  };

  const handleAddTab = () => {
    const id = `tab-${Date.now()}`;
    setTabs((prev) => [
      ...prev,
      {
        id,
        title: 'sh — /workspace',
        cwd: '/workspace',
        lines: makeWelcomeLines(),
      },
    ]);
    setActiveTabId(id);
  };

  const handleCloseTab = (id: string) => {
    if (tabs.length === 1) return;
    const filtered = tabs.filter((t) => t.id !== id);
    setTabs(filtered);
    if (activeTabId === id) {
      setActiveTabId(filtered[filtered.length - 1].id);
    }
  };

  const handleSaveEditor = () => {
    if (!editorTarget) return;
    if (editorTarget.fileId) {
      onUpdateFileContent(editorTarget.fileId, editorTarget.content);
    } else {
      onCreateFile(editorTarget.path, editorTarget.name, 'file', editorTarget.content);
    }
    appendLines(activeTab.id, [
      {
        id: `ed-${Date.now()}`,
        kind: 'system',
        text: `Saved ${editorTarget.path}/${editorTarget.name} (${new Blob([editorTarget.content]).size} bytes) to tenant storage.`,
      },
    ]);
    setEditorTarget(null);
    inputRef.current?.focus();
  };

  const quickCommands = [
    'ls -la',
    'php healthcheck.php',
    'python3 telemetry_parser.py',
    'node worker.mjs',
    'git status',
    'du -sb',
    'apk info',
  ];

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
      {/* Main Interactive Alpine WebVM Terminal Viewport */}
      <div className="xl:col-span-8 flex flex-col border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-950 text-slate-100 overflow-hidden">
        {/* Terminal Tab Bar */}
        <div className="flex items-center justify-between gap-2 px-3 py-2 bg-slate-900 border-b border-slate-800">
          <div className="flex items-center gap-1 overflow-x-auto">
            {tabs.map((tab) => {
              const isActive = tab.id === activeTab.id;
              return (
                <div
                  key={tab.id}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-mono transition-colors shrink-0 ${
                    isActive
                      ? 'bg-slate-950 text-sky-400 border border-slate-800'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setActiveTabId(tab.id)}
                    className="flex items-center gap-1.5 whitespace-nowrap"
                  >
                    <TerminalIcon className="w-3.5 h-3.5" />
                    <span>{tab.title}</span>
                  </button>
                  {tabs.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleCloseTab(tab.id)}
                      className="text-slate-500 hover:text-slate-200"
                      aria-label="Close terminal tab"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })}
            <button
              type="button"
              onClick={handleAddTab}
              className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
              title="Open new terminal tab"
              aria-label="Open new terminal tab"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() =>
                setTabs((prev) =>
                  prev.map((t) =>
                    t.id === activeTab.id
                      ? { ...t, cwd: '/workspace', title: 'sh — /workspace', lines: makeWelcomeLines() }
                      : t
                  )
                )
              }
              className="px-2.5 py-1 rounded-md text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5 whitespace-nowrap"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Shell</span>
            </button>
          </div>
        </div>

        {/* Quick Command Toolbar */}
        <div className="px-4 py-2 bg-slate-900/60 border-b border-slate-800/80 flex items-center gap-2 overflow-x-auto">
          <span className="text-[11px] font-medium text-slate-400 whitespace-nowrap shrink-0">
            Quick run:
          </span>
          {quickCommands.map((cmd) => (
            <button
              key={cmd}
              type="button"
              onClick={() => {
                executeCommand(cmd);
                inputRef.current?.focus();
              }}
              className="px-2 py-1 rounded bg-slate-800/90 hover:bg-slate-700 text-[11px] font-mono text-slate-200 transition-colors whitespace-nowrap shrink-0"
            >
              {cmd}
            </button>
          ))}
        </div>

        {/* Either Inline Nano/Vim Editor OR Live Terminal Output */}
        {editorTarget ? (
          <div className="h-[480px] flex flex-col bg-slate-950">
            <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs font-mono text-slate-200">
                <FileCode2 className="w-4 h-4 text-sky-400" />
                <span>
                  GNU {editorTarget.mode} — {editorTarget.path}/{editorTarget.name}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditorTarget(null)}
                  className="px-3 py-1 rounded text-xs text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  Cancel (^X)
                </button>
                <button
                  type="button"
                  onClick={handleSaveEditor}
                  className="px-3 py-1 rounded bg-sky-600 hover:bg-sky-700 text-xs font-medium text-white flex items-center gap-1.5 transition-colors"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Write Out (^O)</span>
                </button>
              </div>
            </div>
            <textarea
              value={editorTarget.content}
              onChange={(e) =>
                setEditorTarget((prev) =>
                  prev ? { ...prev, content: e.target.value } : null
                )
              }
              spellCheck={false}
              className="flex-1 w-full p-4 bg-slate-950 text-slate-100 font-mono text-xs leading-relaxed focus:outline-none resize-none terminal-scroll"
            />
          </div>
        ) : (
          <div
            ref={scrollRef}
            onClick={() => inputRef.current?.focus()}
            className="h-[480px] p-4 overflow-y-auto font-mono text-[13px] leading-relaxed terminal-scroll cursor-text space-y-1.5"
          >
            {activeTab.lines.map((line) => {
              if (line.kind === 'prompt') {
                return (
                  <div key={line.id} className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-sky-400 font-medium">
                      {tenant.slug}:{line.cwd}#
                    </span>
                    <span className="text-slate-100">{line.command}</span>
                  </div>
                );
              }
              if (line.kind === 'error') {
                return (
                  <pre key={line.id} className="text-rose-400 whitespace-pre-wrap break-words font-mono">
                    {line.text}
                  </pre>
                );
              }
              if (line.kind === 'system') {
                return (
                  <div key={line.id} className="text-emerald-400/90 text-xs">
                    {line.text}
                  </div>
                );
              }
              return (
                <pre key={line.id} className="text-slate-300 whitespace-pre-wrap break-words font-mono">
                  {line.text}
                </pre>
              );
            })}

            {/* Active Command Prompt */}
            <div className="flex items-center gap-2 pt-1">
              <span className="text-sky-400 font-medium shrink-0">
                {tenant.slug}:{activeTab.cwd}#
              </span>
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
                spellCheck={false}
                autoComplete="off"
                aria-label="Alpine WebVM command input"
                className="flex-1 bg-transparent text-slate-100 focus:outline-none font-mono text-[13px] min-w-0"
                placeholder="Enter command (e.g. ls -la, php healthcheck.php, help)..."
              />
            </div>
          </div>
        )}
      </div>

      {/* Right-Side WebVM Runtime & Isolation Inspector */}
      <div className="xl:col-span-4 space-y-5">
        {/* Tenant Mount & PHP Session Verification */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-display font-semibold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <span>Mounted Tenant Rootfs</span>
            </h2>
            <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
              2FA Verified
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between gap-2 py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">Image Path</span>
              <span className="font-mono text-slate-800 dark:text-slate-200 truncate max-w-[200px]">
                {workspace?.image_path}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2 py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">Master Base</span>
              <span className="font-mono text-slate-800 dark:text-slate-200">
                /images/base-alpine.img
              </span>
            </div>
            <div className="flex items-center justify-between gap-2 py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">WASM Memory</span>
              <span className="font-mono text-slate-800 dark:text-slate-200 tabular-nums">
                {workspace?.config_json.memory_limit_mb ?? 512} MB
              </span>
            </div>
            <div className="flex items-center justify-between gap-2 py-1.5">
              <span className="text-slate-500 dark:text-slate-400">PHP Session Gate</span>
              <span className="font-mono text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                authenticated=true
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onNavigateFiles}
            className="w-full py-2 px-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-medium text-slate-800 dark:text-slate-100 transition-colors flex items-center justify-center gap-2"
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span>Open Tenant File Manager</span>
          </button>
        </div>

        {/* Alpine Pre-installed Toolchain */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-semibold text-sm text-slate-900 dark:text-white">
              Alpine Master Toolchain
            </h2>
            <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
              {ALPINE_TOOLCHAIN.length} packages
            </span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {ALPINE_TOOLCHAIN.map((pkg) => (
              <div
                key={pkg.name}
                className="py-2 flex items-center justify-between gap-2 text-xs"
              >
                <div>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {pkg.name}
                  </span>
                  <span className="text-slate-400 dark:text-slate-500 ml-2">
                    {pkg.category}
                  </span>
                </div>
                <span className="font-mono text-slate-600 dark:text-slate-400 tabular-nums">
                  {pkg.version}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
