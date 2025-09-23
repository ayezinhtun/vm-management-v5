import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Plus, Download, Eye, Edit, Trash2, FileText, DollarSign, Calendar, AlertTriangle, Clock } from 'lucide-react';
import { Card } from '../ui/Card';
import { Table } from '../ui/Table';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { FormField } from '../ui/FormField';
import { useSupabaseDataStore as useDataStore } from '../../hooks/useSupabaseDataStore';
import { showToast } from '../ui/Toast';
import { Contract } from '../../types';

export const ContractManagement: React.FC = () => {
  const { 
    contracts, 
    customers, 
    loading, 
    createContract, 
    updateContract, 
    deleteContract 
  } = useDataStore();
  
  const [filteredContracts, setFilteredContracts] = useState<Contract[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [customerFilter, setCustomerFilter] = useState('all');
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [showContractDetails, setShowContractDetails] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [sortField, setSortField] = useState<string>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Form states
  const [createFormData, setCreateFormData] = useState({
    customer_id: '',
    contract_number: '',
    contract_name: '',
    service_start_date: '',
    service_end_date: '',
    value: 0,
    status: 'Active' as const
  });

  const [editFormData, setEditFormData] = useState<Partial<Contract>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    let filtered = contracts;

    if (searchTerm) {
      filtered = filtered.filter(contract =>
        contract.contract_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contract.contract_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(contract => contract.status === statusFilter);
    }

    if (customerFilter !== 'all') {
      filtered = filtered.filter(contract => contract.customer_id === customerFilter);
    }

    // Sort data
    filtered.sort((a, b) => {
      const aValue = a[sortField as keyof Contract];
      const bValue = b[sortField as keyof Contract];
      
      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    setFilteredContracts(filtered);
  }, [contracts, searchTerm, statusFilter, customerFilter, sortField, sortDirection]);

  const handleSort = (field: string) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const validateCreateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!createFormData.customer_id) newErrors.customer_id = 'Customer is required';
    if (!createFormData.contract_number.trim()) newErrors.contract_number = 'Contract number is required';
    if (!createFormData.contract_name.trim()) newErrors.contract_name = 'Contract name is required';
    if (!createFormData.service_start_date) newErrors.service_start_date = 'Service start date is required';
    if (!createFormData.service_end_date) newErrors.service_end_date = 'Service end date is required';
    if (createFormData.value <= 0) newErrors.value = 'Contract value must be greater than 0';

    // Validate date range
    if (createFormData.service_start_date && createFormData.service_end_date) {
      if (new Date(createFormData.service_start_date) >= new Date(createFormData.service_end_date)) {
        newErrors.service_end_date = 'End date must be after start date';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateSubmit = async () => {
    if (!validateCreateForm()) return;

    try {
      const result = await createContract(createFormData);
      if (result.success) {
        setShowCreateModal(false);
        setCreateFormData({
          customer_id: '',
          contract_number: '',
          contract_name: '',
          service_start_date: '',
          service_end_date: '',
          value: 0,
          status: 'Active'
        });
        setErrors({});
      }
    } catch (error) {
      console.error('Create contract error:', error);
    }
  };

  const handleEditSubmit = async () => {
    if (!editingContract || !editFormData) return;

    try {
      await updateContract(editingContract.id, editFormData);
      setShowEditModal(false);
      setEditingContract(null);
      setEditFormData({});
    } catch (error) {
      console.error('Edit contract error:', error);
    }
  };

  const handleDelete = async (contract: Contract) => {
    if (window.confirm(`Are you sure you want to delete contract "${contract.contract_number}"?`)) {
      await deleteContract(contract.id);
    }
  };

  const exportData = () => {
    const csvContent = [
      ['Contract Number', 'Contract Name', 'Customer', 'Status', 'End Date', 'Duration (Days)', 'Value', 'Created'].join(','),
      ...filteredContracts.map(contract => {
        const customer = customers.find(c => c.id === contract.customer_id);
        const duration = Math.ceil((new Date(contract.service_end_date).getTime() - new Date(contract.service_start_date).getTime()) / (1000 * 60 * 60 * 24));
        return [
          contract.contract_number,
          contract.contract_name,
          customer?.department_name || '',
          contract.status,
          contract.service_end_date,
          duration.toString(),
          contract.value.toString(),
          new Date(contract.created_at).toLocaleDateString()
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contracts_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    showToast.success('Contracts exported successfully');
  };

  const contractColumns = [
    { key: 'contract_number', label: 'Contract #', sortable: true },
    // { key: 'contract_name', label: 'Contract Name', sortable: true },
    { 
      key: 'customer_id', 
      label: 'Customer', 
      render: (value: string) => {
        const customer = customers.find(c => c.id === value);
        return customer?.department_name || 'Unknown';
      }
    },
    { 
      key: 'status', 
      label: 'Status', 
      sortable: true,
      render: (value: string) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value === 'Active' ? 'bg-green-100 text-green-800' :
          value === 'Expired' ? 'bg-red-100 text-red-800' :
          value === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {value}
        </span>
      )
    },
    { 
      key: 'service_end_date', 
      label: 'End Date', 
      sortable: true,
      render: (value: string) => {
        const endDate = new Date(value);
        const today = new Date();
        const daysUntilExpiry = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        return (
          <span className={`text-sm ${
            daysUntilExpiry <= 0 ? 'text-red-600 font-bold' :
            daysUntilExpiry <= 30 ? 'text-amber-600 font-medium' :
            'text-gray-600'
          }`}>
            {endDate.toLocaleDateString()}
            {daysUntilExpiry <= 0 && ' (EXPIRED)'}
            {daysUntilExpiry > 0 && daysUntilExpiry <= 30 && ' (EXPIRING)'}
          </span>
        );
      }
    },
    // { 
    //   key: 'duration', 
    //   label: 'Duration', 
    //   render: (value: any, contract: Contract) => {
    //     const duration = Math.ceil((new Date(contract.service_end_date).getTime() - new Date(contract.service_start_date).getTime()) / (1000 * 60 * 60 * 24));
    //     return `${duration} days`;
    //   }
    // },
    {
      key: 'actions',
      label: 'Actions',
      render: (value: any, contract: Contract) => (
        <div className="flex space-x-1">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSelectedContract(contract);
              setShowContractDetails(true);
            }}
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setEditingContract(contract);
              setEditFormData(contract);
              setShowEditModal(true);
            }}
            title="Edit Contract"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => handleDelete(contract)}
            title="Delete Contract"
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
          <h2 className="text-2xl font-bold text-gray-900">Contract Management</h2>
          <p className="text-gray-600 mt-1">Manage service contracts and billing agreements</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={exportData}>
            <Download className="w-4 h-4 mr-2" />
            Export ({filteredContracts.length})
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Contract
          </Button>
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Contracts</p>
              <p className="text-2xl font-bold text-gray-900">{contracts.length}</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Contracts</p>
              <p className="text-2xl font-bold text-green-600">
                {contracts.filter(contract => contract.status === 'Active').length}
              </p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <FileText className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-purple-600">
                ${contracts.filter(c => c.status === 'Active').reduce((sum, contract) => sum + contract.value, 0).toLocaleString()}
              </p>
            </div>
            <div className="p-2 bg-purple-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-purple-600" />
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Expiring Soon</p>
              <p className="text-2xl font-bold text-amber-600">
                {contracts.filter(contract => {
                  const endDate = new Date(contract.service_end_date);
                  const today = new Date();
                  const daysUntilExpiry = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                  return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
                }).length}
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
              <p className="text-sm text-gray-600">Overdue</p>
              <p className="text-2xl font-bold text-red-600">
                {contracts.filter(contract => {
                  const endDate = new Date(contract.service_end_date);
                  const today = new Date();
                  return endDate < today && contract.status === 'Active';
                }).length}
              </p>
            </div>
            <div className="p-2 bg-red-100 rounded-lg">
              <Clock className="w-5 h-5 text-red-600" />
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
              placeholder="Search contracts..."
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
            <option value="Expired">Expired</option>
            <option value="Pending">Pending</option>
            <option value="Cancelled">Cancelled</option>
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

      {/* Contracts Table */}
      <Card>
        <Table
          columns={contractColumns}
          data={filteredContracts}
          loading={loading}
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={handleSort}
        />
      </Card>

      {/* Create Contract Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Contract"
        size="lg"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Customer" required error={errors.customer_id}>
              <select
                value={createFormData.customer_id}
                onChange={(e) => setCreateFormData({ ...createFormData, customer_id: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.customer_id ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
              >
                <option value="">Select customer</option>
                {customers.map(customer => (
                  <option key={customer.id} value={customer.id}>
                    {customer.department_name}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Status" required>
              <select
                value={createFormData.status}
                onChange={(e) => setCreateFormData({ ...createFormData, status: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Active">Active</option>
                <option value="Pending">Pending</option>
                <option value="Expired">Expired</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </FormField>

            <FormField label="Contract Number" required error={errors.contract_number}>
              <Input
                value={createFormData.contract_number}
                onChange={(e) => setCreateFormData({ ...createFormData, contract_number: e.target.value })}
                placeholder="CT-2024-001"
                error={!!errors.contract_number}
              />
            </FormField>

            <FormField label="Contract Name" required error={errors.contract_name}>
              <Input
                value={createFormData.contract_name}
                onChange={(e) => setCreateFormData({ ...createFormData, contract_name: e.target.value })}
                placeholder="Web Hosting Service"
                error={!!errors.contract_name}
              />
            </FormField>

            <FormField label="Service Start Date" required error={errors.service_start_date}>
              <Input
                type="date"
                value={createFormData.service_start_date}
                onChange={(e) => setCreateFormData({ ...createFormData, service_start_date: e.target.value })}
                error={!!errors.service_start_date}
              />
            </FormField>

            <FormField label="Service End Date" required error={errors.service_end_date}>
              <Input
                type="date"
                value={createFormData.service_end_date}
                onChange={(e) => setCreateFormData({ ...createFormData, service_end_date: e.target.value })}
                error={!!errors.service_end_date}
              />
            </FormField>

            <FormField label="Contract Value (USD)" required error={errors.value}>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={createFormData.value}
                onChange={(e) => setCreateFormData({ ...createFormData, value: parseFloat(e.target.value) || 0 })}
                placeholder="5000.00"
                error={!!errors.value}
              />
            </FormField>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateSubmit} loading={loading}>
              Create Contract
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Contract Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title={`Edit Contract - ${editingContract?.contract_number}`}
        size="lg"
      >
        {editingContract && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Contract Number" required>
                <Input
                  value={editFormData.contract_number || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, contract_number: e.target.value })}
                  placeholder="CT-2024-001"
                />
              </FormField>

              <FormField label="Contract Name" required>
                <Input
                  value={editFormData.contract_name || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, contract_name: e.target.value })}
                  placeholder="Web Hosting Service"
                />
              </FormField>

              <FormField label="Status" required>
                <select
                  value={editFormData.status || 'Active'}
                  onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Active">Active</option>
                  <option value="Pending">Pending</option>
                  <option value="Expired">Expired</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </FormField>

              <FormField label="Contract Value (USD)" required>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editFormData.value || 0}
                  onChange={(e) => setEditFormData({ ...editFormData, value: parseFloat(e.target.value) || 0 })}
                  placeholder="5000.00"
                />
              </FormField>

              <FormField label="Service Start Date" required>
                <Input
                  type="date"
                  value={editFormData.service_start_date || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, service_start_date: e.target.value })}
                />
              </FormField>

              <FormField label="Service End Date" required>
                <Input
                  type="date"
                  value={editFormData.service_end_date || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, service_end_date: e.target.value })}
                />
              </FormField>
            </div>

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

      {/* Contract Details Modal */}
      <Modal
        isOpen={showContractDetails}
        onClose={() => setShowContractDetails(false)}
        title={`Contract Details - ${selectedContract?.contract_number}`}
        size="lg"
      >
        {selectedContract && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Contract Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Contract Number:</span> 
                    <span className="font-mono">{selectedContract.contract_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Contract Name:</span> 
                    <span>{selectedContract.contract_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Status:</span> 
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      selectedContract.status === 'Active' ? 'bg-green-100 text-green-800' :
                      selectedContract.status === 'Expired' ? 'bg-red-100 text-red-800' :
                      selectedContract.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedContract.status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Customer:</span> 
                    <span>{customers.find(c => c.id === selectedContract.customer_id)?.department_name}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Financial Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Contract Value:</span> 
                    <span className="font-semibold text-green-600">${selectedContract.value.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Service Start:</span> 
                    <span>{new Date(selectedContract.service_start_date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Service End:</span> 
                    <span>{new Date(selectedContract.service_end_date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Duration:</span> 
                    <span>
                      {Math.ceil((new Date(selectedContract.service_end_date).getTime() - new Date(selectedContract.service_start_date).getTime()) / (1000 * 60 * 60 * 24))} days
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Created:</span> 
                    <span>{new Date(selectedContract.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Last Updated:</span> 
                    <span>{new Date(selectedContract.updated_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <Button 
                variant="outline" 
                onClick={() => {
                  setEditingContract(selectedContract);
                  setEditFormData(selectedContract);
                  setShowContractDetails(false);
                  setShowEditModal(true);
                }}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Contract
              </Button>
              <Button 
                variant="danger"
                onClick={() => {
                  setShowContractDetails(false);
                  handleDelete(selectedContract);
                }}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Contract
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  );
};