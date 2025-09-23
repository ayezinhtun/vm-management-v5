import { useState, useEffect } from 'react';
import { supabase, handleSupabaseError, handleSupabaseSuccess } from '../lib/supabase';
import { VM, Customer, Contract, GPAccount, Contact, AuditLog, ActivityLog, Cluster, Node } from '../types';
import { showToast } from '../components/ui/Toast';

// Helper function to add audit log
const addAuditLog = async (
  tableName: string,
  operation: 'CREATE' | 'UPDATE' | 'DELETE',
  recordId: string,
  oldValues: any,
  newValues: any,
  changedBy: string,
  description: string
) => {
  try {
    await supabase.from('audit_logs').insert({
      table_name: tableName,
      operation,
      record_id: recordId,
      old_values: oldValues,
      new_values: newValues,
      changed_by: changedBy,
      description
    });
  } catch (error) {
    console.error('Failed to add audit log:', error);
  }
};

// Helper function to add activity log
const addActivityLog = async (
  action: string,
  entityType: 'VM' | 'Customer' | 'Contract' | 'GPAccount' | 'Contact' | 'Cluster' | 'Node',
  entityId: string,
  entityName: string,
  user: string,
  details: string,
  severity: 'info' | 'warning' | 'error' | 'success' = 'info'
) => {
  try {
    await supabase.from('activity_logs').insert({
      action,
      entity_type: entityType,
      entity_id: entityId,
      entity_name: entityName,
      user_name: user,
      details,
      severity
    });
  } catch (error) {
    console.error('Failed to add activity log:', error);
  }
};

export const useSupabaseDataStore = () => {
  const [vms, setVMs] = useState<VM[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [gpAccounts, setGPAccounts] = useState<GPAccount[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [loading, setLoading] = useState(false);

  // Load all data from Supabase
  const loadAllData = async () => {
    try {
      setLoading(true);
      
      const [
        vmsResult,
        customersResult,
        contractsResult,
        clustersResult,
        nodesResult,
        gpAccountsResult,
        contactsResult,
        auditLogsResult,
        activityLogsResult
      ] = await Promise.all([
        supabase.from('vms').select('*').order('created_at', { ascending: false }),
        supabase.from('customers').select('*').order('created_at', { ascending: false }),
        supabase.from('contracts').select('*').order('created_at', { ascending: false }),
        supabase.from('clusters').select('*').order('created_at', { ascending: false }),
        supabase.from('nodes').select('*').order('created_at', { ascending: false }),
        supabase.from('gp_accounts').select('*').order('created_at', { ascending: false }),
        supabase.from('contacts').select('*').order('created_at', { ascending: false }),
        supabase.from('audit_logs').select('*').order('timestamp', { ascending: false }).limit(100),
        supabase.from('activity_logs').select('*').order('timestamp', { ascending: false }).limit(100)
      ]);

      if (vmsResult.error) throw vmsResult.error;
      if (customersResult.error) throw customersResult.error;
      if (contractsResult.error) throw contractsResult.error;
      if (clustersResult.error) throw clustersResult.error;
      if (nodesResult.error) throw nodesResult.error;
      if (gpAccountsResult.error) throw gpAccountsResult.error;
      if (contactsResult.error) throw contactsResult.error;
      if (auditLogsResult.error) throw auditLogsResult.error;
      if (activityLogsResult.error) throw activityLogsResult.error;

      setVMs(vmsResult.data || []);
      setCustomers(customersResult.data || []);
      setContracts(contractsResult.data || []);
      setClusters(clustersResult.data || []);
      setNodes(nodesResult.data || []);
      setGPAccounts(gpAccountsResult.data || []);
      setContacts(contactsResult.data || []);
      setAuditLogs(auditLogsResult.data || []);
      setActivityLogs(activityLogsResult.data || []);

      return handleSupabaseSuccess(null, 'load all data');
    } catch (error) {
      showToast.error('Failed to load data');
      return handleSupabaseError(error, 'load all data');
    } finally {
      setLoading(false);
    }
  };

  // VM CRUD operations
  const createVM = async (vmData: Omit<VM, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setLoading(true);
     // Calculate resource requirements
      const cpuGHz = vmData.cpu_ghz;
      const ramGB = parseInt(vmData.ram.match(/(\d+)/)?.[1] || '0');
      const storageGB = parseInt(vmData.storage.match(/(\d+)/)?.[1] || '0');

      // Update node resources first
      const node = nodes.find(n => n.id === vmData.node_id);
      if (node) {
        await supabase.from('nodes').update({
          allocated_cpu_ghz: node.allocated_cpu_ghz + cpuGHz,
          available_cpu_ghz: node.available_cpu_ghz - cpuGHz,
          allocated_ram_gb: node.allocated_ram_gb + ramGB,
          available_ram_gb: node.available_ram_gb - ramGB,
          allocated_storage_gb: node.allocated_storage_gb + storageGB,
          available_storage_gb: node.available_storage_gb - storageGB,
          vm_count: node.vm_count + 1
        }).eq('id', vmData.node_id);
      }

      // Create VM
      const { data, error } = await supabase.from('vms').insert([vmData]).select().single();
      if (error) throw error;
      setVMs(prev => [data, ...prev]);
      await addAuditLog('vms', 'CREATE', data.id, null, data, 'System Admin', `Created VM: ${data.vm_name}`);
      await addActivityLog('VM Created', 'VM', data.id, data.vm_name, 'System Admin', `Created ${data.vm_name}`, 'success');
      showToast.success('VM created successfully');
      return handleSupabaseSuccess(data, 'create VM');
    } catch (error) {
      showToast.error('Failed to create VM');
      return handleSupabaseError(error, 'create VM');
    } finally {
      setLoading(false);
    }
  };

  const updateVM = async (id: string, updates: Partial<VM>) => {
    try {
      setLoading(true);
      const { data: oldData } = await supabase.from('vms').select('*').eq('id', id).single();
      const { data, error } = await supabase.from('vms').update(updates).eq('id', id).select().single();
      if (error) throw error;
      setVMs(prev => prev.map(vm => vm.id === id ? data : vm));
      await addAuditLog('vms', 'UPDATE', id, oldData, data, 'System Admin', `Updated VM: ${data.vm_name}`);
      showToast.success('VM updated successfully');
      return handleSupabaseSuccess(data, 'update VM');
    } catch (error) {
      showToast.error('Failed to update VM');
      return handleSupabaseError(error, 'update VM');
    } finally {
      setLoading(false);
    }
  };

  const deleteVM = async (id: string) => {
    try {
      setLoading(true);
      const { data: vmData } = await supabase.from('vms').select('*').eq('id', id).single();
      const { error } = await supabase.from('vms').delete().eq('id', id);
      if (error) throw error;
      setVMs(prev => prev.filter(vm => vm.id !== id));
      if (vmData) {
        await addAuditLog('vms', 'DELETE', id, vmData, null, 'System Admin', `Deleted VM: ${vmData.vm_name}`);
      }
      showToast.success('VM deleted successfully');
      return handleSupabaseSuccess(null, 'delete VM');
    } catch (error) {
      showToast.error('Failed to delete VM');
      return handleSupabaseError(error, 'delete VM');
    } finally {
      setLoading(false);
    }
  };

  // Cluster CRUD operations
  const createCluster = async (clusterData: Omit<Cluster, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('clusters').insert([clusterData]).select().single();
      if (error) throw error;
      setClusters(prev => [data, ...prev]);
      await addAuditLog('clusters', 'CREATE', data.id, null, data, 'System Admin', `Created cluster: ${data.cluster_name}`);
      showToast.success('Cluster created successfully');
      return handleSupabaseSuccess(data, 'create cluster');
    } catch (error) {
      showToast.error('Failed to create cluster');
      return handleSupabaseError(error, 'create cluster');
    } finally {
      setLoading(false);
    }
  };

  const updateCluster = async (id: string, updates: Partial<Cluster>) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('clusters').update(updates).eq('id', id).select().single();
      if (error) throw error;
      setClusters(prev => prev.map(cluster => cluster.id === id ? data : cluster));
      showToast.success('Cluster updated successfully');
      return handleSupabaseSuccess(data, 'update cluster');
    } catch (error) {
      showToast.error('Failed to update cluster');
      return handleSupabaseError(error, 'update cluster');
    } finally {
      setLoading(false);
    }
  };

  const deleteCluster = async (id: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.from('clusters').delete().eq('id', id);
      if (error) throw error;
      setClusters(prev => prev.filter(cluster => cluster.id !== id));
      showToast.success('Cluster deleted successfully');
      return handleSupabaseSuccess(null, 'delete cluster');
    } catch (error) {
      showToast.error('Failed to delete cluster');
      return handleSupabaseError(error, 'delete cluster');
    } finally {
      setLoading(false);
    }
  };

  // Contact CRUD operations
  const createContact = async (contactData: Omit<Contact, 'id' | 'created_at'>) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('contacts').insert([contactData]).select().single();
      if (error) throw error;
      setContacts(prev => [data, ...prev]);
      showToast.success('Contact created successfully');
      return handleSupabaseSuccess(data, 'create contact');
    } catch (error) {
      showToast.error('Failed to create contact');
      return handleSupabaseError(error, 'create contact');
    } finally {
      setLoading(false);
    }
  };

  const updateContact = async (id: string, updates: Partial<Contact>) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('contacts').update(updates).eq('id', id).select().single();
      if (error) throw error;
      setContacts(prev => prev.map(contact => contact.id === id ? data : contact));
      showToast.success('Contact updated successfully');
      return handleSupabaseSuccess(data, 'update contact');
    } catch (error) {
      showToast.error('Failed to update contact');
      return handleSupabaseError(error, 'update contact');
    } finally {
      setLoading(false);
    }
  };

  const deleteContact = async (id: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.from('contacts').delete().eq('id', id);
      if (error) throw error;
      setContacts(prev => prev.filter(contact => contact.id !== id));
      showToast.success('Contact deleted successfully');
      return handleSupabaseSuccess(null, 'delete contact');
    } catch (error) {
      showToast.error('Failed to delete contact');
      return handleSupabaseError(error, 'delete contact');
    } finally {
      setLoading(false);
    }
  };

  // Contract CRUD operations
  const createContract = async (contractData: Omit<Contract, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('contracts').insert([contractData]).select().single();
      if (error) throw error;
      setContracts(prev => [data, ...prev]);
      showToast.success('Contract created successfully');
      return handleSupabaseSuccess(data, 'create contract');
    } catch (error) {
      showToast.error('Failed to create contract');
      return handleSupabaseError(error, 'create contract');
    } finally {
      setLoading(false);
    }
  };

  const updateContract = async (id: string, updates: Partial<Contract>) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('contracts').update(updates).eq('id', id).select().single();
      if (error) throw error;
      setContracts(prev => prev.map(contract => contract.id === id ? data : contract));
      showToast.success('Contract updated successfully');
      return handleSupabaseSuccess(data, 'update contract');
    } catch (error) {
      showToast.error('Failed to update contract');
      return handleSupabaseError(error, 'update contract');
    } finally {
      setLoading(false);
    }
  };

  const deleteContract = async (id: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.from('contracts').delete().eq('id', id);
      if (error) throw error;
      setContracts(prev => prev.filter(contract => contract.id !== id));
      showToast.success('Contract deleted successfully');
      return handleSupabaseSuccess(null, 'delete contract');
    } catch (error) {
      showToast.error('Failed to delete contract');
      return handleSupabaseError(error, 'delete contract');
    } finally {
      setLoading(false);
    }
  };

  // Node CRUD operations
  const createNode = async (nodeData: Omit<Node, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('nodes').insert([nodeData]).select().single();
      if (error) throw error;
      setNodes(prev => [data, ...prev]);
      showToast.success('Node created successfully');
      return handleSupabaseSuccess(data, 'create node');
    } catch (error) {
      showToast.error('Failed to create node');
      return handleSupabaseError(error, 'create node');
    } finally {
      setLoading(false);
    }
  };

  const updateNode = async (id: string, updates: Partial<Node>) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('nodes').update(updates).eq('id', id).select().single();
      if (error) throw error;
      setNodes(prev => prev.map(node => node.id === id ? data : node));
      showToast.success('Node updated successfully');
      return handleSupabaseSuccess(data, 'update node');
    } catch (error) {
      showToast.error('Failed to update node');
      return handleSupabaseError(error, 'update node');
    } finally {
      setLoading(false);
    }
  };

  const deleteNode = async (id: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.from('nodes').delete().eq('id', id);
      if (error) throw error;
      setNodes(prev => prev.filter(node => node.id !== id));
      showToast.success('Node deleted successfully');
      return handleSupabaseSuccess(null, 'delete node');
    } catch (error) {
      showToast.error('Failed to delete node');
      return handleSupabaseError(error, 'delete node');
    } finally {
      setLoading(false);
    }
  };

  // GP Account CRUD operations
  const createGPAccount = async (gpAccountData: Omit<GPAccount, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('gp_accounts').insert([gpAccountData]).select().single();
      if (error) throw error;
      setGPAccounts(prev => [data, ...prev]);
      showToast.success('GP Account created successfully');
      return handleSupabaseSuccess(data, 'create GP account');
    } catch (error) {
      showToast.error('Failed to create GP Account');
      return handleSupabaseError(error, 'create GP account');
    } finally {
      setLoading(false);
    }
  };

  const updateGPAccount = async (id: string, updates: Partial<GPAccount>) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('gp_accounts').update(updates).eq('id', id).select().single();
      if (error) throw error;
      setGPAccounts(prev => prev.map(account => account.id === id ? data : account));
      showToast.success('GP Account updated successfully');
      return handleSupabaseSuccess(data, 'update GP account');
    } catch (error) {
      showToast.error('Failed to update GP Account');
      return handleSupabaseError(error, 'update GP account');
    } finally {
      setLoading(false);
    }
  };

  const deleteGPAccount = async (id: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.from('gp_accounts').delete().eq('id', id);
      if (error) throw error;
      setGPAccounts(prev => prev.filter(account => account.id !== id));
      showToast.success('GP Account deleted successfully');
      return handleSupabaseSuccess(null, 'delete GP account');
    } catch (error) {
      showToast.error('Failed to delete GP Account');
      return handleSupabaseError(error, 'delete GP account');
    } finally {
      setLoading(false);
    }
  };

  // Customer CRUD operations
  const createCustomer = async (
    customerData: { department_name: string },
    contactsData: Omit<Contact, 'id' | 'customer_id' | 'created_at'>[] = [],
    contractsData: Omit<Contract, 'id' | 'customer_id' | 'created_at' | 'updated_at'>[] = [],
    gpAccountsData: Omit<GPAccount, 'id' | 'customer_id' | 'created_at' | 'updated_at'>[] = [],
    clusterData: Omit<Cluster, 'id' | 'created_at' | 'updated_at'>[] = []
  ) => {
    try {
      setLoading(true);

      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .insert([customerData])
        .select()
        .single();

      if (customerError) throw customerError;

      // Update local customers state
      setCustomers(prev => [customer, ...prev]);

      const promises = [];

      if (contactsData.length > 0) {
        const contactsWithCustomerId = contactsData.map(contact => ({
          ...contact,
          customer_id: customer.id
        }));
        const contactPromise = supabase.from('contacts').insert(contactsWithCustomerId).select();
        promises.push(contactPromise);
      }

      if (contractsData.length > 0) {
        const contractsWithCustomerId = contractsData.map(contract => ({
          ...contract,
          customer_id: customer.id
        }));
        const contractPromise = supabase.from('contracts').insert(contractsWithCustomerId).select();
        promises.push(contractPromise);
      }

      if (gpAccountsData.length > 0) {
        const gpAccountsWithCustomerId = gpAccountsData.map(account => ({
          ...account,
          customer_id: customer.id
        }));
        const gpAccountPromise = supabase.from('gp_accounts').insert(gpAccountsWithCustomerId).select();
        promises.push(gpAccountPromise);
      }

      // Execute all promises and get the results
      const results = await Promise.all(promises);
      
      // Update local state with the new data
      let resultIndex = 0;
      if (contactsData.length > 0) {
        const contactResult = results[resultIndex++];
        if (contactResult.data) {
          setContacts(prev => [...contactResult.data, ...prev]);
        }
      }
      
      if (contractsData.length > 0) {
        const contractResult = results[resultIndex++];
        if (contractResult.data) {
          setContracts(prev => [...contractResult.data, ...prev]);
        }
      }
      
      if (gpAccountsData.length > 0) {
        const gpAccountResult = results[resultIndex++];
        if (gpAccountResult.data) {
          setGPAccounts(prev => [...gpAccountResult.data, ...prev]);
        }
      }

      await addAuditLog('customers', 'CREATE', customer.id, null, customer, 'System Admin', `Created customer: ${customer.department_name}`);
      await addActivityLog('Customer Created', 'Customer', customer.id, customer.department_name, 'System Admin', `Created customer ${customer.department_name}`, 'success');

      showToast.success('Customer created successfully');
      return handleSupabaseSuccess(customer, 'create customer');
    } catch (error) {
      showToast.error('Failed to create customer');
      return handleSupabaseError(error, 'create customer');
    } finally {
      setLoading(false);
    }
  };

  // Create customer only (without associated records)
  const createCustomerOnly = async (customerData: Omit<Customer, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setLoading(true);

      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .insert([customerData])
        .select()
        .single();

      if (customerError) throw customerError;

      // Update local customers state only
      setCustomers(prev => [customer, ...prev]);

      await addAuditLog('customers', 'CREATE', customer.id, null, customer, 'System Admin', `Created customer: ${customer.department_name}`);
      await addActivityLog('Customer Created', 'Customer', customer.id, customer.department_name, 'System Admin', `Created customer ${customer.department_name}`, 'success');

      showToast.success('Customer created successfully');
      return handleSupabaseSuccess(customer, 'create customer');
    } catch (error) {
      showToast.error('Failed to create customer');
      return handleSupabaseError(error, 'create customer');
    } finally {
      setLoading(false);
    }
  };

  // Create customer with associated records (for bulk operations)
  const createCustomerWithAssociatedRecords = async (
    customerData: { department_name: string },
    contactsData: Omit<Contact, 'id' | 'customer_id' | 'created_at'>[],
    contractsData: Omit<Contract, 'id' | 'customer_id' | 'created_at' | 'updated_at'>[],
    gpAccountsData: Omit<GPAccount, 'id' | 'customer_id' | 'created_at' | 'updated_at'>[],
    clusterData: Omit<Cluster, 'id' | 'created_at' | 'updated_at'>[]
  ) => {
    try {
      setLoading(true);

      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .insert([customerData])
        .select()
        .single();

      if (customerError) throw customerError;

      // Update local customers state only
      setCustomers(prev => [customer, ...prev]);

      const promises = [];

      if (contactsData.length > 0) {
        const contactsWithCustomerId = contactsData.map(contact => ({
          ...contact,
          customer_id: customer.id
        }));
        const contactPromise = supabase.from('contacts').insert(contactsWithCustomerId).select();
        promises.push(contactPromise);
      }

      if (contractsData.length > 0) {
        const contractsWithCustomerId = contractsData.map(contract => ({
          ...contract,
          customer_id: customer.id
        }));
        const contractPromise = supabase.from('contracts').insert(contractsWithCustomerId).select();
        promises.push(contractPromise);
      }

      if (gpAccountsData.length > 0) {
        const gpAccountsWithCustomerId = gpAccountsData.map(account => ({
          ...account,
          customer_id: customer.id
        }));
        const gpAccountPromise = supabase.from('gp_accounts').insert(gpAccountsWithCustomerId).select();
        promises.push(gpAccountPromise);
      }

      // Execute all promises and get the results
      const results = await Promise.all(promises);
      
      // Update local state with the new data
      let resultIndex = 0;
      if (contactsData.length > 0) {
        const contactResult = results[resultIndex++];
        if (contactResult.data) {
          setContacts(prev => [...contactResult.data, ...prev]);
        }
      }
      
      if (contractsData.length > 0) {
        const contractResult = results[resultIndex++];
        if (contractResult.data) {
          setContracts(prev => [...contractResult.data, ...prev]);
        }
      }
      
      if (gpAccountsData.length > 0) {
        const gpAccountResult = results[resultIndex++];
        if (gpAccountResult.data) {
          setGPAccounts(prev => [...gpAccountResult.data, ...prev]);
        }
      }

      await addAuditLog('customers', 'CREATE', customer.id, null, customer, 'System Admin', `Created customer with associated records: ${customer.department_name}`);
      await addActivityLog('Customer Created', 'Customer', customer.id, customer.department_name, 'System Admin', `Created customer ${customer.department_name} with associated records`, 'success');

      showToast.success('Customer and associated records created successfully');
      return handleSupabaseSuccess(customer, 'create customer with associated records');
    } catch (error) {
      showToast.error('Failed to create customer with associated records');
      return handleSupabaseError(error, 'create customer with associated records');
    } finally {
      setLoading(false);
    }
  };

  const updateCustomer = async (id: string, updates: Partial<Customer>) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('customers').update(updates).eq('id', id).select().single();
      if (error) throw error;
      setCustomers(prev => prev.map(customer => customer.id === id ? data : customer));
      showToast.success('Customer updated successfully');
      return handleSupabaseSuccess(data, 'update customer');
    } catch (error) {
      showToast.error('Failed to update customer');
      return handleSupabaseError(error, 'update customer');
    } finally {
      setLoading(false);
    }
  };

  const deleteCustomer = async (id: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.from('customers').delete().eq('id', id);
      if (error) throw error;
      setCustomers(prev => prev.filter(customer => customer.id !== id));
      showToast.success('Customer deleted successfully');
      return handleSupabaseSuccess(null, 'delete customer');
    } catch (error) {
      showToast.error('Failed to delete customer');
      return handleSupabaseError(error, 'delete customer');
    } finally {
      setLoading(false);
    }
  };

  // Helper functions
  const getClusterNodes = (clusterId: string) => nodes.filter(node => node.cluster_id === clusterId);
  const getCustomerContracts = (customerId: string): Contract[] => contracts.filter(contract => contract.customer_id === customerId);
  const getCustomerGPAccounts = (customerId: string): GPAccount[] => gpAccounts.filter(account => account.customer_id === customerId);
  const getCustomerContacts = (customerId: string): Contact[] => contacts.filter(contact => contact.customer_id === customerId);
  const getCustomerVMs = (customerId: string): VM[] => vms.filter(vm => vm.customer_id === customerId);
  const getNodeVMs = (nodeId: string): VM[] => vms.filter(vm => vm.node_id === nodeId);

  const getDashboardMetrics = () => {
    const today = new Date();
    const sevenDaysFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
  
    // Calculate password due dates
    const nearVMPasswordDue = vms.filter(vm => {
      if (!vm.next_password_due_date) return false;
      const dueDate = new Date(vm.next_password_due_date);
      return dueDate >= today && dueDate <= sevenDaysFromNow;
    }).length;
  
    const nearGPPasswordDue = gpAccounts.filter(gp => {
      if (!gp.next_password_due_date) return false;
      const dueDate = new Date(gp.next_password_due_date);
      return dueDate >= today && dueDate <= sevenDaysFromNow;
    }).length;
  
    const nearContractExpiry = contracts.filter(contract => {
      if (!contract.service_end_date) return false;
      const endDate = new Date(contract.service_end_date);
      return endDate >= today && endDate <= thirtyDaysFromNow && contract.status === 'Active';
    }).length;
  
    // Calculate overdue items
    const overdueVMPasswords = vms.filter(vm => {
      if (!vm.next_password_due_date) return false;
      const dueDate = new Date(vm.next_password_due_date);
      return dueDate < today;
    }).length;
  
    const overdueGPPasswords = gpAccounts.filter(gp => {
      if (!gp.next_password_due_date) return false;
      const dueDate = new Date(gp.next_password_due_date);
      return dueDate < today;
    }).length;
  
    const overdueContracts = contracts.filter(contract => {
      if (!contract.service_end_date) return false;
      const endDate = new Date(contract.service_end_date);
      return endDate < today && contract.status === 'Active';
    }).length;
  
    // Calculate resource totals from VMs
    const totalCPU = vms.reduce((sum, vm) => {
      const cpuMatch = vm.cpu.match(/(\d+)/);
      return sum + (cpuMatch ? parseInt(cpuMatch[1]) : 0);
    }, 0);
  
    const totalRAM = vms.reduce((sum, vm) => {
      const ramMatch = vm.ram.match(/(\d+)/);
      return sum + (ramMatch ? parseInt(ramMatch[1]) : 0);
    }, 0);
  
    const totalStorage = vms.reduce((sum, vm) => {
      const storageMatch = vm.storage.match(/(\d+)/);
      return sum + (storageMatch ? parseInt(storageMatch[1]) : 0);
    }, 0);
  
// Calculate CPU, RAM, Storage totals from nodes
const totalCPUGHz = nodes.reduce((sum, node) => sum + (node.total_cpu_ghz || 0), 0);
const allocatedCPUGHz = nodes.reduce((sum, node) => sum + (node.allocated_cpu_ghz || 0), 0);
const availableCPUGHz = nodes.reduce((sum, node) => sum + (node.available_cpu_ghz || 0), 0);

const totalRAMGB = nodes.reduce((sum, node) => sum + (node.total_ram_gb || 0), 0);
const allocatedRAMGB = nodes.reduce((sum, node) => sum + (node.allocated_ram_gb || 0), 0);
const availableRAMGB = nodes.reduce((sum, node) => sum + (node.available_ram_gb || 0), 0);

const totalStorageGB = nodes.reduce((sum, node) => sum + (node.storage_capacity_gb || 0), 0);
const allocatedStorageGB = nodes.reduce((sum, node) => sum + (node.allocated_storage_gb || 0), 0);
const availableStorageGB = nodes.reduce((sum, node) => sum + (node.available_storage_gb || 0), 0);

return {
  totalVMs: vms.length,
  activeVMs: vms.filter(vm => vm.status === 'Active').length,
  inactiveVMs: vms.filter(vm => vm.status === 'Inactive').length,
  maintenanceVMs: vms.filter(vm => vm.status === 'Maintenance').length,
  totalCustomers: customers.length,
  totalContracts: contracts.length,
  activeContracts: contracts.filter(c => c.status === 'Active').length,
  totalGPAccounts: gpAccounts.length,
  activeGPAccounts: gpAccounts.filter(gp => gp.status === 'Active').length,
  totalRevenue: contracts.filter(c => c.status === 'Active').reduce((sum, c) => sum + (c.value || 0), 0),
  nearVMPasswordDue,
  nearGPPasswordDue,
  nearContractExpiry,
  overdueVMPasswords,
  overdueGPPasswords,
  overdueContracts,
  totalCPU,
  totalRAM,
  totalStorage,
  totalCPUGHz,
  allocatedCPUGHz,
  availableCPUGHz,
  totalRAMGB,
  allocatedRAMGB,
  availableRAMGB,
  totalStorageGB,
  allocatedStorageGB,
  availableStorageGB
};
  };

  useEffect(() => {
    loadAllData();
  }, []);

  return {
    vms, customers, contracts, gpAccounts, contacts, auditLogs, activityLogs, clusters, nodes, loading,
    createVM, updateVM, deleteVM, createCustomer, updateCustomer, deleteCustomer,
    createContact, updateContact, deleteContact, createContract, updateContract, deleteContract,
    createCluster, updateCluster, deleteCluster, createNode, updateNode, deleteNode,
    createGPAccount, updateGPAccount, deleteGPAccount, createCustomerOnly, createCustomerWithAssociatedRecords,
    getClusterNodes, getCustomerContracts, getCustomerGPAccounts, getCustomerContacts, getCustomerVMs, getDashboardMetrics, getNodeVMs, loadAllData
  };
};