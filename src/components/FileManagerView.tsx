import React, { useRef, useState } from 'react';
import {
  ChevronRight,
  Download,
  FileCode2,
  FilePlus2,
  Folder,
  FolderPlus,
  HardDrive,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { Tenant, VirtualFile, Workspace } from '../types';
import { formatBytes } from '../utils/formatters';

interface FileManagerViewProps {
  tenant: Tenant;
  workspace?: Workspace;
  files: VirtualFile[];
  onCreateFile: (path: string, name: string, type: 'file' | 'dir', content?: string, customSize?: number) => void;
  onUpdateFileContent: (fileId: string, content: string) => void;
  onDeleteFile: (fileId: string) => void;
}

export const FileManagerView: React.FC<FileManagerViewProps> = ({
  tenant,
  workspace,
  files,
  onCreateFile,
  onUpdateFileContent,
  onDeleteFile,
}) => {
  const [cwd, setCwd] = useState('/workspace');
  const [search, setSearch] = useState('');
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [newItemModal, setNewItemModal] = useState<'file' | 'dir' | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [uploadError, setUploadError] = useState('');

  const uploadInputRef = useRef<HTMLInputElement>(null);

  const tenantFiles = files.filter((f) => f.tenant_id === tenant.id);
  const visibleEntries = tenantFiles
    .filter((f) => f.path === cwd)
    .filter((f) =>
      search.trim()
        ? f.name.toLowerCase().includes(search.trim().toLowerCase())
        : true
    )
    .sort((a, b) => {
      if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

  const selectedFile = tenantFiles.find((f) => f.id === selectedFileId) ?? null;

  const storageUsed = workspace?.storage_used ?? 0;
  const storageLimit = tenant.storage_limit;
  const usagePct = Math.min(100, Math.round((storageUsed / storageLimit) * 100));

  const pathSegments = cwd.split('/').filter(Boolean);

  const handleOpenEntry = (entry: VirtualFile) => {
    if (entry.type === 'dir') {
      setCwd(`${entry.path}/${entry.name}`);
      setSelectedFileId(null);
    } else {
      setSelectedFileId(entry.id);
      setEditingContent(entry.content ?? '');
    }
  };

  const handleDownload = (entry: VirtualFile) => {
    const blob = new Blob([entry.content ?? ''], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = entry.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleUploadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError('');
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    Array.from(fileList).forEach((file) => {
      if (storageUsed + file.size > storageLimit) {
        setUploadError(
          `Upload blocked: ${file.name} (${formatBytes(file.size)}) exceeds ${tenant.plan} quota (${formatBytes(storageLimit, 0)}).`
        );
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const textContent =
          typeof reader.result === 'string'
            ? reader.result
            : `[Binary asset uploaded: ${file.name}, ${file.size} bytes]`;
        onCreateFile(cwd, file.name, 'file', textContent, file.size);
      };
      reader.readAsText(file);
    });
    e.target.value = '';
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = newItemName.trim().replace(/[/\\]/g, '');
    if (!cleaned || !newItemModal) return;
    onCreateFile(cwd, cleaned, newItemModal, newItemModal === 'file' ? '' : undefined);
    setNewItemName('');
    setNewItemModal(null);
  };

  return (
    <div className="space-y-6">
      {/* Storage Quota Summary Strip */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
            <HardDrive className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            <span>Isolated Storage Directory: /storage/tenants/{tenant.slug}/files/</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Changes sync immediately with your Alpine WebVM workspace. Tracked via{' '}
            <code className="font-mono text-slate-700 dark:text-slate-300">
              du -sb /storage/tenants/{tenant.id}
            </code>
            .
          </p>
        </div>

        <div className="w-full md:w-72 space-y-1.5 shrink-0">
          <div className="flex items-center justify-between text-xs tabular-nums">
            <span className="font-medium text-slate-700 dark:text-slate-300">
              {tenant.plan} Plan ({usagePct}%)
            </span>
            <span className="font-mono text-slate-600 dark:text-slate-400">
              {formatBytes(storageUsed)} / {formatBytes(storageLimit, 0)}
            </span>
          </div>
          <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${
                usagePct > 85 ? 'bg-amber-500' : 'bg-sky-600 dark:bg-sky-500'
              }`}
              style={{ width: `${usagePct}%` }}
            />
          </div>
        </div>
      </div>

      {uploadError && (
        <div className="p-3.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300 flex items-center justify-between">
          <span>{uploadError}</span>
          <button type="button" onClick={() => setUploadError('')}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Directory Table */}
        <div className={`${selectedFile ? 'lg:col-span-7' : 'lg:col-span-12'} bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden`}>
          {/* Toolbar */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            {/* Breadcrumb Path */}
            <div className="flex items-center gap-1 text-xs font-mono">
              {pathSegments.map((seg, idx) => {
                const targetPath = '/' + pathSegments.slice(0, idx + 1).join('/');
                return (
                  <React.Fragment key={targetPath}>
                    {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                    <button
                      type="button"
                      onClick={() => {
                        setCwd(targetPath);
                        setSelectedFileId(null);
                      }}
                      className={`px-1.5 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 ${
                        idx === pathSegments.length - 1
                          ? 'font-semibold text-slate-900 dark:text-white'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      /{seg}
                    </button>
                  </React.Fragment>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filter files..."
                  className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 w-40"
                />
              </div>

              <button
                type="button"
                onClick={() => setNewItemModal('dir')}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 whitespace-nowrap"
              >
                <FolderPlus className="w-3.5 h-3.5" />
                <span>New Folder</span>
              </button>

              <button
                type="button"
                onClick={() => setNewItemModal('file')}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 whitespace-nowrap"
              >
                <FilePlus2 className="w-3.5 h-3.5" />
                <span>New File</span>
              </button>

              <input
                ref={uploadInputRef}
                type="file"
                multiple
                onChange={handleUploadChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => uploadInputRef.current?.click()}
                className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-xs font-medium text-white flex items-center gap-1.5 whitespace-nowrap transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload</span>
              </button>
            </div>
          </div>

          {/* Inline Create Form */}
          {newItemModal && (
            <form
              onSubmit={handleCreateSubmit}
              className="px-4 py-3 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2"
            >
              <input
                type="text"
                autoFocus
                required
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder={
                  newItemModal === 'dir' ? 'Directory name (e.g. builds)' : 'Filename (e.g. app.php)'
                }
                className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              <button
                type="submit"
                className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-xs font-medium text-white whitespace-nowrap"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => {
                  setNewItemModal(null);
                  setNewItemName('');
                }}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300"
              >
                Cancel
              </button>
            </form>
          )}

          {/* File Table */}
          {visibleEntries.length === 0 ? (
            <div className="p-10 text-center space-y-3">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                No files in {cwd}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Upload an asset, create a script, or generate files via your Alpine WebVM terminal.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    <th className="py-2.5 px-4">Name</th>
                    <th className="py-2.5 px-4">Permissions</th>
                    <th className="py-2.5 px-4 text-right">Size</th>
                    <th className="py-2.5 px-4 text-right">Modified</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
                  {visibleEntries.map((entry) => {
                    const isSelected = entry.id === selectedFileId;
                    return (
                      <tr
                        key={entry.id}
                        className={`transition-colors ${
                          isSelected
                            ? 'bg-sky-50/70 dark:bg-sky-950/30'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                        }`}
                      >
                        <td className="py-2.5 px-4">
                          <button
                            type="button"
                            onClick={() => handleOpenEntry(entry)}
                            className="flex items-center gap-2 font-mono font-medium text-slate-900 dark:text-slate-100 hover:text-sky-600 dark:hover:text-sky-400 text-left"
                          >
                            {entry.type === 'dir' ? (
                              <Folder className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
                            ) : (
                              <FileCode2 className="w-4 h-4 text-slate-400 shrink-0" />
                            )}
                            <span>{entry.name}{entry.type === 'dir' ? '/' : ''}</span>
                          </button>
                        </td>
                        <td className="py-2.5 px-4 font-mono text-slate-500 dark:text-slate-400">
                          {entry.permissions}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono text-slate-600 dark:text-slate-400 tabular-nums">
                          {entry.type === 'dir' ? '—' : formatBytes(entry.size)}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono text-slate-500 dark:text-slate-400 tabular-nums whitespace-nowrap">
                          {entry.updated_at}
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <div className="inline-flex items-center gap-1">
                            {entry.type === 'file' && (
                              <button
                                type="button"
                                onClick={() => handleDownload(entry)}
                                title="Download file"
                                aria-label={`Download ${entry.name}`}
                                className="p-1.5 rounded text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                if (selectedFileId === entry.id) setSelectedFileId(null);
                                onDeleteFile(entry.id);
                              }}
                              title="Delete"
                              aria-label={`Delete ${entry.name}`}
                              className="p-1.5 rounded text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right File Inspector & Editor */}
        {selectedFile && (
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="font-mono text-xs font-semibold text-slate-900 dark:text-white truncate">
                  {selectedFile.path}/{selectedFile.name}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                  {formatBytes(selectedFile.size)} · {selectedFile.permissions}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => onUpdateFileContent(selectedFile.id, editingContent)}
                  className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-xs font-medium text-white transition-colors"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedFileId(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  aria-label="Close inspector"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <textarea
              value={editingContent}
              onChange={(e) => setEditingContent(e.target.value)}
              spellCheck={false}
              className="w-full h-96 p-4 bg-slate-950 text-slate-100 font-mono text-xs leading-relaxed focus:outline-none resize-none terminal-scroll"
            />
          </div>
        )}
      </div>
    </div>
  );
};
