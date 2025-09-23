import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, PieChart, TrendingUp, Download, Calendar, Filter, DollarSign, Server, Users, Shield, AlertTriangle, Clock } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { useSupabaseDataStore as useDataStore } from '../../hooks/useSupabaseDataStore';
import { showToast } from '../ui/Toast';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';

export const Analytics: React.FC = () => {
  const { vms, customers, contracts, gpAccounts, clusters, nodes, getDashboardMetrics } = useDataStore();
  const [dateRange, setDateRange] = useState('30');
  const [reportType, setReportType] = useState('overview');
  const [metrics, setMetrics] = useState(getDashboardMetrics());

  useEffect(() => {
    setMetrics(getDashboardMetrics());
  }, [vms, customers, contracts, gpAccounts, clusters, nodes]);

  // Calculate analytics data
  const vmStatusData = [
    { name: 'Active', value: vms.filter(vm => vm.status === 'Active').length, color: '#10b981' },
    { name: 'Inactive', value: vms.filter(vm => vm.status === 'Inactive').length, color: '#ef4444' },
    { name: 'Maintenance', value: vms.filter(vm => vm.status === 'Maintenance').length, color: '#f59e0b' },
    { name: 'Terminated', value: vms.filter(vm => vm.status === 'Terminated').length, color: '#6b7280' }
  ];

  const customerVMData = customers.map(customer => ({
    name: customer.department_name.split(' ')[0],
    vms: vms.filter(vm => vm.customer_id === customer.id).length,
    revenue: contracts.filter(c => c.customer_id === customer.id && c.status === 'Active').reduce((sum, c) => sum + c.value, 0)
  }));

  // const monthlyTrendData = [
  //   { month: 'Jan', vms: 45, customers: 12, revenue: 15000 },
  //   { month: 'Feb', vms: 52, customers: 15, revenue: 18500 },
  //   { month: 'Mar', vms: 61, customers: 18, revenue: 22000 },
  //   { month: 'Apr', vms: 58, customers: 16, revenue: 20500 },
  //   { month: 'May', vms: 67, customers: 22, revenue: 25000 },
  //   { month: 'Jun', vms: 73, customers: 25, revenue: 28000 }
  // ];

  const calculateMonthlyTrends = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth(); // 0-based (September = 8)

    // Get the last 6 months including current month
    const recentMonths = [];
    for (let i = 5; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12;
      recentMonths.push({ name: months[monthIndex], index: monthIndex });
    }

    return recentMonths.map(({ name, index }) => {
      const monthEnd = new Date(currentYear, index + 1, 0);
      
      // Count nodes created up to this month
      const nodesUpToMonth = nodes.filter(node =>
        node.created_at && new Date(node.created_at) <= monthEnd
      ).length;

      // Count clusters created up to this month
      const clustersUpToMonth = clusters.filter(cluster => 
        new Date(cluster.created_at) <= monthEnd
      ).length;

      // Calculate revenue for this specific month only
      const monthStart = new Date(currentYear, index, 1);
      const revenueForMonth = contracts.filter(contract => {
        const contractStart = new Date(contract.created_at);
        const contractEnd = new Date(contract.service_end_date);
        return contract.status === 'Active' && 
               contractStart <= monthEnd && 
               contractEnd >= monthStart;
      }).reduce((sum, contract) => {
        // Calculate monthly revenue (annual value / 12)
        const monthlyValue = contract.value;
        return sum + monthlyValue;
      }, 0);

      // Use actual revenue if contracts exist, otherwise use fallback with variation
      // Use only actual revenue from contracts
const finalRevenue = Math.round(revenueForMonth);
      return {
        month: name, 
        nodes: nodesUpToMonth,
        clusters: clustersUpToMonth,
        revenue: finalRevenue
      };
    });
  }

  const monthlyTrendData = calculateMonthlyTrends();

  const contractStatusData = [
    { name: 'Active', value: contracts.filter(c => c.status === 'Active').length, color: '#10b981' },
    { name: 'Expired', value: contracts.filter(c => c.status === 'Expired').length, color: '#ef4444' },
    { name: 'Pending', value: contracts.filter(c => c.status === 'Pending').length, color: '#f59e0b' },
    { name: 'Cancelled', value: contracts.filter(c => c.status === 'Cancelled').length, color: '#6b7280' }
  ];

  // const resourceUtilizationData = [
  //   { resource: 'CPU (vCores)', allocated: metrics.totalCPU, available: 128 - metrics.totalCPU },
  //   { resource: 'RAM (GB)', allocated: metrics.totalRAM, available: 512 - metrics.totalRAM },
  //   { resource: 'Storage (GB)', allocated: metrics.totalStorage, available: 10000 - metrics.totalStorage }
  // ];

  const calculateResourceUtilization = () => {
    // Use logical threads with virtualization multiplier (typically 2-4x overallocation is normal)
    const totalCPU = nodes.reduce((sum, n) => sum + ((n.total_logical_threads || 0) * 3), 0);
    const totalRAM = nodes.reduce((sum, n) => sum + (n.total_ram_gb || 0), 0);
    const totalStorage = nodes.reduce((sum, n) => sum + (n.storage_capacity_gb || 0), 0);
  
    console.log('Sample node data:', nodes[0]);
    console.log('Total nodes data (cores/GB):', { totalCPU, totalRAM, totalStorage });
    console.log('Nodes count:', nodes.length);
    
    const allocatedCPU = vms.reduce((sum, vm) => {
      // Use cpu field (vCPU cores) instead of cpu_ghz which has unrealistic values
      const cpuValue = parseFloat(vm.cpu) || 0;
      return sum + cpuValue;
    }, 0);
    console.log('allocatedCPU (vCPU cores):',allocatedCPU);
    console.log('CPU comparison:', { allocated: allocatedCPU, total: totalCPU, ratio: allocatedCPU/totalCPU });
    
    const allocatedRAM = vms.reduce((sum, vm) => {
      let ramValue = parseFloat(vm.ram) || 0;
      // Convert MB to GB if value is > 1000 (assuming MB)
      if (ramValue > 1000) {
        ramValue = ramValue / 1024;
      }
      return sum + ramValue;
    }, 0);
    console.log('allocatedRAM (GB):',allocatedRAM)
    console.log('RAM comparison:', { allocated: allocatedRAM, total: totalRAM, ratio: allocatedRAM/totalRAM });
    
    const allocatedStorage = vms.reduce((sum, vm) => {
      let storageValue = parseFloat(vm.storage) || 0;
      // Convert MB to GB if value is > 1000 (assuming MB)
      if (storageValue > 1000) {
        storageValue = storageValue / 1024;
      }
      return sum + storageValue;
    }, 0);
    console.log('allocatedStorage (GB):',allocatedStorage)
    console.log('Storage comparison:', { allocated: allocatedStorage, total: totalStorage, ratio: allocatedStorage/totalStorage });
  
    return [
      {
        resource: 'CPU (vCores)',
        allocated: Math.min(allocatedCPU, totalCPU),
        available: Math.max(0, totalCPU - allocatedCPU),
        total: totalCPU,
        utilization: totalCPU > 0 ? ((allocatedCPU / totalCPU) * 100).toFixed(1) : '0'
      },
      {
        resource: 'RAM (GB)',
        allocated: Math.min(allocatedRAM, totalRAM),
        available: Math.max(0, totalRAM - allocatedRAM),
        total: totalRAM,
        utilization: totalRAM > 0 ? ((allocatedRAM / totalRAM) * 100).toFixed(1) : '0'
      },
      {
        resource: 'Storage (GB)',
        allocated: Math.min(allocatedStorage, totalStorage),
        available: Math.max(0, totalStorage - allocatedStorage),
        total: totalStorage,
        utilization: totalStorage > 0 ? ((allocatedStorage / totalStorage) * 100).toFixed(1) : '0'
      }
    ];


  };
  

  const resourceUtilizationData = calculateResourceUtilization();

  const exportReport = (type: string) => {
    let csvContent = '';
    let filename = '';

    switch (type) {
      case 'vm-summary':
        csvContent = [
          ['VM Name', 'Status', 'CPU', 'RAM', 'Storage', 'Public IP', 'Management IP', 'Customer', 'Password Due', 'Created'].join(','),
          ...vms.map(vm => {
            const customer = customers.find(c => c.id === vm.customer_id);
            return [
              vm.vm_name,
              vm.status,
              vm.cpu,
              vm.ram,
              vm.storage,
              vm.public_ip || '',
              vm.management_ip || '',
              customer?.department_name || '',
              new Date(vm.next_password_due_date).toLocaleDateString(),
              new Date(vm.created_at).toLocaleDateString()
            ].join(',');
          })
        ].join('\n');
        filename = 'vm_summary_report';
        break;

      case 'customer-analysis':
        csvContent = [
          ['Customer', 'VMs Count', 'Total Revenue', 'Active Contracts', 'GP Accounts'].join(','),
          ...customers.map(customer => [
            customer.department_name,
            vms.filter(vm => vm.customer_id === customer.id).length.toString(),
            contracts.filter(c => c.customer_id === customer.id && c.status === 'Active').reduce((sum, c) => sum + c.value, 0).toString(),
            contracts.filter(c => c.customer_id === customer.id && c.status === 'Active').length.toString(),
            gpAccounts.filter(gp => gp.customer_id === customer.id).length.toString()
          ].join(','))
        ].join('\n');
        filename = 'customer_analysis_report';
        break;

      case 'financial':
        csvContent = [
          ['Contract Number', 'Customer', 'Value', 'Status', 'Start Date', 'End Date', 'Duration'].join(','),
          ...contracts.map(contract => {
            const customer = customers.find(c => c.id === contract.customer_id);
            const duration = Math.ceil((new Date(contract.service_end_date).getTime() - new Date(contract.service_start_date).getTime()) / (1000 * 60 * 60 * 24));
            return [
              contract.contract_number,
              customer?.department_name || '',
              contract.value.toString(),
              contract.status,
              contract.service_start_date,
              contract.service_end_date,
              duration.toString()
            ].join(',');
          })
        ].join('\n');
        filename = 'financial_report';
        break;

      case 'overdue-analysis':
        csvContent = [
          ['Type', 'Entity Name', 'Due Date', 'Days Overdue', 'Status'].join(','),
          // VM Password Overdue
          ...vms.filter(vm => new Date(vm.next_password_due_date) < new Date()).map(vm => {
            const daysOverdue = Math.ceil((new Date().getTime() - new Date(vm.next_password_due_date).getTime()) / (1000 * 60 * 60 * 24));
            return [
              'VM Password',
              vm.vm_name,
              new Date(vm.next_password_due_date).toLocaleDateString(),
              daysOverdue.toString(),
              'Overdue'
            ].join(',');
          }),
          // GP Password Overdue
          ...gpAccounts.filter(gp => new Date(gp.next_password_due_date) < new Date()).map(gp => {
            const daysOverdue = Math.ceil((new Date().getTime() - new Date(gp.next_password_due_date).getTime()) / (1000 * 60 * 60 * 24));
            return [
              'GP Password',
              gp.gp_username,
              new Date(gp.next_password_due_date).toLocaleDateString(),
              daysOverdue.toString(),
              'Overdue'
            ].join(',');
          }),
          // Contract Overdue
          ...contracts.filter(c => new Date(c.service_end_date) < new Date() && c.status === 'Active').map(contract => {
            const daysOverdue = Math.ceil((new Date().getTime() - new Date(contract.service_end_date).getTime()) / (1000 * 60 * 60 * 24));
            return [
              'Contract',
              contract.contract_number,
              new Date(contract.service_end_date).toLocaleDateString(),
              daysOverdue.toString(),
              'Expired'
            ].join(',');
          })
        ].join('\n');
        filename = 'overdue_analysis_report';
        break;
    }

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    showToast.success(`${filename.replace('_', ' ')} exported successfully`);
  };

  return (
    <motion.div
      className="p-6 space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics & Reports</h2>
          <p className="text-gray-600 mt-1">Comprehensive analytics and reporting dashboard</p>
        </div>
        <div className="flex space-x-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
        </div>
      </div>

      {/* Real-time Analysis Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">VM Total</p>
              <p className="text-3xl font-bold text-blue-600">{metrics.totalVMs}</p>
              <p className="text-sm text-blue-600 mt-1">{metrics.activeVMs} active</p>
            </div>
            <Server className="w-8 h-8 text-blue-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Customer Total</p>
              <p className="text-3xl font-bold text-green-600">{metrics.totalCustomers}</p>
              <p className="text-sm text-green-600 mt-1">Active departments</p>
            </div>
            <Users className="w-8 h-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-3xl font-bold text-purple-600">
                ${metrics.totalRevenue.toLocaleString()}
              </p>
              <p className="text-sm text-purple-600 mt-1">Active contracts</p>
            </div>
            <DollarSign className="w-8 h-8 text-purple-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Resource Utilization</p>
              <p className="text-3xl font-bold text-orange-600">
                {resourceUtilizationData.length > 0 
                  ? Math.round(resourceUtilizationData.reduce((sum, resource) => 
                      sum + parseFloat(resource.utilization), 0) / resourceUtilizationData.length)
                  : 0}%
              </p>              
              <p className="text-sm text-orange-600 mt-1">CPU & Memory avg</p>
            </div>
            <BarChart3 className="w-8 h-8 text-orange-600" />
          </div>
        </Card>
      </div>

      {/* Overdue Analysis Cards */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Overdue Analysis</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 border-red-200 bg-red-50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-700 font-medium">VM Password Overdue</p>
                <p className="text-2xl font-bold text-red-900">{metrics.overdueVMPasswords}</p>
                <p className="text-xs text-red-600">Critical security risk</p>
              </div>
              <Server className="w-6 h-6 text-red-600" />
            </div>
          </Card>

          <Card className="p-4 border-red-200 bg-red-50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-700 font-medium">GP Password Overdue</p>
                <p className="text-2xl font-bold text-red-900">{metrics.overdueGPPasswords}</p>
                <p className="text-xs text-red-600">Access security risk</p>
              </div>
              <Shield className="w-6 h-6 text-red-600" />
            </div>
          </Card>

          <Card className="p-4 border-red-200 bg-red-50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-700 font-medium">Contracts Overdue</p>
                <p className="text-2xl font-bold text-red-900">{metrics.overdueContracts}</p>
                <p className="text-xs text-red-600">Renewal required</p>
              </div>
              <Calendar className="w-6 h-6 text-red-600" />
            </div>
          </Card>

          <Card className="p-4 border-amber-200 bg-amber-50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-700 font-medium">Password Alerts</p>
                <p className="text-2xl font-bold text-amber-900">
                  {metrics.nearVMPasswordDue + metrics.nearGPPasswordDue}
                </p>
                <p className="text-xs text-amber-600">Due within 7 days</p>
              </div>
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
          </Card>
        </div>
      </div>

      {/* Resource Utilization Cards */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Resource Utilization</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">CPU Cores</p>
                <p className="text-3xl font-bold text-blue-600">{metrics.totalCPU}</p>
                <p className="text-sm text-blue-600 mt-1">vCPU allocated</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Server className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">RAM</p>
                <p className="text-3xl font-bold text-green-600">{metrics.totalRAM} GB</p>
                <p className="text-sm text-green-600 mt-1">Memory allocated</p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <BarChart3 className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Storage</p>
                <p className="text-3xl font-bold text-purple-600">{(metrics.totalStorage / 1000).toFixed(1)} TB</p>
                <p className="text-sm text-purple-600 mt-1">Storage allocated</p>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg">
                <PieChart className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">VM Status Distribution</h3>
            <Button variant="outline" size="sm" onClick={() => exportReport('vm-summary')}>
              <Download className="w-4 h-4 mr-1" />
              Export
            </Button>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPieChart>
              <Pie
                data={vmStatusData}
                cx="50%"
                cy="50%"
                outerRadius={100}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {vmStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </RechartsPieChart>
          </ResponsiveContainer>
        
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Customer Revenue Distribution</h3>
            <Button variant="outline" size="sm" onClick={() => exportReport('customer-analysis')}>
              <Download className="w-4 h-4 mr-1" />
              Export
            </Button>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={customerVMData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="revenue" fill="#8b5cf6" name="Revenue ($)" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Monthly Growth Trends</h3>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-1" />
              Export
            </Button>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyTrendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="nodes" stroke="#3b82f6" strokeWidth={2} name="Nodes" />
              <Line type="monotone" dataKey="clusters" stroke="#10b981" strokeWidth={2} name="Clusters" />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Contract Status Overview</h3>
            <Button variant="outline" size="sm" onClick={() => exportReport('financial')}>
              <Download className="w-4 h-4 mr-1" />
              Export
            </Button>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPieChart>
              <Pie
                data={contractStatusData}
                cx="50%"
                cy="50%"
                outerRadius={100}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {contractStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </RechartsPieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Resource Utilization Chart */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Resource Utilization Analysis</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={resourceUtilizationData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="resource" />
            <YAxis />
            <Tooltip 
              formatter={(value, name, props) => {
                if (name === 'Allocated') {
                  return [`${value} ${props.payload.resource.includes('CPU') ? 'GHz' : 'GB'}`, name];
                }
                if (name === 'Available') {
                  return [`${value} ${props.payload.resource.includes('CPU') ? 'GHz' : 'GB'}`, name];
                }
                return [value, name];
              }}
              labelFormatter={(label) => {
                const resource = resourceUtilizationData.find(r => r.resource === label);
                return `${label} - ${resource?.utilization}% utilized`;
              }}
            />
            <Legend />
            <Bar dataKey="allocated" stackId="a" fill="#ef4444" name="Allocated" />
            <Bar dataKey="available" stackId="a" fill="#10b981" name="Available" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Revenue Analysis */}
      {/* <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Analysis</h3>
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={monthlyTrendData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']} />
            <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} />
          </AreaChart>
        </ResponsiveContainer>
      </Card> */}

      {/* Export Options */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Reports</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Button variant="outline" onClick={() => exportReport('vm-summary')}>
            <Download className="w-4 h-4 mr-2" />
            VM Summary Report
          </Button>
          <Button variant="outline" onClick={() => exportReport('customer-analysis')}>
            <Download className="w-4 h-4 mr-2" />
            Customer Analysis
          </Button>
          <Button variant="outline" onClick={() => exportReport('financial')}>
            <Download className="w-4 h-4 mr-2" />
            Financial Report
          </Button>
          <Button variant="outline" onClick={() => exportReport('overdue-analysis')}>
            <Download className="w-4 h-4 mr-2" />
            Overdue Analysis
          </Button>
        </div>
      </Card>
    </motion.div>
  );
};