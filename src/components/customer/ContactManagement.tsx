import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Mail, Phone, User, Save } from 'lucide-react';
import { Card } from '../ui/Card';
import { Table } from '../ui/Table';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { FormField } from '../ui/FormField';
import { Modal } from '../ui/Modal';
import { useSupabaseDataStore as useDataStore } from '../../hooks/useSupabaseDataStore';
import { showToast } from '../ui/Toast';
import { Contact } from '../../types';

interface ContactManagementProps {
  customerId: string;
  onClose: () => void;
}

export const ContactManagement: React.FC<ContactManagementProps> = ({ customerId, onClose }) => {
  const { 
    contacts, 
    loading, 
    createContact, 
    updateContact, 
    deleteContact, 
    getCustomerContacts 
  } = useDataStore();
  
  const [customerContacts, setCustomerContacts] = useState<Contact[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [showContactDetails, setShowContactDetails] = useState(false);

  // Form states
  const [createFormData, setCreateFormData] = useState({
    name: '',
    department: '',
    email: '',
    contact_number: ''
  });

  const [editFormData, setEditFormData] = useState<Partial<Contact>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setCustomerContacts(getCustomerContacts(customerId));
  }, [contacts, customerId, getCustomerContacts]);

  const validateForm = (data: any): boolean => {
    const newErrors: Record<string, string> = {};

    if (!data.name?.trim()) newErrors.name = 'Name is required';
    if (!data.email?.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(data.email)) newErrors.email = 'Invalid email format';
    if (!data.contact_number?.trim()) newErrors.contact_number = 'Contact number is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateSubmit = async () => {
    if (!validateForm(createFormData)) return;

    try {
      const result = await createContact({
        ...createFormData,
        customer_id: customerId
      });
      
      if (result.success) {
        setShowCreateModal(false);
        setCreateFormData({
          name: '',
          department: '',
          email: '',
          contact_number: ''
        });
        setErrors({});
      }
    } catch (error) {
      console.error('Create contact error:', error);
    }
  };

  const handleEditSubmit = async () => {
    if (!editingContact || !validateForm(editFormData)) return;

    try {
      await updateContact(editingContact.id, editFormData);
      setShowEditModal(false);
      setEditingContact(null);
      setEditFormData({});
      setErrors({});
    } catch (error) {
      console.error('Edit contact error:', error);
    }
  };

  const handleDelete = async (contact: Contact) => {
    if (window.confirm(`Are you sure you want to delete contact "${contact.name}"?`)) {
      await deleteContact(contact.id);
    }
  };

  const contactColumns = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'department', label: 'Department', sortable: true },
    { 
      key: 'email', 
      label: 'Email', 
      render: (value: string) => (
        <div className="flex items-center space-x-2">
          <Mail className="w-4 h-4 text-gray-400" />
          <span className="text-sm">{value}</span>
        </div>
      )
    },
    { 
      key: 'contact_number', 
      label: 'Phone', 
      render: (value: string) => (
        <div className="flex items-center space-x-2">
          <Phone className="w-4 h-4 text-gray-400" />
          <span className="text-sm">{value}</span>
        </div>
      )
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
      render: (value: any, contact: Contact) => (
        <div className="flex space-x-1">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSelectedContact(contact);
              setShowContactDetails(true);
            }}
            title="View Details"
          >
            <User className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setEditingContact(contact);
              setEditFormData(contact);
              setShowEditModal(true);
            }}
            title="Edit Contact"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => handleDelete(contact)}
            title="Delete Contact"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Contact Management</h3>
          <p className="text-sm text-gray-600">Manage contact persons for this customer</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Contact
        </Button>
      </div>

      {/* Contacts Table */}
      <Table
        columns={contactColumns}
        data={customerContacts}
        loading={loading}
      />

      {/* Create Contact Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Contact"
        size="md"
      >
        <div className="space-y-4">
          <FormField label="Name" required error={errors.name}>
            <Input
              value={createFormData.name}
              onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
              placeholder="Contact name"
              error={!!errors.name}
            />
          </FormField>

          <FormField label="Department">
            <Input
              value={createFormData.department}
              onChange={(e) => setCreateFormData({ ...createFormData, department: e.target.value })}
              placeholder="Department (optional)"
            />
          </FormField>

          <FormField label="Email" required error={errors.email}>
            <Input
              type="email"
              value={createFormData.email}
              onChange={(e) => setCreateFormData({ ...createFormData, email: e.target.value })}
              placeholder="email@example.com"
              error={!!errors.email}
            />
          </FormField>

          <FormField label="Contact Number" required error={errors.contact_number}>
            <Input
              value={createFormData.contact_number}
              onChange={(e) => setCreateFormData({ ...createFormData, contact_number: e.target.value })}
              placeholder="Phone number"
              error={!!errors.contact_number}
            />
          </FormField>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateSubmit} loading={loading}>
              <Save className="w-4 h-4 mr-2" />
              Create Contact
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Contact Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title={`Edit Contact - ${editingContact?.name}`}
        size="md"
      >
        {editingContact && (
          <div className="space-y-4">
            <FormField label="Name" required error={errors.name}>
              <Input
                value={editFormData.name || ''}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                placeholder="Contact name"
                error={!!errors.name}
              />
            </FormField>

            <FormField label="Department">
              <Input
                value={editFormData.department || ''}
                onChange={(e) => setEditFormData({ ...editFormData, department: e.target.value })}
                placeholder="Department (optional)"
              />
            </FormField>

            <FormField label="Email" required error={errors.email}>
              <Input
                type="email"
                value={editFormData.email || ''}
                onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                placeholder="email@example.com"
                error={!!errors.email}
              />
            </FormField>

            <FormField label="Contact Number" required error={errors.contact_number}>
              <Input
                value={editFormData.contact_number || ''}
                onChange={(e) => setEditFormData({ ...editFormData, contact_number: e.target.value })}
                placeholder="Phone number"
                error={!!errors.contact_number}
              />
            </FormField>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <Button variant="outline" onClick={() => setShowEditModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditSubmit} loading={loading}>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Contact Details Modal */}
      <Modal
        isOpen={showContactDetails}
        onClose={() => setShowContactDetails(false)}
        title={`Contact Details - ${selectedContact?.name}`}
        size="md"
      >
        {selectedContact && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <User className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="font-medium text-lg">{selectedContact.name}</p>
                    {selectedContact.department && (
                      <p className="text-sm text-gray-600">{selectedContact.department}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-gray-500" />
                  <span className="text-sm">{selectedContact.email}</span>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-gray-500" />
                  <span className="text-sm">{selectedContact.contact_number}</span>
                </div>
                
                <div className="text-xs text-gray-500 pt-2 border-t border-gray-200">
                  Created: {new Date(selectedContact.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <Button 
                variant="outline" 
                onClick={() => {
                  setEditingContact(selectedContact);
                  setEditFormData(selectedContact);
                  setShowContactDetails(false);
                  setShowEditModal(true);
                }}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Contact
              </Button>
              <Button 
                variant="danger"
                onClick={() => {
                  setShowContactDetails(false);
                  handleDelete(selectedContact);
                }}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Contact
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};