import React, { useState, useMemo, useRef } from 'react';
import { useVault } from '../context/VaultContext';
import { Asset, CategoryType } from '../types';
import {
  Search, Plus, X, Package, Shield, MapPin, Tag,
  Edit2, Trash2, Cpu, Armchair, Wrench, FileText,
  Gem, Home, CheckCircle, AlertCircle, Scan, Upload,
  ChevronDown, Star, Calendar, DollarSign, Loader2,
} from 'lucide-react';

const formatINR = (val: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

const formatDate = (d: string) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const CATEGORIES: { id: CategoryType; label: string; icon: React.FC<any> }[] = [
  { id: 'electronics', label: 'Electronics', icon: Cpu },
  { id: 'furniture', label: 'Furniture', icon: Armchair },
  { id: 'appliances', label: 'Appliances', icon: Wrench },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'assets', label: 'Assets', icon: Gem },
  { id: 'household', label: 'Household', icon: Home },
];

const CAT_COLOR: Record<string, string> = {
  electronics: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  furniture: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  appliances: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
  documents: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  assets: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
  household: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
};

const EMPTY_FORM = {
  name: '', brand: '', modelNumber: '', serialNumber: '', description: '',
  category: 'electronics' as CategoryType,
  purchaseDate: '', purchasePrice: '' as any, depreciationRate: 15 as any,
  store: '', warrantyProvider: '', warrantyExpiry: '', warrantyActive: true,
  room: '', storageLocation: '', tags: '', imageUrl: '', notes: '',
  currentValue: 0, completionRate: 0,
};

type FormData = typeof EMPTY_FORM;

const assetToForm = (a: Asset): FormData => ({
  name: a.name, brand: a.brand, modelNumber: a.modelNumber || '',
  serialNumber: a.serialNumber || '', description: a.description || '',
  category: a.category, purchaseDate: a.purchaseDate,
  purchasePrice: a.purchasePrice, depreciationRate: a.depreciationRate ?? 15,
  store: a.store || '', warrantyProvider: a.warrantyProvider || '',
  warrantyExpiry: a.warrantyExpiry || '', warrantyActive: a.warrantyActive,
  room: a.room || '', storageLocation: a.storageLocation || '',
  tags: (a.tags || []).join(', '), imageUrl: a.imageUrl || '',
  notes: a.notes || '', currentValue: a.currentValue, completionRate: a.completionRate,
});

export default function Inventory() {
  const { assets, addAsset, updateAsset, deleteAsset, selectedAsset, setSelectedAsset, scanAssetWithGemini } = useVault();

  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState<CategoryType | 'all'>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [scanning, setScanning] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    let result = assets;
    if (filterCat !== 'all') result = result.filter(a => a.category === filterCat);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(a =>
        a.name.toLowerCase().includes(q) ||
        a.brand.toLowerCase().includes(q) ||
        a.room?.toLowerCase().includes(q) ||
        a.tags?.some(t => t.toLowerCase().includes(q))
      );
    }
    return result;
  }, [assets, filterCat, search]);

  const openAdd = () => { setForm(EMPTY_FORM); setEditingId(null); setShowModal(true); };
  const openEdit = (a: Asset) => { setForm(assetToForm(a)); setEditingId(a.id); setShowModal(true); setSelectedAsset(null); };
  const closeModal = () => { setShowModal(false); setEditingId(null); };

  const setField = (k: keyof FormData, v: any) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      purchasePrice: Number(form.purchasePrice) || 0,
      depreciationRate: Number(form.depreciationRate) || 15,
      tags: form.tags.split(',').map((t: string) => t.trim()).filter(Boolean),
    };
    if (editingId) {
      updateAsset(editingId, payload);
    } else {
      addAsset(payload);
    }
    closeModal();
  };

  const handleScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScanning(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        const result = await scanAssetWithGemini(base64, 'invoice');
        if (result) {
          setForm(prev => ({
            ...prev,
            name: result.name || prev.name,
            brand: result.brand || prev.brand,
            modelNumber: result.modelNumber || prev.modelNumber,
            serialNumber: result.serialNumber || prev.serialNumber,
            purchaseDate: result.purchaseDate || prev.purchaseDate,
            purchasePrice: result.purchasePrice || prev.purchasePrice,
            store: result.store || prev.store,
            warrantyProvider: result.warrantyProvider || prev.warrantyProvider,
            warrantyExpiry: result.warrantyExpiry || prev.warrantyExpiry,
          }));
        }
      };
      reader.readAsDataURL(file);
    } catch {
      // silent
    } finally {
      setScanning(false);
    }
  };

  const handleDelete = (id: string) => {
    deleteAsset(id);
    setDeleteConfirm(null);
    if (selectedAsset?.id === id) setSelectedAsset(null);
  };

  return (
    <div className="px-5 py-7 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-50">Inventory Vault</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{assets.length} registered assets</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-lg shadow-blue-600/20"
        >
          <Plus size={16} />
          Add Asset
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search assets, brands, rooms…"
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white dark:bg-neutral-900/50 border border-gray-200/60 dark:border-neutral-800/60 rounded-xl text-gray-800 dark:text-gray-200 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilterCat('all')}
            className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${filterCat === 'all' ? 'bg-blue-600 text-white shadow-sm' : 'bg-white dark:bg-neutral-900/50 border border-gray-200/60 dark:border-neutral-800/60 text-gray-600 dark:text-gray-300 hover:border-blue-400/40'}`}
          >
            All
          </button>
          {CATEGORIES.map(cat => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => setFilterCat(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${filterCat === cat.id ? 'bg-blue-600 text-white shadow-sm' : 'bg-white dark:bg-neutral-900/50 border border-gray-200/60 dark:border-neutral-800/60 text-gray-600 dark:text-gray-300 hover:border-blue-400/40'}`}
              >
                <Icon size={12} />
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Package size={40} className="text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">No assets found</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Try adjusting filters or add a new asset</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(asset => {
            const CatIcon = CATEGORIES.find(c => c.id === asset.category)?.icon ?? Package;
            const depPct = Math.round(((asset.purchasePrice - asset.currentValue) / asset.purchasePrice) * 100);
            return (
              <div
                key={asset.id}
                onClick={() => setSelectedAsset(asset)}
                className="group bg-white dark:bg-neutral-900/50 border border-gray-200/60 dark:border-neutral-800/60 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
              >
                {/* Image */}
                <div className="h-36 bg-gray-100 dark:bg-neutral-800 relative overflow-hidden">
                  {asset.imageUrl ? (
                    <img src={asset.imageUrl} alt={asset.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <CatIcon size={32} className="text-gray-300 dark:text-gray-600" />
                    </div>
                  )}
                  <div className="absolute top-2.5 left-2.5">
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-semibold ${CAT_COLOR[asset.category]}`}>
                      {asset.category}
                    </span>
                  </div>
                  {asset.warrantyActive && (
                    <div className="absolute top-2.5 right-2.5">
                      <div className="w-6 h-6 bg-emerald-500/20 rounded-full flex items-center justify-center">
                        <Shield size={11} className="text-emerald-600 dark:text-emerald-400" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-3.5">
                  <p className="text-xs text-gray-400 dark:text-gray-500 font-mono truncate">{asset.brand}</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-50 mt-0.5 line-clamp-1">{asset.name}</p>
                  <p className="text-base font-bold text-blue-600 dark:text-blue-400 mt-2 tabular-nums">
                    {formatINR(asset.currentValue)}
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] text-gray-400 font-mono">
                      ↓ {depPct}% from {formatINR(asset.purchasePrice)}
                    </span>
                  </div>

                  {/* Completion bar */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[9px] text-gray-400 font-mono">COMPLETION</span>
                      <span className="text-[9px] font-bold font-mono text-gray-500 dark:text-gray-400">{asset.completionRate}%</span>
                    </div>
                    <div className="w-full h-1 bg-gray-100 dark:bg-neutral-800 rounded-full">
                      <div
                        className="h-full rounded-full transition-all bg-blue-500"
                        style={{ width: `${asset.completionRate}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 mt-2.5">
                    <MapPin size={10} className="text-gray-400 flex-shrink-0" />
                    <span className="text-[10px] text-gray-400 truncate">{asset.room}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Panel */}
      {selectedAsset && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedAsset(null)} />
          <div className="w-full max-w-md bg-white dark:bg-neutral-950 overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white dark:bg-neutral-950 border-b border-gray-100 dark:border-neutral-800 px-5 py-4 flex items-center justify-between z-10">
              <h3 className="font-semibold text-gray-900 dark:text-gray-50 text-sm">Asset Details</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEdit(selectedAsset)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors"
                >
                  <Edit2 size={12} /> Edit
                </button>
                <button
                  onClick={() => setDeleteConfirm(selectedAsset.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                >
                  <Trash2 size={12} /> Delete
                </button>
                <button onClick={() => setSelectedAsset(null)} className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-neutral-800">
                  <X size={16} />
                </button>
              </div>
            </div>

            {selectedAsset.imageUrl && (
              <div className="h-52 overflow-hidden">
                <img src={selectedAsset.imageUrl} alt={selectedAsset.name} className="w-full h-full object-cover" />
              </div>
            )}

            <div className="p-5 space-y-5">
              <div>
                <span className={`inline-block px-2 py-0.5 rounded-lg text-[10px] font-semibold mb-2 ${CAT_COLOR[selectedAsset.category]}`}>
                  {selectedAsset.category}
                </span>
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-50">{selectedAsset.name}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{selectedAsset.brand} · {selectedAsset.modelNumber}</p>
                {selectedAsset.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 leading-relaxed">{selectedAsset.description}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Purchase Price', value: formatINR(selectedAsset.purchasePrice) },
                  { label: 'Current Value', value: formatINR(selectedAsset.currentValue) },
                  { label: 'Purchased', value: formatDate(selectedAsset.purchaseDate) },
                  { label: 'Store', value: selectedAsset.store || '—' },
                  { label: 'Serial No.', value: selectedAsset.serialNumber || '—' },
                  { label: 'Depreciation', value: `${selectedAsset.depreciationRate ?? 15}% / yr` },
                ].map(item => (
                  <div key={item.label} className="bg-gray-50 dark:bg-neutral-900 rounded-xl p-3">
                    <p className="text-[10px] text-gray-400 font-mono uppercase tracking-wider">{item.label}</p>
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 mt-0.5 truncate">{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="bg-gray-50 dark:bg-neutral-900 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Shield size={14} className={selectedAsset.warrantyActive ? 'text-emerald-500' : 'text-gray-400'} />
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">Warranty</p>
                  <span className={`ml-auto px-2 py-0.5 rounded-full text-[9px] font-bold ${
                    selectedAsset.warrantyActive
                      ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                      : 'bg-gray-200 text-gray-500 dark:bg-neutral-700 dark:text-gray-400'
                  }`}>
                    {selectedAsset.warrantyActive ? 'ACTIVE' : 'EXPIRED'}
                  </span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-200">{selectedAsset.warrantyProvider || '—'}</p>
                <p className="text-xs text-gray-400 font-mono mt-0.5">Until {formatDate(selectedAsset.warrantyExpiry)}</p>
              </div>

              <div className="bg-gray-50 dark:bg-neutral-900 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin size={14} className="text-gray-400" />
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">Location</p>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-200">{selectedAsset.room}</p>
                <p className="text-xs text-gray-400 mt-0.5">{selectedAsset.storageLocation}</p>
              </div>

              {selectedAsset.tags && selectedAsset.tags.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Tag size={13} className="text-gray-400" />
                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-300">Tags</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedAsset.tags.map(t => (
                      <span key={t} className="px-2.5 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs rounded-lg font-mono">{t}</span>
                    ))}
                  </div>
                </div>
              )}

              {selectedAsset.notes && (
                <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200/40 dark:border-amber-800/30 rounded-xl p-4">
                  <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1">Notes</p>
                  <p className="text-sm text-amber-800 dark:text-amber-200/80 leading-relaxed">{selectedAsset.notes}</p>
                </div>
              )}

              <div className="flex items-center justify-between p-3.5 bg-gray-50 dark:bg-neutral-900 rounded-xl">
                <div>
                  <p className="text-[10px] text-gray-400 font-mono">PROFILE COMPLETION</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-gray-50 mt-0.5">{selectedAsset.completionRate}%</p>
                </div>
                <div className="w-24 h-2 bg-gray-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${selectedAsset.completionRate}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-white dark:bg-neutral-900 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
                <Trash2 size={18} className="text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-50">Delete Asset?</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">This action cannot be undone.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 text-sm font-medium bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-200 rounded-xl hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors">
                Cancel
              </button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 py-2.5 text-sm font-semibold bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center px-4 py-8 overflow-y-auto">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-white dark:bg-neutral-950 rounded-2xl w-full max-w-2xl shadow-2xl">
            <div className="sticky top-0 bg-white dark:bg-neutral-950 border-b border-gray-100 dark:border-neutral-800 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <h2 className="font-bold text-gray-900 dark:text-gray-50">{editingId ? 'Edit Asset' : 'Add New Asset'}</h2>
              <div className="flex items-center gap-2">
                {!editingId && (
                  <>
                    <input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleScan} />
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      disabled={scanning}
                      className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 border border-violet-200/50 dark:border-violet-800/40 rounded-xl hover:bg-violet-100 transition-colors disabled:opacity-50"
                    >
                      {scanning ? <Loader2 size={12} className="animate-spin" /> : <Scan size={12} />}
                      {scanning ? 'Scanning…' : 'Scan Receipt'}
                    </button>
                  </>
                )}
                <button onClick={closeModal} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors">
                  <X size={18} />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <section>
                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Basic Info</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Asset Name *</label>
                    <input required value={form.name} onChange={e => setField('name', e.target.value)} placeholder='e.g. MacBook Pro 16"' className="form-input w-full" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Brand *</label>
                    <input required value={form.brand} onChange={e => setField('brand', e.target.value)} placeholder="Apple, Sony, IKEA…" className="form-input w-full" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Category *</label>
                    <select required value={form.category} onChange={e => setField('category', e.target.value as CategoryType)} className="form-input w-full">
                      {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Model Number</label>
                    <input value={form.modelNumber} onChange={e => setField('modelNumber', e.target.value)} placeholder="A3184" className="form-input w-full" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Serial Number</label>
                    <input value={form.serialNumber} onChange={e => setField('serialNumber', e.target.value)} placeholder="SN-XXXXXXXX" className="form-input w-full" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
                    <textarea value={form.description} onChange={e => setField('description', e.target.value)} rows={2} placeholder="Brief description of the asset…" className="form-input w-full resize-none" />
                  </div>
                </div>
              </section>

              <section>
                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Purchase Details</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Purchase Date *</label>
                    <input required type="date" value={form.purchaseDate} onChange={e => setField('purchaseDate', e.target.value)} className="form-input w-full" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Purchase Price (₹) *</label>
                    <input required type="number" min="0" value={form.purchasePrice} onChange={e => setField('purchasePrice', e.target.value)} placeholder="230000" className="form-input w-full" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Store / Retailer</label>
                    <input value={form.store} onChange={e => setField('store', e.target.value)} placeholder="Apple Store, BKC" className="form-input w-full" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Depreciation Rate (% / yr)</label>
                    <input type="number" min="0" max="100" value={form.depreciationRate} onChange={e => setField('depreciationRate', e.target.value)} className="form-input w-full" />
                  </div>
                </div>
              </section>

              <section>
                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Warranty</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Warranty Provider</label>
                    <input value={form.warrantyProvider} onChange={e => setField('warrantyProvider', e.target.value)} placeholder="AppleCare+, Sony Care…" className="form-input w-full" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Warranty Expiry</label>
                    <input type="date" value={form.warrantyExpiry} onChange={e => setField('warrantyExpiry', e.target.value)} className="form-input w-full" />
                  </div>
                  <div className="flex items-center gap-2.5 sm:col-span-2">
                    <input type="checkbox" id="warrantyActive" checked={form.warrantyActive} onChange={e => setField('warrantyActive', e.target.checked)} className="w-4 h-4 rounded text-blue-600" />
                    <label htmlFor="warrantyActive" className="text-sm text-gray-700 dark:text-gray-200 cursor-pointer">Warranty currently active</label>
                  </div>
                </div>
              </section>

              <section>
                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Location</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Room *</label>
                    <input required value={form.room} onChange={e => setField('room', e.target.value)} placeholder="Living Room, Kitchen…" className="form-input w-full" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Storage Location</label>
                    <input value={form.storageLocation} onChange={e => setField('storageLocation', e.target.value)} placeholder="Main Desk, Shelf 2…" className="form-input w-full" />
                  </div>
                </div>
              </section>

              <section>
                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Extras</p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Tags (comma-separated)</label>
                    <input value={form.tags} onChange={e => setField('tags', e.target.value)} placeholder="#Electronics, #Apple, #HighValue" className="form-input w-full" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Image URL</label>
                    <input type="url" value={form.imageUrl} onChange={e => setField('imageUrl', e.target.value)} placeholder="https://…" className="form-input w-full" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Notes</label>
                    <textarea value={form.notes} onChange={e => setField('notes', e.target.value)} rows={2} placeholder="Any additional notes…" className="form-input w-full resize-none" />
                  </div>
                </div>
              </section>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeModal} className="flex-1 py-2.5 text-sm font-medium bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-200 rounded-xl hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors">
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-2.5 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors shadow-lg shadow-blue-600/20">
                  {editingId ? 'Save Changes' : 'Add Asset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .form-input {
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          background: rgb(249 250 251);
          border: 1px solid rgb(229 231 235 / 0.8);
          border-radius: 0.625rem;
          color: rgb(17 24 39);
          outline: none;
          transition: all 0.15s;
        }
        .form-input:focus {
          border-color: rgb(59 130 246 / 0.5);
          box-shadow: 0 0 0 3px rgb(59 130 246 / 0.15);
          background: white;
        }
        .dark .form-input {
          background: rgb(23 23 23);
          border-color: rgb(38 38 38);
          color: rgb(245 245 245);
        }
        .dark .form-input:focus {
          border-color: rgb(59 130 246 / 0.5);
          background: rgb(10 10 10);
        }
      `}</style>
    </div>
  );
}
