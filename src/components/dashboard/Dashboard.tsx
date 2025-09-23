import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Server, 
  Users, 
  Shield, 
  FileText, 
  Activity,
  TrendingUp,
  AlertTriangle,
  Clock,
  Calendar,
  DollarSign,
  Cpu,
  HardDrive,
  Zap,
  Eye,
  Database
} from 'lucide-react';
import { MetricsCard } from './MetricsCard';
import { Card } from '../ui/Card';
import { Table } from '../ui/Table';
import { Button } from '../ui/Button';
import { useSupabaseDataStore as useDataStore } from '../../hooks/useSupabaseDataStore';
import { showToast } from '../ui/Toast';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';

interface DashboardProps {
  onNavigate?: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { vms, customers, contracts, gpAccounts, activityLogs, contacts, getDashboardMetrics } = useDataStore();
  const [metrics, setMetrics] = useState(getDashboardMetrics());

  useEffect(() => {
    setMetrics(getDashboardMetrics());
  }, [vms, customers, contracts, gpAccounts]);

  const vmColumns = [
    { key: 'vm_name', label: 'VM Name', sortable: true },
    { key: 'status', label: 'Status', render: (value: string) => (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
        value === 'Active' ? 'bg-green-100 text-green-800' :
        value === 'Inactive' ? 'bg-red-100 text-red-800' :
        'bg-yellow-100 text-yellow-800'
      }`}>
        {value}
      </span>
    )},
    { 
      key: 'cpu_ram', 
      label: 'CPU/RAM', 
      render: (value: any, vm: any) => (
        <div className="text-sm">
          <div>{vm.cpu}</div>
          <div className="text-gray-500">{vm.ram}</div>
        </div>
      )
    },
    { 
      key: 'next_password_due_date', 
      label: 'Password Due', 
      render: (value: string) => {
        const dueDate = new Date(value);
        const today = new Date();
        const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        return (
          <span className={`text-sm ${
            daysUntilDue <= 0 ? 'text-red-600 font-bold' :
            daysUntilDue <= 7 ? 'text-amber-600 font-medium' :
            'text-gray-600'
          }`}>
            {dueDate.toLocaleDateString()}
            {daysUntilDue <= 0 && ' (OVERDUE)'}
            {daysUntilDue > 0 && daysUntilDue <= 7 && ' (DUE SOON)'}
          </span>
        );
      }
    },
    { key: 'created_at', label: 'Created', render: (value: string) => 
      new Date(value).toLocaleDateString()
    }
  ];

  const customerColumns = [
    { key: 'department_name', label: 'Department', sortable: true },
    { 
      key: 'contacts', 
      label: 'Contacts', 
      render: (value: any, customer: any) => {
        const customerContacts = contacts.filter(c => c.customer_id === customer.id);
        return (
          <div className="text-sm">
            {customerContacts.slice(0, 2).map((contact, index) => (
              <div key={contact.id} className="text-gray-700">
                {contact.name} ({contact.email})
              </div>
            ))}
            {customerContacts.length > 2 && (
              <div className="text-gray-500">+{customerContacts.length - 2} more</div>
            )}
          </div>
        );
      }
    },
    { key: 'created_at', label: 'Created', render: (value: string) => 
      new Date(value).toLocaleDateString()
    }
  ];

  const statusData = [
    { name: 'Active', value: metrics.activeVMs, color: '#10b981' },
    { name: 'Inactive', value: metrics.inactiveVMs, color: '#ef4444' },
    { name: 'Maintenance', value: metrics.maintenanceVMs, color: '#f59e0b' }
  ];

  // const monthlyData = [
  //   { month: 'Jan', vms: 45, customers: 12, revenue: 15000 },
  //   { month: 'Feb', vms: 52, customers: 15, revenue: 18500 },
  //   { month: 'Mar', vms: 61, customers: 18, revenue: 22000 },
  //   { month: 'Apr', vms: 58, customers: 16, revenue: 20500 },
  //   { month: 'May', vms: 67, customers: 22, revenue: 25000 },
  //   { month: 'Jun', vms: 73, customers: 25, revenue: 28000 }
  // ];

  const generateMonthlyData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    
    // Get last 6 months of data
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const targetMonth = currentMonth - i;
      const targetYear = targetMonth < 0 ? currentYear - 1 : currentYear;
      const adjustedMonth = targetMonth < 0 ? 12 + targetMonth : targetMonth;
      
      const monthStart = new Date(targetYear, adjustedMonth, 1);
      const monthEnd = new Date(targetYear, adjustedMonth + 1, 0);
      
      // Count total VMs created up to this month (cumulative)
      const monthVMs = vms.filter(vm => {
        const createdDate = new Date(vm.created_at);
        return createdDate <= monthEnd;
      }).length;
      
      // Count total customers created up to this month (cumulative)
      const monthCustomers = customers.filter(customer => {
        const createdDate = new Date(customer.created_at);
        return createdDate <= monthEnd;
      }).length;
      
      // Calculate revenue from contracts active in this month
      const monthRevenue = contracts.filter(contract => {
        const startDate = new Date(contract.service_start_date);
        const endDate = new Date(contract.service_end_date);
        return startDate <= monthEnd && endDate >= monthStart && contract.status === 'Active';
      }).reduce((sum, contract) => sum + contract.value, 0);
      
      monthlyData.push({
        month: months[adjustedMonth],
        vms: monthVMs,
        customers: monthCustomers,
        revenue: monthRevenue
      });
    }
    
    return monthlyData;
  };

  const monthlyData = generateMonthlyData();

  const calculateGrowthRate = (current: number, previous: number): { rate: string, type: 'increase' | 'decrease' | 'neutral' } => {
    if (previous === 0) {
      return { rate: current > 0 ? '+100%' : '0%', type: current > 0 ? 'increase' : 'neutral' };
    }
    
    const growth = ((current - previous) / previous) * 100;
    const roundedGrowth = Math.round(growth);
    
    if (roundedGrowth > 0) {
      return { rate: `+${roundedGrowth}%`, type: 'increase' };
    } else if (roundedGrowth < 0) {
      return { rate: `${roundedGrowth}%`, type: 'decrease' };
    } else {
      return { rate: '0%', type: 'neutral' };
    }
  };

  // Get current and previous month data for growth calculations
  const currentMonthData = monthlyData[monthlyData.length - 1] || { vms: 0, customers: 0 };
  const previousMonthData = monthlyData[monthlyData.length - 2] || { vms: 0, customers: 0 };

  const vmGrowth = calculateGrowthRate(currentMonthData.vms, previousMonthData.vms);
  const customerGrowth = calculateGrowthRate(currentMonthData.customers, previousMonthData.customers);
  const revenueGrowth = calculateGrowthRate(currentMonthData.revenue, previousMonthData.revenue);
  const activeVMGrowth = calculateGrowthRate(metrics.activeVMs, previousMonthData.vms);

  return (
    <motion.div
      className="p-6 space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Main Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricsCard
          title="Total VMs"
          value={metrics.totalVMs}
          change={vmGrowth.rate}
          changeType={vmGrowth.type}
          icon={Server}
          color="bg-blue-500"
        />
        <MetricsCard
          title="Active VMs"
          value={metrics.activeVMs}
          change={activeVMGrowth.rate}
          changeType={activeVMGrowth.type}
          icon={Activity}
          color="bg-green-500"
        />
        <MetricsCard
          title="Total Customers"
          value={metrics.totalCustomers}
          change={customerGrowth.rate}
          changeType={customerGrowth.type}
          icon={Users}
          color="bg-purple-500"
        />
        <MetricsCard
          title="Total Revenue"
          value={`$${metrics.totalRevenue.toLocaleString()}`}
          change={revenueGrowth.rate}
          changeType={revenueGrowth.type}
          icon={DollarSign}
          color="bg-emerald-500"
        />
      </div>

      {/* Near Due Date Alert Cards */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Near Due Date Alerts</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 border-amber-200 bg-amber-50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-700 font-medium">VM Password Due Soon</p>
                <p className="text-2xl font-bold text-amber-900">{metrics.nearVMPasswordDue}</p>
                <p className="text-xs text-amber-600">Within 7 days</p>
              </div>
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
          </Card>

          <Card className="p-4 border-orange-200 bg-orange-50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-700 font-medium">GP Password Due Soon</p>
                <p className="text-2xl font-bold text-orange-900">{metrics.nearGPPasswordDue}</p>
                <p className="text-xs text-orange-600">Within 7 days</p>
              </div>
              <Shield className="w-6 h-6 text-orange-600" />
            </div>
          </Card>

          <Card className="p-4 border-red-200 bg-red-50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-700 font-medium">Contracts Expiring Soon</p>
                <p className="text-2xl font-bold text-red-900">{metrics.nearContractExpiry}</p>
                <p className="text-xs text-red-600">Within 30 days</p>
              </div>
              <Calendar className="w-6 h-6 text-red-600" />
            </div>
          </Card>

          <Card className="p-4 border-purple-200 bg-purple-50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-700 font-medium">Total Alerts</p>
                <p className="text-2xl font-bold text-purple-900">
                  {metrics.nearVMPasswordDue + metrics.nearGPPasswordDue + metrics.nearContractExpiry}
                </p>
                <p className="text-xs text-purple-600">Requires attention</p>
              </div>
              <AlertTriangle className="w-6 h-6 text-purple-600" />
            </div>
          </Card>
        </div>
      </div>

      {/* Overdue Alert Cards */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Overdue Alerts</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="p-4 border-red-300 bg-red-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-800 font-medium">VM Password Overdue</p>
                <p className="text-3xl font-bold text-red-900">{metrics.overdueVMPasswords}</p>
                <p className="text-xs text-red-700">Immediate action required</p>
              </div>
              <div className="p-2 bg-red-200 rounded-lg">
                <Server className="w-6 h-6 text-red-700" />
              </div>
            </div>
          </Card>

          <Card className="p-4 border-red-300 bg-red-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-800 font-medium">GP Password Overdue</p>
                <p className="text-3xl font-bold text-red-900">{metrics.overdueGPPasswords}</p>
                <p className="text-xs text-red-700">Security risk</p>
              </div>
              <div className="p-2 bg-red-200 rounded-lg">
                <Shield className="w-6 h-6 text-red-700" />
              </div>
            </div>
          </Card>

          <Card className="p-4 border-red-300 bg-red-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-800 font-medium">Contracts Overdue</p>
                <p className="text-3xl font-bold text-red-900">{metrics.overdueContracts}</p>
                <p className="text-xs text-red-700">Renewal needed</p>
              </div>
              <div className="p-2 bg-red-200 rounded-lg">
                <FileText className="w-6 h-6 text-red-700" />
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Resource Utilization Cards */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Resource Utilization</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total CPU Cores</p>
                <p className="text-2xl font-bold text-blue-600">{metrics.totalCPU}</p>
                <p className="text-xs text-blue-600">vCPU allocated</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Cpu className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total RAM</p>
                <p className="text-2xl font-bold text-green-600">{metrics.totalRAM} GB</p>
                <p className="text-xs text-green-600">Memory allocated</p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <Database className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Storage</p>
                <p className="text-2xl font-bold text-purple-600">{(metrics.totalStorage / 1000).toFixed(1)} TB</p>
                <p className="text-xs text-purple-600">Storage allocated</p>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg">
                <HardDrive className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">VM Status Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Growth Trends</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="vms" stroke="#3b82f6" strokeWidth={2} name="VMs" />
            <Line type="monotone" dataKey="customers" stroke="#10b981" strokeWidth={2} name="Customers" />
          </LineChart>
        </ResponsiveContainer>
      </Card>
      </div>

      {/* Recent Data Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent VMs</h3>
            <Button variant="outline" size="sm" onClick={() => onNavigate?.('vms')}>
              <Eye className="w-4 h-4 mr-1" />
              View All
            </Button>
          </div>
          <Table 
            columns={vmColumns}
            data={vms.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5)}
            loading={false}
          />
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Customers</h3>
            <Button variant="outline" size="sm" onClick={() => onNavigate?.('customers')}>
              <Eye className="w-4 h-4 mr-1" />
              View All
            </Button>
          </div>
          <Table 
            columns={customerColumns}
            data={customers.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5)}
            loading={false}
          />
        </Card>
      </div>

      {/* Revenue Analysis */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Analysis</h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']} />
            <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} />
          </AreaChart>
        </ResponsiveContainer>
      </Card>
    </motion.div>
  );
};