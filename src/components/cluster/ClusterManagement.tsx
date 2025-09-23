import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Plus, Download, Eye, Edit, Trash2, Server, Database, HardDrive, Activity } from 'lucide-react';
import { Card } from '../ui/Card';
import { Table } from '../ui/Table';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { FormField } from '../ui/FormField';
import { useSupabaseDataStore as useDataStore } from '../../hooks/useSupabaseDataStore';
import { showToast } from '../ui/Toast';
import { Cluster } from '../../types';

export const ClusterManagement: React.FC = () => {
  const { 
    clusters, 
    nodes,
    vms,
    loading, 
    createCluster,
    updateCluster, 
    deleteCluster,
    getClusterNodes
  } = useDataStore();
  
  const [filteredClusters, setFilteredClusters] = useState<Cluster[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [purposeFilter, setPurposeFilter] = useState('all');
  const [selectedCluster, setSelectedCluster] = useState<Cluster | null>(null);
  const [showClusterDetails, setShowClusterDetails] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCluster, setEditingCluster] = useState<Cluster | null>(null);
  const [sortField, setSortField] = useState<string>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Form states
  const [createFormData, setCreateFormData] = useState({
    cluster_name: '',
    cluster_type: '',
    cluster_code: '',
    cluster_purpose: 'Production' as const,
    cluster_location: '',
    total_cpu_ghz: 0,
    total_ram_gb: 0,
    total_storage_gb: 0,
    storage_type: 'SSD' as const,
    status: 'Active' as const
  });

  const [editFormData, setEditFormData] = useState<Partial<Cluster>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Ensure clusters is an array before performing operations
    let filtered = Array.isArray(clusters) ? [...clusters] : [];

    if (searchTerm) {
      filtered = filtered.filter(cluster =>
        cluster.cluster_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cluster.cluster_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cluster.cluster_location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(cluster => cluster.status === statusFilter);
    }

    if (purposeFilter !== 'all') {
      filtered = filtered.filter(cluster => cluster.cluster_purpose === purposeFilter);
    }

    // Sort data
    filtered.sort((a, b) => {
      const aValue = a[sortField as keyof Cluster];
      const bValue = b[sortField as keyof Cluster];
      
      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    setFilteredClusters(filtered);
  }, [clusters, searchTerm, statusFilter, purposeFilter, sortField, sortDirection]);

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

    if (!createFormData.cluster_name.trim()) newErrors.cluster_name = 'Cluster name is required';
    if (!createFormData.cluster_code.trim()) newErrors.cluster_code = 'Cluster code is required';
    if (!createFormData.cluster_location.trim()) newErrors.cluster_location = 'Cluster location is required';
    if (createFormData.total_cpu_ghz <= 0) newErrors.total_cpu_ghz = 'Total CPU GHz must be greater than 0';
    if (createFormData.total_ram_gb <= 0) newErrors.total_ram_gb = 'Total RAM must be greater than 0';
    if (createFormData.total_storage_gb <= 0) newErrors.total_storage_gb = 'Total storage must be greater than 0';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateSubmit = async () => {
    if (!validateCreateForm()) return;

    try {
      const result = await createCluster(createFormData);
      if (result.success) {
        setShowCreateModal(false);
        setCreateFormData({
          cluster_name: '',
          cluster_type: '',
          cluster_code: '',
          cluster_purpose: 'Production',
          cluster_location: '',
          total_cpu_ghz: 0,
          total_ram_gb: 0,
          total_storage_gb: 0,
          storage_type: 'SSD',
          status: 'Active'
        });
        setErrors({});
      }
    } catch (error) {
      console.error('Create cluster error:', error);
    }
  };

  const handleEditSubmit = async () => {
    if (!editingCluster || !editFormData) return;

    try {
      await updateCluster(editingCluster.id, editFormData);
      setShowEditModal(false);
      setEditingCluster(null);
      setEditFormData({});
    } catch (error) {
      console.error('Edit cluster error:', error);
    }
  };

  const handleDelete = async (cluster: Cluster) => {
    const clusterNodes = getClusterNodes(cluster.id);
    if (clusterNodes.length > 0) {
      showToast.error(`Cannot delete cluster with ${clusterNodes.length} active nodes`);
      return;
    }

    if (window.confirm(`Are you sure you want to delete cluster "${cluster.cluster_name}"?`)) {
      await deleteCluster(cluster.id);
    }
  };

  const exportData = () => {
    const csvContent = [
      ['Cluster Name', 'Code', 'Purpose', 'Location', 'Status', 'CPU (GHz)', 'RAM (GB)', 'Storage (GB)', 'Nodes', 'VMs', 'Created'].join(','),
      ...filteredClusters.map(cluster => [
        cluster.cluster_name,
        cluster.cluster_code,
        cluster.cluster_purpose,
        cluster.cluster_location,
        cluster.status,
        cluster.total_cpu_ghz.toString(),
        cluster.total_ram_gb.toString(),
        cluster.total_storage_gb.toString(),
        cluster.node_count.toString(),
        cluster.vm_count.toString(),
        new Date(cluster.created_at).toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clusters_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    showToast.success('Clusters exported successfully');
  };

  const clusterColumns = [
    { key: 'cluster_name', label: 'Cluster Name', sortable: true },
    { key: 'cluster_code', label: 'Code', sortable: true },
    { key: 'cluster_purpose', label: 'Purpose', sortable: true },
    { key: 'cluster_location', label: 'Location', sortable: true },
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
      key: 'resources', 
      label: 'Resources (CPU/RAM/Storage)', 
      render: (value: any, cluster: Cluster) => (
        <div className="text-sm">
          <div className="font-medium">{cluster.total_cpu_ghz} GHz</div>
          <div className="text-gray-500">{cluster.total_ram_gb} GB / {cluster.total_storage_gb} GB</div>
        </div>
      )
    },
    { 
      key: 'utilization', 
      label: 'Utilization', 
      render: (value: any, cluster: Cluster) => {
        // const cpuUtil = cluster.total_cpu_ghz > 0 ? (cluster.allocated_cpu_ghz / cluster.total_cpu_ghz * 100) : 0;
        // const ramUtil = cluster.total_ram_gb > 0 ? (cluster.allocated_ram_gb / cluster.total_ram_gb * 100) : 0;

        const clusterVMs = vms.filter(vm => vm.cluster_id === cluster.id && vm.status === 'Active');
const allocatedCPU = clusterVMs.reduce((sum, vm) => sum + vm.cpu_ghz, 0);
const allocatedRAM = clusterVMs.reduce((sum, vm) => sum + parseInt(vm.ram), 0);
const cpuUtil = cluster.total_cpu_ghz > 0 ? (allocatedCPU / cluster.total_cpu_ghz * 100) : 0;
const ramUtil = cluster.total_ram_gb > 0 ? (allocatedRAM / cluster.total_ram_gb * 100) : 0;
        return (
          <div className="text-sm">
            <div>CPU: {cpuUtil.toFixed(1)}%</div>
            <div>RAM: {ramUtil.toFixed(1)}%</div>
          </div>
        );
      }
    },
    { 
      key: 'counts', 
      label: 'Nodes/VMs', 
      render: (value: any, cluster: Cluster) => (
        <div className="text-sm">
          <div className="font-medium">{cluster.node_count} Nodes</div>
          <div className="text-gray-500">{cluster.vm_count} VMs</div>
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
      render: (value: any, cluster: Cluster) => (
        <div className="flex space-x-1">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSelectedCluster(cluster);
              setShowClusterDetails(true);
            }}
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setEditingCluster(cluster);
              setEditFormData(cluster);
              setShowEditModal(true);
            }}
            title="Edit Cluster"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => handleDelete(cluster)}
            title="Delete Cluster"
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
          <h2 className="text-2xl font-bold text-gray-900">Cluster Management</h2>
          <p className="text-gray-600 mt-1">Manage infrastructure clusters and resource pools</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={exportData}>
            <Download className="w-4 h-4 mr-2" />
            Export ({filteredClusters.length})
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Cluster
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Clusters</p>
              <p className="text-2xl font-bold text-gray-900">{clusters?.length || 0}</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Server className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Clusters</p>
              <p className="text-2xl font-bold text-green-600">
                {clusters?.filter(cluster => cluster.status === 'Active').length || 0}
              </p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <Activity className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Nodes</p>
              <p className="text-2xl font-bold text-purple-600">
                {clusters?.reduce((sum, cluster) => sum + cluster.node_count, 0) || 0}
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
                {clusters?.reduce((sum, cluster) => sum + cluster.vm_count, 0) || 0}
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
              placeholder="Search clusters..."
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
            value={purposeFilter}
            onChange={(e) => setPurposeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Purposes</option>
            <option value="Production">Production</option>
            <option value="Development">Development</option>
            <option value="Testing">Testing</option>
            <option value="Lab">Lab</option>
            <option value="DR Site">DR Site</option>
            <option value="Staging">Staging</option>
          </select>

          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Advanced Filters
          </Button>
        </div>
      </Card>

      {/* Clusters Table */}
      <Card>
        <Table
          columns={clusterColumns}
          data={filteredClusters}
          loading={loading}
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={handleSort}
        />
      </Card>

      {/* Create Cluster Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Cluster"
        size="xl"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Cluster Name" required error={errors.cluster_name}>
              <Input
                value={createFormData.cluster_name}
                onChange={(e) => setCreateFormData({ ...createFormData, cluster_name: e.target.value })}
                placeholder="Production Cluster 01"
                error={!!errors.cluster_name}
              />
            </FormField>

            <FormField label="Cluster Type">
              <Input
                value={createFormData.cluster_type}
                onChange={(e) => setCreateFormData({ ...createFormData, cluster_type: e.target.value })}
                placeholder="VMware vSphere, Hyper-V, etc."
              />
            </FormField>

            <FormField label="Cluster Code/ID" required error={errors.cluster_code}>
              <Input
                value={createFormData.cluster_code}
                onChange={(e) => setCreateFormData({ ...createFormData, cluster_code: e.target.value })}
                placeholder="PROD-CL-01"
                error={!!errors.cluster_code}
              />
            </FormField>

            <FormField label="Purpose/Role" required>
              <select
                value={createFormData.cluster_purpose}
                onChange={(e) => setCreateFormData({ ...createFormData, cluster_purpose: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Production">Production</option>
                <option value="Development">Development</option>
                <option value="Testing">Testing</option>
                <option value="Lab">Lab</option>
                <option value="DR Site">DR Site</option>
                <option value="Staging">Staging</option>
              </select>
            </FormField>

            <FormField label="Location" required error={errors.cluster_location}>
              <Input
                value={createFormData.cluster_location}
                onChange={(e) => setCreateFormData({ ...createFormData, cluster_location: e.target.value })}
                placeholder="DC-01, Rack-A, Zone-1"
                error={!!errors.cluster_location}
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

            <FormField label="Total CPU (GHz)" required error={errors.total_cpu_ghz}>
              <Input
                type="number"
                step="0.1"
                min="0"
                value={createFormData.total_cpu_ghz}
                onChange={(e) => setCreateFormData({ ...createFormData, total_cpu_ghz: parseFloat(e.target.value) || 0 })}
                placeholder="128.0"
                error={!!errors.total_cpu_ghz}
              />
            </FormField>

            <FormField label="Total RAM (GB)" required error={errors.total_ram_gb}>
              <Input
                type="number"
                min="0"
                value={createFormData.total_ram_gb}
                onChange={(e) => setCreateFormData({ ...createFormData, total_ram_gb: parseInt(e.target.value) || 0 })}
                placeholder="1024"
                error={!!errors.total_ram_gb}
              />
            </FormField>

            <FormField label="Storage Type" required>
              <select
                value={createFormData.storage_type}
                onChange={(e) => setCreateFormData({ ...createFormData, storage_type: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="NVMe">NVMe</option>
                <option value="SSD">SSD</option>
                <option value="HDD">HDD</option>
                <option value="Normal">Normal</option>
              </select>
            </FormField>

            <FormField label="Total Storage (GB)" required error={errors.total_storage_gb}>
              <Input
                type="number"
                min="0"
                value={createFormData.total_storage_gb}
                onChange={(e) => setCreateFormData({ ...createFormData, total_storage_gb: parseInt(e.target.value) || 0 })}
                placeholder="10000"
                error={!!errors.total_storage_gb}
              />
            </FormField>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateSubmit} loading={loading}>
              Create Cluster
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Cluster Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title={`Edit Cluster - ${editingCluster?.cluster_name}`}
        size="xl"
      >
        {editingCluster && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Cluster Name" required>
                <Input
                  value={editFormData.cluster_name || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, cluster_name: e.target.value })}
                  placeholder="Production Cluster 01"
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

              <FormField label="Location" required>
                <Input
                  value={editFormData.cluster_location || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, cluster_location: e.target.value })}
                  placeholder="DC-01, Rack-A, Zone-1"
                />
              </FormField>

              <FormField label="Total CPU" required>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  value={editFormData.total_cpu_ghz || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, total_cpu_ghz: parseFloat(e.target.value) || 0 })}
                  placeholder="128.0"
                />
              </FormField>

              <FormField label="Total RAM" required>
                <Input
                  type="number"
                  min="0"
                  value={editFormData.total_ram_gb || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, total_ram_gb: parseInt(e.target.value) || 0 })}
                  placeholder="1024"
                />
              </FormField>

              <FormField label="Total Storage" required>
                <Input
                  type="number"
                  min="0"
                  value={editFormData.total_storage_gb || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, total_storage_gb: parseInt(e.target.value) || 0 })}
                  placeholder="1024"
                />
              </FormField>

              <FormField label="Purpose/Role" required>
                <select
                  value={editFormData.cluster_purpose || 'Production'}
                  onChange={(e) => setEditFormData({ ...editFormData, cluster_purpose: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Production">Production</option>
                  <option value="Development">Development</option>
                  <option value="Testing">Testing</option>
                  <option value="Lab">Lab</option>
                  <option value="DR Site">DR Site</option>
                  <option value="Staging">Staging</option>
                </select>
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

      {/* Cluster Details Modal */}
      <Modal
        isOpen={showClusterDetails}
        onClose={() => setShowClusterDetails(false)}
        title={`Cluster Details - ${selectedCluster?.cluster_name}`}
        size="xl"
      >
        {selectedCluster && (() => {
          const clusterVMs = vms.filter(vm => vm.cluster_id === selectedCluster.id && vm.status === 'Active');
          const allocatedCPU = clusterVMs.reduce((sum, vm) => sum + vm.cpu_ghz, 0);
          const availableCPU = selectedCluster.total_cpu_ghz - allocatedCPU;
          const allocatedRAM = clusterVMs.reduce((sum, vm) => sum + parseInt(vm.ram), 0);
          const availableRAM = selectedCluster.total_ram_gb - allocatedRAM;

          return (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Cluster Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Name:</span> 
                      <span>{selectedCluster.cluster_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Code:</span> 
                      <span className="font-mono">{selectedCluster.cluster_code}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Purpose:</span> 
                      <span>{selectedCluster.cluster_purpose}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Location:</span> 
                      <span>{selectedCluster.cluster_location}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Status:</span> 
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        selectedCluster.status === 'Active' ? 'bg-green-100 text-green-800' :
                        selectedCluster.status === 'Inactive' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {selectedCluster.status}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Resource Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Total CPU:</span> 
                      <span>{selectedCluster.total_cpu_ghz} GHz</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Allocated CPU:</span> 
                      <span>{allocatedCPU} GHz</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Available CPU:</span> 
                      <span className="text-green-600">{availableCPU} GHz</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Total RAM:</span> 
                      <span>{selectedCluster.total_ram_gb} GB</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Allocated RAM:</span> 
                      <span>{allocatedRAM} GB</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Available RAM:</span> 
                      <span className="text-green-600">{availableRAM} GB</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Total Storage:</span> 
                      <span>{selectedCluster.total_storage_gb} GB ({selectedCluster.storage_type})</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Nodes:</span> 
                      <span>{selectedCluster.node_count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">VMs:</span> 
                      <span>{selectedCluster.vm_count}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setEditingCluster(selectedCluster);
                    setEditFormData(selectedCluster);
                    setShowClusterDetails(false);
                    setShowEditModal(true);
                  }}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Cluster
                </Button>
                <Button 
                  variant="danger"
                  onClick={() => {
                    setShowClusterDetails(false);
                    handleDelete(selectedCluster);
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Cluster
                </Button>
              </div>
            </div>
          );
        })()}
      </Modal>
    </motion.div>
  );
};