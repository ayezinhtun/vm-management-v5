import { useState, useEffect } from 'react';
import { Customer, Contact, Contract, GPAccount } from '../types';
import { showToast } from '../components/ui/Toast';

// Mock data stores
let customerStore: Customer[] = [
  {
    id: '1',
    department_name: 'IT Department',
    created_at: '2024-01-10T10:00:00Z',
    updated_at: '2024-01-10T10:00:00Z'
  },
  {
    id: '2',
    department_name: 'Finance Department',
    created_at: '2024-01-12T10:00:00Z',
    updated_at: '2024-01-12T10:00:00Z'
  },
  {
    id: '3',
    department_name: 'HR Department',
    created_at: '2024-01-14T10:00:00Z',
    updated_at: '2024-01-14T10:00:00Z'
  }
];

let contactStore: Contact[] = [
  {
    id: '1',
    customer_id: '1',
    name: 'John Smith',
    department: 'IT',
    email: 'john.smith@company.com',
    contact_number: '+1-555-0101',
    created_at: '2024-01-10T10:00:00Z'
  },
  {
    id: '2',
    customer_id: '2',
    name: 'Jane Doe',
    department: 'Finance',
    email: 'jane.doe@company.com',
    contact_number: '+1-555-0102',
    created_at: '2024-01-12T10:00:00Z'
  }
];

let contractStore: Contract[] = [
  {
    id: '1',
    customer_id: '1',
    contract_number: 'CT-2024-001',
    contract_name: 'Web Hosting Service',
    service_start_date: '2024-01-01',
    service_end_date: '2024-12-31',
    value: 5000,
    created_at: '2024-01-01T10:00:00Z'
  },
  {
    id: '2',
    customer_id: '2',
    contract_number: 'CT-2024-002',
    contract_name: 'Database Management',
    service_start_date: '2024-01-15',
    service_end_date: '2024-12-31',
    value: 8000,
    created_at: '2024-01-15T10:00:00Z'
  }
];

let gpAccountStore: GPAccount[] = [
  {
    id: '1',
    customer_id: '1',
    gp_ip: '10.0.2.100',
    gp_username: 'user001',
    gp_password: 'encrypted_password',
    account_created_date: '2024-01-01',
    last_password_changed_date: '2024-01-01',
    password_changer: 'Admin',
    account_creator: 'Admin',
    next_password_due_date: '2024-04-01',
    created_at: '2024-01-01T10:00:00Z'
  }
];

export const useCustomerData = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 300));
      setCustomers([...customerStore]);
    } catch (error) {
      showToast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const createCustomer = async (
    customerData: { department_name: string },
    contactsData: Omit<Contact, 'id' | 'customer_id' | 'created_at'>[],
    contractsData: Omit<Contract, 'id' | 'customer_id' | 'created_at'>[],
    gpAccountsData: Omit<GPAccount, 'id' | 'customer_id' | 'created_at'>[]
  ) => {
    try {
      setLoading(true);
      
      const customerId = Date.now().toString();
      const now = new Date().toISOString();
      
      // Create customer
      const newCustomer: Customer = {
        id: customerId,
        department_name: customerData.department_name,
        created_at: now,
        updated_at: now
      };
      
      // Create contacts
      const newContacts: Contact[] = contactsData.map(contact => ({
        ...contact,
        id: `contact_${Date.now()}_${Math.random()}`,
        customer_id: customerId,
        created_at: now
      }));
      
      // Create contracts
      const newContracts: Contract[] = contractsData.map(contract => ({
        ...contract,
        id: `contract_${Date.now()}_${Math.random()}`,
        customer_id: customerId,
        created_at: now
      }));
      
      // Create GP accounts
      const newGPAccounts: GPAccount[] = gpAccountsData.map(account => ({
        ...account,
        id: `gp_${Date.now()}_${Math.random()}`,
        customer_id: customerId,
        created_at: now
      }));

      // Simulate API calls
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update stores
      customerStore.push(newCustomer);
      contactStore.push(...newContacts);
      contractStore.push(...newContracts);
      gpAccountStore.push(...newGPAccounts);
      
      setCustomers([...customerStore]);
      
      showToast.success('Customer created successfully');
      return { success: true, data: newCustomer };
    } catch (error) {
      showToast.error('Failed to create customer');
      console.error('Create customer error:', error);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  const updateCustomer = async (id: string, updates: Partial<Customer>) => {
    try {
      setLoading(true);
      
      await new Promise(resolve => setTimeout(resolve, 600));
      
      const index = customerStore.findIndex(customer => customer.id === id);
      if (index === -1) {
        throw new Error('Customer not found');
      }

      customerStore[index] = {
        ...customerStore[index],
        ...updates,
        updated_at: new Date().toISOString()
      };
      
      setCustomers([...customerStore]);
      showToast.success('Customer updated successfully');
      return { success: true, data: customerStore[index] };
    } catch (error) {
      showToast.error('Failed to update customer');
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  const deleteCustomer = async (id: string) => {
    try {
      setLoading(true);
      
      await new Promise(resolve => setTimeout(resolve, 600));
      
      customerStore = customerStore.filter(customer => customer.id !== id);
      contactStore = contactStore.filter(contact => contact.customer_id !== id);
      contractStore = contractStore.filter(contract => contract.customer_id !== id);
      gpAccountStore = gpAccountStore.filter(account => account.customer_id !== id);
      
      setCustomers([...customerStore]);
      showToast.success('Customer deleted successfully');
      return { success: true };
    } catch (error) {
      showToast.error('Failed to delete customer');
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  const getCustomerContracts = (customerId: string): Contract[] => {
    return contractStore.filter(contract => contract.customer_id === customerId);
  };

  const getCustomerGPAccounts = (customerId: string): GPAccount[] => {
    return gpAccountStore.filter(account => account.customer_id === customerId);
  };

  const getCustomerContacts = (customerId: string): Contact[] => {
    return contactStore.filter(contact => contact.customer_id === customerId);
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  return {
    customers,
    loading,
    loadCustomers,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    getCustomerContracts,
    getCustomerGPAccounts,
    getCustomerContacts
  };
};