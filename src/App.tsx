import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { Dashboard } from './components/dashboard/Dashboard';
import { ClusterManagement } from './components/cluster/ClusterManagement';
import { NodeManagement } from './components/node/NodeManagement';
import { VMManagement } from './components/vm/VMManagement';
import { CustomerManagement } from './components/customer/CustomerManagement';
import { GPAccountManagement } from './components/gp-accounts/GPAccountManagement';
import { ContractManagement } from './components/contracts/ContractManagement';
import { ContactManagement } from './components/customer/ContactManagement';
import { Analytics } from './components/analytics/Analytics';
import { ActivityLogs } from './components/activity/ActivityLogs';
import { CreateVM } from './components/vm/CreateVM';
import { AuditLogs } from './components/audit/AuditLogs';
import { ImportExport } from './components/import-export/ImportExport';
import { UniversalSearch } from './components/search/UniversalSearch';
import { NotificationPanel } from './components/notifications/NotificationPanel';
import { SettingsPanel } from './components/settings/SettingsPanel';
import { ToastProvider } from './components/ui/Toast';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showSearch, setShowSearch] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard onNavigate={setActiveTab} />;
      case 'clusters':
        return <ClusterManagement />;
      case 'nodes':
        return <NodeManagement />;
      case 'vms':
        return <VMManagement onNavigate={setActiveTab} />;
      case 'customers':
        return <CustomerManagement />;
      case 'gp-accounts':
        return <GPAccountManagement />;
      case 'contracts':
        return <ContractManagement />;
      case 'analytics':
        return <Analytics />;
      case 'activity-logs':
        return <ActivityLogs />;
        case 'create-vm':
          return <CreateVM onNavigate={setActiveTab} />;
      case 'audit-logs':
        return <AuditLogs />;
      case 'import-export':
        return <ImportExport />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <ToastProvider />
      
      <Header
        onSearchToggle={() => setShowSearch(true)}
        onNotificationsToggle={() => setShowNotifications(true)}
        onSettingsToggle={() => setShowSettings(true)}
      />
      
      <div className="flex">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
        
        <motion.main
          className="flex-1 overflow-auto"
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          {renderContent()}
        </motion.main>
      </div>

      {/* Global Modals */}
      <UniversalSearch
        isOpen={showSearch}
        onClose={() => setShowSearch(false)}
      />
      
      <NotificationPanel
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
      
      <SettingsPanel
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </div>
  );
}

export default App;