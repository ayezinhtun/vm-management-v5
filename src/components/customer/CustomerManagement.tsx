import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Users, Download, Eye, Edit, Trash2, Calendar, Phone, Mail, FileText } from 'lucide-react';
import { Card } from '../ui/Card';
import { Table } from '../ui/Table';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { CreateCustomerWizard } from './CreateCustomerWizard';
import { ContactManagement } from './ContactManagement';
import { useSupabaseDataStore as useDataStore } from '../../hooks/useSupabaseDataStore';
import { showToast } from '../ui/Toast';
import { Customer } from '../../types'; 

export const CustomerManagement: React.FC = () => {
  const { 
    customers, 
    loading, 
    deleteCustomer, 
    getCustomerContracts, 
    getCustomerGPAccounts, 
    getCustomerContacts 
  } = useDataStore();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCustomerDetails, setShowCustomerDetails] = useState(false);

  const handleDeleteCustomer = async (customer: Customer) => {
    if (window.confirm(`Are you sure you want to delete "${customer.department_name}"? This will also delete all associated contacts, contracts, and GP accounts.`)) {
      await deleteCustomer(customer.id);
    }
  };

  const exportData = () => {
    const csvContent = [
      ['Department Name', 'Contact Persons', 'Contracts', 'GP Accounts', 'Contract Expiry', 'Created Date', 'Last Updated'].join(','),
      ...customers.map(customer => {
        const contacts = getCustomerContacts(customer.id);
        const contracts = getCustomerContracts(customer.id);
        const gpAccounts = getCustomerGPAccounts(customer.id);
        
        // Get nearest contract expiry
        const nearestExpiry = contracts.length > 0 
          ? contracts.reduce((nearest, contract) => {
              const contractDate = new Date(contract.service_end_date);
              const nearestDate = new Date(nearest);
              return contractDate < nearestDate ? contract.service_end_date : nearest;
            }, contracts[0].service_end_date)
          : 'N/A';
        
        return [
          customer.department_name,
          contacts.map(c => `${c.name} (${c.email})`).join('; '),
          contracts.map(c => `${c.contract_number} - ${c.contract_name}`).join('; '),
          gpAccounts.map(gp => `${gp.gp_username} (${gp.gp_ip})`).join('; '),
          nearestExpiry,
          new Date(customer.created_at).toLocaleDateString(),
          new Date(customer.updated_at).toLocaleDateString()
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customers_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    showToast.success('Customer data exported successfully');
  };

  const customerColumns = [
    { key: 'department_name', label: 'Department Name', sortable: true },
    { 
      key: 'contact_persons', 
      label: 'Contact Persons', 
      render: (value: any, customer: Customer) => {
        const contacts = getCustomerContacts(customer.id);
        return (
          <div className="text-sm max-w-xs">
            {contacts.slice(0, 2).map((contact, index) => (
              <div key={contact.id} className="flex items-center space-x-1 mb-1">
                <Mail className="w-3 h-3 text-gray-400" />
                <span className="truncate">{contact.name}</span>
              </div>
            ))}
            {contacts.length > 2 && (
              <div className="text-gray-500 text-xs">+{contacts.length - 2} more</div>
            )}
            {contacts.length === 0 && (
              <span className="text-gray-400 text-xs">No contacts</span>
            )}
          </div>
        );
      }
    },
    { 
      key: 'contracts', 
      label: 'Contracts', 
      render: (value: any, customer: Customer) => {
        const contracts = getCustomerContracts(customer.id);
        return (
          <div className="text-sm max-w-xs">
            {contracts.slice(0, 2).map((contract, index) => (
              <div key={contract.id} className="mb-1">
                <span className="font-medium">{contract.contract_number}</span>
                <div className="text-gray-500 text-xs">{contract.contract_name}</div>
              </div>
            ))}
            {contracts.length > 2 && (
              <div className="text-gray-500 text-xs">+{contracts.length - 2} more</div>
            )}
            {contracts.length === 0 && (
              <span className="text-gray-400 text-xs">No contracts</span>
            )}
          </div>
        );
      }
    },
    { 
      key: 'contract_expiry', 
      label: 'Contract Expiry', 
      render: (value: any, customer: Customer) => {
        const contracts = getCustomerContracts(customer.id);
        if (contracts.length === 0) return <span className="text-gray-400 text-sm">N/A</span>;
        
        // Find nearest expiry
        const nearestExpiry = contracts.reduce((nearest, contract) => {
          const contractDate = new Date(contract.service_end_date);
          const nearestDate = new Date(nearest);
          return contractDate < nearestDate ? contract.service_end_date : nearest;
        }, contracts[0].service_end_date);
        
        const expiryDate = new Date(nearestExpiry);
        const today = new Date();
        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        return (
          <span className={`text-sm ${
            daysUntilExpiry <= 0 ? 'text-red-600 font-bold' :
            daysUntilExpiry <= 30 ? 'text-amber-600 font-medium' :
            'text-gray-600'
          }`}>
            {expiryDate.toLocaleDateString()}
            {daysUntilExpiry <= 0 && ' (EXPIRED)'}
            {daysUntilExpiry > 0 && daysUntilExpiry <= 30 && ' (EXPIRING)'}
          </span>
        );
      }
    },
    { 
      key: 'created_at', 
      label: 'Created', 
      sortable: true,
      render: (value: string) => new Date(value).toLocaleDateString()
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (value: any, customer: Customer) => (
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSelectedCustomer(customer);
              setShowCustomerDetails(true);
            }}
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setSelectedCustomer(customer);
              setShowContactModal(true);
            }}
            title="Manage Contacts"
          >
            <Phone className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => handleDeleteCustomer(customer)}
            title="Delete Customer"
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
          <h2 className="text-2xl font-bold text-gray-900">Customer Management</h2>
          <p className="text-gray-600 mt-1">Manage departments, contacts, contracts, and GP accounts</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={exportData}>
            <Download className="w-4 h-4 mr-2" />
            Export ({customers.length})
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Customer
          </Button>
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Customers</p>
              <p className="text-3xl font-bold text-gray-900">{customers.length}</p>
              <p className="text-sm text-gray-500 mt-1">Active departments</p>
            </div>
            <Users className="w-8 h-8 text-blue-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Contacts</p>
              <p className="text-3xl font-bold text-gray-900">
                {customers.reduce((sum, customer) => sum + getCustomerContacts(customer.id).length, 0)}
              </p>
              <p className="text-sm text-gray-500 mt-1">Contact persons</p>
            </div>
            <Phone className="w-8 h-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Contracts</p>
              <p className="text-3xl font-bold text-gray-900">
                {customers.reduce((sum, customer) => sum + getCustomerContracts(customer.id).filter(c => c.status === 'Active').length, 0)}
              </p>
              <p className="text-sm text-gray-500 mt-1">Service contracts</p>
            </div>
            <FileText className="w-8 h-8 text-purple-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Expiring Soon</p>
              <p className="text-3xl font-bold text-amber-600">
                {customers.reduce((sum, customer) => {
                  const contracts = getCustomerContracts(customer.id);
                  return sum + contracts.filter(contract => {
                    const endDate = new Date(contract.service_end_date);
                    const today = new Date();
                    const daysUntilExpiry = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
                  }).length;
                }, 0)}
              </p>
              <p className="text-sm text-gray-500 mt-1">Within 30 days</p>
            </div>
            <Calendar className="w-8 h-8 text-amber-600" />
          </div>
        </Card>
      </div>

      {/* Customers Table */}
      <Card>
        <Table
          columns={customerColumns}
          data={customers}
          loading={loading}
        />
      </Card>

      {/* Create Customer Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Customer"
        size="xl"
      >
        <CreateCustomerWizard 
          onSuccess={() => {
            setShowCreateModal(false);
          }}
        />
      </Modal>

      {/* Contact Management Modal */}
      <Modal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
        title={`Manage Contacts - ${selectedCustomer?.department_name}`}
        size="xl"
      >
        {selectedCustomer && (
          <ContactManagement 
            customerId={selectedCustomer.id}
            onClose={() => setShowContactModal(false)}
          />
        )}
      </Modal>

      {/* Customer Details Modal */}
      <Modal
        isOpen={showCustomerDetails}
        onClose={() => setShowCustomerDetails(false)}
        title={`Customer Details - ${selectedCustomer?.department_name}`}
        size="xl"
      >
        {selectedCustomer && (
          <div className="space-y-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Department Information</h4>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="font-medium text-lg">{selectedCustomer.department_name}</p>
                <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Created:</span>
                    <span>{new Date(selectedCustomer.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Last Updated:</span>
                    <span>{new Date(selectedCustomer.updated_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Contacts */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Contact Persons</h4>
              <div className="space-y-3">
                {getCustomerContacts(selectedCustomer.id).map(contact => (
                  <div key={contact.id} className="bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="font-medium">{contact.name}</p>
                        {contact.department && (
                          <p className="text-sm text-gray-600">{contact.department}</p>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Mail className="w-4 h-4" />
                          <span>{contact.email}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-600 mt-1">
                          <Phone className="w-4 h-4" />
                          <span>{contact.contact_number}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {getCustomerContacts(selectedCustomer.id).length === 0 && (
                  <p className="text-gray-500 text-center py-4">No contacts available</p>
                )}
              </div>
            </div>

            {/* Contracts */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Contracts</h4>
              <div className="space-y-3">
                {getCustomerContracts(selectedCustomer.id).map(contract => (
                  <div key={contract.id} className="bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="font-medium">{contract.contract_number}</p>
                        <p className="text-sm text-gray-600">{contract.contract_name}</p>
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-2 ${
                          contract.status === 'Active' ? 'bg-green-100 text-green-800' :
                          contract.status === 'Expired' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {contract.status}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">
                          {contract.service_start_date} to {contract.service_end_date}
                        </p>
                        <p className="text-sm font-medium text-green-600">${contract.value.toLocaleString()}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Duration: {Math.ceil((new Date(contract.service_end_date).getTime() - new Date(contract.service_start_date).getTime()) / (1000 * 60 * 60 * 24))} days
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {getCustomerContracts(selectedCustomer.id).length === 0 && (
                  <p className="text-gray-500 text-center py-4">No contracts available</p>
                )}
              </div>
            </div>

            {/* GP Accounts */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">GP Accounts</h4>
              <div className="space-y-3">
                {getCustomerGPAccounts(selectedCustomer.id).map(account => (
                  <div key={account.id} className="bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="font-medium font-mono">{account.gp_username}</p>
                        <p className="text-sm text-gray-600 font-mono">{account.gp_ip}</p>
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-2 ${
                          account.status === 'Active' ? 'bg-green-100 text-green-800' :
                          account.status === 'Suspended' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {account.status}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">
                          Last changed: {new Date(account.last_password_changed_date).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-gray-600">
                          Next due: {new Date(account.next_password_due_date).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Creator: {account.account_creator}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {getCustomerGPAccounts(selectedCustomer.id).length === 0 && (
                  <p className="text-gray-500 text-center py-4">No GP accounts available</p>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  );
};