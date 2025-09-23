import React from 'react';
import { motion } from 'framer-motion';
import { Server, Search, Bell, Settings } from 'lucide-react';

interface HeaderProps {
  onSearchToggle: () => void;
  onNotificationsToggle: () => void;
  onSettingsToggle: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onSearchToggle,
  onNotificationsToggle,
  onSettingsToggle
}) => {
  return (
    <motion.header
      className="bg-white border-b border-gray-200 px-6 py-4"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <motion.div
            className="p-2 bg-blue-600 rounded-lg"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Server className="w-6 h-6 text-white" />
          </motion.div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">VM Management</h1>
            <p className="text-sm text-gray-500">Internal Administration Panel</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <motion.button
            onClick={onSearchToggle}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Search className="w-5 h-5" />
          </motion.button>
          
          <motion.button
            onClick={onNotificationsToggle}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors relative"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
          </motion.button>
          
          <motion.button
            onClick={onSettingsToggle}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Settings className="w-5 h-5" />
          </motion.button>
        </div>
      </div>
    </motion.header>
  );
};