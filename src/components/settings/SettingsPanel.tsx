import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { FormField } from '../ui/FormField';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { showToast } from '../ui/Toast';
import { UserSettings } from '../../types';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useLocalStorage<UserSettings>('userSettings', {
    itemsPerPage: 10,
    defaultDateRange: '30',
    visibleColumns: ['vm_name', 'status', 'cpu', 'ram', 'public_ip', 'created_at'],
    theme: 'light'
  });

  const [tempSettings, setTempSettings] = useState(settings);

  const handleSave = () => {
    setSettings(tempSettings);
    showToast.success('Settings saved successfully');
    onClose();
  };

  const handleReset = () => {
    const defaultSettings: UserSettings = {
      itemsPerPage: 10,
      defaultDateRange: '30',
      visibleColumns: ['vm_name', 'status', 'cpu', 'ram', 'public_ip', 'created_at'],
      theme: 'light'
    };
    setTempSettings(defaultSettings);
    showToast.info('Settings reset to defaults');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 overflow-y-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="flex min-h-screen items-start justify-end p-4">
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
              onClick={onClose}
            />
            <motion.div
              initial={{ x: 400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 400, opacity: 0 }}
              className="relative bg-white rounded-lg shadow-xl w-full max-w-md"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Settings</h3>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-4">Display Preferences</h4>
                  
                  <FormField label="Items per page">
                    <select
                      value={tempSettings.itemsPerPage}
                      onChange={(e) => setTempSettings({
                        ...tempSettings,
                        itemsPerPage: parseInt(e.target.value)
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={5}>5 items</option>
                      <option value={10}>10 items</option>
                      <option value={25}>25 items</option>
                      <option value={50}>50 items</option>
                    </select>
                  </FormField>

                  <FormField label="Default date range">
                    <select
                      value={tempSettings.defaultDateRange}
                      onChange={(e) => setTempSettings({
                        ...tempSettings,
                        defaultDateRange: e.target.value
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="7">Last 7 days</option>
                      <option value="30">Last 30 days</option>
                      <option value="90">Last 90 days</option>
                      <option value="365">Last year</option>
                    </select>
                  </FormField>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-4">Table Columns</h4>
                  <div className="space-y-2">
                    {[
                      { key: 'vm_name', label: 'VM Name' },
                      { key: 'status', label: 'Status' },
                      { key: 'cpu', label: 'CPU' },
                      { key: 'ram', label: 'RAM' },
                      { key: 'storage', label: 'Storage' },
                      { key: 'public_ip', label: 'Public IP' },
                      { key: 'management_ip', label: 'Management IP' },
                      { key: 'created_at', label: 'Created Date' }
                    ].map(column => (
                      <label key={column.key} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={tempSettings.visibleColumns.includes(column.key)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setTempSettings({
                                ...tempSettings,
                                visibleColumns: [...tempSettings.visibleColumns, column.key]
                              });
                            } else {
                              setTempSettings({
                                ...tempSettings,
                                visibleColumns: tempSettings.visibleColumns.filter(col => col !== column.key)
                              });
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{column.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-between p-6 border-t border-gray-200">
                <Button variant="outline" onClick={handleReset}>
                  Reset to Defaults
                </Button>
                <Button onClick={handleSave}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Settings
                </Button>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};