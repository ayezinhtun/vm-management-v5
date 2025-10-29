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

  // const updateVM = async (id: string, updates: Partial<VM>) => {
  //   try {
  //     setLoading(true);
  //     const { data: oldData } = await supabase.from('vms').select('*').eq('id', id).single();
  //     const { data, error } = await supabase.from('vms').update(updates).eq('id', id).select().single();
  //     if (error) throw error;
  //     setVMs(prev => prev.map(vm => vm.id === id ? data : vm));
  //     await addAuditLog('vms', 'UPDATE', id, oldData, data, 'System Admin', `Updated VM: ${data.vm_name}`);
  //     showToast.success('VM updated successfully');
  //     return handleSupabaseSuccess(data, 'update VM');
  //   } catch (error) {
  //     showToast.error('Failed to update VM');
  //     return handleSupabaseError(error, 'update VM');
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const updateVM = async (id: string, updates: Partial<VM>) => {
    try {
      setLoading(true);
  
      // 1) Load current VM to compute deltas and know node_id
      const { data: current, error: fetchVmErr } = await supabase
        .from('vms')
        .select('*')
        .eq('id', id)
        .single();
      if (fetchVmErr) throw fetchVmErr;
  
      // 2) Compute "old" usage from current VM
      const oldCpu = Number(current.cpu_ghz ?? current.allocated_cpu_ghz ?? 0);
      // const oldRam = Number(current.ram_gb ?? current.allocated_ram_gb ?? 0);
      const oldRam = (() => {
        if (current.ram_gb != null) return Number(current.ram_gb);
        if (current.allocated_ram_gb != null) return Number(current.allocated_ram_gb);
        if (typeof current.ram === 'string') {
          const m = current.ram.match(/(\d+(\.\d+)?)/);
          return m ? Number(m[1]) : 0;
        }
        return 0;
      })();
      const oldStore = (() => {
        if (current.storage_gb != null) return Number(current.storage_gb);
        if (current.allocated_storage_gb != null) return Number(current.allocated_storage_gb);
        if (typeof current.storage === 'string') {
          const m = current.storage.match(/(\d+(\.\d+)?)/);
          return m ? Number(m[1]) : 0;
        }
        return 0;
      })();
  
      // 3) Compute "new" usage from updates (fall back to current if not provided)
      const newCpu = Number(updates.cpu_ghz ?? updates.allocated_cpu_ghz ?? current.cpu_ghz ?? current.allocated_cpu_ghz ?? 0);
      // const newRam = Number(updates.ram_gb ?? updates.allocated_ram_gb ?? current.ram_gb ?? current.allocated_ram_gb ?? 0);
      const newRam = (() => {
        if (updates.ram_gb != null) return Number(updates.ram_gb);
        if (updates.allocated_ram_gb != null) return Number(updates.allocated_ram_gb);
        if (typeof updates.ram === 'string') {
          const m = updates.ram.match(/(\d+(\.\d+)?)/);
          return m ? Number(m[1]) : 0;
        }
        // fall back to current values if not provided in updates
        if (current.ram_gb != null) return Number(current.ram_gb);
        if (current.allocated_ram_gb != null) return Number(current.allocated_ram_gb);
        if (typeof current.ram === 'string') {
          const m = current.ram.match(/(\d+(\.\d+)?)/);
          return m ? Number(m[1]) : 0;
        }
        return 0;
      })();
      const newStore = (() => {
        if (updates.storage_gb != null) return Number(updates.storage_gb);
        if (updates.allocated_storage_gb != null) return Number(updates.allocated_storage_gb);
        if (typeof updates.storage === 'string') {
          const m = updates.storage.match(/(\d+(\.\d+)?)/);
          return m ? Number(m[1]) : 0;
        }
        // fall back to current
        return oldStore;
      })();
  
      // 4) Deltas (what to apply to the node)
      const deltaCpu = newCpu - oldCpu;
      const deltaRam = newRam - oldRam;
      const deltaStore = newStore - oldStore;
  
      // 5) Persist VM update
      const { data: updatedVM, error: updVmErr } = await supabase
        .from('vms')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (updVmErr) throw updVmErr;
  
      // 6) Adjust parent node resources if any delta
      if (deltaCpu !== 0 || deltaRam !== 0 || deltaStore !== 0) {
        // Load node
        const { data: node, error: nodeErr } = await supabase
          .from('nodes')
          .select('*')
          .eq('id', current.node_id)
          .single();
        if (nodeErr) throw nodeErr;
  
        const currAllocCpu = Number(node.allocated_cpu_ghz ?? 0);
        const currAllocRam = Number(node.allocated_ram_gb ?? 0);
        const currAllocStore = Number(node.allocated_storage_gb ?? 0);
  
        const currAvailCpu = Number(node.available_cpu_ghz ?? 0);
        const currAvailRam = Number(node.available_ram_gb ?? 0);
        const currAvailStore = Number(node.available_storage_gb ?? 0);
  
        // allocated += delta; available -= delta
        const updatedNode = {
          allocated_cpu_ghz: Math.max(0, currAllocCpu + deltaCpu),
          allocated_ram_gb: Math.max(0, currAllocRam + deltaRam),
          allocated_storage_gb: Math.max(0, currAllocStore + deltaStore),
          available_cpu_ghz: currAvailCpu - deltaCpu,
          available_ram_gb: currAvailRam - deltaRam,
          available_storage_gb: currAvailStore - deltaStore,
          updated_at: new Date().toISOString(),
        };
  
        const { error: updNodeErr } = await supabase
          .from('nodes')
          .update(updatedNode)
          .eq('id', node.id);
        if (updNodeErr) throw updNodeErr;
  
        // Update local node state
        setNodes(prev => prev.map(n => (n.id === node.id ? { ...n, ...updatedNode } : n)));
      }
  
      // 7) Update local VM state
      setVMs(prev => prev.map(v => (v.id === id ? updatedVM : v)));
  
      showToast.success('VM updated successfully');
      return handleSupabaseSuccess(updatedVM, 'update vm');
    } catch (error) {
      showToast.error('Failed to update VM');
      return handleSupabaseError(error, 'update vm');
    } finally {
      setLoading(false);
    }
  };

  // const deleteVM = async (id: string) => {
  //   try {
  //     setLoading(true);
  //     const { data: vmData } = await supabase.from('vms').select('*').eq('id', id).single();
  //     const { error } = await supabase.from('vms').delete().eq('id', id);
  //     if (error) throw error;
  //     setVMs(prev => prev.filter(vm => vm.id !== id));
  //     if (vmData) {
  //       await addAuditLog('vms', 'DELETE', id, vmData, null, 'System Admin', `Deleted VM: ${vmData.vm_name}`);
  //     }
  //     showToast.success('VM deleted successfully');
  //     return handleSupabaseSuccess(null, 'delete VM');
  //   } catch (error) {
  //     showToast.error('Failed to delete VM');
  //     return handleSupabaseError(error, 'delete VM');
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const deleteVM = async (id: string) => {
    try {
      setLoading(true);
  
      // 1) Load VM to get node_id and resource usage
      const { data: vm, error: vmErr } = await supabase
        .from('vms')
        .select('*')
        .eq('id', id)
        .single();
      if (vmErr) throw vmErr;
  
      // 2) Delete the VM
      const { error: delErr } = await supabase.from('vms').delete().eq('id', id);
      if (delErr) throw delErr;
  
      // 3) Load parent node
      const { data: node, error: nodeErr } = await supabase
        .from('nodes')
        .select('*')
        .eq('id', vm.node_id)
        .single();
      if (nodeErr) throw nodeErr;
  
      // 4) VM resource usage (map to your schema)
      const vmCpu = Number(vm.cpu_ghz ?? vm.allocated_cpu_ghz ?? 0);
      const vmRam = Number(vm.ram_gb ?? vm.allocated_ram_gb ?? 0);
      const vmStorageParsed = (() => {
        if (vm.storage_gb != null) return Number(vm.storage_gb);
        if (vm.allocated_storage_gb != null) return Number(vm.allocated_storage_gb);
        if (typeof vm.storage === 'string') {
          const m = vm.storage.match(/(\d+(\.\d+)?)/);
          return m ? Number(m[1]) : 0;
        }
        return 0;
      })();
  
      // 5) Current node numbers
      const currAllocCpu = Number(node.allocated_cpu_ghz ?? 0);
      const currAllocRam = Number(node.allocated_ram_gb ?? 0);
      const currAllocStore = Number(node.allocated_storage_gb ?? 0);
  
      const currAvailCpu = Number(node.available_cpu_ghz ?? 0);
      const currAvailRam = Number(node.available_ram_gb ?? 0);
      const currAvailStore = Number(node.available_storage_gb ?? 0);
  
      // 6) Compute new node values: subtract from allocated, add back to available
      const updatedNode = {
        allocated_cpu_ghz: Math.max(0, currAllocCpu - vmCpu),
        allocated_ram_gb: Math.max(0, currAllocRam - vmRam),
        allocated_storage_gb: Math.max(0, currAllocStore - vmStorageParsed),
        available_cpu_ghz: currAvailCpu + vmCpu,
        available_ram_gb: currAvailRam + vmRam,
        available_storage_gb: currAvailStore + vmStorageParsed,
        vm_count: Math.max(0, Number(node.vm_count || 0) - 1),
        updated_at: new Date().toISOString(),
      };
  
      // 7) Persist node update
      const { error: updErr } = await supabase
        .from('nodes')
        .update(updatedNode)
        .eq('id', node.id);
      if (updErr) throw updErr;
  
      // 8) Update local state
      setVMs(prev => prev.filter(v => v.id !== id));
      setNodes(prev => prev.map(n => (n.id === node.id ? { ...n, ...updatedNode } : n)));
  
      showToast.success('VM deleted successfully');
      return handleSupabaseSuccess(null, 'delete vm');
    } catch (error) {
      showToast.error('Failed to delete VM');
      return handleSupabaseError(error, 'delete vm');
    } finally {
      setLoading(false);
    }
  };

  // Cluster CRUD operations
  const createCluster = async (clusterData: Omit<Cluster, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setLoading(true);
      // compute availability from totals − allocated (default allocated to 0)
    const totalCPU = Number(clusterData.total_cpu_ghz || 0);
    const allocCPU = Number(clusterData.allocated_cpu_ghz || 0);
    const totalRAM = Number(clusterData.total_ram_gb || 0);
    const allocRAM = Number(clusterData.allocated_ram_gb || 0);
    const totalStore = Number(clusterData.total_storage_gb || 0);
    const allocStore = Number(clusterData.allocated_storage_gb || 0);

  const clusterPayload = {
    ...clusterData,
    allocated_cpu_ghz: allocCPU,
    allocated_ram_gb: allocRAM,
    allocated_storage_gb: allocStore,
    available_cpu_ghz: totalCPU - allocCPU,
    available_ram_gb: totalRAM - allocRAM,
    available_storage_gb: totalStore - allocStore,
    node_count: 0,
    vm_count: 0,
  };

  // Use this in the insert:
  const { data: newCluster, error } = await supabase
    .from('clusters')
    .insert([clusterPayload])
    .select()
    .single();
        // const { data, error } = await supabase.from('clusters').insert([clusterData]).select().single();
        if (error) throw error;
        // setClusters(prev => [data, ...prev]);
        // await addAuditLog('clusters', 'CREATE', data.id, null, data, 'System Admin', `Created cluster: ${data.cluster_name}`);
        // showToast.success('Cluster created successfully');
        // return handleSupabaseSuccess(data, 'create cluster');

        setClusters(prev => [newCluster, ...prev]);
        await addAuditLog('clusters', 'CREATE', newCluster.id, null, newCluster, 'System Admin', `Created cluster: ${newCluster.cluster_name}`);
        await addActivityLog('Cluster Created', 'Cluster', newCluster.id, newCluster.cluster_name, 'System Admin', `Created cluster ${newCluster.cluster_name}`, 'success');
        return handleSupabaseSuccess(newCluster, 'create cluster');
      } catch (error) {
        showToast.error('Failed to create cluster');
        return handleSupabaseError(error, 'create cluster');
      } finally {
        setLoading(false);
      }
    };

  // const updateCluster = async (id: string, updates: Partial<Cluster>) => {
  //   try {
  //     setLoading(true);
  //     const { data, error } = await supabase.from('clusters').update(updates).eq('id', id).select().single();
  //     if (error) throw error;
  //     setClusters(prev => prev.map(cluster => cluster.id === id ? data : cluster));
  //     showToast.success('Cluster updated successfully');
  //     return handleSupabaseSuccess(data, 'update cluster');
  //   } catch (error) {
  //     showToast.error('Failed to update cluster');
  //     return handleSupabaseError(error, 'update cluster');
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const updateCluster = async (id: string, updates: Partial<Cluster>) => {
    try {
      setLoading(true);
      const { data: current, error: fetchErr } = await supabase
        .from('clusters')
        .select('*')
        .eq('id', id)
        .single();
      if (fetchErr) throw fetchErr;
  
      const totalCPU = Number(updates.total_cpu_ghz ?? current.total_cpu_ghz ?? 0);
      const allocCPU = Number(updates.allocated_cpu_ghz ?? current.allocated_cpu_ghz ?? 0);
      const totalRAM = Number(updates.total_ram_gb ?? current.total_ram_gb ?? 0);
      const allocRAM = Number(updates.allocated_ram_gb ?? current.allocated_ram_gb ?? 0);
      const totalStore = Number(updates.total_storage_gb ?? current.total_storage_gb ?? 0);
      const allocStore = Number(updates.allocated_storage_gb ?? current.allocated_storage_gb ?? 0);
  
      const sanitized: any = { ...updates };
      if ('total_cpu_ghz' in updates || 'allocated_cpu_ghz' in updates) {
        sanitized.available_cpu_ghz = totalCPU - allocCPU;
      }
      if ('total_ram_gb' in updates || 'allocated_ram_gb' in updates) {
        sanitized.available_ram_gb = totalRAM - allocRAM;
      }
      if ('total_storage_gb' in updates || 'allocated_storage_gb' in updates) {
        sanitized.available_storage_gb = totalStore - allocStore;
      }
  
      const { data, error } = await supabase
        .from('clusters')
        .update(sanitized)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
  
      setClusters(prev => prev.map(c => (c.id === id ? data : c)));
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
  // const createNode = async (nodeData: Omit<Node, 'id' | 'created_at' | 'updated_at'>) => {
  //   try {
  //     setLoading(true);
  //     const { data, error } = await supabase.from('nodes').insert([nodeData]).select().single();
  //     if (error) throw error;
  //     setNodes(prev => [data, ...prev]);
  //     showToast.success('Node created successfully');
  //     return handleSupabaseSuccess(data, 'create node');
  //   } catch (error) {
  //     showToast.error('Failed to create node');
  //     return handleSupabaseError(error, 'create node');
  //   } finally {
  //     setLoading(false);
  //   }
  // };
  // Node CRUD operations
const createNode = async (nodeData: Omit<Node, 'id' | 'created_at' | 'updated_at'>) => {
  try {
    setLoading(true);

    // 1) Load cluster (for validation and later DB update)
    const { data: cluster, error: clusterErr } = await supabase
      .from('clusters')
      .select('*')
      .eq('id', nodeData.cluster_id)
      .single();
    if (clusterErr) throw clusterErr;

    // 2) Compute node totals (numeric)
    const nodeTotalCpu = Number(
      nodeData.total_cpu_ghz ??
      (Number(nodeData.total_physical_cores || 0) * Number(nodeData.cpu_clock_speed_ghz || 0))
    );
    const nodeTotalRam = Number(nodeData.total_ram_gb || 0);
    const nodeTotalStore = Number(nodeData.storage_capacity_gb || 0);

    // 3) Compute effective cluster available (fallback if DB has NULLs)
    const clusterAvailCpu = Number(
      cluster.available_cpu_ghz ?? (Number(cluster.total_cpu_ghz || 0) - Number(cluster.allocated_cpu_ghz || 0))
    );
    const clusterAvailRam = Number(
      cluster.available_ram_gb ?? (Number(cluster.total_ram_gb || 0) - Number(cluster.allocated_ram_gb || 0))
    );
    const clusterAvailStore = Number(
      cluster.available_storage_gb ?? (Number(cluster.total_storage_gb || 0) - Number(cluster.allocated_storage_gb || 0))
    );

    // 4) Validate against cluster available
    if (nodeTotalCpu > clusterAvailCpu) {
      showToast.error(`Insufficient Cluster CPU. Available: ${clusterAvailCpu} GHz`);
      return handleSupabaseError(new Error('Insufficient cluster CPU'), 'create node');
    }
    if (nodeTotalRam > clusterAvailRam) {
      showToast.error(`Insufficient Cluster RAM. Available: ${clusterAvailRam} GB`);
      return handleSupabaseError(new Error('Insufficient cluster RAM'), 'create node');
    }
    if (nodeTotalStore > clusterAvailStore) {
      showToast.error(`Insufficient Cluster Storage. Available: ${clusterAvailStore} GB`);
      return handleSupabaseError(new Error('Insufficient cluster storage'), 'create node');
    }

    // 5) Build node payload with derived fields
    const allocCPU = Number(nodeData.allocated_cpu_ghz || 0);
    const allocRAM = Number(nodeData.allocated_ram_gb || 0);
    const allocStore = Number(nodeData.allocated_storage_gb || 0);

    const nodePayload = {
      ...nodeData,
      total_cpu_ghz: nodeTotalCpu,
      available_cpu_ghz: nodeTotalCpu - allocCPU,
      available_ram_gb: nodeTotalRam - allocRAM,
      available_storage_gb: nodeTotalStore - allocStore,
      vm_count: 0,
    };

    // 6) Insert node
    const { data: newNode, error: insertErr } = await supabase
      .from('nodes')
      .insert([nodePayload])
      .select()
      .single();
    if (insertErr) throw insertErr;

    // 7) Persist cluster availability (decrease) and increment node_count
    const { error: clusterUpdateErr } = await supabase
      .from('clusters')
      // .update({
      //   available_cpu_ghz: clusterAvailCpu - nodeTotalCpu,
      //   available_ram_gb: clusterAvailRam - nodeTotalRam,
      //   available_storage_gb: clusterAvailStore - nodeTotalStore,
      //   node_count: Number(cluster.node_count || 0) + 1,
      //   updated_at: new Date().toISOString(),
      // })
      .update({
        available_cpu_ghz: clusterAvailCpu - nodeTotalCpu,
        available_ram_gb: clusterAvailRam - nodeTotalRam,
        available_storage_gb: clusterAvailStore - nodeTotalStore,
        allocated_cpu_ghz: Number(cluster.allocated_cpu_ghz || 0) + nodeTotalCpu,
        allocated_ram_gb: Number(cluster.allocated_ram_gb || 0) + nodeTotalRam,
        allocated_storage_gb: Number(cluster.allocated_storage_gb || 0) + nodeTotalStore,
        node_count: Number(cluster.node_count || 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', nodeData.cluster_id);
    if (clusterUpdateErr) throw clusterUpdateErr;

    // 8) Update local state
    setNodes(prev => [newNode, ...prev]);
    setClusters(prev => prev.map(c =>
      c.id === cluster.id
        ? {
            ...c,
            // available_cpu_ghz: clusterAvailCpu - nodeTotalCpu,
            // available_ram_gb: clusterAvailRam - nodeTotalRam,
            // available_storage_gb: clusterAvailStore - nodeTotalStore,
            // node_count: Number(cluster.node_count || 0) + 1,
            // updated_at: new Date().toISOString(),

            available_cpu_ghz: clusterAvailCpu - nodeTotalCpu,
            available_ram_gb: clusterAvailRam - nodeTotalRam,
            available_storage_gb: clusterAvailStore - nodeTotalStore,
            allocated_cpu_ghz: Number(cluster.allocated_cpu_ghz || 0) + nodeTotalCpu,
            allocated_ram_gb: Number(cluster.allocated_ram_gb || 0) + nodeTotalRam,
            allocated_storage_gb: Number(cluster.allocated_storage_gb || 0) + nodeTotalStore,
            node_count: Number(cluster.node_count || 0) + 1,
            updated_at: new Date().toISOString(),
          }
        : c
    ));

    showToast.success('Node created successfully');
    return handleSupabaseSuccess(newNode, 'create node');
  } catch (error) {
    showToast.error('Failed to create node');
    return handleSupabaseError(error, 'create node');
  } finally {
    setLoading(false);
  }
};

  // const updateNode = async (id: string, updates: Partial<Node>) => {
  //   try {
  //     setLoading(true);
  
  //     // 1) Get current node (needed for validation and derived fields)
  //     const { data: current, error: fetchError } = await supabase
  //       .from('nodes')
  //       .select('*')
  //       .eq('id', id)
  //       .single();
  //     if (fetchError) throw fetchError;
  
  //     // 2) Sanitize payload: never send system-managed fields
  //     const sanitized: Partial<Node> = { ...updates };
  //     delete (sanitized as any).id;
  //     delete (sanitized as any).created_at;
  //     delete (sanitized as any).updated_at;
  
  //     // 3) Prepare current + new totals and allocated values (numeric!)
  //     const allocatedCPU = Number(current.allocated_cpu_ghz || 0);
  //     const allocatedRAM = Number(current.allocated_ram_gb || 0);
  //     const allocatedStore = Number(current.allocated_storage_gb || 0);
  
  //     const newCores = Number(sanitized.total_physical_cores ?? current.total_physical_cores);
  //     const newClock = Number(sanitized.cpu_clock_speed_ghz ?? current.cpu_clock_speed_ghz);
  //     const newTotalRAM = Number(sanitized.total_ram_gb ?? current.total_ram_gb);
  //     const newTotalStore = Number(sanitized.storage_capacity_gb ?? current.storage_capacity_gb);
  
  //     // 4) Recompute deriveds only when related totals changed
  
  //     // CPU recompute
  //     if ('total_physical_cores' in sanitized || 'cpu_clock_speed_ghz' in sanitized) {
  //       const totalCPU = (newCores || 0) * (newClock || 0);
  //       if (totalCPU < allocatedCPU) {
  //         showToast.error('Total CPU GHz cannot be less than allocated CPU');
  //         return handleSupabaseError(new Error('Invalid CPU totals'), 'update node');
  //       }
  //       sanitized.total_cpu_ghz = totalCPU;
  //       sanitized.available_cpu_ghz = totalCPU - allocatedCPU;
  //     }
  
  //     // RAM recompute
  //     if ('total_ram_gb' in sanitized) {
  //       if ((newTotalRAM || 0) < allocatedRAM) {
  //         showToast.error('Total RAM cannot be less than allocated RAM');
  //         return handleSupabaseError(new Error('Invalid RAM totals'), 'update node');
  //       }
  //       sanitized.available_ram_gb = (newTotalRAM || 0) - allocatedRAM;
  //     }
  
  //     // Storage recompute
  //     if ('storage_capacity_gb' in sanitized) {
  //       if ((newTotalStore || 0) < allocatedStore) {
  //         showToast.error('Total storage cannot be less than allocated storage');
  //         return handleSupabaseError(new Error('Invalid storage totals'), 'update node');
  //       }
  //       sanitized.available_storage_gb = (newTotalStore || 0) - allocatedStore;
  //     }
  
  //     // 5) Persist update
  //     const { data, error } = await supabase
  //       .from('nodes')
  //       .update(sanitized)
  //       .eq('id', id)
  //       .select()
  //       .single();
  //     if (error) throw error;
  
  //     setNodes(prev => prev.map(node => (node.id === id ? data : node)));
  //     showToast.success('Node updated successfully');
  //     return handleSupabaseSuccess(data, 'update node');
  //   } catch (error) {
  //     showToast.error('Failed to update node');
  //     return handleSupabaseError(error, 'update node');
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // const deleteNode = async (id: string) => {
  //   try {
  //     setLoading(true);
  //     const { error } = await supabase.from('nodes').delete().eq('id', id);
  //     if (error) throw error;
  //     setNodes(prev => prev.filter(node => node.id !== id));
  //     showToast.success('Node deleted successfully');
  //     return handleSupabaseSuccess(null, 'delete node');
  //   } catch (error) {
  //     showToast.error('Failed to delete node');
  //     return handleSupabaseError(error, 'delete node');
  //   } finally {
  //     setLoading(false);
  //   }
  // };


  const updateNode = async (id: string, updates: Partial<Node>) => {
    try {
      setLoading(true);
  
      // 1) Load current node (to compute deltas and know cluster_id)
      const { data: current, error: fetchNodeErr } = await supabase
        .from('nodes')
        .select('*')
        .eq('id', id)
        .single();
      if (fetchNodeErr) throw fetchNodeErr;
  
      // 2) Compute new node totals
      // CPU: prefer explicit total_cpu_ghz in updates, otherwise cores*clock
      const newCores = Number(updates.total_physical_cores ?? current.total_physical_cores ?? 0);
      const newClock = Number(updates.cpu_clock_speed_ghz ?? current.cpu_clock_speed_ghz ?? 0);
      const newTotalCpu = Number(
        updates.total_cpu_ghz ??
        (newCores * newClock) ??
        current.total_cpu_ghz ??
        0
      );
  
      const newTotalRam = Number(updates.total_ram_gb ?? current.total_ram_gb ?? 0);
      const newTotalStore = Number(updates.storage_capacity_gb ?? current.storage_capacity_gb ?? 0);
  
      // Old totals
      const oldTotalCpu = Number(current.total_cpu_ghz ?? 0);
      const oldTotalRam = Number(current.total_ram_gb ?? 0);
      const oldTotalStore = Number(current.storage_capacity_gb ?? 0);
  
      // 3) Deltas for cluster adjustment
      const deltaCpu = newTotalCpu - oldTotalCpu;
      const deltaRam = newTotalRam - oldTotalRam;
      const deltaStore = newTotalStore - oldTotalStore;
  
      // 4) Recompute node available = total − allocated
      const nodeAllocCpu = Number(current.allocated_cpu_ghz ?? 0);
      const nodeAllocRam = Number(current.allocated_ram_gb ?? 0);
      const nodeAllocStore = Number(current.allocated_storage_gb ?? 0);
  
      const nodeSanitized: Partial<Node> = {
        ...updates,
        total_cpu_ghz: newTotalCpu,
        total_ram_gb: newTotalRam,
        storage_capacity_gb: newTotalStore,
        available_cpu_ghz: newTotalCpu - nodeAllocCpu,
        available_ram_gb: newTotalRam - nodeAllocRam,
        available_storage_gb: newTotalStore - nodeAllocStore,
        updated_at: new Date().toISOString(),
      };
  
      // 5) Update the node
      const { data: updatedNode, error: updNodeErr } = await supabase
        .from('nodes')
        .update(nodeSanitized)
        .eq('id', id)
        .select()
        .single();
      if (updNodeErr) throw updNodeErr;
  
      // 6) If totals changed, adjust the parent cluster
      if (deltaCpu !== 0 || deltaRam !== 0 || deltaStore !== 0) {
        // Load cluster
        const { data: cluster, error: fetchClusterErr } = await supabase
          .from('clusters')
          .select('*')
          .eq('id', current.cluster_id)
          .single();
        if (fetchClusterErr) throw fetchClusterErr;
  
        const currAllocCpu = Number(cluster.allocated_cpu_ghz ?? 0);
        const currAllocRam = Number(cluster.allocated_ram_gb ?? 0);
        const currAllocStore = Number(cluster.allocated_storage_gb ?? 0);
  
        const currAvailCpu = Number(
          cluster.available_cpu_ghz ?? ((Number(cluster.total_cpu_ghz ?? 0)) - (Number(cluster.allocated_cpu_ghz ?? 0)))
        );
        const currAvailRam = Number(
          cluster.available_ram_gb ?? ((Number(cluster.total_ram_gb ?? 0)) - (Number(cluster.allocated_ram_gb ?? 0)))
        );
        const currAvailStore = Number(
          cluster.available_storage_gb ?? ((Number(cluster.total_storage_gb ?? 0)) - (Number(cluster.allocated_storage_gb ?? 0)))
        );
  
        const updatedCluster = {
          allocated_cpu_ghz: Math.max(0, currAllocCpu + deltaCpu),
          allocated_ram_gb: Math.max(0, currAllocRam + deltaRam),
          allocated_storage_gb: Math.max(0, currAllocStore + deltaStore),
          available_cpu_ghz: currAvailCpu - deltaCpu,
          available_ram_gb: currAvailRam - deltaRam,
          available_storage_gb: currAvailStore - deltaStore,
          updated_at: new Date().toISOString(),
        };
  
        const { error: updClusterErr } = await supabase
          .from('clusters')
          .update(updatedCluster)
          .eq('id', current.cluster_id);
        if (updClusterErr) throw updClusterErr;
  
        // Update local cluster state
        setClusters(prev =>
          prev.map(c => (c.id === current.cluster_id ? { ...c, ...updatedCluster } : c))
        );
      }
  
      // 7) Update local node state
      setNodes(prev => prev.map(n => (n.id === id ? updatedNode : n)));
  
      showToast.success('Node updated successfully');
      return handleSupabaseSuccess(updatedNode, 'update node');
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
  
      // 1) Load node to know its cluster and totals
      const { data: node, error: fetchNodeErr } = await supabase
        .from('nodes')
        .select('*')
        .eq('id', id)
        .single();
      if (fetchNodeErr) throw fetchNodeErr;
  
      // 2) Delete the node
      const { error: delErr } = await supabase.from('nodes').delete().eq('id', id);
      if (delErr) throw delErr;
  
      // 3) Load cluster (for current values)
      const { data: cluster, error: clusterErr } = await supabase
        .from('clusters')
        .select('*')
        .eq('id', node.cluster_id)
        .single();
      if (clusterErr) throw clusterErr;
  
      // 4) Node totals
      const nodeTotalCpu = Number(node.total_cpu_ghz || 0);
      const nodeTotalRam = Number(node.total_ram_gb || 0);
      const nodeTotalStore = Number(node.storage_capacity_gb || 0);
  
      // 5) Compute current cluster values with fallbacks if null
      const currAvailCpu = Number(
        cluster.available_cpu_ghz ?? (Number(cluster.total_cpu_ghz || 0) - Number(cluster.allocated_cpu_ghz || 0))
      );
      const currAvailRam = Number(
        cluster.available_ram_gb ?? (Number(cluster.total_ram_gb || 0) - Number(cluster.allocated_ram_gb || 0))
      );
      const currAvailStore = Number(
        cluster.available_storage_gb ?? (Number(cluster.total_storage_gb || 0) - Number(cluster.allocated_storage_gb || 0))
      );
  
      const currAllocCpu = Number(cluster.allocated_cpu_ghz || 0);
      const currAllocRam = Number(cluster.allocated_ram_gb || 0);
      const currAllocStore = Number(cluster.allocated_storage_gb || 0);
  
      // 6) Update cluster: add back to available, subtract from allocated, decrement node_count
      const updatedCluster = {
        available_cpu_ghz: currAvailCpu + nodeTotalCpu,
        available_ram_gb: currAvailRam + nodeTotalRam,
        available_storage_gb: currAvailStore + nodeTotalStore,
        allocated_cpu_ghz: Math.max(0, currAllocCpu - nodeTotalCpu),
        allocated_ram_gb: Math.max(0, currAllocRam - nodeTotalRam),
        allocated_storage_gb: Math.max(0, currAllocStore - nodeTotalStore),
        node_count: Math.max(0, Number(cluster.node_count || 0) - 1),
        updated_at: new Date().toISOString(),
      };
  
      const { error: updErr } = await supabase
        .from('clusters')
        .update(updatedCluster)
        .eq('id', node.cluster_id);
      if (updErr) throw updErr;
  
      // 7) Update local state
      setNodes(prev => prev.filter(n => n.id !== id));
      setClusters(prev => prev.map(c => c.id === cluster.id ? { ...c, ...updatedCluster } : c));
  
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