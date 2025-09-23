import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, Filter, Download, Search, Eye, Clock, User, AlertTriangle } from 'lucide-react';
import { Card } from '../ui/Card';
import { Table } from '../ui/Table';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { useSupabaseDataStore as useDataStore } from '../../hooks/useSupabaseDataStore';
import { showToast } from '../ui/Toast';
import { ActivityLog } from '../../types';

export const ActivityLogs: React.FC = () => {
  const { activityLogs, loading } = useDataStore();
  const [filteredLogs, setFilteredLogs] = useState<ActivityLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [entityTypeFilter, setEntityTypeFilter] = useState('all');
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);
  const [showLogDetails, setShowLogDetails] = useState(false);
  const [sortField, setSortField] = useState<string>('timestamp');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    let filtered = activityLogs;

    if (searchTerm) {
      filtered = filtered.filter(log =>
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.entity_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (severityFilter !== 'all') {
      filtered = filtered.filter(log => log.severity === severityFilter);
    }

    if (entityTypeFilter !== 'all') {
      filtered = filtered.filter(log => log.entity_type === entityTypeFilter);
    }

    // Sort data
    filtered.sort((a, b) => {
      const aValue = a[sortField as keyof ActivityLog];
      const bValue = b[sortField as keyof ActivityLog];
      
      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    setFilteredLogs(filtered);
  }, [activityLogs, searchTerm, severityFilter, entityTypeFilter, sortField, sortDirection]);

  const handleSort = (field: string) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const exportLogs = () => {
    const csvContent = [
      ['Timestamp', 'Action', 'Entity Type', 'Entity Name', 'User', 'Severity', 'Details'].join(','),
      ...filteredLogs.map(log => [
        new Date(log.timestamp).toLocaleString(),
        log.action,
        log.entity_type,
        log.entity_name,
        log.user,
        log.severity,
        log.details.replace(/,/g, ';') // Replace commas to avoid CSV issues
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activity_logs_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    showToast.success('Activity logs exported successfully');
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'success': return <div className="w-2 h-2 bg-green-500 rounded-full"></div>;
      case 'warning': return <div className="w-2 h-2 bg-amber-500 rounded-full"></div>;
      case 'error': return <div className="w-2 h-2 bg-red-500 rounded-full"></div>;
      default: return <div className="w-2 h-2 bg-blue-500 rounded-full"></div>;
    }
  };

  const logColumns = [
    { 
      key: 'timestamp', 
      label: 'Timestamp', 
      sortable: true,
      render: (value: string) => (
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-gray-400" />
          <span className="text-sm">{new Date(value).toLocaleString()}</span>
        </div>
      )
    },
    { 
      key: 'severity', 
      label: 'Severity', 
      sortable: true,
      render: (value: string, log: ActivityLog) => (
        <div className="flex items-center space-x-2">
          {getSeverityIcon(value)}
          <span className={`text-xs font-medium uppercase ${
            value === 'success' ? 'text-green-600' :
            value === 'warning' ? 'text-amber-600' :
            value === 'error' ? 'text-red-600' :
            'text-blue-600'
          }`}>
            {value}
          </span>
        </div>
      )
    },
    { key: 'action', label: 'Action', sortable: true },
    { 
      key: 'entity_type', 
      label: 'Entity Type', 
      sortable: true,
      render: (value: string) => (
        <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
          {value}
        </span>
      )
    },
    { key: 'entity_name', label: 'Entity Name', sortable: true },
    { 
      key: 'user', 
      label: 'User', 
      sortable: true,
      render: (value: string) => (
        <div className="flex items-center space-x-2">
          <User className="w-4 h-4 text-gray-400" />
          <span>{value}</span>
        </div>
      )
    },
    { 
      key: 'details', 
      label: 'Details',
      render: (value: string) => (
        <span className="text-sm text-gray-600 truncate max-w-xs block">
          {value.length > 50 ? `${value.substring(0, 50)}...` : value}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (value: any, log: ActivityLog) => (
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setSelectedLog(log);
            setShowLogDetails(true);
          }}
          title="View Details"
        >
          <Eye className="w-4 h-4" />
        </Button>
      )
    }
  ];

  return (
    <motion.div
      className="p-6 space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Activity Logs</h2>
          <p className="text-gray-600 mt-1">Real-time system activity and user actions</p>
        </div>
        <Button variant="outline" onClick={exportLogs}>
          <Download className="w-4 h-4 mr-2" />
          Export Logs ({filteredLogs.length})
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Activities</p>
              <p className="text-2xl font-bold text-gray-900">{activityLogs.length}</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Activity className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Success Actions</p>
              <p className="text-2xl font-bold text-green-600">
                {activityLogs.filter(log => log.severity === 'success').length}
              </p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <Activity className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Warnings</p>
              <p className="text-2xl font-bold text-amber-600">
                {activityLogs.filter(log => log.severity === 'warning').length}
              </p>
            </div>
            <div className="p-2 bg-amber-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Errors</p>
              <p className="text-2xl font-bold text-red-600">
                {activityLogs.filter(log => log.severity === 'error').length}
              </p>
            </div>
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search activities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Severities</option>
            <option value="success">Success</option>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="error">Error</option>
          </select>

          <select
            value={entityTypeFilter}
            onChange={(e) => setEntityTypeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Entity Types</option>
            <option value="VM">VMs</option>
            <option value="Customer">Customers</option>
            <option value="Contract">Contracts</option>
            <option value="GPAccount">GP Accounts</option>
          </select>

          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Advanced Filters
          </Button>
        </div>
      </Card>

      {/* Activity Logs Table */}
      <Card>
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Recent Activity</h3>
          <p className="text-sm text-gray-600">Real-time system activities and user actions</p>
        </div>
        <div className="max-h-96 overflow-y-auto">
          <Table
            columns={logColumns}
            data={filteredLogs}
            loading={loading}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
          />
        </div>
      </Card>

      {/* Activity Log Details Modal */}
      <Modal
        isOpen={showLogDetails}
        onClose={() => setShowLogDetails(false)}
        title="Activity Log Details"
        size="lg"
      >
        {selectedLog && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Activity Information</h4>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    {getSeverityIcon(selectedLog.severity)}
                    <div>
                      <p className="font-medium text-gray-900">{selectedLog.action}</p>
                      <p className="text-sm text-gray-600">{selectedLog.entity_type}: {selectedLog.entity_name}</p>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-700">{selectedLog.details}</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Metadata</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Timestamp:</span> 
                    <span>{new Date(selectedLog.timestamp).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">User:</span> 
                    <span>{selectedLog.user}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Entity Type:</span> 
                    <span>{selectedLog.entity_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Entity ID:</span> 
                    <span className="font-mono text-xs">{selectedLog.entity_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Severity:</span> 
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      selectedLog.severity === 'success' ? 'bg-green-100 text-green-800' :
                      selectedLog.severity === 'warning' ? 'bg-amber-100 text-amber-800' :
                      selectedLog.severity === 'error' ? 'bg-red-100 text-red-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {selectedLog.severity.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  );
};