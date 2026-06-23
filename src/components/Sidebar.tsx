import React, { useState } from 'react';
import { useVault } from '../context/VaultContext';
import { 
  LayoutDashboard, 
  Boxes, 
  FileText, 
  Map, 
  BarChart3, 
  Settings, 
  ShieldCheck, 
  Sun, 
  Moon, 
  Menu, 
  X, 
  Sparkles,
  Zap,
  HardDrive
} from 'lucide-react';

export default function Sidebar() {
  const { 
    activeTab, 
    setActiveTab, 
    darkMode, 
    setDarkMode, 
    userProfile, 
    assets, 
    documents 
  } = useVault();
  
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'inventory', name: 'Inventory Vault', icon: Boxes, badge: assets.length },
    { id: 'documents', name: 'Document Vault', icon: FileText, badge: documents.length },
    { id: 'map', name: 'Interactive Map', icon: Map },
    { id: 'analytics', name: 'Insights & Analytics', icon: BarChart3 },
    { id: 'settings', name: 'Profile & Settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile top bar */}
      <div id="mobile-topbar" className="lg:hidden flex items-center justify-between px-4 py-3 bg-white dark:bg-neutral-900 border-b border-gray-150 dark:border-neutral-800 sticky top-0 z-40 transition-colors">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <span className="text-white font-bold text-sm">H</span>
          </div>
          <span className="font-semibold text-lg tracking-tight text-neutral-800 dark:text-neutral-100">HomeVault</span>
        </div>
        <button 
          id="mobile-menu-toggle"
          onClick={() => setIsOpen(!isOpen)} 
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-neutral-800 transition-colors"
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Nav Sidebar container */}
      <div 
        id="side-nav-bar"
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-50/90 dark:bg-neutral-950/95 lg:bg-slate-50/80 dark:lg:bg-neutral-950/80 border-r border-gray-200/60 dark:border-neutral-900/60 transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } flex flex-col justify-between backdrop-blur-md lg:fixed`}
      >
        <div>
          {/* Header */}
          <div className="px-6 py-5 flex items-center justify-between border-b border-gray-200/50 dark:border-neutral-900/50">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/10">
                <ShieldCheck className="text-white" size={18} />
              </div>
              <div>
                <h1 className="font-semibold text-base tracking-tight text-slate-900 dark:text-slate-50">HomeVault</h1>
                <p className="text-[10px] text-gray-500 font-mono tracking-wider">v1.2 // PERSISTENT</p>
              </div>
            </div>
            <button 
              id="sidebar-toggle-close"
              onClick={() => setIsOpen(false)} 
              className="lg:hidden p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-neutral-800"
            >
              <X size={16} />
            </button>
          </div>

          {/* User quick status (Arc Browser inspired card) */}
          <div className="px-4 py-4">
            <div className="p-3.5 bg-white/70 dark:bg-neutral-900/60 border border-gray-250/30 dark:border-neutral-800/40 rounded-2xl flex items-center gap-3 shadow-sm hover:shadow-md transition-all duration-300">
              <img 
                src={userProfile.avatarUrl} 
                alt={userProfile.name} 
                className="w-10 h-10 rounded-full border-2 border-blue-500/20 object-cover"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  <p className="text-xs font-semibold text-gray-800 dark:text-neutral-100 truncate">{userProfile.name}</p>
                  <span className="w-3.5 h-3.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center flex-shrink-0 animate-pulse">
                    <Zap size={8} />
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="px-1.5 py-0.5 bg-emerald-500/10 text-[9px] font-medium text-emerald-600 rounded-md">
                    {userProfile.tier.toUpperCase()}
                  </span>
                  <span className="text-[10px] font-mono text-gray-400">Score: {userProfile.organizationScore}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="px-3 space-y-1 mt-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-item-${item.id}`}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-250 group ${
                    isActive 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/10' 
                      : 'text-gray-600 dark:text-neutral-300 hover:bg-slate-150/40 dark:hover:bg-neutral-900/50 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={18} className={`transition-transform duration-300 group-hover:scale-105 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-blue-500 dark:group-hover:text-blue-400'}`} />
                    <span>{item.name}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-mono font-medium tracking-wide transition-all ${
                      isActive 
                        ? 'bg-blue-700 text-white' 
                        : 'bg-gray-200/60 text-gray-600 dark:bg-neutral-800 dark:text-gray-400 group-hover:bg-blue-500/10 group-hover:text-blue-600 dark:group-hover:text-blue-400'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer info & theme toggle */}
        <div className="p-4 border-t border-gray-200/50 dark:border-neutral-900/50 space-y-3.5">
          {/* Storage status */}
          <div className="px-2">
            <div className="flex items-center justify-between text-[11px] text-gray-400 mb-1 font-mono">
              <span className="flex items-center gap-1"><HardDrive size={11} /> Storage Pool</span>
              <span>{userProfile.storageUsed} / {userProfile.storageLimit}</span>
            </div>
            <div className="w-full h-1.5 bg-gray-200 dark:bg-neutral-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full" 
                style={{ width: '42%' }}
              />
            </div>
          </div>

          {/* Actions panel */}
          <div className="flex items-center justify-between gap-2 px-2 pt-1.5">
            <button 
              id="theme-switcher-toggle"
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 flex-1 rounded-xl bg-white dark:bg-neutral-900/60 border border-gray-200/50 dark:border-neutral-800/40 text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-all flex items-center justify-center gap-2 text-xs shadow-sm"
            >
              {darkMode ? (
                <>
                  <Sun size={14} />
                  <span>Light Mode</span>
                </>
              ) : (
                <>
                  <Moon size={14} />
                  <span>Dark Mode</span>
                </>
              )}
            </button>
          </div>

          {/* Small watermark */}
          <div className="text-center font-mono text-[9px] text-gray-400 dark:text-neutral-600">
            Secure Digital Brain • flat-402
          </div>
        </div>
      </div>

      {/* Slide-over backdrop on mobile overlay */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/45 dark:bg-black/65 backdrop-blur-sm z-30 lg:hidden"
        />
      )}
    </>
  );
}
