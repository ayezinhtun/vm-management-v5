export interface Customer {
  id: string;
  department_name: string;
  created_at: string;
  updated_at: string;
}

export interface Contact {
  id: string;
  customer_id: string;
  name: string;
  department?: string;
  email: string;
  contact_number: string;
  created_at: string;
}

export interface Contract {
  id: string;
  customer_id: string;
  contract_number: string;
  contract_name: string;
  service_start_date: string;
  service_end_date: string;
  value: number;
  status: 'Active' | 'Expired' | 'Pending' | 'Cancelled';
  created_at: string;
  updated_at: string;
}

export interface GPAccount {
  id: string;
  customer_id: string;
  gp_ip: string;
  gp_username: string;
  gp_password?: string;
  account_created_date: string;
  last_password_changed_date: string;
  password_changer: string;
  account_creator: string;
  next_password_due_date: string;
  status: 'Active' | 'Inactive' | 'Suspended';
  created_at: string;
  updated_at: string;
}

export interface Cluster {
  id: string;
  cluster_name: string;
  cluster_type?: string;
  cluster_code: string;
  cluster_purpose: 'Production' | 'Development' | 'Testing' | 'Lab' | 'DR Site' | 'Staging';
  cluster_location: string;
  total_cpu_ghz: number;
  total_ram_gb: number;
  total_storage_gb: number;
  storage_type: 'NVMe' | 'SSD' | 'HDD' | 'Normal';
  allocated_cpu_ghz: number;
  allocated_ram_gb: number;
  allocated_storage_gb: number;
  available_cpu_ghz: number;
  available_ram_gb: number;
  available_storage_gb: number;
  node_count: number;
  vm_count: number;
  status: 'Active' | 'Inactive' | 'Maintenance';
  created_at: string;
  updated_at: string;
}

export interface Node {
  id: string;
  cluster_id: string;
  node_name: string;
  hostname: string;
  
  // CPU Specifications
  cpu_vendor: 'Intel' | 'AMD';
  cpu_model: string;
  total_physical_cores: number;
  total_logical_threads: number;
  cpu_clock_speed_ghz: number;
  total_cpu_ghz: number;
  allocated_cpu_ghz: number;
  available_cpu_ghz: number;
  
  // RAM Specifications
  total_ram_gb: number;
  dimm_slots_used: number;
  dimm_slots_total: number;
  ram_type: 'DDR4' | 'DDR5' | 'ECC Registered';
  allocated_ram_gb: number;
  available_ram_gb: number;
  
  // Storage Specifications
  storage_type: 'NVMe' | 'SSD' | 'HDD' | 'Normal SATA';
  storage_capacity_gb: number;
  raid_configuration: 'RAID 1' | 'RAID 5' | 'RAID 10' | 'JBOD' | 'None';
  disk_vendor_model?: string;
  allocated_storage_gb: number;
  available_storage_gb: number;
  
  // Network Specifications
  nic_count: number;
  nic_speed: '1GbE' | '10GbE' | '25GbE' | '40GbE' | '100GbE';
  teaming_bonding?: string;
  vlan_tagging_support: boolean;
  
  vm_count: number;
  status: 'Active' | 'Inactive' | 'Maintenance';
  created_at: string;
  updated_at: string;
}

export interface VM {
  id: string;
  customer_id: string;
  cluster_id: string;
  node_id: string;
  vm_name: string;
  cpu: string;
  cpu_ghz: number;
  ram: string;
  storage: string;
  os_type?: string;
  os_version?: string;
  services: string;
  creation_date: string;
  service_start_date: string;
  service_end_date: string;
  password_created_date: string;
  last_password_changed_date: string;
  next_password_due_date: string;
  password_changer: string;
  public_ip?: string;
  management_ip?: string;
  private_ips: string[];
  allowed_ports: string[];
  status: 'Active' | 'Inactive' | 'Maintenance' | 'Terminated';
  remarks?: string;
  custom_fields?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface VMContract {
  id: string;
  vm_id: string;
  contract_id: string;
}

export interface VMGPAccount {
  id: string;
  vm_id: string;
  gp_account_id: string;
}

export interface AuditLog {
  id: string;
  table_name: string;
  operation: 'CREATE' | 'UPDATE' | 'DELETE';
  record_id: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  changed_by: string;
  timestamp: string;
  description: string;
}

export interface UserSettings {
  itemsPerPage: number;
  defaultDateRange: string;
  visibleColumns: string[];
  theme: 'light';
}

export interface DashboardMetrics {
  totalVMs: number;
  activeVMs: number;
  inactiveVMs: number;
  maintenanceVMs: number;
  totalCustomers: number;
  totalContracts: number;
  activeContracts: number;
  expiringContracts: number;
  totalGPAccounts: number;
  activeGPAccounts: number;
  totalClusters: number;
  activeClusters: number;
  totalNodes: number;
  activeNodes: number;
  totalCPUGHz: number;
  allocatedCPUGHz: number;
  availableCPUGHz: number;
  totalRAMGB: number;
  allocatedRAMGB: number;
  availableRAMGB: number;
  totalStorageGB: number;
  allocatedStorageGB: number;
  availableStorageGB: number;
  totalRevenue: number;
  monthlyGrowth: number;
  upcomingPasswordChanges: number;
  nearVMPasswordDue: number;
  nearGPPasswordDue: number;
  nearContractExpiry: number;
  overdueVMPasswords: number;
  overdueGPPasswords: number;
  overdueContracts: number;
}

export interface ActivityLog {
  id: string;
  action: string;
  entity_type: 'VM' | 'Customer' | 'Contract' | 'GPAccount' | 'Cluster' | 'Node';
  entity_id: string;
  entity_name: string;
  user: string;
  timestamp: string;
  details: string;
  severity: 'info' | 'warning' | 'error' | 'success';
}