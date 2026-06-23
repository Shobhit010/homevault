import React, { useState, useMemo, useRef } from 'react';
import { useVault } from '../context/VaultContext';
import { Document } from '../types';
import {
  Search, Upload, X, FileText, FileBadge, FileCheck,
  FileImage, FileBox, Shield, Tag, Trash2, Eye,
  Loader2, Scan, Download, Calendar,
} from 'lucide-react';

const DOC_TYPE_CONFIG: Record<Document['type'], { label: string; icon: React.FC<any>; color: string }> = {
  invoice: { label: 'Invoice', icon: FileText, color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
  receipt: { label: 'Receipt', icon: FileBadge, color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
  warranty: { label: 'Warranty', icon: Shield, color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
  manual: { label: 'Manual', icon: FileBox, color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400' },
  certificate: { label: 'Certificate', icon: FileCheck, color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400' },
  insurance: { label: 'Insurance', icon: FileImage, color: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400' },
};

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const EMPTY_UPLOAD = {
  name: '',
  type: 'invoice' as Document['type'],
  fileSize: '0 KB',
  fileUrl: '#',
  tags: '',
  assetId: '',
  ocrContent: '',
};

export default function Documents() {
  const { documents, assets, addDocument, deleteDocument, runDocumentOcr } = useVault();

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<Document['type'] | 'all'>('all');
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [form, setForm] = useState(EMPTY_UPLOAD);
  const [uploading, setUploading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    let docs = documents;
    if (filterType !== 'all') docs = docs.filter(d => d.type === filterType);
    if (search.trim()) {
      const q = search.toLowerCase();
      docs = docs.filter(d =>
        d.name.toLowerCase().includes(q) ||
        d.tags.some(t => t.toLowerCase().includes(q)) ||
        d.ocrContent?.toLowerCase().includes(q)
      );
    }
    return docs;
  }, [documents, filterType, search]);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const sizeKB = Math.round(file.size / 1024);
    const sizeStr = sizeKB > 1024 ? `${(sizeKB / 1024).toFixed(1)} MB` : `${sizeKB} KB`;
    const guessType = (): Document['type'] => {
      const n = file.name.toLowerCase();
      if (n.includes('warranty')) return 'warranty';
      if (n.includes('invoice')) return 'invoice';
      if (n.includes('receipt') || n.includes('bill')) return 'receipt';
      if (n.includes('manual') || n.includes('guide')) return 'manual';
      if (n.includes('insurance')) return 'insurance';
      if (n.includes('certificate') || n.includes('deed') || n.includes('registration')) return 'certificate';
      return 'invoice';
    };
    setForm(prev => ({ ...prev, name: file.name, fileSize: sizeStr, type: guessType() }));

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        const mimeType = file.type || 'application/octet-stream';
        try {
          const result = await runDocumentOcr(base64, file.name, mimeType);
          if (result?.text) setForm(prev => ({ ...prev, ocrContent: result.text }));
        } catch { /* silent */ }
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      setUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addDocument({
      name: form.name || 'Untitled Document',
      type: form.type,
      fileSize: form.fileSize,
      fileUrl: form.fileUrl,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      assetId: form.assetId || undefined,
      ocrContent: form.ocrContent || undefined,
    });
    setShowUpload(false);
    setForm(EMPTY_UPLOAD);
  };

  const typeStats = Object.entries(DOC_TYPE_CONFIG).map(([type, cfg]) => ({
    type: type as Document['type'],
    count: documents.filter(d => d.type === type).length,
    ...cfg,
  }));

  return (
    <div className="px-5 py-7 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-50">Document Vault</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{documents.length} documents secured</p>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-lg shadow-blue-600/20"
        >
          <Upload size={15} />
          Upload Doc
        </button>
      </div>

      {/* Type breakdown */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5 mb-6">
        {typeStats.map(stat => {
          const Icon = stat.icon;
          return (
            <button
              key={stat.type}
              onClick={() => setFilterType(filterType === stat.type ? 'all' : stat.type)}
              className={`p-3 rounded-xl border text-center transition-all ${
                filterType === stat.type
                  ? 'border-blue-500/50 bg-blue-50 dark:bg-blue-900/20 shadow-sm'
                  : 'border-gray-200/60 dark:border-neutral-800/60 bg-white dark:bg-neutral-900/50 hover:border-blue-400/30'
              }`}
            >
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center mx-auto mb-1.5 ${stat.color}`}>
                <Icon size={14} />
              </div>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-50 leading-none">{stat.count}</p>
              <p className="text-[9px] text-gray-400 mt-0.5 font-mono">{stat.label.toUpperCase()}</p>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search documents, tags, OCR content…"
          className="w-full pl-9 pr-4 py-2.5 text-sm bg-white dark:bg-neutral-900/50 border border-gray-200/60 dark:border-neutral-800/60 rounded-xl text-gray-800 dark:text-gray-200 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50"
        />
        {filterType !== 'all' && (
          <button
            onClick={() => setFilterType('all')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
          >
            <X size={12} /> Clear filter
          </button>
        )}
      </div>

      {/* Document list */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <FileText size={40} className="text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">No documents found</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map(doc => {
            const cfg = DOC_TYPE_CONFIG[doc.type];
            const Icon = cfg.icon;
            const linkedAsset = doc.assetId ? assets.find(a => a.id === doc.assetId) : null;
            return (
              <div
                key={doc.id}
                className="group flex items-center gap-4 p-4 bg-white dark:bg-neutral-900/50 border border-gray-200/60 dark:border-neutral-800/60 rounded-xl hover:shadow-sm hover:border-blue-200/40 dark:hover:border-blue-800/30 transition-all cursor-pointer"
                onClick={() => setSelectedDoc(doc)}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.color}`}>
                  <Icon size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{doc.name}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-[10px] text-gray-400 font-mono">{doc.fileSize}</span>
                    <span className="text-[10px] text-gray-400 font-mono flex items-center gap-1">
                      <Calendar size={9} />
                      {formatDate(doc.uploadDate)}
                    </span>
                    {linkedAsset && (
                      <span className="text-[10px] text-blue-500 dark:text-blue-400 font-mono truncate">
                        → {linkedAsset.name}
                      </span>
                    )}
                  </div>
                  {doc.tags.length > 0 && (
                    <div className="flex gap-1 mt-1.5 flex-wrap">
                      {doc.tags.slice(0, 4).map(t => (
                        <span key={t} className="px-1.5 py-0.5 bg-gray-100 dark:bg-neutral-800 text-gray-500 dark:text-gray-400 text-[9px] rounded-md font-mono">{t}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={e => { e.stopPropagation(); setSelectedDoc(doc); }}
                    className="p-2 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                  >
                    <Eye size={15} />
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); setDeleteConfirm(doc.id); }}
                    className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Document Detail */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedDoc(null)} />
          <div className="relative bg-white dark:bg-neutral-950 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-neutral-800">
              <div className="flex items-center gap-3">
                {(() => {
                  const cfg = DOC_TYPE_CONFIG[selectedDoc.type];
                  const Icon = cfg.icon;
                  return (
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${cfg.color}`}>
                      <Icon size={15} />
                    </div>
                  );
                })()}
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-50 text-sm">{selectedDoc.name}</h3>
                  <p className="text-[10px] text-gray-400 font-mono">{selectedDoc.type} · {selectedDoc.fileSize}</p>
                </div>
              </div>
              <button onClick={() => setSelectedDoc(null)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-800">
                <X size={16} />
              </button>
            </div>
            <div className="overflow-y-auto p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 dark:bg-neutral-900 rounded-xl p-3">
                  <p className="text-[10px] text-gray-400 font-mono uppercase">Upload Date</p>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 mt-0.5">{formatDate(selectedDoc.uploadDate)}</p>
                </div>
                <div className="bg-gray-50 dark:bg-neutral-900 rounded-xl p-3">
                  <p className="text-[10px] text-gray-400 font-mono uppercase">File Size</p>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 mt-0.5">{selectedDoc.fileSize}</p>
                </div>
              </div>

              {selectedDoc.assetId && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200/40 dark:border-blue-800/30 rounded-xl p-3">
                  <p className="text-[10px] text-blue-500 font-mono uppercase mb-1">Linked Asset</p>
                  <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                    {assets.find(a => a.id === selectedDoc.assetId)?.name ?? 'Unknown Asset'}
                  </p>
                </div>
              )}

              {selectedDoc.tags.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-2 flex items-center gap-1.5">
                    <Tag size={12} /> Tags
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedDoc.tags.map(t => (
                      <span key={t} className="px-2.5 py-1 bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-300 text-xs rounded-lg font-mono">{t}</span>
                    ))}
                  </div>
                </div>
              )}

              {selectedDoc.ocrContent && (
                <div>
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-2 flex items-center gap-1.5">
                    <Scan size={12} /> OCR Content
                  </p>
                  <div className="bg-gray-50 dark:bg-neutral-900 rounded-xl p-3.5 border border-gray-100 dark:border-neutral-800">
                    <p className="text-xs text-gray-600 dark:text-gray-300 font-mono leading-relaxed whitespace-pre-wrap">{selectedDoc.ocrContent}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-white dark:bg-neutral-900 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="font-semibold text-gray-900 dark:text-gray-50 mb-1">Delete Document?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 text-sm font-medium bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-200 rounded-xl">
                Cancel
              </button>
              <button onClick={() => { deleteDocument(deleteConfirm); setDeleteConfirm(null); setSelectedDoc(null); }} className="flex-1 py-2.5 text-sm font-semibold bg-red-600 text-white rounded-xl">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowUpload(false)} />
          <div className="relative bg-white dark:bg-neutral-950 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-neutral-800">
              <h2 className="font-bold text-gray-900 dark:text-gray-50">Upload Document</h2>
              <button onClick={() => setShowUpload(false)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-800">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {/* File picker */}
              <div
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-gray-200 dark:border-neutral-700 rounded-xl p-6 text-center cursor-pointer hover:border-blue-400/60 transition-colors"
              >
                <input ref={fileRef} type="file" className="hidden" onChange={handleFile} />
                {uploading ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 size={24} className="text-blue-500 animate-spin" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">Extracting OCR content…</p>
                  </div>
                ) : form.name ? (
                  <div className="flex flex-col items-center gap-2">
                    <FileCheck size={24} className="text-emerald-500" />
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{form.name}</p>
                    <p className="text-xs text-gray-400">{form.fileSize}</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload size={24} className="text-gray-400" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">Click to select a file</p>
                    <p className="text-xs text-gray-400">PDF, JPG, PNG supported</p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Document Name</label>
                <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Invoice.pdf" className="w-full px-3 py-2.5 text-sm bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-xl text-gray-800 dark:text-gray-200 outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/15" />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Type</label>
                <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value as Document['type'] }))} className="w-full px-3 py-2.5 text-sm bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-xl text-gray-800 dark:text-gray-200 outline-none focus:border-blue-500/50">
                  {Object.entries(DOC_TYPE_CONFIG).map(([t, c]) => (
                    <option key={t} value={t}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Link to Asset (optional)</label>
                <select value={form.assetId} onChange={e => setForm(p => ({ ...p, assetId: e.target.value }))} className="w-full px-3 py-2.5 text-sm bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-xl text-gray-800 dark:text-gray-200 outline-none focus:border-blue-500/50">
                  <option value="">— Not linked —</option>
                  {assets.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Tags (comma-separated)</label>
                <input value={form.tags} onChange={e => setForm(p => ({ ...p, tags: e.target.value }))} placeholder="#Electronics, #Warranty" className="w-full px-3 py-2.5 text-sm bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-xl text-gray-800 dark:text-gray-200 outline-none focus:border-blue-500/50" />
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowUpload(false)} className="flex-1 py-2.5 text-sm font-medium bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-200 rounded-xl hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={uploading} className="flex-1 py-2.5 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors shadow-lg shadow-blue-600/20 disabled:opacity-60">
                  Save Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
