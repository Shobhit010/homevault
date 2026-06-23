import React, { useState, useMemo } from 'react';
import { useVault } from '../context/VaultContext';
import { Asset } from '../types';
import {
  MapPin, Package, ChevronDown, ChevronUp, Shield,
  Cpu, Armchair, Wrench, FileText, Gem, Home,
  TrendingUp,
} from 'lucide-react';

const formatINR = (val: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

const CAT_ICON: Record<string, React.FC<any>> = {
  electronics: Cpu, furniture: Armchair, appliances: Wrench,
  documents: FileText, assets: Gem, household: Home,
};

const ROOM_COLORS = [
  'from-blue-500/10 to-indigo-500/10 border-blue-200/40 dark:border-blue-800/30',
  'from-emerald-500/10 to-teal-500/10 border-emerald-200/40 dark:border-emerald-800/30',
  'from-violet-500/10 to-purple-500/10 border-violet-200/40 dark:border-violet-800/30',
  'from-amber-500/10 to-orange-500/10 border-amber-200/40 dark:border-amber-800/30',
  'from-rose-500/10 to-pink-500/10 border-rose-200/40 dark:border-rose-800/30',
  'from-cyan-500/10 to-sky-500/10 border-cyan-200/40 dark:border-cyan-800/30',
  'from-lime-500/10 to-green-500/10 border-lime-200/40 dark:border-lime-800/30',
];

const ROOM_ACCENT = [
  'text-blue-600 dark:text-blue-400 bg-blue-500/10',
  'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10',
  'text-violet-600 dark:text-violet-400 bg-violet-500/10',
  'text-amber-600 dark:text-amber-400 bg-amber-500/10',
  'text-rose-600 dark:text-rose-400 bg-rose-500/10',
  'text-cyan-600 dark:text-cyan-400 bg-cyan-500/10',
  'text-lime-600 dark:text-lime-400 bg-lime-500/10',
];

export default function MapView() {
  const { assets, setSelectedAsset, setActiveTab } = useVault();
  const [expandedRoom, setExpandedRoom] = useState<string | null>(null);

  const rooms = useMemo(() => {
    const map = new Map<string, Asset[]>();
    assets.forEach(a => {
      const room = a.room || 'Unassigned';
      if (!map.has(room)) map.set(room, []);
      map.get(room)!.push(a);
    });
    return Array.from(map.entries())
      .map(([name, roomAssets]) => ({
        name,
        assets: roomAssets,
        totalValue: roomAssets.reduce((s, a) => s + a.currentValue, 0),
        warrantyCount: roomAssets.filter(a => a.warrantyActive).length,
      }))
      .sort((a, b) => b.totalValue - a.totalValue);
  }, [assets]);

  const totalRooms = rooms.length;
  const totalValue = assets.reduce((s, a) => s + a.currentValue, 0);

  return (
    <div className="px-5 py-7 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-50">Interactive Map</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          {assets.length} assets across {totalRooms} rooms · {formatINR(totalValue)} total
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {rooms.slice(0, 4).map((room, idx) => (
          <button
            key={room.name}
            onClick={() => setExpandedRoom(expandedRoom === room.name ? null : room.name)}
            className={`text-left p-4 bg-gradient-to-br ${ROOM_COLORS[idx % ROOM_COLORS.length]} border rounded-2xl hover:shadow-md transition-all duration-200`}
          >
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-3 ${ROOM_ACCENT[idx % ROOM_ACCENT.length]}`}>
              <MapPin size={15} />
            </div>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-50">{room.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{room.assets.length} asset{room.assets.length !== 1 ? 's' : ''}</p>
            <p className="text-xs font-mono text-gray-600 dark:text-gray-300 mt-1">{formatINR(room.totalValue)}</p>
          </button>
        ))}
      </div>

      {/* Floor plan style room list */}
      <div className="space-y-3">
        {rooms.map((room, idx) => {
          const isExpanded = expandedRoom === room.name;
          const accent = ROOM_ACCENT[idx % ROOM_ACCENT.length];
          const gradient = ROOM_COLORS[idx % ROOM_COLORS.length];

          return (
            <div
              key={room.name}
              className={`border rounded-2xl overflow-hidden transition-all duration-200 ${
                isExpanded
                  ? `bg-gradient-to-br ${gradient}`
                  : 'bg-white dark:bg-neutral-900/50 border-gray-200/60 dark:border-neutral-800/60'
              }`}
            >
              <button
                onClick={() => setExpandedRoom(isExpanded ? null : room.name)}
                className="w-full flex items-center justify-between px-5 py-4"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${accent}`}>
                    <MapPin size={16} />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-50">{room.name}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        <Package size={10} className="inline mr-0.5" />
                        {room.assets.length} items
                      </span>
                      {room.warrantyCount > 0 && (
                        <span className="text-xs text-emerald-600 dark:text-emerald-400">
                          <Shield size={10} className="inline mr-0.5" />
                          {room.warrantyCount} warranted
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900 dark:text-gray-50 tabular-nums">{formatINR(room.totalValue)}</p>
                    <p className="text-[10px] text-gray-400 font-mono">
                      {Math.round((room.totalValue / totalValue) * 100)}% of total
                    </p>
                  </div>
                  {isExpanded ? (
                    <ChevronUp size={16} className="text-gray-400 flex-shrink-0" />
                  ) : (
                    <ChevronDown size={16} className="text-gray-400 flex-shrink-0" />
                  )}
                </div>
              </button>

              {isExpanded && (
                <div className="px-5 pb-5">
                  <div className="h-px bg-gray-200/60 dark:bg-neutral-700/60 mb-4" />
                  <div className="grid sm:grid-cols-2 gap-2.5">
                    {room.assets.map(asset => {
                      const CatIcon = CAT_ICON[asset.category] ?? Package;
                      const depPct = Math.round(
                        ((asset.purchasePrice - asset.currentValue) / asset.purchasePrice) * 100
                      );
                      return (
                        <button
                          key={asset.id}
                          onClick={() => {
                            setSelectedAsset(asset);
                            setActiveTab('inventory');
                          }}
                          className="flex items-center gap-3 p-3 bg-white/60 dark:bg-neutral-900/60 hover:bg-white dark:hover:bg-neutral-900/80 border border-white/80 dark:border-neutral-700/40 rounded-xl text-left transition-all group"
                        >
                          <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-neutral-800 flex-shrink-0 overflow-hidden">
                            {asset.imageUrl ? (
                              <img src={asset.imageUrl} alt={asset.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <CatIcon size={16} className="text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-gray-800 dark:text-gray-100 truncate">{asset.name}</p>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 truncate">{asset.storageLocation || asset.brand}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-xs font-bold text-blue-600 dark:text-blue-400 tabular-nums">{formatINR(asset.currentValue)}</p>
                              <span className="text-[9px] text-gray-400 font-mono">↓{depPct}%</span>
                            </div>
                          </div>
                          {asset.warrantyActive && (
                            <Shield size={13} className="text-emerald-500 flex-shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-200/40 dark:border-neutral-700/40 flex items-center justify-between">
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                      {room.assets.length} items · {formatINR(room.totalValue)} total value
                    </p>
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <TrendingUp size={11} />
                      <span className="font-mono">{Math.round((room.totalValue / totalValue) * 100)}% of portfolio</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
