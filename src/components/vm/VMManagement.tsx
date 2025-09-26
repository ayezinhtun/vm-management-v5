import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Plus, Download, Eye, Edit, Trash2, Copy, Power, Calendar } from 'lucide-react';
import { Card } from '../ui/Card';
import { Table } from '../ui/Table';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { FormField } from '../ui/FormField';
import { useSupabaseDataStore as useDataStore } from '../../hooks/useSupabaseDataStore';
import { showToast } from '../ui/Toast';
import { VM } from '../../types';

interface VMManagementProps {
  onNavigate?: (tab: string) => void;
}

export const VMManagement: React.FC<VMManagementProps> = ({ onNavigate }) => {
  const { vms, customers, clusters, nodes, loading, updateVM, deleteVM } = useDataStore();
  const [filteredVMs, setFilteredVMs] = useState<VM[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [customerFilter, setCustomerFilter] = useState('all');
  const [selectedVM, setSelectedVM] = useState<VM | null>(null);
  const [showVMDetails, setShowVMDetails] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingVM, setEditingVM] = useState<VM | null>(null);
  const [sortField, setSortField] = useState<string>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Edit form state
  const [editFormData, setEditFormData] = useState<Partial<VM>>({});

  useEffect(() => {
    let filtered = vms;

    if (searchTerm) {
      filtered = filtered.filter(vm =>
        vm.vm_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vm.public_ip?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vm.management_ip?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vm.services.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(vm => vm.status === statusFilter);
    }

    if (customerFilter !== 'all') {
      filtered = filtered.filter(vm => vm.customer_id === customerFilter);
    }

    // Sort data
    filtered.sort((a, b) => {
      const aValue = a[sortField as keyof VM];
      const bValue = b[sortField as keyof VM];
      
      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    setFilteredVMs(filtered);
  }, [vms, searchTerm, statusFilter, customerFilter, sortField, sortDirection]);

  const handleSort = (field: string) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleQuickAction = async (vm: VM, action: string) => {
    try {
      switch (action) {
        case 'toggle-status':
          const newStatus = vm.status === 'Active' ? 'Inactive' : 'Active';
          await updateVM(vm.id, { status: newStatus });
          break;

        case 'copy-ip':
          if (vm.public_ip) {
            await navigator.clipboard.writeText(vm.public_ip);
            showToast.success('IP address copied to clipboard');
          } else {
            showToast.warning('No public IP available');
          }
          break;

        case 'edit':
          setEditingVM(vm);
          setEditFormData(vm);
          setShowEditModal(true);
          break;

        case 'delete':
          if (window.confirm(`Are you sure you want to delete VM "${vm.vm_name}"?`)) {
            await deleteVM(vm.id);
          }
          break;
      }
    } catch (error) {
      showToast.error('Failed to perform action');
      console.error('Quick action error:', error);
    }
  };

  const handleEditSubmit = async () => {
    if (!editingVM || !editFormData) return;

    try {
      await updateVM(editingVM.id, editFormData);
      setShowEditModal(false);
      setEditingVM(null);
      setEditFormData({});
    } catch (error) {
      console.error('Edit submit error:', error);
    }
  };

  const exportData = () => {
    const csvContent = [
      ['VM Name', 'Status', 'CPU/RAM', 'Storage', 'IPs', 'Password Due', 'Allowed Ports', 'Service End', 'Customer', 'Created'].join(','),
      ...filteredVMs.map(vm => {
        const customer = customers.find(c => c.id === vm.customer_id);
        return [
          vm.vm_name,
          vm.status,
          `${vm.cpu} / ${vm.ram}`,
          vm.storage,
          `${vm.public_ip || 'N/A'} / ${vm.management_ip || 'N/A'}`,
          new Date(vm.next_password_due_date).toLocaleDateString(),
          vm.allowed_ports?.join('; ') || '',
          vm.service_end_date,
          customer?.department_name || '',
          new Date(vm.created_at).toLocaleDateString()
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vms_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    showToast.success('VM data exported successfully');
  };

  const vmColumns = [
    { key: 'vm_name', label: 'VM Name', sortable: true },
    { key: 'status', label: 'Status', sortable: true, render: (value: string) => (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
        value === 'Active' ? 'bg-green-100 text-green-800' :
        value === 'Inactive' ? 'bg-red-100 text-red-800' :
        value === 'Maintenance' ? 'bg-yellow-100 text-yellow-800' :
        'bg-gray-100 text-gray-800'
      }`}>
        {value}
      </span>
    )},
    { 
      key: 'cpu_ram', 
      label: 'CPU/RAM', 
      render: (value: any, vm: VM) => (
        <div className="text-sm">
          <div className="font-medium">{vm.cpu} ({vm.cpu_ghz}GHz)</div>
          <div className="text-gray-500">{vm.ram}</div>
        </div>
      )
    },
    { 
      key: 'cluster_node', 
      label: 'Cluster/Node', 
      render: (value: any, vm: VM) => {
       const cluster = clusters?.find(c => c.id === vm.cluster_id);
      const node = nodes?.find(n => n.id === vm.node_id);
        return (
          <div className="text-sm">
            <div className="font-medium">{cluster?.cluster_name || 'N/A'}</div>
            <div className="text-gray-500">{node?.node_name || 'N/A'}</div>
          </div>
        );
      }
    },
    { 
      key: 'ips', 
      label: 'Private/Management IP', 
      render: (value: any, vm: VM) => (
        <div className="text-sm font-mono">
          <div>{vm.private_ips?.[0] || 'N/A'}</div>
          <div className="text-gray-500">{vm.management_ip || 'N/A'}</div>
        </div>
      )
    },
    { 
      key: 'next_password_due_date', 
      label: 'Password Due', 
      sortable: true,
      render: (value: string) => {
        const dueDate = new Date(value);
        const today = new Date();
        const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        return (
          <span className={`text-sm ${
            daysUntilDue <= 0 ? 'text-red-600 font-bold' :
            daysUntilDue <= 7 ? 'text-amber-600 font-medium' :
            'text-gray-600'
          }`}>
            {dueDate.toLocaleDateString()}
            {daysUntilDue <= 0 && ' (OVERDUE)'}
            {daysUntilDue > 0 && daysUntilDue <= 7 && ' (DUE SOON)'}
          </span>
        );
      }
    },
    { 
      key: 'allowed_ports', 
      label: 'Allowed Ports', 
      render: (value: string[]) => (
        <div className="text-xs font-mono">
          {value?.slice(0, 3).join(', ')}
          {value?.length > 3 && ` +${value.length - 3}`}
        </div>
      )
    },
    { key: 'storage', label: 'Storage', sortable: true },
    { 
      key: 'service_end_date', 
      label: 'Service End', 
      sortable: true,
      render: (value: string) => {
        const endDate = new Date(value);
        const today = new Date();
        const daysUntilExpiry = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        return (
          <span className={`text-sm ${
            daysUntilExpiry <= 30 && daysUntilExpiry > 0 ? 'text-amber-600 font-medium' :
            daysUntilExpiry <= 0 ? 'text-red-600 font-medium' :
            'text-gray-600'
          }`}>
            {endDate.toLocaleDateString()}
          </span>
        );
      }
    },
    { 
      key: 'actions', 
      label: 'Actions', 
      render: (value: any, vm: VM) => (
        <div className="flex space-x-1">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSelectedVM(vm);
              setShowVMDetails(true);
            }}
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => handleQuickAction(vm, 'edit')}
            title="Edit VM"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant={vm.status === 'Active' ? 'danger' : 'success'}
            onClick={() => handleQuickAction(vm, 'toggle-status')}
            title={vm.status === 'Active' ? 'Deactivate' : 'Activate'}
          >
            <Power className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleQuickAction(vm, 'copy-ip')}
            title="Copy IP"
          >
            <Copy className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => handleQuickAction(vm, 'delete')}
            title="Delete VM"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
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
          <h2 className="text-2xl font-bold text-gray-900">VM Management</h2>
          <p className="text-gray-600 mt-1">Manage virtual machines and their configurations</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={exportData}>
            <Download className="w-4 h-4 mr-2" />
            Export ({filteredVMs.length})
          </Button>
          <Button onClick={() => onNavigate?.('create-vm')}>
            <Plus className="w-4 h-4 mr-2" />
            Create VM
          </Button>
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total VMs</p>
              <p className="text-2xl font-bold text-gray-900">{vms.length}</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Eye className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active VMs</p>
              <p className="text-2xl font-bold text-green-600">
                {vms.filter(vm => vm.status === 'Active').length}
              </p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <Power className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Password Due Soon</p>
              <p className="text-2xl font-bold text-amber-600">
                {vms.filter(vm => {
                  const dueDate = new Date(vm.next_password_due_date);
                  const today = new Date();
                  const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                  return daysUntilDue <= 7 && daysUntilDue > 0;
                }).length}
              </p>
            </div>
            <div className="p-2 bg-amber-100 rounded-lg">
              <Calendar className="w-5 h-5 text-amber-600" />
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Password Overdue</p>
              <p className="text-2xl font-bold text-red-600">
                {vms.filter(vm => {
                  const dueDate = new Date(vm.next_password_due_date);
                  const today = new Date();
                  return dueDate < today;
                }).length}
              </p>
            </div>
            <div className="p-2 bg-red-100 rounded-lg">
              <Calendar className="w-5 h-5 text-red-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Service Expiring</p>
              <p className="text-2xl font-bold text-orange-600">
                {vms.filter(vm => {
                  const endDate = new Date(vm.service_end_date);
                  const today = new Date();
                  const daysUntilExpiry = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                  return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
                }).length}
              </p>
            </div>
            <div className="p-2 bg-orange-100 rounded-lg">
              <Calendar className="w-5 h-5 text-orange-600" />
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
              placeholder="Search VMs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Terminated">Terminated</option>
          </select>

          <select
            value={customerFilter}
            onChange={(e) => setCustomerFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Customers</option>
            {customers.map(customer => (
              <option key={customer.id} value={customer.id}>
                {customer.department_name}
              </option>
            ))}
          </select>

          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Advanced Filters
          </Button>
        </div>
      </Card>

      {/* VMs Table */}
      <Card>
        <Table
          columns={vmColumns}
          data={filteredVMs}
          loading={loading}
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={handleSort}
        />
      </Card>

      {/* VM Details Modal */}
      <Modal
        isOpen={showVMDetails}
        onClose={() => setShowVMDetails(false)}
        title={`VM Details - ${selectedVM?.vm_name}`}
        size="xl"
      >
        {selectedVM && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Basic Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Name:</span> 
                    <span>{selectedVM.vm_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Status:</span> 
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      selectedVM.status === 'Active' ? 'bg-green-100 text-green-800' :
                      selectedVM.status === 'Inactive' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {selectedVM.status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">CPU:</span> 
                    <span>{selectedVM.cpu}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">RAM:</span> 
                    <span>{selectedVM.ram}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Storage:</span> 
                    <span>{selectedVM.storage}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">OS Type:</span> 
                    <span>{selectedVM.os_type || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">OS Version:</span> 
                    <span>{selectedVM.os_version || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Services:</span> 
                    <span>{selectedVM.services || 'N/A'}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Network Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Public IP:</span> 
                    <span className="font-mono">{selectedVM.public_ip || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Management IP:</span> 
                    <span className="font-mono">{selectedVM.management_ip || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Private IPs:</span> 
                    <span className="font-mono">{selectedVM.private_ips?.join(', ') || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Allowed Ports:</span> 
                    <span className="font-mono">{selectedVM.allowed_ports?.join(', ') || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Service & Password Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">Service Period:</span> 
                  <span>{selectedVM.service_start_date} to {selectedVM.service_end_date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">Password Changer:</span> 
                  <span>{selectedVM.password_changer}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">Last Password Change:</span> 
                  <span>{new Date(selectedVM.last_password_changed_date).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">Next Password Due:</span> 
                  <span className={`${
                    new Date(selectedVM.next_password_due_date) < new Date() ? 'text-red-600 font-bold' :
                    new Date(selectedVM.next_password_due_date) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) ? 'text-amber-600 font-medium' :
                    'text-gray-900'
                  }`}>
                    {new Date(selectedVM.next_password_due_date).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {selectedVM.custom_fields && Object.keys(selectedVM.custom_fields).length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Custom Fields</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  {Object.entries(selectedVM.custom_fields).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-sm mb-2">
                      <span className="font-medium text-gray-600 capitalize">{key.replace('_', ' ')}:</span>
                      <span>{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {selectedVM.remarks && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Remarks</h4>
                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">{selectedVM.remarks}</p>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <Button variant="outline" onClick={() => handleQuickAction(selectedVM, 'edit')}>
                <Edit className="w-4 h-4 mr-2" />
                Edit VM
              </Button>
              <Button 
                variant={selectedVM.status === 'Active' ? 'danger' : 'success'}
                onClick={() => handleQuickAction(selectedVM, 'toggle-status')}
              >
                <Power className="w-4 h-4 mr-2" />
                {selectedVM.status === 'Active' ? 'Deactivate' : 'Activate'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit VM Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title={`Edit VM - ${editingVM?.vm_name}`}
        size="xl"
      >
        {editingVM && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="VM Name" required>
                <Input
                  value={editFormData.vm_name || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, vm_name: e.target.value })}
                  placeholder="Enter VM name"
                />
              </FormField>

              <FormField label="Status" required>
                <select
                  value={editFormData.status || 'Active'}
                  onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Terminated">Terminated</option>
                </select>
              </FormField>

              <FormField label="CPU" required>
                <Input
                  value={editFormData.cpu || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, cpu: e.target.value })}
                  placeholder="e.g., 4 vCPU"
                />
              </FormField>

              <FormField label="RAM" required>
                <Input
                  value={editFormData.ram || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, ram: e.target.value })}
                  placeholder="e.g., 8 GB"
                />
              </FormField>

              <FormField label="Storage" required>
                <Input
                  value={editFormData.storage || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, storage: e.target.value })}
                  placeholder="e.g., 100 GB SSD"
                />
              </FormField>

              <FormField label="OS Type">
                <Input
                  value={editFormData.os_type || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, os_type: e.target.value })}
                  placeholder="e.g., Windows Server, Ubuntu, CentOS"
                />
              </FormField>

              <FormField label="OS Version">
                <Input
                  value={editFormData.os_version || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, os_version: e.target.value })}
                  placeholder="e.g., 2022, 22.04 LTS"
                />
              </FormField>

              <FormField label="Next Password Due Date" required>
                <Input
                  type="date"
                  value={editFormData.next_password_due_date || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, next_password_due_date: e.target.value })}
                />
              </FormField>

              <FormField label="Public IP">
                <Input
                  value={editFormData.public_ip || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, public_ip: e.target.value })}
                  placeholder="192.168.1.100"
                />
              </FormField>

              <FormField label="Management IP">
                <Input
                  value={editFormData.management_ip || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, management_ip: e.target.value })}
                  placeholder="10.0.0.100"
                />
              </FormField>

              <FormField label="Private IPs">
                <Input
                  value={Array.isArray(editFormData.private_ips) ? editFormData.private_ips.join(', ') : editFormData.private_ips || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, private_ips: e.target.value.split(',').map(ip => ip.trim()).filter(ip => ip) })}
                  placeholder="10.0.0.100, 10.0.0.101"
                />
              </FormField>

              <FormField label="Allowed Ports">
                <Input
                  value={Array.isArray(editFormData.allowed_ports) ? editFormData.allowed_ports.join(', ') : editFormData.allowed_ports || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, allowed_ports: e.target.value.split(',').map(port => port.trim()).filter(port => port) })}
                  placeholder="80, 443, 22, 3389"
                />
              </FormField>

              <FormField label="Environment">
                <select
                  value={editFormData.custom_fields?.environment || 'Production'}
                  onChange={(e) => setEditFormData({ 
                    ...editFormData, 
                    custom_fields: { 
                      ...editFormData.custom_fields, 
                      environment: e.target.value 
                    } 
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Production">Production</option>
                  <option value="Development">Development</option>
                  <option value="Testing">Testing</option>
                  <option value="Staging">Staging</option>
                </select>
              </FormField>


              <FormField label="Access Level">
                <select
                  value={editFormData.custom_fields?.access_level || 'medium'}
                  onChange={(e) => setEditFormData({ 
                    ...editFormData, 
                    custom_fields: { 
                      ...editFormData.custom_fields, 
                      access_level: e.target.value 
                    } 
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </FormField>

              <FormField label="Backup Enabled">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={editFormData.custom_fields?.backup_enabled === 'true' || editFormData.custom_fields?.backup_enabled === true}
                  onChange={(e) => setEditFormData({ 
                    ...editFormData, 
                    custom_fields: { 
                      ...editFormData.custom_fields, 
                      backup_enabled: e.target.checked 
                    } 
                  })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Enable automated backups</span>
              </label>
            </FormField>
            </div>


            <FormField label="Services" required>
              <Input
                value={editFormData?.services || ''}
                onChange={(e) => setEditFormData({ ...editFormData, services: e.target.value })}
                placeholder="e.g., Web Server, Database"
              />
            </FormField>

            <FormField label="Remarks">
              <textarea
                value={editFormData.remarks || ''}
                onChange={(e) => setEditFormData({ ...editFormData, remarks: e.target.value })}
                placeholder="Additional notes or remarks"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </FormField>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <Button variant="outline" onClick={() => setShowEditModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditSubmit} loading={loading}>
                Save Changes
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  );
};