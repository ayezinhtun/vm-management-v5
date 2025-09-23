import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Plus, Download, Eye, Edit, Trash2, Shield, Key, Clock, Calendar } from 'lucide-react';
import { Card } from '../ui/Card';
import { Table } from '../ui/Table';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { FormField } from '../ui/FormField';
import { useSupabaseDataStore as useDataStore } from '../../hooks/useSupabaseDataStore';
import { showToast } from '../ui/Toast';
import { GPAccount } from '../../types';

export const GPAccountManagement: React.FC = () => {
  const { 
    gpAccounts, 
    customers, 
    loading, 
    createGPAccount, 
    updateGPAccount, 
    deleteGPAccount 
  } = useDataStore();
  
  const [filteredAccounts, setFilteredAccounts] = useState<GPAccount[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [customerFilter, setCustomerFilter] = useState('all');
  const [selectedAccount, setSelectedAccount] = useState<GPAccount | null>(null);
  const [showAccountDetails, setShowAccountDetails] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<GPAccount | null>(null);
  const [sortField, setSortField] = useState<string>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Form states
  const [createFormData, setCreateFormData] = useState({
    customer_id: '',
    gp_ip: '',
    gp_username: '',
    gp_password: '',
    account_created_date: new Date().toISOString().split('T')[0],
    last_password_changed_date: new Date().toISOString().split('T')[0],
    password_changer: '',
    account_creator: '',
    next_password_due_date: '',
    status: 'Active' as const
  });

  const [editFormData, setEditFormData] = useState<Partial<GPAccount>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    let filtered = gpAccounts;

    if (searchTerm) {
      filtered = filtered.filter(account =>
        account.gp_username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.gp_ip.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.account_creator.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.password_changer.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(account => account.status === statusFilter);
    }

    if (customerFilter !== 'all') {
      filtered = filtered.filter(account => account.customer_id === customerFilter);
    }

    // Sort data
    filtered.sort((a, b) => {
      const aValue = a[sortField as keyof GPAccount];
      const bValue = b[sortField as keyof GPAccount];
      
      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    setFilteredAccounts(filtered);
  }, [gpAccounts, searchTerm, statusFilter, customerFilter, sortField, sortDirection]);

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
    if (!createFormData.gp_ip.trim()) newErrors.gp_ip = 'GP IP is required';
    if (!createFormData.gp_username.trim()) newErrors.gp_username = 'GP Username is required';
    if (!createFormData.password_changer.trim()) newErrors.password_changer = 'Password changer is required';
    if (!createFormData.account_creator.trim()) newErrors.account_creator = 'Account creator is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateSubmit = async () => {
    if (!validateCreateForm()) return;

    try {
      const result = await createGPAccount(createFormData);
      if (result.success) {
        setShowCreateModal(false);
        setCreateFormData({
          customer_id: '',
          gp_ip: '',
          gp_username: '',
          gp_password: '',
          account_created_date: new Date().toISOString().split('T')[0],
          last_password_changed_date: new Date().toISOString().split('T')[0],
          password_changer: '',
          account_creator: '',
          next_password_due_date: '',
          status: 'Active'
        });
        setErrors({});
      }
    } catch (error) {
      console.error('Create GP Account error:', error);
    }
  };

  const handleEditSubmit = async () => {
    if (!editingAccount || !editFormData) return;

    try {
      await updateGPAccount(editingAccount.id, editFormData);
      setShowEditModal(false);
      setEditingAccount(null);
      setEditFormData({});
    } catch (error) {
      console.error('Edit GP Account error:', error);
    }
  };

  const handleDelete = async (account: GPAccount) => {
    if (window.confirm(`Are you sure you want to delete GP Account "${account.gp_username}"?`)) {
      await deleteGPAccount(account.id);
    }
  };

  const exportData = () => {
    const csvContent = [
      ['Username', 'IP Address', 'Customer', 'Creator', 'Next Password Due', 'Last Changed', 'Status', 'Created'].join(','),
      ...filteredAccounts.map(account => {
        const customer = customers.find(c => c.id === account.customer_id);
        return [
          account.gp_username,
          account.gp_ip,
          customer?.department_name || '',
          account.account_creator,
          new Date(account.next_password_due_date).toLocaleDateString(),
          new Date(account.last_password_changed_date).toLocaleDateString(),
          account.status,
          new Date(account.created_at).toLocaleDateString()
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gp_accounts_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    showToast.success('GP Accounts exported successfully');
  };

  const accountColumns = [
    { key: 'gp_username', label: 'Username', sortable: true },
    { key: 'gp_ip', label: 'IP Address', sortable: true },
    { 
      key: 'customer_id', 
      label: 'Customer', 
      render: (value: string) => {
        const customer = customers.find(c => c.id === value);
        return customer?.department_name || 'Unknown';
      }
    },
    { key: 'account_creator', label: 'Creator', sortable: true },
    { 
      key: 'next_password_due_date', 
      label: 'Next Password Due', 
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
      key: 'last_password_changed_date', 
      label: 'Last Changed', 
      sortable: true,
      render: (value: string) => new Date(value).toLocaleDateString()
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (value: any, account: GPAccount) => (
        <div className="flex space-x-1">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSelectedAccount(account);
              setShowAccountDetails(true);
            }}
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setEditingAccount(account);
              setEditFormData(account);
              setShowEditModal(true);
            }}
            title="Edit Account"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => handleDelete(account)}
            title="Delete Account"
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
          <h2 className="text-2xl font-bold text-gray-900">GP Account Management</h2>
          <p className="text-gray-600 mt-1">Manage Global Protect accounts and access credentials</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={exportData}>
            <Download className="w-4 h-4 mr-2" />
            Export ({filteredAccounts.length})
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create GP Account
          </Button>
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Accounts</p>
              <p className="text-2xl font-bold text-gray-900">{gpAccounts.length}</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Shield className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Accounts</p>
              <p className="text-2xl font-bold text-green-600">
                {gpAccounts.filter(account => account.status === 'Active').length}
              </p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <Key className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Password Due Soon</p>
              <p className="text-2xl font-bold text-amber-600">
                {gpAccounts.filter(account => {
                  const dueDate = new Date(account.next_password_due_date);
                  const today = new Date();
                  const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                  return daysUntilDue <= 7 && daysUntilDue > 0;
                }).length}
              </p>
            </div>
            <div className="p-2 bg-amber-100 rounded-lg">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Password Overdue</p>
              <p className="text-2xl font-bold text-red-600">
                {gpAccounts.filter(account => {
                  const dueDate = new Date(account.next_password_due_date);
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
              <p className="text-sm text-gray-600">Suspended</p>
              <p className="text-2xl font-bold text-orange-600">
                {gpAccounts.filter(account => account.status === 'Suspended').length}
              </p>
            </div>
            <div className="p-2 bg-orange-100 rounded-lg">
              <Shield className="w-5 h-5 text-orange-600" />
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
              placeholder="Search accounts..."
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
            <option value="Suspended">Suspended</option>
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

      {/* GP Accounts Table */}
      <Card>
        <Table
          columns={accountColumns}
          data={filteredAccounts}
          loading={loading}
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={handleSort}
        />
      </Card>

      {/* Create GP Account Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create GP Account"
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
                <option value="Inactive">Inactive</option>
                <option value="Suspended">Suspended</option>
              </select>
            </FormField>

            <FormField label="GP IP Address" required error={errors.gp_ip}>
              <Input
                value={createFormData.gp_ip}
                onChange={(e) => setCreateFormData({ ...createFormData, gp_ip: e.target.value })}
                placeholder="10.0.2.100"
                error={!!errors.gp_ip}
              />
            </FormField>

            <FormField label="GP Username" required error={errors.gp_username}>
              <Input
                value={createFormData.gp_username}
                onChange={(e) => setCreateFormData({ ...createFormData, gp_username: e.target.value })}
                placeholder="user001"
                error={!!errors.gp_username}
              />
            </FormField>

            <FormField label="GP Password">
              <Input
                type="password"
                value={createFormData.gp_password}
                onChange={(e) => setCreateFormData({ ...createFormData, gp_password: e.target.value })}
                placeholder="Password (optional)"
              />
            </FormField>

            <FormField label="Account Created Date" required>
              <Input
                type="date"
                value={createFormData.account_created_date}
                onChange={(e) => setCreateFormData({ ...createFormData, account_created_date: e.target.value })}
              />
            </FormField>

            <FormField label="Last Password Changed" required>
              <Input
                type="date"
                value={createFormData.last_password_changed_date}
                onChange={(e) => setCreateFormData({ ...createFormData, last_password_changed_date: e.target.value })}
              />
            </FormField>

            <FormField label="Next Password Due Date">
              <Input
                type="date"
                value={createFormData.next_password_due_date}
                onChange={(e) => setCreateFormData({ ...createFormData, next_password_due_date: e.target.value })}
              />
            </FormField>

            <FormField label="Password Changer" required error={errors.password_changer}>
              <Input
                value={createFormData.password_changer}
                onChange={(e) => setCreateFormData({ ...createFormData, password_changer: e.target.value })}
                placeholder="Who changed the password"
                error={!!errors.password_changer}
              />
            </FormField>

            <FormField label="Account Creator" required error={errors.account_creator}>
              <Input
                value={createFormData.account_creator}
                onChange={(e) => setCreateFormData({ ...createFormData, account_creator: e.target.value })}
                placeholder="Who created the account"
                error={!!errors.account_creator}
              />
            </FormField>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateSubmit} loading={loading}>
              Create GP Account
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit GP Account Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title={`Edit GP Account - ${editingAccount?.gp_username}`}
        size="lg"
      >
        {editingAccount && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <FormField label="Customer">
                <select
                  value={editFormData.customer_id || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, customer_id: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Customer</option>
                  {customers.map(customer => (
                    <option key={customer.id} value={customer.id}>
                      {customer.department_name}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="GP IP Address" required>
                <Input
                  value={editFormData.gp_ip || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, gp_ip: e.target.value })}
                  placeholder="10.0.2.100"
                />
              </FormField>

              <FormField label="GP Username">
                <Input
                  value={editFormData.gp_username || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, gp_username: e.target.value })}
                  placeholder="user001"
                />
              </FormField>

              <FormField label="GP Password">
                <Input
                  value={editFormData.gp_password || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, gp_password: e.target.value })}
                  placeholder="test123"
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
                  <option value="Suspended">Suspended</option>
                </select>
              </FormField>

              <FormField label="Next Password Due Date">
                <Input
                  type="date"
                  value={editFormData.next_password_due_date || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, next_password_due_date: e.target.value })}
                />
              </FormField>

              <FormField label="Password Changer" required>
                <Input
                  value={editFormData.password_changer || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, password_changer: e.target.value })}
                  placeholder="Who changed the password"
                />
              </FormField>

              <FormField label="Account Creator" required>
                <Input
                  value={editFormData.account_creator || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, account_creator: e.target.value })}
                  placeholder="Who created the account"
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

      {/* GP Account Details Modal */}
      <Modal
        isOpen={showAccountDetails}
        onClose={() => setShowAccountDetails(false)}
        title={`GP Account Details - ${selectedAccount?.gp_username}`}
        size="lg"
      >
        {selectedAccount && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Account Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Username:</span> 
                    <span className="font-mono">{selectedAccount.gp_username}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">IP Address:</span> 
                    <span className="font-mono">{selectedAccount.gp_ip}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Status:</span> 
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      selectedAccount.status === 'Active' ? 'bg-green-100 text-green-800' :
                      selectedAccount.status === 'Inactive' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {selectedAccount.status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Customer:</span> 
                    <span>{customers.find(c => c.id === selectedAccount.customer_id)?.department_name}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Password Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Account Created:</span> 
                    <span>{new Date(selectedAccount.account_created_date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Last Changed:</span> 
                    <span>{new Date(selectedAccount.last_password_changed_date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Changed By:</span> 
                    <span>{selectedAccount.password_changer}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Next Due:</span> 
                    <span className={`${
                      new Date(selectedAccount.next_password_due_date) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                        ? 'text-red-600 font-medium' : 'text-gray-900'
                    }`}>
                      {new Date(selectedAccount.next_password_due_date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Created By:</span> 
                    <span>{selectedAccount.account_creator}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <Button 
                variant="outline" 
                onClick={() => {
                  setEditingAccount(selectedAccount);
                  setEditFormData(selectedAccount);
                  setShowAccountDetails(false);
                  setShowEditModal(true);
                }}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Account
              </Button>
              <Button 
                variant="danger"
                onClick={() => {
                  setShowAccountDetails(false);
                  handleDelete(selectedAccount);
                }}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Account
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  );
};