import React, { useState } from 'react';
import { useVault } from '../context/VaultContext';
import {
  User, HardDrive, Bell, Sun, Moon, CheckCircle,
  Trash2, Shield, Calendar, Edit2, X, Check, Download,
  AlertTriangle, Zap,
} from 'lucide-react';

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const daysUntil = (d: string) =>
  Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);

const REMINDER_TYPE_COLOR: Record<string, string> = {
  warranty: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  service: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  insurance: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  document: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
};

export default function Settings() {
  const {
    userProfile, assets, documents, reminders, activityLogs,
    darkMode, setDarkMode, toggleReminder, addReminder,
  } = useVault();

  const [showAddReminder, setShowAddReminder] = useState(false);
  const [remForm, setRemForm] = useState({ title: '', type: 'warranty' as any, date: '', assetId: '', assetName: '' });
  const [clearConfirm, setClearConfirm] = useState(false);

  const pendingReminders = reminders.filter(r => !r.completed);
  const completedReminders = reminders.filter(r => r.completed);

  const handleAddReminder = (e: React.FormEvent) => {
    e.preventDefault();
    const linkedAsset = assets.find(a => a.id === remForm.assetId);
    addReminder({
      title: remForm.title,
      type: remForm.type,
      date: remForm.date,
      assetId: remForm.assetId || undefined,
      assetName: linkedAsset?.name || remForm.assetName || undefined,
    });
    setShowAddReminder(false);
    setRemForm({ title: '', type: 'warranty', date: '', assetId: '', assetName: '' });
  };

  const handleExport = () => {
    const data = { assets, documents, reminders, activityLogs, userProfile, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `homevault-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="px-5 py-7 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-50">Profile & Settings</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Manage your vault preferences</p>
      </div>

      {/* Profile Card */}
      <div className="bg-white dark:bg-neutral-900/50 border border-gray-200/60 dark:border-neutral-800/60 rounded-2xl shadow-sm overflow-hidden mb-5">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-neutral-800/60 flex items-center gap-2">
          <User size={14} className="text-gray-500" />
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-50">Profile</h2>
        </div>
        <div className="p-5 flex items-center gap-4">
          <img
            src={userProfile.avatarUrl}
            alt={userProfile.name}
            className="w-16 h-16 rounded-2xl object-cover border-2 border-blue-500/20 flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-gray-900 dark:text-gray-50">{userProfile.name}</h3>
              <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-[10px] font-bold rounded-full tracking-wider">
                {userProfile.tier.toUpperCase()}
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{userProfile.email}</p>
            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-1.5">
                <Zap size={11} className="text-blue-500" />
                <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">Score: <strong className="text-gray-800 dark:text-gray-100">{userProfile.organizationScore}%</strong></span>
              </div>
              <span className="text-xs text-gray-400">·</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">{assets.length} assets · {documents.length} docs</span>
            </div>
          </div>
        </div>
      </div>

      {/* Storage */}
      <div className="bg-white dark:bg-neutral-900/50 border border-gray-200/60 dark:border-neutral-800/60 rounded-2xl shadow-sm overflow-hidden mb-5">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-neutral-800/60 flex items-center gap-2">
          <HardDrive size={14} className="text-gray-500" />
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-50">Storage</h2>
        </div>
        <div className="p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-700 dark:text-gray-200">{userProfile.storageUsed} used</span>
            <span className="text-sm text-gray-500 dark:text-gray-400">{userProfile.storageLimit}</span>
          </div>
          <div className="w-full h-2 bg-gray-100 dark:bg-neutral-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full" style={{ width: '42%' }} />
          </div>
          <p className="text-xs text-gray-400 font-mono mt-2">42% used · Unlimited plan</p>
        </div>
      </div>

      {/* Appearance */}
      <div className="bg-white dark:bg-neutral-900/50 border border-gray-200/60 dark:border-neutral-800/60 rounded-2xl shadow-sm overflow-hidden mb-5">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-neutral-800/60">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-50">Appearance</h2>
        </div>
        <div className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-100">Theme</p>
              <p className="text-xs text-gray-400 mt-0.5">{darkMode ? 'Dark mode active' : 'Light mode active'}</p>
            </div>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${darkMode ? 'bg-blue-600' : 'bg-gray-200 dark:bg-neutral-700'}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${darkMode ? 'translate-x-7' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Reminders */}
      <div className="bg-white dark:bg-neutral-900/50 border border-gray-200/60 dark:border-neutral-800/60 rounded-2xl shadow-sm overflow-hidden mb-5">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-neutral-800/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell size={14} className="text-gray-500" />
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-50">Reminders</h2>
            {pendingReminders.length > 0 && (
              <span className="px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[10px] font-bold rounded-full">{pendingReminders.length}</span>
            )}
          </div>
          <button
            onClick={() => setShowAddReminder(true)}
            className="flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
          >
            + Add
          </button>
        </div>

        <div className="divide-y divide-gray-50 dark:divide-neutral-800/60">
          {reminders.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-6">No reminders set</p>
          ) : (
            reminders
              .sort((a, b) => Number(a.completed) - Number(b.completed) || new Date(a.date).getTime() - new Date(b.date).getTime())
              .map(rem => {
                const days = daysUntil(rem.date);
                const urgent = !rem.completed && days <= 7;
                return (
                  <div
                    key={rem.id}
                    className={`px-5 py-3.5 flex items-center gap-3 transition-opacity ${rem.completed ? 'opacity-50' : ''}`}
                  >
                    <button
                      onClick={() => toggleReminder(rem.id)}
                      className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                        rem.completed
                          ? 'border-emerald-500 bg-emerald-500'
                          : urgent
                          ? 'border-red-400 hover:border-red-500'
                          : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
                      }`}
                    >
                      {rem.completed && <Check size={11} className="text-white" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${rem.completed ? 'line-through text-gray-400' : 'text-gray-800 dark:text-gray-100'}`}>
                        {rem.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-semibold ${REMINDER_TYPE_COLOR[rem.type]}`}>
                          {rem.type.toUpperCase()}
                        </span>
                        <span className="text-[10px] text-gray-400 font-mono flex items-center gap-1">
                          <Calendar size={9} /> {formatDate(rem.date)}
                        </span>
                        {rem.assetName && (
                          <span className="text-[10px] text-gray-400 truncate">· {rem.assetName}</span>
                        )}
                      </div>
                    </div>
                    {!rem.completed && (
                      <div className={`px-2 py-0.5 rounded-lg text-[10px] font-bold font-mono flex-shrink-0 ${
                        urgent
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          : days <= 30
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                          : 'bg-gray-100 text-gray-500 dark:bg-neutral-800 dark:text-gray-400'
                      }`}>
                        {days <= 0 ? 'PAST' : `${days}d`}
                      </div>
                    )}
                  </div>
                );
              })
          )}
        </div>
      </div>

      {/* Data management */}
      <div className="bg-white dark:bg-neutral-900/50 border border-gray-200/60 dark:border-neutral-800/60 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-neutral-800/60">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-50">Data Management</h2>
        </div>
        <div className="p-5 space-y-3">
          <button
            onClick={handleExport}
            className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-neutral-800/60 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-200 transition-colors"
          >
            <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center">
              <Download size={15} className="text-emerald-600" />
            </div>
            Export Vault Data (JSON)
          </button>
        </div>
      </div>

      {/* Add Reminder Modal */}
      {showAddReminder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowAddReminder(false)} />
          <div className="relative bg-white dark:bg-neutral-950 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-neutral-800">
              <h3 className="font-bold text-gray-900 dark:text-gray-50">Add Reminder</h3>
              <button onClick={() => setShowAddReminder(false)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-800">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleAddReminder} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Title *</label>
                <input required value={remForm.title} onChange={e => setRemForm(p => ({ ...p, title: e.target.value }))} placeholder="Warranty check for TV…" className="w-full px-3 py-2.5 text-sm bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-xl text-gray-800 dark:text-gray-200 outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/15" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Type</label>
                  <select value={remForm.type} onChange={e => setRemForm(p => ({ ...p, type: e.target.value }))} className="w-full px-3 py-2.5 text-sm bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-xl text-gray-800 dark:text-gray-200 outline-none focus:border-blue-500/50">
                    <option value="warranty">Warranty</option>
                    <option value="service">Service</option>
                    <option value="insurance">Insurance</option>
                    <option value="document">Document</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Date *</label>
                  <input required type="date" value={remForm.date} onChange={e => setRemForm(p => ({ ...p, date: e.target.value }))} className="w-full px-3 py-2.5 text-sm bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-xl text-gray-800 dark:text-gray-200 outline-none focus:border-blue-500/50" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Link to Asset (optional)</label>
                <select value={remForm.assetId} onChange={e => setRemForm(p => ({ ...p, assetId: e.target.value }))} className="w-full px-3 py-2.5 text-sm bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-xl text-gray-800 dark:text-gray-200 outline-none focus:border-blue-500/50">
                  <option value="">— Not linked —</option>
                  {assets.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowAddReminder(false)} className="flex-1 py-2.5 text-sm font-medium bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-200 rounded-xl">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl">Add Reminder</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
