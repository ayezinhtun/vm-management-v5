import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Plus, Download, Eye, Edit, Trash2, Server, Cpu, Database, HardDrive, Network } from 'lucide-react';
import { Card } from '../ui/Card';
import { Table } from '../ui/Table';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { FormField } from '../ui/FormField';
import { useSupabaseDataStore as useDataStore } from '../../hooks/useSupabaseDataStore';
import { showToast } from '../ui/Toast';
import { Node } from '../../types';

export const NodeManagement: React.FC = () => {
  const { 
    nodes, 
    clusters,
    vms,
    loading, 
    createNode, 
    updateNode, 
    deleteNode,
    getNodeVMs
  } = useDataStore();
  
  const [filteredNodes, setFilteredNodes] = useState<Node[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [clusterFilter, setClusterFilter] = useState('all');
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [showNodeDetails, setShowNodeDetails] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingNode, setEditingNode] = useState<Node | null>(null);
  const [sortField, setSortField] = useState<string>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Form states
  const [createFormData, setCreateFormData] = useState({
    cluster_id: '',
    node_name: '',
    hostname: '',
    cpu_vendor: 'Intel' as const,
    cpu_model: '',
    total_physical_cores: 0,
    total_logical_threads: 0,
    cpu_clock_speed_ghz: 0,
    total_ram_gb: 0,
    dimm_slots_used: 0,
    dimm_slots_total: 0,
    ram_type: 'DDR4' as const,
    storage_type: 'SSD' as const,
    storage_capacity_gb: 0,
    raid_configuration: 'RAID 1' as const,
    disk_vendor_model: '',
    nic_count: 1,
    nic_speed: '1GbE' as const,
    teaming_bonding: '',
    vlan_tagging_support: false,
    status: 'Active' as const
  });

  const [editFormData, setEditFormData] = useState<Partial<Node>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    let filtered = nodes || [];

    if (searchTerm) {
      filtered = filtered.filter(node =>
        node.node_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        node.hostname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        node.cpu_model.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(node => node.status === statusFilter);
    }

    if (clusterFilter !== 'all') {
      filtered = filtered.filter(node => node.cluster_id === clusterFilter);
    }

    // Sort data
    filtered.sort((a, b) => {
      const aValue = a[sortField as keyof Node];
      const bValue = b[sortField as keyof Node];
      
      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    

    setFilteredNodes(filtered);
  }, [nodes, searchTerm, statusFilter, clusterFilter, sortField, sortDirection]);

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

    if (!createFormData.cluster_id) newErrors.cluster_id = 'Cluster is required';
    if (!createFormData.node_name.trim()) newErrors.node_name = 'Node name is required';
    if (!createFormData.hostname.trim()) newErrors.hostname = 'Hostname is required';
    if (!createFormData.cpu_model.trim()) newErrors.cpu_model = 'CPU model is required';
    if (createFormData.total_physical_cores <= 0) newErrors.total_physical_cores = 'Physical cores must be greater than 0';
    if (createFormData.total_logical_threads <= 0) newErrors.total_logical_threads = 'Logical threads must be greater than 0';
    if (createFormData.cpu_clock_speed_ghz <= 0) newErrors.cpu_clock_speed_ghz = 'CPU clock speed must be greater than 0';
    if (createFormData.total_ram_gb <= 0) newErrors.total_ram_gb = 'Total RAM must be greater than 0';
    if (createFormData.storage_capacity_gb <= 0) newErrors.storage_capacity_gb = 'Storage capacity must be greater than 0';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateSubmit = async () => {
    if (!validateCreateForm()) return;

    try {
      // Calculate total CPU GHz
      const totalCPUGHz = createFormData.total_physical_cores * createFormData.cpu_clock_speed_ghz;
      
      const nodeData = {
        ...createFormData,
        total_cpu_ghz: totalCPUGHz,
        allocated_cpu_ghz: 0,
        available_cpu_ghz: totalCPUGHz,
        allocated_ram_gb: 0,
        available_ram_gb: createFormData.total_ram_gb,
        allocated_storage_gb: 0,
        available_storage_gb: createFormData.storage_capacity_gb,
        vm_count: 0
      };

      const result = await createNode(nodeData);
      if (result.success) {
        setShowCreateModal(false);
        setCreateFormData({
          cluster_id: '',
          node_name: '',
          hostname: '',
          cpu_vendor: 'Intel',
          cpu_model: '',
          total_physical_cores: 0,
          total_logical_threads: 0,
          cpu_clock_speed_ghz: 0,
          total_ram_gb: 0,
          dimm_slots_used: 0,
          dimm_slots_total: 0,
          ram_type: 'DDR4',
          storage_type: 'SSD',
          storage_capacity_gb: 0,
          raid_configuration: 'RAID 1',
          disk_vendor_model: '',
          nic_count: 1,
          nic_speed: '1GbE',
          teaming_bonding: '',
          vlan_tagging_support: false,
          status: 'Active'
        });
        setErrors({});
      }
    } catch (error) {
      console.error('Create node error:', error);
    }
  };

  const handleEditSubmit = async () => {
    if (!editingNode || !editFormData) return;

    try {
      await updateNode(editingNode.id, editFormData);
      setShowEditModal(false);
      setEditingNode(null);
      setEditFormData({});
    } catch (error) {
      console.error('Edit node error:', error);
    }
  };

  const handleDelete = async (node: Node) => {
    const nodeVMs = getNodeVMs(node.id);
    if (nodeVMs.length > 0) {
      showToast.error(`Cannot delete node with ${nodeVMs.length} active VMs`);
      return;
    }

    if (window.confirm(`Are you sure you want to delete node "${node.node_name}"?`)) {
      await deleteNode(node.id);
    }
  };

  const exportData = () => {
    const csvContent = [
      ['Node Name', 'Hostname', 'Cluster', 'CPU Model', 'CPU (GHz)', 'RAM (GB)', 'Storage (GB)', 'VMs', 'Status', 'Created'].join(','),
      ...filteredNodes.map(node => {
        const cluster = clusters.find(c => c.id === node.cluster_id);
        return [
          node.node_name,
          node.hostname,
          cluster?.cluster_name || '',
          node.cpu_model,
          node.total_cpu_ghz.toString(),
          node.total_ram_gb.toString(),
          node.storage_capacity_gb.toString(),
          node.vm_count.toString(),
          node.status,
          new Date(node.created_at).toLocaleDateString()
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nodes_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    showToast.success('Nodes exported successfully');
  };

  const nodeColumns = [
    { key: 'node_name', label: 'Node Name', sortable: true },
    { key: 'hostname', label: 'Hostname', sortable: true },
    { 
      key: 'cluster_id', 
      label: 'Cluster', 
      render: (value: string) => {
        const cluster = clusters.find(c => c.id === value);
        return cluster?.cluster_name || 'Unknown';
      }
    },
    { 
      key: 'cpu_info', 
      label: 'CPU Info', 
      render: (value: any, node: Node) => (
        <div className="text-sm">
          <div className="font-medium">{node.cpu_vendor} {node.cpu_model}</div>
          <div className="text-gray-500">{node.total_physical_cores}C/{node.total_logical_threads}T @ {node.cpu_clock_speed_ghz}GHz</div>
        </div>
      )
    },
    { 
      key: 'resources', 
      label: 'Resources (CPU/RAM/Storage)', 
      render: (value: any, node: Node) => (
        <div className="text-sm">
          <div className="font-medium">{node.total_cpu_ghz} GHz</div>
          <div className="text-gray-500">{node.total_ram_gb} GB / {node.storage_capacity_gb} GB</div>
        </div>
      )
    },
    { 
      key: 'utilization', 
      label: 'Utilization', 
      render: (value: any, node: Node) => {
        const cpuUtil = node.total_cpu_ghz > 0 ? (node.allocated_cpu_ghz / node.total_cpu_ghz * 100) : 0;
        const ramUtil = node.total_ram_gb > 0 ? (node.allocated_ram_gb / node.total_ram_gb * 100) : 0;
        return (
          <div className="text-sm">
            <div>CPU: {cpuUtil.toFixed(1)}%</div>
            <div>RAM: {ramUtil.toFixed(1)}%</div>
          </div>
        );
      }
    },
    { 
      key: 'vm_count', 
      label: 'VMs', 
      sortable: true,
      render: (value: number) => (
        <span className="font-medium">{value}</span>
      )
    },
    { 
      key: 'status', 
      label: 'Status', 
      sortable: true,
      render: (value: string) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value === 'Active' ? 'bg-green-100 text-green-800' :
          value === 'Inactive' ? 'bg-red-100 text-red-800' :
          'bg-yellow-100 text-yellow-800'
        }`}>
          {value}
        </span>
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
      render: (value: any, node: Node) => (
        <div className="flex space-x-1">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSelectedNode(node);
              setShowNodeDetails(true);
            }}
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setEditingNode(node);
              setEditFormData(node);
              setShowEditModal(true);
            }}
            title="Edit Node"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => handleDelete(node)}
            title="Delete Node"
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
          <h2 className="text-2xl font-bold text-gray-900">Node Management</h2>
          <p className="text-gray-600 mt-1">Manage physical servers and compute nodes</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={exportData}>
            <Download className="w-4 h-4 mr-2" />
            Export ({filteredNodes.length})
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Node
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Nodes</p>
              <p className="text-2xl font-bold text-gray-900">{nodes?.length || 0}</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Server className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Nodes</p>
              <p className="text-2xl font-bold text-green-600">
                {nodes?.filter(node => node.status === 'Active').length || 0}
              </p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <Cpu className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total CPU (GHz)</p>
              <p className="text-2xl font-bold text-purple-600">
                {nodes?.reduce((sum, node) => sum + node.total_cpu_ghz, 0).toFixed(1) || 0}
              </p>
            </div>
            <div className="p-2 bg-purple-100 rounded-lg">
              <Database className="w-5 h-5 text-purple-600" />
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total VMs</p>
              <p className="text-2xl font-bold text-orange-600">
                {nodes?.reduce((sum, node) => sum + node.vm_count, 0) || 0}
              </p>
            </div>
            <div className="p-2 bg-orange-100 rounded-lg">
              <HardDrive className="w-5 h-5 text-orange-600" />
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
              placeholder="Search nodes..."
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
            <option value="Maintenance">Maintenance</option>
          </select>

          <select
            value={clusterFilter}
            onChange={(e) => setClusterFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Clusters</option>
            {clusters.map(cluster => (
              <option key={cluster.id} value={cluster.id}>
                {cluster.cluster_name}
              </option>
            ))}
          </select>

          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Advanced Filters
          </Button>
        </div>
      </Card>

      {/* Nodes Table */}
      <Card>
        <Table
          columns={nodeColumns}
          data={filteredNodes}
          loading={loading}
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={handleSort}
        />
      </Card>

      {/* Create Node Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Add Node to Cluster"
        size="xl"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Select Cluster" required error={errors.cluster_id}>
              <select
                value={createFormData.cluster_id}
                onChange={(e) => setCreateFormData({ ...createFormData, cluster_id: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.cluster_id ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
              >
                <option value="">Select cluster</option>
                {clusters.filter(c => c.status === 'Active').map(cluster => (
                  <option key={cluster.id} value={cluster.id}>
                    {cluster.cluster_name} ({cluster.cluster_code})
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Node Name" required error={errors.node_name}>
              <Input
                value={createFormData.node_name}
                onChange={(e) => setCreateFormData({ ...createFormData, node_name: e.target.value })}
                placeholder="Node-01"
                error={!!errors.node_name}
              />
            </FormField>

            <FormField label="Hostname" required error={errors.hostname}>
              <Input
                value={createFormData.hostname}
                onChange={(e) => setCreateFormData({ ...createFormData, hostname: e.target.value })}
                placeholder="node01.domain.com"
                error={!!errors.hostname}
              />
            </FormField>

            <FormField label="Status" required>
              <select
                value={createFormData.status}
                onChange={(e) => setCreateFormData({ ...createFormData, status: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Maintenance">Maintenance</option>
              </select>
            </FormField>
          </div>

          {/* CPU Specifications */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">CPU Specifications</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="CPU Vendor" required>
                <select
                  value={createFormData.cpu_vendor}
                  onChange={(e) => setCreateFormData({ ...createFormData, cpu_vendor: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Intel">Intel</option>
                  <option value="AMD">AMD</option>
                </select>
              </FormField>

              <FormField label="CPU Model" required error={errors.cpu_model}>
                <Input
                  value={createFormData.cpu_model}
                  onChange={(e) => setCreateFormData({ ...createFormData, cpu_model: e.target.value })}
                  placeholder="Xeon Gold 6338, EPYC 7xxx"
                  error={!!errors.cpu_model}
                />
              </FormField>

              <FormField label="Physical Cores" required error={errors.total_physical_cores}>
                <Input
                  type="number"
                  min="1"
                  value={createFormData.total_physical_cores}
                  onChange={(e) => setCreateFormData({ ...createFormData, total_physical_cores: parseInt(e.target.value) || 0 })}
                  placeholder="16"
                  error={!!errors.total_physical_cores}
                />
              </FormField>

              <FormField label="Logical Threads" required error={errors.total_logical_threads}>
                <Input
                  type="number"
                  min="1"
                  value={createFormData.total_logical_threads}
                  onChange={(e) => setCreateFormData({ ...createFormData, total_logical_threads: parseInt(e.target.value) || 0 })}
                  placeholder="32"
                  error={!!errors.total_logical_threads}
                />
              </FormField>

              <FormField label="Clock Speed (GHz)" required error={errors.cpu_clock_speed_ghz}>
                <Input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={createFormData.cpu_clock_speed_ghz}
                  onChange={(e) => setCreateFormData({ ...createFormData, cpu_clock_speed_ghz: parseFloat(e.target.value) || 0 })}
                  placeholder="2.4"
                  error={!!errors.cpu_clock_speed_ghz}
                />
              </FormField>
            </div>
          </div>

          {/* RAM Specifications */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">RAM Specifications</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Total RAM (GB)" required error={errors.total_ram_gb}>
                <Input
                  type="number"
                  min="1"
                  value={createFormData.total_ram_gb}
                  onChange={(e) => setCreateFormData({ ...createFormData, total_ram_gb: parseInt(e.target.value) || 0 })}
                  placeholder="512"
                  error={!!errors.total_ram_gb}
                />
              </FormField>

              <FormField label="RAM Type" required>
                <select
                  value={createFormData.ram_type}
                  onChange={(e) => setCreateFormData({ ...createFormData, ram_type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="DDR4">DDR4</option>
                  <option value="DDR5">DDR5</option>
                  <option value="ECC Registered">ECC Registered</option>
                </select>
              </FormField>

              <FormField label="DIMM Slots Used">
                <Input
                  type="number"
                  min="0"
                  value={createFormData.dimm_slots_used}
                  onChange={(e) => setCreateFormData({ ...createFormData, dimm_slots_used: parseInt(e.target.value) || 0 })}
                  placeholder="8"
                />
              </FormField>

              <FormField label="Total DIMM Slots">
                <Input
                  type="number"
                  min="0"
                  value={createFormData.dimm_slots_total}
                  onChange={(e) => setCreateFormData({ ...createFormData, dimm_slots_total: parseInt(e.target.value) || 0 })}
                  placeholder="16"
                />
              </FormField>
            </div>
          </div>

          {/* Storage Specifications */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Storage Specifications</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Storage Type" required>
                <select
                  value={createFormData.storage_type}
                  onChange={(e) => setCreateFormData({ ...createFormData, storage_type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="NVMe">NVMe</option>
                  <option value="SSD">SSD</option>
                  <option value="HDD">HDD</option>
                  <option value="Normal SATA">Normal SATA</option>
                </select>
              </FormField>

              <FormField label="Storage Capacity (GB)" required error={errors.storage_capacity_gb}>
                <Input
                  type="number"
                  min="1"
                  value={createFormData.storage_capacity_gb}
                  onChange={(e) => setCreateFormData({ ...createFormData, storage_capacity_gb: parseInt(e.target.value) || 0 })}
                  placeholder="2000"
                  error={!!errors.storage_capacity_gb}
                />
              </FormField>

              <FormField label="RAID Configuration" required>
                <select
                  value={createFormData.raid_configuration}
                  onChange={(e) => setCreateFormData({ ...createFormData, raid_configuration: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="RAID 1">RAID 1</option>
                  <option value="RAID 5">RAID 5</option>
                  <option value="RAID 10">RAID 10</option>
                  <option value="JBOD">JBOD</option>
                  <option value="None">None</option>
                </select>
              </FormField>

              <FormField label="Disk Vendor/Model">
                <Input
                  value={createFormData.disk_vendor_model}
                  onChange={(e) => setCreateFormData({ ...createFormData, disk_vendor_model: e.target.value })}
                  placeholder="Samsung 980 PRO"
                />
              </FormField>
            </div>
          </div>

          {/* Network Specifications */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Network Specifications</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="NIC Count" required>
                <Input
                  type="number"
                  min="1"
                  value={createFormData.nic_count}
                  onChange={(e) => setCreateFormData({ ...createFormData, nic_count: parseInt(e.target.value) || 1 })}
                  placeholder="2"
                />
              </FormField>

              <FormField label="NIC Speed" required>
                <select
                  value={createFormData.nic_speed}
                  onChange={(e) => setCreateFormData({ ...createFormData, nic_speed: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="1GbE">1GbE</option>
                  <option value="10GbE">10GbE</option>
                  <option value="25GbE">25GbE</option>
                  <option value="40GbE">40GbE</option>
                  <option value="100GbE">100GbE</option>
                </select>
              </FormField>

              <FormField label="Teaming/Bonding">
                <Input
                  value={createFormData.teaming_bonding}
                  onChange={(e) => setCreateFormData({ ...createFormData, teaming_bonding: e.target.value })}
                  placeholder="LACP, Active-Backup"
                />
              </FormField>

              <FormField label="VLAN Tagging Support">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={createFormData.vlan_tagging_support}
                    onChange={(e) => setCreateFormData({ ...createFormData, vlan_tagging_support: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Enable VLAN tagging</span>
                </label>
              </FormField>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateSubmit} loading={loading}>
              Add Node
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Node Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title={`Edit Node - ${editingNode?.node_name}`}
        size="lg"
      >
        {editingNode && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Node Name" required>
                <Input
                  value={editFormData.node_name || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, node_name: e.target.value })}
                  placeholder="Node-01"
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
                  <option value="Maintenance">Maintenance</option>
                </select>
              </FormField>

              <FormField label="Hostname" required>
                <Input
                  value={editFormData.hostname || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, hostname: e.target.value })}
                  placeholder="node01.domain.com"
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

      {/* Node Details Modal */}
      <Modal
        isOpen={showNodeDetails}
        onClose={() => setShowNodeDetails(false)}
        title={`Node Details - ${selectedNode?.node_name}`}
        size="xl"
      >
        {selectedNode && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Node Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Name:</span> 
                    <span>{selectedNode.node_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Hostname:</span> 
                    <span className="font-mono">{selectedNode.hostname}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Cluster:</span> 
                    <span>{clusters.find(c => c.id === selectedNode.cluster_id)?.cluster_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Status:</span> 
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      selectedNode.status === 'Active' ? 'bg-green-100 text-green-800' :
                      selectedNode.status === 'Inactive' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {selectedNode.status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">VMs:</span> 
                    <span>{selectedNode.vm_count}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">CPU Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Vendor:</span> 
                    <span>{selectedNode.cpu_vendor}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Model:</span> 
                    <span>{selectedNode.cpu_model}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Cores/Threads:</span> 
                    <span>{selectedNode.total_physical_cores}C/{selectedNode.total_logical_threads}T</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Clock Speed:</span> 
                    <span>{selectedNode.cpu_clock_speed_ghz} GHz</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Total CPU:</span> 
                    <span>{selectedNode.total_cpu_ghz} GHz</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Available:</span> 
                    <span className="text-green-600">{selectedNode.available_cpu_ghz} GHz</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">RAM Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Total RAM:</span> 
                    <span>{selectedNode.total_ram_gb} GB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">RAM Type:</span> 
                    <span>{selectedNode.ram_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">DIMM Slots:</span> 
                    <span>{selectedNode.dimm_slots_used}/{selectedNode.dimm_slots_total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Available:</span> 
                    <span className="text-green-600">{selectedNode.available_ram_gb} GB</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Storage Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Storage Type:</span> 
                    <span>{selectedNode.storage_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Capacity:</span> 
                    <span>{selectedNode.storage_capacity_gb} GB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">RAID:</span> 
                    <span>{selectedNode.raid_configuration}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Available:</span> 
                    <span className="text-green-600">{selectedNode.available_storage_gb} GB</span>
                  </div>
                  {selectedNode.disk_vendor_model && (
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Disk Model:</span> 
                      <span>{selectedNode.disk_vendor_model}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Network Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">NIC Count:</span> 
                  <span>{selectedNode.nic_count}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">NIC Speed:</span> 
                  <span>{selectedNode.nic_speed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">VLAN Support:</span> 
                  <span>{selectedNode.vlan_tagging_support ? 'Yes' : 'No'}</span>
                </div>
                {selectedNode.teaming_bonding && (
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Teaming:</span> 
                    <span>{selectedNode.teaming_bonding}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <Button 
                variant="outline" 
                onClick={() => {
                  setEditingNode(selectedNode);
                  setEditFormData(selectedNode);
                  setShowNodeDetails(false);
                  setShowEditModal(true);
                }}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Node
              </Button>
              <Button 
                variant="danger"
                onClick={() => {
                  setShowNodeDetails(false);
                  handleDelete(selectedNode);
                }}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Node
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  );
};