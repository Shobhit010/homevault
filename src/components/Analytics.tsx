import React, { useMemo } from 'react';
import { useVault } from '../context/VaultContext';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { TrendingDown, TrendingUp, Package, Award, AlertTriangle } from 'lucide-react';

const formatINR = (val: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

const COLORS: Record<string, string> = {
  electronics: '#3B82F6',
  furniture: '#F59E0B',
  appliances: '#8B5CF6',
  documents: '#10B981',
  assets: '#F43F5E',
  household: '#F97316',
};

const CAT_LABELS: Record<string, string> = {
  electronics: 'Electronics',
  furniture: 'Furniture',
  appliances: 'Appliances',
  documents: 'Documents',
  assets: 'Assets',
  household: 'Household',
};

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-xl px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold text-gray-800 dark:text-gray-100">{payload[0].name}</p>
      <p className="text-gray-500 dark:text-gray-400 mt-0.5">{formatINR(payload[0].value)}</p>
    </div>
  );
};

const BarTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-xl px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold text-gray-800 dark:text-gray-100">{CAT_LABELS[label] ?? label}</p>
      <p className="text-gray-500 dark:text-gray-400">{payload[0].value} assets</p>
      <p className="text-blue-500 dark:text-blue-400">{formatINR(payload[1]?.value ?? 0)}</p>
    </div>
  );
};

export default function Analytics() {
  const { assets, reminders } = useVault();

  const totalValue = assets.reduce((s, a) => s + a.currentValue, 0);
  const totalOriginal = assets.reduce((s, a) => s + a.purchasePrice, 0);
  const totalDepreciation = totalOriginal - totalValue;
  const avgValue = assets.length ? totalValue / assets.length : 0;

  const byCategory = useMemo(() => {
    const map: Record<string, { count: number; value: number; original: number }> = {};
    assets.forEach(a => {
      if (!map[a.category]) map[a.category] = { count: 0, value: 0, original: 0 };
      map[a.category].count++;
      map[a.category].value += a.currentValue;
      map[a.category].original += a.purchasePrice;
    });
    return Object.entries(map).map(([cat, data]) => ({
      name: CAT_LABELS[cat] ?? cat,
      key: cat,
      ...data,
      depreciation: data.original - data.value,
    }));
  }, [assets]);

  const pieData = byCategory.map(c => ({ name: c.name, value: c.value, key: c.key }));

  const barData = byCategory.map(c => ({
    cat: c.key,
    count: c.count,
    value: c.value,
  }));

  const topAssets = [...assets]
    .sort((a, b) => b.currentValue - a.currentValue)
    .slice(0, 5);

  const highDepreciation = [...assets]
    .filter(a => a.depreciationRate && a.depreciationRate >= 20)
    .sort((a, b) => (b.depreciationRate ?? 0) - (a.depreciationRate ?? 0))
    .slice(0, 3);

  const warrantyExpiringSoon = assets
    .filter(a => {
      if (!a.warrantyExpiry || !a.warrantyActive) return false;
      const days = Math.ceil((new Date(a.warrantyExpiry).getTime() - Date.now()) / 86400000);
      return days <= 180 && days > 0;
    })
    .sort((a, b) => new Date(a.warrantyExpiry).getTime() - new Date(b.warrantyExpiry).getTime())
    .slice(0, 3);

  return (
    <div className="px-5 py-7 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-50">Insights & Analytics</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Portfolio overview · {assets.length} assets
        </p>
      </div>

      {/* Top stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
        {[
          {
            label: 'Portfolio Value',
            value: formatINR(totalValue),
            sub: `from ${formatINR(totalOriginal)} purchased`,
            icon: TrendingUp,
            color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
          },
          {
            label: 'Total Depreciation',
            value: formatINR(totalDepreciation),
            sub: `${Math.round((totalDepreciation / totalOriginal) * 100)}% of original cost`,
            icon: TrendingDown,
            color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
          },
          {
            label: 'Average Asset Value',
            value: formatINR(avgValue),
            sub: `across ${assets.length} assets`,
            icon: Package,
            color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
          },
          {
            label: 'Highest Value Asset',
            value: topAssets[0] ? formatINR(topAssets[0].currentValue) : '—',
            sub: topAssets[0]?.name ?? 'No assets',
            icon: Award,
            color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
          },
        ].map(card => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="p-4 bg-white dark:bg-neutral-900/50 border border-gray-200/60 dark:border-neutral-800/60 rounded-2xl shadow-sm">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${card.color}`}>
                <Icon size={18} />
              </div>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-50 tabular-nums leading-tight">{card.value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{card.label}</p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 font-mono truncate">{card.sub}</p>
            </div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-5 mb-5">
        {/* Pie chart */}
        <div className="bg-white dark:bg-neutral-900/50 border border-gray-200/60 dark:border-neutral-800/60 rounded-2xl shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-50 mb-1">Portfolio by Category</h2>
          <p className="text-xs text-gray-400 font-mono mb-4">Current value distribution</p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
              >
                {pieData.map(entry => (
                  <Cell key={entry.key} fill={COLORS[entry.key] ?? '#94A3B8'} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                formatter={(value) => <span className="text-xs text-gray-600 dark:text-gray-300">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Bar chart */}
        <div className="bg-white dark:bg-neutral-900/50 border border-gray-200/60 dark:border-neutral-800/60 rounded-2xl shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-50 mb-1">Assets per Category</h2>
          <p className="text-xs text-gray-400 font-mono mb-4">Count + current value</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis
                dataKey="cat"
                tick={{ fontSize: 10, fill: '#94A3B8' }}
                tickFormatter={k => CAT_LABELS[k]?.slice(0, 4) ?? k}
                axisLine={false}
                tickLine={false}
              />
              <YAxis yAxisId="count" orientation="left" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="value" orientation="right" tick={false} axisLine={false} tickLine={false} />
              <Tooltip content={<BarTooltip />} />
              <Bar yAxisId="count" dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={28} />
              <Bar yAxisId="value" dataKey="value" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Top 5 assets */}
        <div className="lg:col-span-2 bg-white dark:bg-neutral-900/50 border border-gray-200/60 dark:border-neutral-800/60 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-neutral-800/60">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-50">Top Assets by Value</h2>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-neutral-800/60">
            {topAssets.map((asset, idx) => {
              const depPct = Math.round(((asset.purchasePrice - asset.currentValue) / asset.purchasePrice) * 100);
              const barWidth = (asset.currentValue / (topAssets[0]?.currentValue ?? 1)) * 100;
              return (
                <div key={asset.id} className="px-5 py-3.5 flex items-center gap-3">
                  <span className="w-5 text-xs font-bold text-gray-300 dark:text-gray-600 text-center flex-shrink-0">
                    {idx + 1}
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-neutral-800 overflow-hidden flex-shrink-0">
                    {asset.imageUrl ? (
                      <img src={asset.imageUrl} alt={asset.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package size={14} className="text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{asset.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1.5 bg-gray-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-gray-400 font-mono flex-shrink-0">↓{depPct}%</span>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-gray-900 dark:text-gray-50 tabular-nums flex-shrink-0">
                    {formatINR(asset.currentValue)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Alerts */}
        <div className="space-y-4">
          {/* High depreciation */}
          {highDepreciation.length > 0 && (
            <div className="bg-white dark:bg-neutral-900/50 border border-gray-200/60 dark:border-neutral-800/60 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-4 py-3.5 border-b border-gray-100 dark:border-neutral-800/60 flex items-center gap-2">
                <TrendingDown size={14} className="text-amber-500" />
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50">High Depreciation</h3>
              </div>
              <div className="p-4 space-y-2.5">
                {highDepreciation.map(a => (
                  <div key={a.id} className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-gray-800 dark:text-gray-100 truncate">{a.name}</p>
                      <p className="text-[10px] text-gray-400 font-mono">{a.brand}</p>
                    </div>
                    <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[10px] font-bold font-mono rounded-lg flex-shrink-0">
                      {a.depreciationRate}% / yr
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Warranty expiring */}
          {warrantyExpiringSoon.length > 0 && (
            <div className="bg-white dark:bg-neutral-900/50 border border-gray-200/60 dark:border-neutral-800/60 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-4 py-3.5 border-b border-gray-100 dark:border-neutral-800/60 flex items-center gap-2">
                <AlertTriangle size={14} className="text-red-500" />
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50">Warranty Expiring</h3>
              </div>
              <div className="p-4 space-y-2.5">
                {warrantyExpiringSoon.map(a => {
                  const days = Math.ceil((new Date(a.warrantyExpiry).getTime() - Date.now()) / 86400000);
                  return (
                    <div key={a.id} className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-gray-800 dark:text-gray-100 truncate">{a.name}</p>
                        <p className="text-[10px] text-gray-400 font-mono">{a.warrantyProvider}</p>
                      </div>
                      <span className={`px-2 py-0.5 text-[10px] font-bold font-mono rounded-lg flex-shrink-0 ${
                        days <= 30
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                          : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                      }`}>
                        {days}d
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Category breakdown text */}
          <div className="bg-white dark:bg-neutral-900/50 border border-gray-200/60 dark:border-neutral-800/60 rounded-2xl shadow-sm p-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50 mb-3">Category Breakdown</h3>
            <div className="space-y-2">
              {byCategory.sort((a, b) => b.value - a.value).map(cat => (
                <div key={cat.key} className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ background: COLORS[cat.key] ?? '#94A3B8' }}
                  />
                  <span className="text-xs text-gray-600 dark:text-gray-300 flex-1 truncate">{cat.name}</span>
                  <span className="text-[10px] font-mono text-gray-400">{cat.count}</span>
                  <span className="text-[10px] font-bold font-mono text-gray-700 dark:text-gray-200">
                    {Math.round((cat.value / totalValue) * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
