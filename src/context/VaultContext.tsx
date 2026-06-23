import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Asset, Document, Reminder, ActivityLog, UserProfile, SmartInsight } from '../types';
import { 
  INITIAL_ASSETS, 
  INITIAL_DOCUMENTS, 
  INITIAL_REMINDERS, 
  INITIAL_USER_PROFILE, 
  INITIAL_ACTIVITY_LOGS 
} from '../data';

interface VaultContextType {
  assets: Asset[];
  documents: Document[];
  reminders: Reminder[];
  activityLogs: ActivityLog[];
  userProfile: UserProfile;
  insights: SmartInsight[];
  insightsLoading: boolean;
  selectedAsset: Asset | null;
  setSelectedAsset: (asset: Asset | null) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  
  // State Mutators
  addAsset: (asset: Omit<Asset, 'id' | 'createdAt'>) => Asset;
  updateAsset: (id: string, updated: Partial<Asset>) => void;
  deleteAsset: (id: string) => void;
  addDocument: (doc: Omit<Document, 'id' | 'uploadDate'>) => Document;
  deleteDocument: (id: string) => void;
  toggleReminder: (id: string) => void;
  addReminder: (reminder: Omit<Reminder, 'id' | 'completed'>) => void;
  triggerAIInsights: () => Promise<void>;
  scanAssetWithGemini: (base64File: string, documentType: string) => Promise<any>;
  runDocumentOcr: (base64File: string, fileName: string, mimeType: string) => Promise<any>;
}

const VaultContext = createContext<VaultContextType | undefined>(undefined);

export const useVault = () => {
  const context = useContext(VaultContext);
  if (!context) {
    throw new Error('useVault must be used within a VaultProvider');
  }
  return context;
};

export const VaultProvider = ({ children }: { children: ReactNode }) => {
  const [assets, setAssets] = useState<Asset[]>(() => {
    const saved = localStorage.getItem('hv_assets');
    return saved ? JSON.parse(saved) : INITIAL_ASSETS;
  });

  const [documents, setDocuments] = useState<Document[]>(() => {
    const saved = localStorage.getItem('hv_documents');
    return saved ? JSON.parse(saved) : INITIAL_DOCUMENTS;
  });

  const [reminders, setReminders] = useState<Reminder[]>(() => {
    const saved = localStorage.getItem('hv_reminders');
    return saved ? JSON.parse(saved) : INITIAL_REMINDERS;
  });

  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(() => {
    const saved = localStorage.getItem('hv_activities');
    return saved ? JSON.parse(saved) : INITIAL_ACTIVITY_LOGS;
  });

  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('hv_profile');
    return saved ? JSON.parse(saved) : INITIAL_USER_PROFILE;
  });

  const [insights, setInsights] = useState<SmartInsight[]>(() => {
    const saved = localStorage.getItem('hv_insights');
    return saved ? JSON.parse(saved) : [];
  });

  const [insightsLoading, setInsightsLoading] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('hv_darkmode');
    return saved ? JSON.parse(saved) : false;
  });

  // Keep LocalStorage in sync
  useEffect(() => {
    localStorage.setItem('hv_assets', JSON.stringify(assets));
    // Calculate and update organization score dynamically based on filled assets
    if (assets.length > 0) {
      const avgRate = assets.reduce((acc, a) => acc + (a.completionRate || 50), 0) / assets.length;
      const countFactor = Math.min(20, assets.length * 2); // reward registering items
      const newScore = Math.min(100, Math.round(avgRate * 0.8 + countFactor));
      setUserProfile(prev => ({ ...prev, organizationScore: newScore }));
    }
  }, [assets]);

  useEffect(() => {
    localStorage.setItem('hv_documents', JSON.stringify(documents));
  }, [documents]);

  useEffect(() => {
    localStorage.setItem('hv_reminders', JSON.stringify(reminders));
  }, [reminders]);

  useEffect(() => {
    localStorage.setItem('hv_activities', JSON.stringify(activityLogs));
  }, [activityLogs]);

  useEffect(() => {
    localStorage.setItem('hv_profile', JSON.stringify(userProfile));
  }, [userProfile]);

  useEffect(() => {
    localStorage.setItem('hv_insights', JSON.stringify(insights));
  }, [insights]);

  useEffect(() => {
    localStorage.setItem('hv_darkmode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Load initial insights if database has any elements
  useEffect(() => {
    if (insights.length === 0) {
      triggerAIInsights();
    }
  }, []);

  // Helper to calculate completions
  const calculateCompletion = (asset: Partial<Asset>): number => {
    const fields = [
      'name', 'brand', 'modelNumber', 'serialNumber', 'description', 
      'purchaseDate', 'purchasePrice', 'store', 'room', 
      'storageLocation', 'warrantyProvider'
    ];
    let filled = 0;
    fields.forEach(f => {
      if (asset[f as keyof typeof asset]) filled++;
    });
    return Math.round((filled / fields.length) * 100);
  };

  // Mutators
  const addAsset = (newAssetData: Omit<Asset, 'id' | 'createdAt'>): Asset => {
    const id = 'ast_' + Math.random().toString(36).substring(2, 9);
    const creationTime = new Date().toISOString();
    const rate = calculateCompletion(newAssetData);
    
    // Calculate custom current depreciated value depending on years
    const currentYear = 2026;
    const pYear = parseInt((newAssetData.purchaseDate || '').substring(0, 4)) || 2026;
    const diff = Math.max(0, currentYear - pYear);
    const depRate = newAssetData.depreciationRate || 15;
    let computedVal = newAssetData.purchasePrice;
    for (let i = 0; i < diff; i++) {
        computedVal = computedVal * (1 - depRate / 100);
    }
    
    const finalAsset: Asset = {
      ...newAssetData,
      id,
      currentValue: Math.round(computedVal),
      completionRate: rate,
      createdAt: creationTime
    };

    setAssets(prev => [finalAsset, ...prev]);

    // Log Activity
    const newLog: ActivityLog = {
      id: 'log_' + Math.random().toString(36).substring(2, 9),
      title: 'New Asset Registered',
      description: `${finalAsset.brand} ${finalAsset.name} added to ${finalAsset.room}.`,
      timestamp: 'Just now',
      icon: 'Plus',
      type: 'create'
    };
    setActivityLogs(prev => [newLog, ...prev]);

    // Generate any dynamic reminders (e.g. warranty notice or appliance checkups)
    if (finalAsset.warrantyExpiry) {
      const wReminder: Reminder = {
        id: 'rem_' + Math.random().toString(36).substring(2, 9),
        title: `${finalAsset.name} warranty deadline check.`,
        type: 'warranty',
        date: finalAsset.warrantyExpiry,
        assetId: id,
        assetName: finalAsset.name,
        completed: false
      };
      setReminders(prev => [wReminder, ...prev]);
    }

    return finalAsset;
  };

  const updateAsset = (id: string, updatedFields: Partial<Asset>) => {
    setAssets(prev => prev.map(item => {
      if (item.id === id) {
        const merged = { ...item, ...updatedFields };
        merged.completionRate = calculateCompletion(merged);
        return merged;
      }
      return item;
    }));
    
    // Log Activity
    const asset = assets.find(a => a.id === id);
    if (asset) {
      const newLog: ActivityLog = {
        id: 'log_' + Math.random().toString(36).substring(2, 9),
        title: 'Asset Updated',
        description: `Details modified for ${asset.name}.`,
        timestamp: 'Just now',
        icon: 'Edit3',
        type: 'update'
      };
      setActivityLogs(prev => [newLog, ...prev]);
    }
  };

  const deleteAsset = (id: string) => {
    const asset = assets.find(a => a.id === id);
    setAssets(prev => prev.filter(item => item.id !== id));
    if (selectedAsset?.id === id) {
      setSelectedAsset(null);
    }

    // Log Activity
    if (asset) {
      const newLog: ActivityLog = {
        id: 'log_' + Math.random().toString(36).substring(2, 9),
        title: 'Asset Removed',
        description: `${asset.name} was deleted from database vault.`,
        timestamp: 'Just now',
        icon: 'Trash2',
        type: 'delete'
      };
      setActivityLogs(prev => [newLog, ...prev]);
    }
  };

  const addDocument = (docData: Omit<Document, 'id' | 'uploadDate'>): Document => {
    const id = 'doc_' + Math.random().toString(36).substring(2, 9);
    const newDoc: Document = {
      ...docData,
      id,
      uploadDate: new Date().toISOString().substring(0, 10),
    };

    setDocuments(prev => [newDoc, ...prev]);

    // Log activity
    const newLog: ActivityLog = {
      id: 'log_' + Math.random().toString(36).substring(2, 9),
      title: 'Document Securely Vaulted',
      description: `Uploaded file '${newDoc.name}' to safe digital storage.`,
      timestamp: 'Just now',
      icon: 'FileText',
      type: 'document'
    };
    setActivityLogs(prev => [newLog, ...prev]);

    return newDoc;
  };

  const deleteDocument = (id: string) => {
    setDocuments(prev => prev.filter(item => item.id !== id));
  };

  const toggleReminder = (id: string) => {
    setReminders(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, completed: !item.completed };
      }
      return item;
    }));
  };

  const addReminder = (remData: Omit<Reminder, 'id' | 'completed'>) => {
    const id = 'rem_' + Math.random().toString(36).substring(2, 9);
    const newRem: Reminder = {
      ...remData,
      id,
      completed: false
    };
    setReminders(prev => [newRem, ...prev]);
  };

  // ----------------------------------------------------
  // SERVER SIDE GEMINI ENDPOINT CALLS
  // ----------------------------------------------------
  const triggerAIInsights = async () => {
    setInsightsLoading(true);
    try {
      // Calculate statistics to send to backend to run analytics
      const totalCount = assets.length;
      const totalPrice = assets.reduce((acc, current) => acc + (current.purchasePrice || 0), 0);
      
      const categoriesSummary = assets.reduce((acc: any, cur) => {
        const cat = cur.category;
        if (!acc[cat]) acc[cat] = { count: 0, totalValue: 0 };
        acc[cat].count += 1;
        acc[cat].totalValue += cur.purchasePrice;
        return acc;
      }, {});

      const response = await fetch('/api/gemini/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assetsCount: totalCount,
          totalPrice,
          categoriesSummary,
          userContext: {
            userName: userProfile.name,
            score: userProfile.organizationScore,
            remindersCount: reminders.length
          }
        })
      });

      if (!response.ok) {
        throw new Error('Server-side AI Insights generation failed.');
      }

      const generatedInsights = await response.json();
      setInsights(generatedInsights);
    } catch (e) {
      console.error('Failed to trigger server insights:', e);
    } finally {
      setInsightsLoading(false);
    }
  };

  // Scanning multi-modal autofill API
  const scanAssetWithGemini = async (base64File: string, documentType: string) => {
    try {
      const response = await fetch('/api/gemini/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          base64File,
          mimeType: base64File.substring(base64File.indexOf(':') + 1, base64File.indexOf(';')),
          documentType
        })
      });

      if (!response.ok) {
        throw new Error('Gemini asset scanning endpoint failed.');
      }

      const parsedAsset = await response.json();
      return parsedAsset;
    } catch (e) {
      console.error('Error scanning asset:', e);
      throw e;
    }
  };

  // OCR document text reader API
  const runDocumentOcr = async (base64File: string, fileName: string, mimeType: string) => {
    try {
      const response = await fetch('/api/gemini/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          base64File,
          fileName,
          mimeType
        })
      });

      if (!response.ok) {
        throw new Error('Gemini OCR API failed.');
      }

      return await response.json();
    } catch (error) {
      console.error('Error in document OCR extraction helper:', error);
      throw error;
    }
  };

  return (
    <VaultContext.Provider value={{
      assets,
      documents,
      reminders,
      activityLogs,
      userProfile,
      insights,
      insightsLoading,
      selectedAsset,
      setSelectedAsset,
      activeTab,
      setActiveTab,
      darkMode,
      setDarkMode,
      
      addAsset,
      updateAsset,
      deleteAsset,
      addDocument,
      deleteDocument,
      toggleReminder,
      addReminder,
      triggerAIInsights,
      scanAssetWithGemini,
      runDocumentOcr
    }}>
      {children}
    </VaultContext.Provider>
  );
};
