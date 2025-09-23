import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Plus, Trash2, ArrowLeft, Server, Database, HardDrive } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { FormField } from '../ui/FormField';
import { useSupabaseDataStore as useDataStore } from '../../hooks/useSupabaseDataStore';
import { showToast } from '../ui/Toast';
import { VM } from '../../types';

interface CreateVMProps {
  onNavigate: (tab: string) => void;
}

export const CreateVM: React.FC<CreateVMProps> = ({onNavigate}) => {
  const { 
    createVM, 
    customers, 
    clusters,
    nodes,
    getCustomerContracts, 
    getCustomerGPAccounts, 
    getClusterNodes,
    loading 
  } = useDataStore();
  
  const [isDraft, setIsDraft] = useState(false);
  const [selectedCluster, setSelectedCluster] = useState('');
  const [selectedNode, setSelectedNode] = useState('');
  const [availableNodes, setAvailableNodes] = useState<any[]>([]);
  const [nodeResources, setNodeResources] = useState<any>(null);

  // Form state
  const [formData, setFormData] = useState({
    vm_name: '',
    customer_id: '',
    cluster_id: '',
    node_id: '',
    cpu: '',
    cpu_ghz: 0,
    ram: '',
    storage: '',
    services: '',
    creation_date: new Date().toISOString().split('T')[0],
    service_start_date: '',
    service_end_date: '',
    password_created_date: new Date().toISOString().split('T')[0],
    last_password_changed_date: new Date().toISOString().split('T')[0],
    next_password_due_date: '',
    password_changer: '',
    public_ip: '',
    management_ip: '',  
    private_ips: [''] as string[],
    allowed_ports: ['22', '80', '443'] as string[],
    status: 'Active' as const,
    remarks: '',
    custom_fields: {
      environment: '',
      backup_enabled: false,
      access_level: 'medium'
    }
  });

  const [selectedContracts, setSelectedContracts] = useState<string[]>([]);
  const [selectedGPAccounts, setSelectedGPAccounts] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [availableContracts, setAvailableContracts] = useState<any[]>([]);
  const [availableGPAccounts, setAvailableGPAccounts] = useState<any[]>([]);

  // Update available nodes when cluster is selected
  useEffect(() => {
    if (selectedCluster) {
      const clusterNodes = getClusterNodes(selectedCluster);
      setAvailableNodes(clusterNodes);
      setFormData(prev => ({ ...prev, cluster_id: selectedCluster, node_id: '' }));
      setSelectedNode('');
      setNodeResources(null);
    } else {
      setAvailableNodes([]);
      setSelectedNode('');
      setNodeResources(null);
    }
  }, [selectedCluster, nodes]);

  // Update node resources when node is selected
  useEffect(() => {
    if (selectedNode) {
      const node = nodes.find(n => n.id === selectedNode);
      if (node) {
        setNodeResources(node);
        setFormData(prev => ({ ...prev, node_id: selectedNode }));
      }
    } else {
      setNodeResources(null);
    }
  }, [selectedNode, nodes]);

  // Update customer-related data when customer is selected
  useEffect(() => {
    if (formData.customer_id) {
      const contracts = getCustomerContracts(formData.customer_id);
      const gpAccounts = getCustomerGPAccounts(formData.customer_id);
      setAvailableContracts(contracts);
      setAvailableGPAccounts(gpAccounts);
    } else {
      setAvailableContracts([]);
      setAvailableGPAccounts([]);
    }
  }, [formData.customer_id]);

  // Auto-calculate password due date (3 months from creation)
  // useEffect(() => {
  //   if (formData.password_created_date) {
  //     const createdDate = new Date(formData.password_created_date);
  //     const dueDate = new Date(createdDate);
  //     dueDate.setMonth(dueDate.getMonth() + 3);
  //     setFormData(prev => ({
  //       ...prev,
  //       next_password_due_date: dueDate.toISOString().split('T')[0]
  //     }));
  //   }
  // }, [formData.password_created_date]);

    // Auto-calculate password due date (3 months from creation)
    useEffect(() => {
      if (formData.password_created_date && !formData.next_password_due_date) {
        const createdDate = new Date(formData.password_created_date);
        const dueDate = new Date(createdDate);
        dueDate.setMonth(dueDate.getMonth() + 3);
        setFormData(prev => ({
          ...prev,
          next_password_due_date: dueDate.toISOString().split('T')[0]
        }));
      }
    }, [formData.password_created_date, formData.next_password_due_date])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.vm_name.trim()) newErrors.vm_name = 'VM name is required';
    if (!formData.customer_id) newErrors.customer_id = 'Customer is required';
    if (!selectedCluster) newErrors.cluster_id = 'Cluster is required';
    if (!selectedNode) newErrors.node_id = 'Node is required';
    if (!formData.cpu.trim()) newErrors.cpu = 'CPU specification is required';
    if (formData.cpu_ghz <= 0) newErrors.cpu_ghz = 'CPU GHz must be greater than 0';
    if (!formData.ram.trim()) newErrors.ram = 'RAM specification is required';
    if (!formData.storage.trim()) newErrors.storage = 'Storage specification is required';
    if (!formData.services.trim()) newErrors.services = 'Services are required';
    if (!formData.service_start_date) newErrors.service_start_date = 'Service start date is required';
    if (!formData.service_end_date) newErrors.service_end_date = 'Service end date is required';
    if (!formData.password_changer.trim()) newErrors.password_changer = 'Password changer is required';

    // Validate resource allocation
    if (nodeResources) {
      const requestedRAM = parseInt(formData.ram.split(' ')[0]) || 0;
      const requestedStorage = parseInt(formData.storage.split(' ')[0]) || 0;
      
      if (formData.cpu_ghz > nodeResources.available_cpu_ghz) {
        newErrors.cpu_ghz = `Insufficient CPU. Available: ${nodeResources.available_cpu_ghz} GHz`;
      }
      if (requestedRAM > nodeResources.available_ram_gb) {
        newErrors.ram = `Insufficient RAM. Available: ${nodeResources.available_ram_gb} GB`;
      }
      if (requestedStorage > nodeResources.available_storage_gb) {
        newErrors.storage = `Insufficient Storage. Available: ${nodeResources.available_storage_gb} GB`;
      }
    }

    // Validate private IPs with defensive check
    const validPrivateIPs = (formData.private_ips || []).filter(ip => ip.trim() !== '');
    if (validPrivateIPs.length === 0) {
      newErrors.private_ips = 'At least one private IP is required';
    }

    // Validate allowed ports with defensive check
    const validPorts = (formData.allowed_ports || []).filter(port => port.trim() !== '');
    if (validPorts.length === 0) {
      newErrors.allowed_ports = 'At least one allowed port is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // const handleSubmit = async (asDraft = false) => {
  //   if (!asDraft && !validateForm()) return;

  //   try {
  //     setIsDraft(asDraft);

  //     // Clean up arrays with defensive checks
  //     const cleanedFormData = {
  //       ...formData,
  //       private_ips: (formData.private_ips || []).filter(ip => ip.trim() !== ''),
  //       allowed_ports: (formData.allowed_ports || []).filter(port => port.trim() !== '')
  //     };

  //     const result = await createVM(cleanedFormData);
      
  //     if (result.success) {
  //       // Reset form
  //       setFormData({
  //         vm_name: '',
  //         customer_id: '',
  //         cluster_id: '',
  //         node_id: '',
  //         cpu: '',
  //         cpu_ghz: 0,
  //         ram: '',
  //         storage: '',
  //         services: '',
  //         creation_date: new Date().toISOString().split('T')[0],
  //         service_start_date: '',
  //         service_end_date: '',
  //         password_created_date: new Date().toISOString().split('T')[0],
  //         last_password_changed_date: new Date().toISOString().split('T')[0],
  //         next_password_due_date: '',
  //         password_changer: '',
  //         public_ip: '',
  //         management_ip: '',
  //         private_ips: [''],
  //         allowed_ports: ['22', '80', '443'],
  //         status: 'Active',
  //         remarks: '',
  //         custom_fields: {
  //           environment: '',
  //           backup_enabled: false,
  //           access_level: 'medium'
  //         }
  //       });
  //       setSelectedCluster('');
  //       setSelectedNode('');
  //       setSelectedContracts([]);
  //       setSelectedGPAccounts([]);
  //       setErrors({});
  //     }
  //   } catch (error) {
  //     console.error('Submit error:', error);
  //   } finally {
  //     setIsDraft(false);
  //   }
  // };


  const handleSubmit = async (asDraft = false) => {
    // console.log('handleSubmit called with asDraft:', asDraft);
    // console.log('Form data before validation:', formData);
    // console.log('Selected cluster:', selectedCluster);
    // console.log('Selected node:', selectedNode);
    
    if (!asDraft && !validateForm()) {
      console.log('Validation failed');
      return;
    }
  
    try {
      setIsDraft(asDraft);
  
      // Clean up arrays with defensive checks
      const cleanedFormData = {
        ...formData,
        private_ips: (formData.private_ips || []).filter(ip => ip.trim() !== ''),
        allowed_ports: (formData.allowed_ports || []).filter(port => port.trim() !== '')
      };
  
/* The above code is a comment block in a TypeScript React file. It includes a console log statement
that outputs the cleaned form data. The comment block is used to provide information or context
about the code for other developers who may be working on the project. */
      console.log('Cleaned form data:', cleanedFormData);
      
      const result = await createVM(cleanedFormData);
      // console.log('CreateVM result:', result);
      
      if (result.success) {
        console.log('VM created successfully');
        // Reset form
        setFormData({
          vm_name: '',
          customer_id: '',
          cluster_id: '',
          node_id: '',
          cpu: '',
          cpu_ghz: 0,
          ram: '',
          storage: '',
          services: '',
          creation_date: new Date().toISOString().split('T')[0],
          service_start_date: '',
          service_end_date: '',
          password_created_date: new Date().toISOString().split('T')[0],
          last_password_changed_date: new Date().toISOString().split('T')[0],
          next_password_due_date: '',
          password_changer: '',
          public_ip: '',
          management_ip: '',
          private_ips: [''],
          allowed_ports: ['22', '80', '443'],
          status: 'Active',
          remarks: '',
          custom_fields: {
            environment: '',
            backup_enabled: false,
            access_level: 'medium'
          }
        });
        setSelectedCluster('');
        setSelectedNode('');
        setSelectedContracts([]);
        setSelectedGPAccounts([]);
        setErrors({});
      } else {
        console.log('VM creation failed:', result.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Submit error:', error);
    } finally {
      setIsDraft(false);
    }
  };
  
  const addPrivateIP = () => {
    setFormData({
      ...formData,
      private_ips: [...(formData.private_ips || []), '']
    });
  };

  const removePrivateIP = (index: number) => {
    if ((formData.private_ips || []).length > 1) {
      setFormData({
        ...formData,
        private_ips: (formData.private_ips || []).filter((_, i) => i !== index)
      });
    }
  };

  const updatePrivateIP = (index: number, value: string) => {
    const updated = [...(formData.private_ips || [])];
    updated[index] = value;
    setFormData({ ...formData, private_ips: updated });
  };

  const addAllowedPort = () => {
    setFormData({
      ...formData,
      allowed_ports: [...(formData.allowed_ports || []), '']
    });
  };

  const removeAllowedPort = (index: number) => {
    if ((formData.allowed_ports || []).length > 1) {
      setFormData({
        ...formData,
        allowed_ports: (formData.allowed_ports || []).filter((_, i) => i !== index)
      });
    }
  };

  const updateAllowedPort = (index: number, value: string) => {
    const updated = [...(formData.allowed_ports || [])];
    updated[index] = value;
    setFormData({ ...formData, allowed_ports: updated });
  };

  const handleBackToManagement = () =>{
    if(onNavigate){
      onNavigate('vms');
    }
  }

  return (
    <motion.div
      className="p-6 space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
          {/* Clickable Back Button */}
          <button
            onClick={handleBackToManagement}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Back to VM Management"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Create VM</h2>
            <p className="text-gray-600 mt-1">Create a new virtual machine with hierarchical resource allocation</p>
          </div>
        </div>
        <div className="flex space-x-3">
          <Button 
            variant="outline" 
            onClick={() => handleSubmit(true)}
            loading={loading && isDraft}
            disabled={loading}
          >
            <Save className="w-4 h-4 mr-2" />
            Save as Draft
          </Button>
          <Button 
            onClick={() => handleSubmit(false)}
            loading={loading && !isDraft}
            disabled={loading}
          >
            Create VM
          </Button>
        </div>
      </div>

      <Card className="p-6">
        <div className="space-y-8">
          {/* Infrastructure Selection */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Infrastructure Selection</h3>
            <div className="grid grid-cols-2 md:grid-cols-2 gap-6">
              <FormField label="Select Cluster" required error={errors.cluster_id}>
                <select
                  value={selectedCluster}
                  onChange={(e) => setSelectedCluster(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.cluster_id ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select cluster</option>
                  {clusters?.filter(c => c.status === 'Active').map(cluster => (
                    <option key={cluster.id} value={cluster.id}>
                      {cluster.cluster_name} ({cluster.cluster_code}) - {cluster.cluster_purpose}
                    </option>
                  ))}
                </select>
              </FormField>

              {/* <FormField label="Select Node" required error={errors.node_id}>
                <select
                  value={selectedNode}
                  onChange={(e) => setSelectedNode(e.target.value)}
                  disabled={!selectedCluster}
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.node_id ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  } ${!selectedCluster ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                >
                  <option value="">Select node</option>
                  {availableNodes.map(node => (
                    <option key={node.id} value={node.id}>
                      {node.node_name} - Available: {node.available_cpu_ghz}GHz, {node.available_ram_gb}GB RAM
                    </option>
                  ))}
                </select>
              </FormField> */}

              

              <FormField label="Customer" required error={errors.customer_id}>
                <select
                  value={formData.customer_id}
                  onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.customer_id ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select customer department</option>
                  {customers.map(customer => (
                    <option key={customer.id} value={customer.id}>
                      {customer.department_name}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>

            {/* Node Resource Information */}
            {nodeResources && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg"
              >
                <h4 className="font-semibold text-blue-900 mb-3">Selected Node Resources</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2">
                    <Server className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-blue-900">CPU Available</p>
                      <p className="text-lg font-bold text-blue-700">{nodeResources.available_cpu_ghz} GHz</p>
                      <p className="text-xs text-blue-600">of {nodeResources.total_cpu_ghz} GHz total</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Database className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-green-900">RAM Available</p>
                      <p className="text-lg font-bold text-green-700">{nodeResources.available_ram_gb} GB</p>
                      <p className="text-xs text-green-600">of {nodeResources.total_ram_gb} GB total</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <HardDrive className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="text-sm font-medium text-purple-900">Storage Available</p>
                      <p className="text-lg font-bold text-purple-700">{nodeResources.available_storage_gb} GB</p>
                      <p className="text-xs text-purple-600">of {nodeResources.total_storage_gb} GB total</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">VM Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="VM Name" required error={errors.vm_name}>
                <Input
                  value={formData.vm_name}
                  onChange={(e) => setFormData({ ...formData, vm_name: e.target.value })}
                  placeholder="Enter VM name (e.g., Web-Server-01)"
                  error={!!errors.vm_name}
                />
              </FormField>

              <FormField label="Status" required>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Terminated">Terminated</option>
                </select>
              </FormField>

              <FormField label="CPU Specification" required error={errors.cpu}>
                <Input
                  value={formData.cpu}
                  onChange={(e) => setFormData({ ...formData, cpu: e.target.value })}
                  placeholder="e.g., 4 vCPU"
                  error={!!errors.cpu}
                />
              </FormField>

              <FormField label="CPU Allocation (GHz)" required error={errors.cpu_ghz}>
                <Input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={formData.cpu_ghz}
                  onChange={(e) => setFormData({ ...formData, cpu_ghz: parseFloat(e.target.value) || 0 })}
                  placeholder="e.g., 2.4"
                  error={!!errors.cpu_ghz}
                />
                {nodeResources && (
                  <p className="text-xs text-gray-500 mt-1">
                    Available: {nodeResources.available_cpu_ghz} GHz
                  </p>
                )}
              </FormField>

              <FormField label="RAM" required error={errors.ram}>
                <Input
                  value={formData.ram}
                  onChange={(e) => setFormData({ ...formData, ram: e.target.value })}
                  placeholder="e.g., 8 GB"
                  error={!!errors.ram}
                />
                {nodeResources && (
                  <p className="text-xs text-gray-500 mt-1">
                    Available: {nodeResources.available_ram_gb} GB
                  </p>
                )}
              </FormField>

              <FormField label="Storage" required error={errors.storage}>
                <Input
                  value={formData.storage}
                  onChange={(e) => setFormData({ ...formData, storage: e.target.value })}
                  placeholder="e.g., 100 GB SSD"
                  error={!!errors.storage}
                />
                {nodeResources && (
                  <p className="text-xs text-gray-500 mt-1">
                    Available: {nodeResources.available_storage_gb} GB
                  </p>
                )}
              </FormField>

              <FormField label="Services" required error={errors.services}>
                <Input
                  value={formData.services}
                  onChange={(e) => setFormData({ ...formData, services: e.target.value })}
                  placeholder="e.g., Web Server, Database"
                  error={!!errors.services}
                />
              </FormField>
            </div>
          </div>

          {/* Custom Fields */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Custom Fields</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* <FormField label="Environment">
                <select
                  value={formData.custom_fields.environment}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    custom_fields: { ...formData.custom_fields, environment: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select environment</option>
                  <option value="production">Production</option>
                  <option value="staging">Staging</option>
                  <option value="development">Development</option>
                  <option value="testing">Testing</option>
                </select>
              </FormField> */}

              {/* <FormField label="Access Level">
                <select
                  value={formData.custom_fields.access_level}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    custom_fields: { ...formData.custom_fields, access_level: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </FormField> */}

              <FormField label="Backup Enabled">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.custom_fields.backup_enabled}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      custom_fields: { ...formData.custom_fields, backup_enabled: e.target.checked }
                    })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Enable automated backups</span>
                </label>
              </FormField>
            </div>
          </div>

          {/* Network Configuration */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Network Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="Public IP">
                <Input
                  value={formData.public_ip}
                  onChange={(e) => setFormData({ ...formData, public_ip: e.target.value })}
                  placeholder="203.0.113.10"
                />
              </FormField>

              <FormField label="Management IP">
                <Input
                  value={formData.management_ip}
                  onChange={(e) => setFormData({ ...formData, management_ip: e.target.value })}
                  placeholder="10.0.0.100"
                />
              </FormField>
            </div>

            {/* Private IPs */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-gray-700">
                  Private IPs <span className="text-red-500">*</span>
                </label>
                <Button variant="outline" size="sm" onClick={addPrivateIP}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add IP
                </Button>
              </div>
              {errors.private_ips && (
                <p className="text-sm text-red-600 mb-2">{errors.private_ips}</p>
              )}
              <div className="space-y-2">
                {(formData.private_ips || []).map((ip, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Input
                      value={ip}
                      onChange={(e) => updatePrivateIP(index, e.target.value)}
                      placeholder="192.168.1.10"
                      className="flex-1"
                    />
                    {(formData.private_ips || []).length > 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removePrivateIP(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Allowed Ports */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-gray-700">
                  Allowed Ports (Firewall Rules) <span className="text-red-500">*</span>
                </label>
                <Button variant="outline" size="sm" onClick={addAllowedPort}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Port
                </Button>
              </div>
              {errors.allowed_ports && (
                <p className="text-sm text-red-600 mb-2">{errors.allowed_ports}</p>
              )}
              <div className="space-y-2">
                {(formData.allowed_ports || []).map((port, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Input
                      value={port}
                      onChange={(e) => updateAllowedPort(index, e.target.value)}
                      placeholder="80, 443, 22"
                      className="flex-1"
                    />
                    {(formData.allowed_ports || []).length > 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeAllowedPort(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Service Dates */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Service & Password Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="Service Start Date" required error={errors.service_start_date}>
                <Input
                  type="date"
                  value={formData.service_start_date}
                  onChange={(e) => setFormData({ ...formData, service_start_date: e.target.value })}
                  error={!!errors.service_start_date}
                />
              </FormField>

              <FormField label="Service End Date" required error={errors.service_end_date}>
                <Input
                  type="date"
                  value={formData.service_end_date}
                  onChange={(e) => setFormData({ ...formData, service_end_date: e.target.value })}
                  error={!!errors.service_end_date}
                />
              </FormField>

              <FormField label="Password Created Date" required>
                <Input
                  type="date"
                  value={formData.password_created_date}
                  onChange={(e) => setFormData({ ...formData, password_created_date: e.target.value })}
                />
              </FormField>

              <FormField label="Next Password Due Date (Auto-calculated)">
                <Input
                  type="date"
                  value={formData.next_password_due_date}
                  onChange={(e) => setFormData({ ...formData, next_password_due_date: e.target.value })}
                  className="bg-gray-50"
                />
                <p className="text-xs text-gray-500 mt-1">Automatically set to 3 months from password creation date</p>
              </FormField>

              <FormField label="Last Password Changed Date" required>
                <Input
                  type="date"
                  value={formData.last_password_changed_date}
                  onChange={(e) => setFormData({ ...formData, last_password_changed_date: e.target.value })}
                />
              </FormField>

              <FormField label="Password Changer" required error={errors.password_changer}>
                <Input
                  value={formData.password_changer}
                  onChange={(e) => setFormData({ ...formData, password_changer: e.target.value })}
                  placeholder="Person who changed password"
                  error={!!errors.password_changer}
                />
              </FormField>
            </div>
          </div>

          {/* Linked Resources */}
          {formData.customer_id && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Linked Resources</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Associated Contracts</label>
                  <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3">
                    {availableContracts.map(contract => (
                      <label key={contract.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={selectedContracts.includes(contract.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedContracts([...selectedContracts, contract.id]);
                            } else {
                              setSelectedContracts(selectedContracts.filter(id => id !== contract.id));
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm">{contract.contract_number} - {contract.contract_name}</span>
                      </label>
                    ))}
                    {availableContracts.length === 0 && (
                      <p className="text-sm text-gray-500">No contracts available for this customer</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Access GP Accounts</label>
                  <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3">
                    {availableGPAccounts.map(account => (
                      <label key={account.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={selectedGPAccounts.includes(account.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedGPAccounts([...selectedGPAccounts, account.id]);
                            } else {
                              setSelectedGPAccounts(selectedGPAccounts.filter(id => id !== account.id));
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div className="text-sm">
                          <div className="font-medium">{account.gp_username}</div>
                          <div className="text-gray-500">{account.gp_ip} - Due: {new Date(account.next_password_due_date).toLocaleDateString()}</div>
                        </div>
                      </label>
                    ))}
                    {availableGPAccounts.length === 0 && (
                      <p className="text-sm text-gray-500">No GP accounts available for this customer</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Remarks */}
          <FormField label="Remarks">
            <textarea
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              placeholder="Additional notes or remarks about this VM"
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </FormField>
        </div>
      </Card>
    </motion.div>
  );
};