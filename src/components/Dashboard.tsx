import React from 'react';
import { useVault } from '../context/VaultContext';
import {
  Package, FileText, Bell, TrendingUp, Plus, Upload,
  Sparkles, ChevronRight, Clock, CheckCircle, AlertCircle,
  Info, Zap, RefreshCw, Activity, Tv, Scan, Edit3, Trash2,
} from 'lucide-react';

const formatINR = (val: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const daysUntil = (dateStr: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((new Date(dateStr).getTime() - today.getTime()) / 86400000);
};

const activityIconMap: Record<string, React.ReactNode> = {
  Tv: <Tv size={14} />, Scan: <Scan size={14} />,
  CheckSquare: <CheckCircle size={14} />, FileText: <FileText size={14} />,
  Plus: <Plus size={14} />, Edit3: <Edit3 size={14} />, Trash2: <Trash2 size={14} />,
};

const insightIconMap: Record<string, React.ReactNode> = {
  info: <Info size={14} className="text-blue-500" />,
  warning: <AlertCircle size={14} className="text-amber-500" />,
  success: <CheckCircle size={14} className="text-emerald-500" />,
  danger: <AlertCircle size={14} className="text-red-500" />,
};

export default function Dashboard() {
  const {
    assets, documents, reminders, activityLogs, userProfile,
    insights, insightsLoading, setActiveTab, triggerAIInsights,
  } = useVault();

  const totalValue = assets.reduce((s, a) => s + a.currentValue, 0);
  const totalOriginal = assets.reduce((s, a) => s + a.purchasePrice, 0);
  const activeWarranties = assets.filter(a => a.warrantyActive).length;
  const pendingReminders = reminders.filter(r => !r.completed);
  const upcomingReminders = [...pendingReminders]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 4);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const stats = [
    {
      label: 'Total Assets',
      value: String(assets.length),
      sub: `${activeWarranties} under warranty`,
      icon: Package,
      colorClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    },
    {
      label: 'Portfolio Value',
      value: formatINR(totalValue),
      sub: totalValue < totalOriginal
        ? `↓ ${formatINR(totalOriginal - totalValue)} depreciated`
        : '↑ Appreciated asset',
      icon: TrendingUp,
      colorClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    },
    {
      label: 'Documents',
      value: String(documents.length),
      sub: `${documents.filter(d => d.assetId).length} linked to assets`,
      icon: FileText,
      colorClass: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    },
    {
      label: 'Pending Reminders',
      value: String(pendingReminders.length),
      sub: upcomingReminders[0] ? `Next: ${formatDate(upcomingReminders[0].date)}` : 'All clear',
      icon: Bell,
      colorClass: pendingReminders.length > 0
        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
        : 'bg-gray-100 dark:bg-neutral-800 text-gray-500',
    },
  ];

  return (
    <div className="px-5 py-7 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-7">
        <div>
          <p className="text-xs text-gray-400 dark:text-gray-500 font-mono tracking-wide">{greeting},</p>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50 mt-0.5">
            {userProfile.name.split(' ')[0]}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Vault organized at{' '}
            <span className="font-semibold text-blue-600 dark:text-blue-400">{userProfile.organizationScore}%</span>
          </p>
        </div>
        <button
          onClick={() => setActiveTab('inventory')}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-lg shadow-blue-600/20"
        >
          <Plus size={16} />
          Add Asset
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-7">
        {stats.map(stat => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="p-4 bg-white dark:bg-neutral-900/50 border border-gray-200/60 dark:border-neutral-800/60 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200"
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${stat.colorClass}`}>
                <Icon size={18} />
              </div>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-50 tabular-nums leading-tight">{stat.value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">{stat.label}</p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 font-mono truncate">{stat.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Main grid */}
      <div className="grid lg:grid-cols-3 gap-5">
        {/* Left col */}
        <div className="lg:col-span-2 space-y-5">
          {/* AI Insights */}
          <div className="bg-white dark:bg-neutral-900/50 border border-gray-200/60 dark:border-neutral-800/60 rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-neutral-800/60">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center">
                  <Sparkles size={13} className="text-white" />
                </div>
                <h2 className="font-semibold text-gray-900 dark:text-gray-50 text-sm">AI Insights</h2>
                <span className="px-1.5 py-0.5 bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 text-[9px] font-mono rounded-md tracking-wider">
                  GEMINI
                </span>
              </div>
              <button
                onClick={triggerAIInsights}
                disabled={insightsLoading}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-blue-500 transition-colors disabled:opacity-40"
              >
                <RefreshCw size={12} className={insightsLoading ? 'animate-spin' : ''} />
                {insightsLoading ? 'Generating…' : 'Refresh'}
              </button>
            </div>
            <div className="p-5">
              {insightsLoading ? (
                <div className="space-y-3">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="h-14 bg-gray-100 dark:bg-neutral-800 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : insights.length === 0 ? (
                <div className="text-center py-8">
                  <Sparkles size={28} className="text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">No insights yet</p>
                  <button onClick={triggerAIInsights} className="mt-3 text-xs text-blue-600 hover:underline">
                    Generate insights
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {insights.map(insight => (
                    <div
                      key={insight.id}
                      className="flex items-start gap-3 p-3.5 rounded-xl bg-gray-50 dark:bg-neutral-800/60 border border-gray-100 dark:border-neutral-800/40"
                    >
                      <div className="mt-0.5 flex-shrink-0">{insightIconMap[insight.type]}</div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{insight.title}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{insight.description}</p>
                        {insight.cta && (
                          <span className="text-xs text-blue-600 dark:text-blue-400 mt-1.5 inline-block font-medium cursor-pointer hover:underline">
                            {insight.cta} →
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white dark:bg-neutral-900/50 border border-gray-200/60 dark:border-neutral-800/60 rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-neutral-800/60">
              <h2 className="font-semibold text-gray-900 dark:text-gray-50 text-sm">Recent Activity</h2>
              <Clock size={14} className="text-gray-400" />
            </div>
            <div className="divide-y divide-gray-50 dark:divide-neutral-800/60">
              {activityLogs.slice(0, 5).map(log => (
                <div
                  key={log.id}
                  className="px-5 py-3 flex items-center gap-3 hover:bg-gray-50/50 dark:hover:bg-neutral-800/30 transition-colors"
                >
                  <div className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-neutral-800 flex items-center justify-center flex-shrink-0 text-blue-500">
                    {activityIconMap[log.icon] ?? <Activity size={14} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{log.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{log.description}</p>
                  </div>
                  <span className="text-[10px] text-gray-400 font-mono flex-shrink-0">{log.timestamp}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right col */}
        <div className="space-y-5">
          {/* Org Score card */}
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-5 text-white shadow-lg shadow-blue-600/25">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-blue-100">Organization Score</p>
              <Zap size={16} className="text-blue-200" />
            </div>
            <p className="text-5xl font-bold">{userProfile.organizationScore}</p>
            <p className="text-sm text-blue-200 mb-4">out of 100</p>
            <div className="w-full h-1.5 bg-blue-500/40 rounded-full">
              <div
                className="h-full bg-white rounded-full transition-all duration-700"
                style={{ width: `${userProfile.organizationScore}%` }}
              />
            </div>
            <p className="text-xs text-blue-200 mt-3 leading-relaxed">
              {userProfile.organizationScore >= 90
                ? 'Excellent! Vault fully organized.'
                : userProfile.organizationScore >= 70
                ? 'Fill in more asset details to improve.'
                : 'Complete asset profiles to improve score.'}
            </p>
          </div>

          {/* Upcoming Reminders */}
          <div className="bg-white dark:bg-neutral-900/50 border border-gray-200/60 dark:border-neutral-800/60 rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-neutral-800/60">
              <h2 className="font-semibold text-gray-900 dark:text-gray-50 text-sm">Upcoming</h2>
              <button
                onClick={() => setActiveTab('settings')}
                className="text-xs text-gray-400 hover:text-blue-500 transition-colors"
              >
                View all
              </button>
            </div>
            <div className="p-4 space-y-2.5">
              {upcomingReminders.length === 0 ? (
                <p className="text-center text-sm text-gray-400 py-4">No pending reminders</p>
              ) : (
                upcomingReminders.map(rem => {
                  const days = daysUntil(rem.date);
                  const urgent = days <= 7;
                  return (
                    <div key={rem.id} className="flex items-start gap-2.5 p-3 rounded-xl bg-gray-50 dark:bg-neutral-800/60">
                      <div className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold flex-shrink-0 ${
                        urgent
                          ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                          : 'bg-gray-200 text-gray-600 dark:bg-neutral-700 dark:text-gray-300'
                      }`}>
                        {days <= 0 ? 'TODAY' : `${days}d`}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-gray-800 dark:text-gray-100 leading-snug">{rem.title}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5 font-mono">{formatDate(rem.date)}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-2">
            {[
              { label: 'Add New Asset', tab: 'inventory', icon: Plus, color: 'bg-blue-500/10 text-blue-600', border: 'hover:border-blue-400/40' },
              { label: 'Upload Document', tab: 'documents', icon: Upload, color: 'bg-purple-500/10 text-purple-600', border: 'hover:border-purple-400/40' },
              { label: 'View Analytics', tab: 'analytics', icon: TrendingUp, color: 'bg-emerald-500/10 text-emerald-600', border: 'hover:border-emerald-400/40' },
            ].map(action => {
              const Icon = action.icon;
              return (
                <button
                  key={action.tab}
                  onClick={() => setActiveTab(action.tab)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 bg-white dark:bg-neutral-900/50 border border-gray-200/60 dark:border-neutral-800/60 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-200 ${action.border} hover:shadow-sm transition-all`}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${action.color}`}>
                    <Icon size={14} />
                  </div>
                  {action.label}
                  <ChevronRight size={13} className="ml-auto text-gray-400" />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
