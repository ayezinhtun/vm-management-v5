import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Server, 
  Users, 
  Plus, 
  FileText,
  Activity,
  Upload,
  Download,
  Shield,
  BarChart3,
  Clock,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  // { id: 'clusters', label: 'Cluster Management', icon: Server },
  // { id: 'nodes', label: 'Node Management', icon: Server },
  // { id: 'vms', label: 'VM Management', icon: Server },
  { 
    id: 'infrastructure', 
    label: 'Infrastructure', 
    icon: Server,
    hasDropdown: true,
    children: [
      { id: 'clusters', label: 'Cluster Management', icon: Server },
      { id: 'nodes', label: 'Node Management', icon: Server },
      { id: 'vms', label: 'VM Management', icon: Server }
    ]
  },
  // { id: 'create-vm', label: 'Create VM', icon: Plus },
  { 
    id: 'customers', 
    label: 'Customers', 
    icon: Users,
    hasDropdown: true,
    children: [
      { id: 'customers', label: 'Customer Management', icon: Users },
      { id: 'gp-accounts', label: 'GP Accounts', icon: Shield },
      { id: 'contracts', label: 'Contracts', icon: FileText }
    ]
  },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'activity-logs', label: 'Activity Logs', icon: Clock },
  { id: 'audit-logs', label: 'Audit Logs', icon: Activity },
  { id: 'import-export', label: 'Import/Export', icon: FileText }
];

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const isItemActive = (item: any) => {
    if (item.children) {
      return item.children.some((child: any) => child.id === activeTab);
    }
    return activeTab === item.id;
  };

  const isChildActive = (childId: string) => {
    return activeTab === childId;
  };

  return (
    <motion.aside
      className="w-64 bg-white border-r border-gray-200 min-h-screen"
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      <nav className="p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = isItemActive(item);
          const isExpanded = expandedItems.includes(item.id);
          
          return (
            <div key={item.id}>
              <motion.button
                onClick={() => {
                  if (item.hasDropdown) {
                    toggleExpanded(item.id);
                  } else {
                    onTabChange(item.id);
                  }
                }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-left transition-colors ${
                  isActive 
                    ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                whileHover={{ x: isActive ? 0 : 4 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
                  <span className="font-medium">{item.label}</span>
                </div>
                {item.hasDropdown && (
                  <motion.div
                    animate={{ rotate: isExpanded ? 90 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </motion.div>
                )}
              </motion.button>

              {/* Dropdown Children */}
              <AnimatePresence>
                {item.hasDropdown && isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="ml-4 mt-1 space-y-1">
                      {item.children?.map((child) => {
                        const ChildIcon = child.icon;
                        const isChildActiveState = isChildActive(child.id);
                        
                        return (
                          <motion.button
                            key={child.id}
                            onClick={() => onTabChange(child.id)}
                            className={`w-full flex items-center space-x-3 px-4 py-2 rounded-lg text-left transition-colors ${
                              isChildActiveState
                                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                                : 'text-gray-600 hover:bg-gray-50'
                            }`}
                            whileHover={{ x: isChildActiveState ? 0 : 2 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <ChildIcon className={`w-4 h-4 ${isChildActiveState ? 'text-blue-600' : 'text-gray-400'}`} />
                            <span className="text-sm font-medium">{child.label}</span>
                          </motion.button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </nav>
    </motion.aside>
  );
};