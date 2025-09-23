import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Plus, Trash2, Check } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { FormField } from '../ui/FormField';
import { useSupabaseDataStore as useDataStore } from '../../hooks/useSupabaseDataStore';
import { showToast } from '../ui/Toast';

interface Contact {
  name: string;
  department: string;
  email: string;
  contact_number: string;
}

interface Contract {
  contract_number: string;
  contract_name: string;
  service_start_date: string;
  service_end_date: string;
  value: number;
}

interface GPAccount {
  gp_ip: string;
  gp_username: string;
  gp_password: string;
  account_created_date: string;
  last_password_changed_date: string;
  password_changer: string;
  account_creator: string;
  next_password_due_date: string;
}

interface CreateCustomerWizardProps {
  onSuccess: () => void;
}

export const CreateCustomerWizard: React.FC<CreateCustomerWizardProps> = ({ onSuccess }) => {
  const { createCustomer, loading } = useDataStore();
  const [currentStep, setCurrentStep] = useState(1);
  
  // Step 1: Customer Details
  const [departmentName, setDepartmentName] = useState('');
  const [contacts, setContacts] = useState<Contact[]>([
    { name: '', department: '', email: '', contact_number: '' }
  ]);

  // Step 2: Contracts
  const [contracts, setContracts] = useState<Contract[]>([
    { contract_number: '', contract_name: '', service_start_date: '', service_end_date: '', value: 0 }
  ]);

  // Step 3: GP Accounts
  const [gpAccounts, setGPAccounts] = useState<GPAccount[]>([
    { 
      gp_ip: '', 
      gp_username: '', 
      gp_password: '', 
      account_created_date: new Date().toISOString().split('T')[0], 
      last_password_changed_date: new Date().toISOString().split('T')[0], 
      password_changer: '', 
      account_creator: '',
      next_password_due_date: ''
    }
  ]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!departmentName.trim()) {
          newErrors.departmentName = 'Department name is required';
        }
        
        contacts.forEach((contact, index) => {
          if (!contact.name.trim()) {
            newErrors[`contact_${index}_name`] = 'Contact name is required';
          }
          if (!contact.email.trim()) {
            newErrors[`contact_${index}_email`] = 'Email is required';
          } else if (!/\S+@\S+\.\S+/.test(contact.email)) {
            newErrors[`contact_${index}_email`] = 'Invalid email format';
          }
          if (!contact.contact_number.trim()) {
            newErrors[`contact_${index}_contact_number`] = 'Contact number is required';
          }
        });
        break;

      case 2:
        contracts.forEach((contract, index) => {
          if (!contract.contract_number.trim()) {
            newErrors[`contract_${index}_number`] = 'Contract number is required';
          }
          if (!contract.contract_name.trim()) {
            newErrors[`contract_${index}_name`] = 'Contract name is required';
          }
          if (contract.value <= 0) {
            newErrors[`contract_${index}_value`] = 'Contract value must be greater than 0';
          }
        });
        break;

      case 3:
        gpAccounts.forEach((account, index) => {
          if (!account.gp_ip.trim()) {
            newErrors[`gp_${index}_ip`] = 'GP IP is required';
          }
          if (!account.gp_username.trim()) {
            newErrors[`gp_${index}_username`] = 'GP Username is required';
          }
          if (!account.password_changer.trim()) {
            newErrors[`gp_${index}_password_changer`] = 'Password changer is required';
          }
          if (!account.account_creator.trim()) {
            newErrors[`gp_${index}_account_creator`] = 'Account creator is required';
          }
        });
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
    setErrors({});
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) return;

    try {
      // Filter out empty entries
      const validContacts = contacts.filter(contact => 
        contact.name.trim() && contact.email.trim() && contact.contact_number.trim()
      );
      const validContracts = contracts.filter(contract => 
        contract.contract_number.trim() && contract.contract_name.trim()
      ).map(contract => ({
        ...contract,
        status: 'Active' as const
      }));
      const validGPAccounts = gpAccounts.filter(account => 
        account.gp_ip.trim() && account.gp_username.trim()
      ).map(account => ({
        ...account,
        status: 'Active' as const
      }));

      const result = await createCustomer(
        { department_name: departmentName },
        validContacts,
        validContracts,
        validGPAccounts,
        [] // Empty cluster data for now
      );

      if (result.success) {
        onSuccess();
      }
    } catch (error) {
      console.error('Submit error:', error);
    }
  };

  // Contact management functions
  const addContact = () => {
    setContacts([...contacts, { name: '', department: '', email: '', contact_number: '' }]);
  };

  const removeContact = (index: number) => {
    if (contacts.length > 1) {
      setContacts(contacts.filter((_, i) => i !== index));
    }
  };

  const updateContact = (index: number, field: keyof Contact, value: string) => {
    const updatedContacts = [...contacts];
    updatedContacts[index] = { ...updatedContacts[index], [field]: value };
    setContacts(updatedContacts);
  };

  // Contract management functions
  const addContract = () => {
    setContracts([...contracts, { contract_number: '', contract_name: '', service_start_date: '', service_end_date: '', value: 0 }]);
  };

  const removeContract = (index: number) => {
    if (contracts.length > 1) {
      setContracts(contracts.filter((_, i) => i !== index));
    }
  };

  const updateContract = (index: number, field: keyof Contract, value: string | number) => {
    const updatedContracts = [...contracts];
    updatedContracts[index] = { ...updatedContracts[index], [field]: value };
    setContracts(updatedContracts);
  };

  // GP Account management functions
  const addGPAccount = () => {
    setGPAccounts([...gpAccounts, { 
      gp_ip: '', 
      gp_username: '', 
      gp_password: '', 
      account_created_date: new Date().toISOString().split('T')[0], 
      last_password_changed_date: new Date().toISOString().split('T')[0], 
      password_changer: '', 
      account_creator: '',
      next_password_due_date: ''
    }]);
  };

  const removeGPAccount = (index: number) => {
    if (gpAccounts.length > 1) {
      setGPAccounts(gpAccounts.filter((_, i) => i !== index));
    }
  };

  const updateGPAccount = (index: number, field: keyof GPAccount, value: string) => {
    const updatedGPAccounts = [...gpAccounts];
    updatedGPAccounts[index] = { ...updatedGPAccounts[index], [field]: value };
    setGPAccounts(updatedGPAccounts);
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <FormField label="Department Name" required error={errors.departmentName}>
        <Input
          value={departmentName}
          onChange={(e) => setDepartmentName(e.target.value)}
          placeholder="Enter department name (e.g., IT Department)"
          error={!!errors.departmentName}
        />
      </FormField>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold text-gray-900">Contact Persons</h4>
          <Button variant="outline" size="sm" onClick={addContact}>
            <Plus className="w-4 h-4 mr-1" />
            Add Contact
          </Button>
        </div>

        <div className="space-y-4">
          {contacts.map((contact, index) => (
            <motion.div
              key={index}
              className="p-4 border border-gray-200 rounded-lg"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex justify-between items-start mb-4">
                <h5 className="font-medium text-gray-700">Contact {index + 1}</h5>
                {contacts.length > 1 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeContact(index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Name" required error={errors[`contact_${index}_name`]}>
                  <Input
                    value={contact.name}
                    onChange={(e) => updateContact(index, 'name', e.target.value)}
                    placeholder="Contact name"
                    error={!!errors[`contact_${index}_name`]}
                  />
                </FormField>

                <FormField label="Department">
                  <Input
                    value={contact.department}
                    onChange={(e) => updateContact(index, 'department', e.target.value)}
                    placeholder="Department (optional)"
                  />
                </FormField>

                <FormField label="Email" required error={errors[`contact_${index}_email`]}>
                  <Input
                    type="email"
                    value={contact.email}
                    onChange={(e) => updateContact(index, 'email', e.target.value)}
                    placeholder="email@example.com"
                    error={!!errors[`contact_${index}_email`]}
                  />
                </FormField>

                <FormField label="Contact Number" required error={errors[`contact_${index}_contact_number`]}>
                  <Input
                    value={contact.contact_number}
                    onChange={(e) => updateContact(index, 'contact_number', e.target.value)}
                    placeholder="Phone number"
                    error={!!errors[`contact_${index}_contact_number`]}
                  />
                </FormField>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold text-gray-900">Contracts & Billing</h4>
        <Button variant="outline" size="sm" onClick={addContract}>
          <Plus className="w-4 h-4 mr-1" />
          Add Contract
        </Button>
      </div>

      <div className="space-y-4">
        {contracts.map((contract, index) => (
          <motion.div
            key={index}
            className="p-4 border border-gray-200 rounded-lg"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex justify-between items-start mb-4">
              <h5 className="font-medium text-gray-700">Contract {index + 1}</h5>
              {contracts.length > 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeContract(index)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Contract Number" required error={errors[`contract_${index}_number`]}>
                <Input
                  value={contract.contract_number}
                  onChange={(e) => updateContract(index, 'contract_number', e.target.value)}
                  placeholder="CT-2024-001"
                  error={!!errors[`contract_${index}_number`]}
                />
              </FormField>

              <FormField label="Contract Name" required error={errors[`contract_${index}_name`]}>
                <Input
                  value={contract.contract_name}
                  onChange={(e) => updateContract(index, 'contract_name', e.target.value)}
                  placeholder="Web Hosting Service"
                  error={!!errors[`contract_${index}_name`]}
                />
              </FormField>

              <FormField label="Service Start Date">
                <Input
                  type="date"
                  value={contract.service_start_date}
                  onChange={(e) => updateContract(index, 'service_start_date', e.target.value)}
                />
              </FormField>

              <FormField label="Service End Date">
                <Input
                  type="date"
                  value={contract.service_end_date}
                  onChange={(e) => updateContract(index, 'service_end_date', e.target.value)}
                />
              </FormField>

              <FormField label="Contract Value (USD)" required error={errors[`contract_${index}_value`]}>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={contract.value}
                  onChange={(e) => updateContract(index, 'value', parseFloat(e.target.value) || 0)}
                  placeholder="5000.00"
                  error={!!errors[`contract_${index}_value`]}
                />
              </FormField>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold text-gray-900">Global Protect Accounts</h4>
        <Button variant="outline" size="sm" onClick={addGPAccount}>
          <Plus className="w-4 h-4 mr-1" />
          Add GP Account
        </Button>
      </div>

      <div className="space-y-4">
        {gpAccounts.map((account, index) => (
          <motion.div
            key={index}
            className="p-4 border border-gray-200 rounded-lg"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex justify-between items-start mb-4">
              <h5 className="font-medium text-gray-700">GP Account {index + 1}</h5>
              {gpAccounts.length > 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeGPAccount(index)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="GP IP" required error={errors[`gp_${index}_ip`]}>
                <Input
                  value={account.gp_ip}
                  onChange={(e) => updateGPAccount(index, 'gp_ip', e.target.value)}
                  placeholder="10.0.2.100"
                  error={!!errors[`gp_${index}_ip`]}
                />
              </FormField>

              <FormField label="GP Username" required error={errors[`gp_${index}_username`]}>
                <Input
                  value={account.gp_username}
                  onChange={(e) => updateGPAccount(index, 'gp_username', e.target.value)}
                  placeholder="user001"
                  error={!!errors[`gp_${index}_username`]}
                />
              </FormField>

              <FormField label="GP Password">
                <Input
                  type="password"
                  value={account.gp_password}
                  onChange={(e) => updateGPAccount(index, 'gp_password', e.target.value)}
                  placeholder="Password (optional)"
                />
              </FormField>

              <FormField label="Account Created Date">
                <Input
                  type="date"
                  value={account.account_created_date}
                  onChange={(e) => updateGPAccount(index, 'account_created_date', e.target.value)}
                />
              </FormField>

              <FormField label="Last Password Changed" required>
                <Input
                  type="date"
                  value={account.last_password_changed_date}
                  onChange={(e) => updateGPAccount(index, 'last_password_changed_date', e.target.value)}
                />
              </FormField>

              <FormField label="Password Changer" required error={errors[`gp_${index}_password_changer`]}>
                <Input
                  value={account.password_changer}
                  onChange={(e) => updateGPAccount(index, 'password_changer', e.target.value)}
                  placeholder="Who changed the password"
                  error={!!errors[`gp_${index}_password_changer`]}
                />
              </FormField>

              <FormField label="Account Creator" required error={errors[`gp_${index}_account_creator`]}>
                <Input
                  value={account.account_creator}
                  onChange={(e) => updateGPAccount(index, 'account_creator', e.target.value)}
                  placeholder="Who created the account"
                  error={!!errors[`gp_${index}_account_creator`]}
                />
              </FormField>

              <FormField label="Next Password Due Date">
                <Input
                  type="date"
                  value={account.next_password_due_date}
                  onChange={(e) => updateGPAccount(index, 'next_password_due_date', e.target.value)}
                />
              </FormField>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );

  const steps = [
    { number: 1, title: 'Customer Details', content: renderStep1() },
    { number: 2, title: 'Contracts & Billing', content: renderStep2() },
    { number: 3, title: 'GP Accounts', content: renderStep3() }
  ];

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center">
            <div className={`
              w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors
              ${currentStep >= step.number 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-600'
              }
            `}>
              {currentStep > step.number ? (
                <Check className="w-5 h-5" />
              ) : (
                step.number
              )}
            </div>
            <span className="ml-3 text-sm font-medium text-gray-700">{step.title}</span>
            {index < steps.length - 1 && (
              <div className={`
                w-16 h-0.5 mx-4 transition-colors
                ${currentStep > step.number ? 'bg-blue-600' : 'bg-gray-200'}
              `} />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="min-h-[400px]"
        >
          {steps[currentStep - 1].content}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t border-gray-200">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 1}
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Previous
        </Button>

        {currentStep < 3 ? (
          <Button onClick={handleNext}>
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} loading={loading}>
            <Check className="w-4 h-4 mr-2" />
            Create Customer
          </Button>
        )}
      </div>
    </div>
  );
};