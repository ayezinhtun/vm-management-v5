import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, Filter, Download, Search } from 'lucide-react';
import { useSupabaseDataStore as useDataStore } from '../../hooks/useSupabaseDataStore';
import { Card } from '../ui/Card';
import { Table } from '../ui/Table';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { supabase } from '../../lib/supabase';
import { showToast } from '../ui/Toast';
import { AuditLog } from '../../types';

export const AuditLogs: React.FC = () => {
  const { auditLogs, loading } = useDataStore();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [operationFilter, setOperationFilter] = useState('all');
  const [tableFilter, setTableFilter] = useState('all');

  const loadAuditLogs = async () => {
    setLogs(auditLogs);
  };

  useEffect(() => {
    setLogs(auditLogs);
  }, [auditLogs]);

  useEffect(() => {
    let filtered = logs;

    if (searchTerm) {
      filtered = filtered.filter(log =>
        log.record_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.table_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (operationFilter !== 'all') {
      filtered = filtered.filter(log => log.operation === operationFilter);
    }

    if (tableFilter !== 'all') {
      filtered = filtered.filter(log => log.table_name === tableFilter);
    }

    setFilteredLogs(filtered);
  }, [logs, searchTerm, operationFilter, tableFilter]);

  const exportLogs = () => {
    const csvContent = [
      ['Timestamp', 'Table', 'Operation', 'Record ID'].join(','),
      ...filteredLogs.map(log => [
        new Date(log.timestamp).toLocaleString(),
        log.table_name,
        log.operation,
        log.record_id
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    showToast.success('Audit logs exported successfully');
  };

  const logColumns = [
    { 
      key: 'timestamp', 
      label: 'Timestamp', 
      sortable: true,
      render: (value: string) => new Date(value).toLocaleString()
    },
    { key: 'table_name', label: 'Table', sortable: true },
    { 
      key: 'operation', 
      label: 'Operation', 
      sortable: true,
      render: (value: string) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value === 'CREATE' ? 'bg-green-100 text-green-800' :
          value === 'UPDATE' ? 'bg-blue-100 text-blue-800' :
          'bg-red-100 text-red-800'
        }`}>
          {value}
        </span>
      )
    },
    { key: 'record_id', label: 'Record ID', sortable: true }
  ];

  return (
    <motion.div
      className="p-6 space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Audit Logs</h2>
        <Button variant="outline" onClick={exportLogs}>
          <Download className="w-4 h-4 mr-2" />
          Export Logs
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <select
            value={operationFilter}
            onChange={(e) => setOperationFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Operations</option>
            <option value="CREATE">Create</option>
            <option value="UPDATE">Update</option>
            <option value="DELETE">Delete</option>
          </select>

          <select
            value={tableFilter}
            onChange={(e) => setTableFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Tables</option>
            <option value="vms">VMs</option>
            <option value="customers">Customers</option>
            <option value="contracts">Contracts</option>
            <option value="gp_accounts">GP Accounts</option>
          </select>

          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Advanced Filters
          </Button>
        </div>
      </Card>

      {/* Logs Table */}
      <Card>
        <Table
          columns={logColumns}
          data={filteredLogs}
          loading={loading}
        />
      </Card>
    </motion.div>
  );
};