import { useState, useEffect } from 'react';
import { VM } from '../types';
import { showToast } from '../components/ui/Toast';

// Mock data store - will be replaced with Supabase
let vmStore: VM[] = [
  {
    id: '1',
    vm_name: 'Web-Server-01',
    customer_id: '1',
    cpu: '4 vCPU',
    ram: '8 GB',
    storage: '100 GB SSD',
    services: 'Web Server, Database',
    creation_date: '2024-01-15',
    cost: 150.00,
    service_start_date: '2024-01-15',
    service_end_date: '2024-12-31',
    password_created_date: '2024-01-15',
    last_password_changed_date: '2024-01-15',
    password_changer: 'Admin',
    public_ip: '203.0.113.10',
    management_ip: '10.0.1.10',
    private_ips: ['192.168.1.10'],
    allowed_ports: ['80', '443', '22'],
    status: 'Active',
    remarks: 'Production web server',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
    custom_fields: {}
  },
  {
    id: '2',
    vm_name: 'DB-Server-01',
    customer_id: '2',
    cpu: '8 vCPU',
    ram: '16 GB',
    storage: '500 GB SSD',
    services: 'Database Server',
    creation_date: '2024-01-20',
    cost: 300.00,
    service_start_date: '2024-01-20',
    service_end_date: '2024-12-31',
    password_created_date: '2024-01-20',
    last_password_changed_date: '2024-01-20',
    password_changer: 'Admin',
    public_ip: '203.0.113.11',
    management_ip: '10.0.1.11',
    private_ips: ['192.168.1.11'],
    allowed_ports: ['3306', '22'],
    status: 'Active',
    remarks: 'MySQL database server',
    created_at: '2024-01-20T10:00:00Z',
    updated_at: '2024-01-20T10:00:00Z',
    custom_fields: {}
  }
];

export const useVMData = () => {
  const [vms, setVMs] = useState<VM[]>([]);
  const [loading, setLoading] = useState(false);

  const loadVMs = async () => {
    try {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      setVMs([...vmStore]);
    } catch (error) {
      showToast.error('Failed to load VMs');
      console.error('Load VMs error:', error);
    } finally {
      setLoading(false);
    }
  };

  const createVM = async (vmData: Omit<VM, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setLoading(true);
      
      const newVM: VM = {
        ...vmData,
        id: Date.now().toString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      vmStore.push(newVM);
      setVMs([...vmStore]);
      
      showToast.success('VM created successfully');
      return { success: true, data: newVM };
    } catch (error) {
      showToast.error('Failed to create VM');
      console.error('Create VM error:', error);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  const updateVM = async (id: string, updates: Partial<VM>) => {
    try {
      setLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const index = vmStore.findIndex(vm => vm.id === id);
      if (index === -1) {
        throw new Error('VM not found');
      }

      vmStore[index] = {
        ...vmStore[index],
        ...updates,
        updated_at: new Date().toISOString()
      };
      
      setVMs([...vmStore]);
      showToast.success('VM updated successfully');
      return { success: true, data: vmStore[index] };
    } catch (error) {
      showToast.error('Failed to update VM');
      console.error('Update VM error:', error);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  // const deleteVM = async (id: string) => {
  //   try {
  //     setLoading(true);
      
  //     // Simulate API call
  //     await new Promise(resolve => setTimeout(resolve, 600));
      
  //     vmStore = vmStore.filter(vm => vm.id !== id);
  //     setVMs([...vmStore]);
      
  //     showToast.success('VM deleted successfully');
  //     return { success: true };
  //   } catch (error) {
  //     showToast.error('Failed to delete VM');
  //     console.error('Delete VM error:', error);
  //     return { success: false, error };
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
  
      // 4) VM resource usage (adjust these field names if your VM schema differs)
      // Prefer exact numeric columns if you have them; otherwise parse
      const vmCpu = Number(vm.cpu_ghz ?? vm.allocated_cpu_ghz ?? 0);
      const vmRam = Number(vm.ram_gb ?? vm.allocated_ram_gb ?? 0);
  
      // Handle storage which may be number or string like "100 GB"
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
      const currAllocCpu = Number(node.allocated_cpu_ghz || 0);
      const currAllocRam = Number(node.allocated_ram_gb || 0);
      const currAllocStore = Number(node.allocated_storage_gb || 0);
  
      const currAvailCpu = Number(node.available_cpu_ghz || 0);
      const currAvailRam = Number(node.available_ram_gb || 0);
      const currAvailStore = Number(node.available_storage_gb || 0);
  
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
      setNodes(prev =>
        prev.map(n => (n.id === node.id ? { ...n, ...updatedNode } : n))
      );
  
      showToast.success('VM deleted successfully');
      return handleSupabaseSuccess(null, 'delete vm');
    } catch (error) {
      showToast.error('Failed to delete VM');
      return handleSupabaseError(error, 'delete vm');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVMs();
  }, []);

  return {
    vms,
    loading,
    loadVMs,
    createVM,
    updateVM,
    deleteVM
  };
};