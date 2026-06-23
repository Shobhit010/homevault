import { VaultProvider, useVault } from './context/VaultContext';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory';
import Documents from './components/Documents';
import MapView from './components/MapView';
import Analytics from './components/Analytics';
import Settings from './components/Settings';

function AppContent() {
  const { activeTab } = useVault();

  return (
    <div className="min-h-screen bg-[#FDFCFB] dark:bg-[#0B0B0C] transition-colors duration-200">
      <Sidebar />
      <main className="lg:ml-64 min-h-screen">
        <div className="pt-14 lg:pt-0">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'inventory' && <Inventory />}
          {activeTab === 'documents' && <Documents />}
          {activeTab === 'map' && <MapView />}
          {activeTab === 'analytics' && <Analytics />}
          {activeTab === 'settings' && <Settings />}
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <VaultProvider>
      <AppContent />
    </VaultProvider>
  );
}
