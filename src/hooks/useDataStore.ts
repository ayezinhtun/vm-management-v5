import { useState, useEffect } from 'react';
import { VM, Customer, Contract, GPAccount, Contact, AuditLog, ActivityLog, Cluster, Node } from '../types';
import { showToast } from '../components/ui/Toast';

// Enhanced data stores with more realistic data
let vmStore: VM[] = [
  {
    id: '1',
    vm_name: 'WEB-PROD-01',
    customer_id: '1',
    cpu: '4 vCPU',
    ram: '16 GB',
    storage: '200 GB SSD',
    services: 'Apache, MySQL, PHP',
    creation_date: '2024-01-15',
    service_start_date: '2024-01-15',
    service_end_date: '2024-12-31',
    password_created_date: '2024-01-15',
    last_password_changed_date: '2024-01-15',
    next_password_due_date: '2024-02-25',
    password_changer: 'John Admin',
    public_ip: '203.0.113.10',
    management_ip: '10.0.1.10',
    private_ips: ['192.168.1.10', '192.168.2.10'],
    allowed_ports: ['80', '443', '22', '3306'],
    status: 'Active',
    remarks: 'Production web server for main website',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
    custom_fields: { environment: 'production', backup_enabled: true, access_level: 'high' }
  },
  {
    id: '2',
    vm_name: 'DB-MASTER-01',
    customer_id: '2',
    cpu: '8 vCPU',
    ram: '32 GB',
    storage: '1 TB SSD',
    services: 'PostgreSQL, Redis',
    creation_date: '2024-01-20',
    service_start_date: '2024-01-20',
    service_end_date: '2024-12-31',
    password_created_date: '2024-01-20',
    last_password_changed_date: '2024-02-15',
    next_password_due_date: '2024-02-20',
    password_changer: 'Sarah DBA',
    public_ip: '203.0.113.11',
    management_ip: '10.0.1.11',
    private_ips: ['192.168.1.11'],
    allowed_ports: ['5432', '6379', '22'],
    status: 'Active',
    remarks: 'Primary database server with replication',
    created_at: '2024-01-20T10:00:00Z',
    updated_at: '2024-02-15T14:30:00Z',
    custom_fields: { replication: 'enabled', backup_schedule: 'daily', access_level: 'critical' }
  },
  {
    id: '3',
    vm_name: 'APP-DEV-01',
    customer_id: '1',
    cpu: '2 vCPU',
    ram: '8 GB',
    storage: '100 GB SSD',
    services: 'Node.js, Docker',
    creation_date: '2024-02-01',
    service_start_date: '2024-02-01',
    service_end_date: '2024-12-31',
    password_created_date: '2024-02-01',
    last_password_changed_date: '2024-02-01',
    next_password_due_date: '2024-01-20',
    password_changer: 'Dev Team',
    public_ip: '203.0.113.12',
    management_ip: '10.0.1.12',
    private_ips: ['192.168.3.10'],
    allowed_ports: ['3000', '8080', '22'],
    status: 'Maintenance',
    remarks: 'Development environment for testing',
    created_at: '2024-02-01T10:00:00Z',
    updated_at: '2024-02-01T10:00:00Z',
    custom_fields: { environment: 'development', access_level: 'medium' }
  },
  {
    id: '4',
    vm_name: 'BACKUP-SRV-01',
    customer_id: '3',
    cpu: '4 vCPU',
    ram: '16 GB',
    storage: '2 TB HDD',
    services: 'Backup Service, FTP',
    creation_date: '2024-01-25',
    service_start_date: '2024-01-25',
    service_end_date: '2024-03-15',
    password_created_date: '2024-01-25',
    last_password_changed_date: '2024-01-25',
    next_password_due_date: '2024-01-18',
    password_changer: 'Backup Admin',
    management_ip: '10.0.1.13',
    private_ips: ['192.168.4.10'],
    allowed_ports: ['21', '22'],
    status: 'Inactive',
    remarks: 'Backup server - scheduled maintenance',
    created_at: '2024-01-25T10:00:00Z',
    updated_at: '2024-01-25T10:00:00Z',
    custom_fields: { backup_type: 'incremental', access_level: 'low' }
  },
  {
    id: '5',
    vm_name: 'MAIL-SRV-01',
    customer_id: '4',
    cpu: '6 vCPU',
    ram: '24 GB',
    storage: '500 GB SSD',
    services: 'Postfix, Dovecot, SpamAssassin',
    creation_date: '2024-02-10',
    service_start_date: '2024-02-10',
    service_end_date: '2024-12-31',
    password_created_date: '2024-02-10',
    last_password_changed_date: '2024-02-10',
    next_password_due_date: '2024-02-22',
    password_changer: 'Mail Admin',
    public_ip: '203.0.113.13',
    management_ip: '10.0.1.14',
    private_ips: ['192.168.5.10'],
    allowed_ports: ['25', '587', '993', '995', '22'],
    status: 'Active',
    remarks: 'Corporate email server with anti-spam',
    created_at: '2024-02-10T10:00:00Z',
    updated_at: '2024-02-10T10:00:00Z',
    custom_fields: { ssl_enabled: true, spam_filter: 'enabled', access_level: 'high' }
  },
  {
    id: '6',
    vm_name: 'FILE-SRV-01',
    customer_id: '5',
    cpu: '4 vCPU',
    ram: '12 GB',
    storage: '1.5 TB HDD',
    services: 'Samba, NFS, FTP',
    creation_date: '2024-01-30',
    service_start_date: '2024-01-30',
    service_end_date: '2024-12-31',
    password_created_date: '2024-01-30',
    last_password_changed_date: '2024-01-30',
    next_password_due_date: '2024-02-21',
    password_changer: 'File Admin',
    management_ip: '10.0.1.15',
    private_ips: ['192.168.6.10', '192.168.6.11'],
    allowed_ports: ['445', '2049', '21', '22'],
    status: 'Active',
    remarks: 'File sharing server for departments',
    created_at: '2024-01-30T10:00:00Z',
    updated_at: '2024-01-30T10:00:00Z',
    custom_fields: { file_sharing: 'enabled', quota_enabled: true, access_level: 'medium' }
  }
];

let customerStore: Customer[] = [
  {
    id: '1',
    department_name: 'Information Technology Department',
    created_at: '2024-01-10T10:00:00Z',
    updated_at: '2024-01-10T10:00:00Z'
  },
  {
    id: '2',
    department_name: 'Finance & Accounting Department',
    created_at: '2024-01-12T10:00:00Z',
    updated_at: '2024-01-12T10:00:00Z'
  },
  {
    id: '3',
    department_name: 'Human Resources Department',
    created_at: '2024-01-14T10:00:00Z',
    updated_at: '2024-01-14T10:00:00Z'
  },
  {
    id: '4',
    department_name: 'Marketing & Sales Department',
    created_at: '2024-01-16T10:00:00Z',
    updated_at: '2024-01-16T10:00:00Z'
  },
  {
    id: '5',
    department_name: 'Operations & Logistics Department',
    created_at: '2024-01-18T10:00:00Z',
    updated_at: '2024-01-18T10:00:00Z'
  }
];

let contractStore: Contract[] = [
  {
    id: '1',
    customer_id: '1',
    contract_number: 'CT-2024-001',
    contract_name: 'Web Hosting & Development Services',
    service_start_date: '2024-01-01',
    service_end_date: '2024-12-31',
    value: 12000,
    status: 'Active',
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-01-01T10:00:00Z'
  },
  {
    id: '2',
    customer_id: '2',
    contract_number: 'CT-2024-002',
    contract_name: 'Database Management & Analytics',
    service_start_date: '2024-01-15',
    service_end_date: '2024-12-31',
    value: 18000,
    status: 'Active',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z'
  },
  {
    id: '3',
    customer_id: '3',
    contract_number: 'CT-2024-003',
    contract_name: 'Backup & Recovery Services',
    service_start_date: '2024-02-01',
    service_end_date: '2024-02-28',
    value: 8500,
    status: 'Active',
    created_at: '2024-02-01T10:00:00Z',
    updated_at: '2024-02-01T10:00:00Z'
  },
  {
    id: '4',
    customer_id: '1',
    contract_number: 'CT-2023-015',
    contract_name: 'Legacy System Support',
    service_start_date: '2023-06-01',
    service_end_date: '2024-01-20',
    value: 5000,
    status: 'Expired',
    created_at: '2023-06-01T10:00:00Z',
    updated_at: '2024-01-20T10:00:00Z'
  },
  {
    id: '5',
    customer_id: '4',
    contract_number: 'CT-2024-004',
    contract_name: 'Email Services & Security',
    service_start_date: '2024-02-10',
    service_end_date: '2024-12-31',
    value: 9500,
    status: 'Active',
    created_at: '2024-02-10T10:00:00Z',
    updated_at: '2024-02-10T10:00:00Z'
  },
  {
    id: '6',
    customer_id: '2',
    contract_number: 'CT-2024-005',
    contract_name: 'Cloud Infrastructure Services',
    service_start_date: '2024-01-01',
    service_end_date: '2024-02-25',
    value: 15000,
    status: 'Active',
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-01-01T10:00:00Z'
  },
  {
    id: '7',
    customer_id: '5',
    contract_number: 'CT-2024-006',
    contract_name: 'File Storage & Sharing Services',
    service_start_date: '2024-01-30',
    service_end_date: '2024-01-15',
    value: 7500,
    status: 'Expired',
    created_at: '2024-01-30T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z'
  }
];

let clusterStore: Cluster[] = [
  {
    id: '1',
    cluster_name: 'test01',
    cluster_type: 'test01',
    cluster_code: 'test01',
    cluster_purpose: 'Development',
    cluster_location: 'Yangon',
    total_cpu_ghz: 10,
    total_ram_gb: 10,
    storage_type: 'NVMe',
    allocated_cpu_ghz: 10,
    total_storage_gb: 10,
    allocated_ram_gb: 10,
    allocated_storage_gb: 10,
    available_cpu_ghz: 10,
    available_ram_gb: 10,
    available_storage_gb: 10,
    node_count: 10,
    vm_count: 10,
    status: 'Active',
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-01-01T10:00:00Z',
  }
]
let gpAccountStore: GPAccount[] = [
  {
    id: '1',
    customer_id: '1',
    gp_ip: '10.0.2.100',
    gp_username: 'it_user001',
    gp_password: 'encrypted_password_hash',
    account_created_date: '2024-01-01',
    last_password_changed_date: '2024-01-01',
    password_changer: 'IT Admin',
    account_creator: 'System Admin',
    next_password_due_date: '2024-02-22',
    status: 'Active',
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-01-01T10:00:00Z'
  },
  {
    id: '2',
    customer_id: '2',
    gp_ip: '10.0.2.101',
    gp_username: 'finance_user001',
    gp_password: 'encrypted_password_hash',
    account_created_date: '2024-01-15',
    last_password_changed_date: '2024-02-15',
    password_changer: 'Finance Admin',
    account_creator: 'System Admin',
    next_password_due_date: '2024-01-20',
    status: 'Active',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-02-15T10:00:00Z'
  },
  {
    id: '3',
    customer_id: '3',
    gp_ip: '10.0.2.102',
    gp_username: 'hr_user001',
    gp_password: 'encrypted_password_hash',
    account_created_date: '2024-01-20',
    last_password_changed_date: '2024-01-20',
    password_changer: 'HR Admin',
    account_creator: 'System Admin',
    next_password_due_date: '2024-02-23',
    status: 'Suspended',
    created_at: '2024-01-20T10:00:00Z',
    updated_at: '2024-01-20T10:00:00Z'
  },
  {
    id: '4',
    customer_id: '4',
    gp_ip: '10.0.2.103',
    gp_username: 'marketing_user001',
    gp_password: 'encrypted_password_hash',
    account_created_date: '2024-02-10',
    last_password_changed_date: '2024-02-10',
    password_changer: 'Marketing Admin',
    account_creator: 'System Admin',
    next_password_due_date: '2024-01-19',
    status: 'Active',
    created_at: '2024-02-10T10:00:00Z',
    updated_at: '2024-02-10T10:00:00Z'
  },
  {
    id: '5',
    customer_id: '5',
    gp_ip: '10.0.2.104',
    gp_username: 'ops_user001',
    gp_password: 'encrypted_password_hash',
    account_created_date: '2024-01-18',
    last_password_changed_date: '2024-01-18',
    password_changer: 'Ops Admin',
    account_creator: 'System Admin',
    next_password_due_date: '2024-01-15',
    status: 'Active',
    created_at: '2024-01-18T10:00:00Z',
    updated_at: '2024-01-18T10:00:00Z'
  }
];

let contactStore: Contact[] = [
  {
    id: '1',
    customer_id: '1',
    name: 'John Smith',
    department: 'IT Operations',
    email: 'john.smith@company.com',
    contact_number: '+1-555-0101',
    created_at: '2024-01-10T10:00:00Z'
  },
  {
    id: '2',
    customer_id: '1',
    name: 'Alice Johnson',
    department: 'IT Security',
    email: 'alice.johnson@company.com',
    contact_number: '+1-555-0102',
    created_at: '2024-01-10T10:00:00Z'
  },
  {
    id: '3',
    customer_id: '2',
    name: 'Robert Brown',
    department: 'Finance',
    email: 'robert.brown@company.com',
    contact_number: '+1-555-0201',
    created_at: '2024-01-12T10:00:00Z'
  },
  {
    id: '4',
    customer_id: '2',
    name: 'Lisa Chen',
    department: 'Accounting',
    email: 'lisa.chen@company.com',
    contact_number: '+1-555-0202',
    created_at: '2024-01-12T10:00:00Z'
  },
  {
    id: '5',
    customer_id: '3',
    name: 'Emily Davis',
    department: 'HR',
    email: 'emily.davis@company.com',
    contact_number: '+1-555-0301',
    created_at: '2024-01-14T10:00:00Z'
  },
  {
    id: '6',
    customer_id: '4',
    name: 'Michael Wilson',
    department: 'Marketing',
    email: 'michael.wilson@company.com',
    contact_number: '+1-555-0401',
    created_at: '2024-01-16T10:00:00Z'
  },
  {
    id: '7',
    customer_id: '4',
    name: 'Sarah Martinez',
    department: 'Sales',
    email: 'sarah.martinez@company.com',
    contact_number: '+1-555-0402',
    created_at: '2024-01-16T10:00:00Z'
  },
  {
    id: '8',
    customer_id: '5',
    name: 'David Lee',
    department: 'Operations',
    email: 'david.lee@company.com',
    contact_number: '+1-555-0501',
    created_at: '2024-01-18T10:00:00Z'
  }
];

let auditLogStore: AuditLog[] = [
  {
    id: '1',
    table_name: 'vms',
    operation: 'CREATE',
    record_id: '1',
    old_values: null,
    new_values: { vm_name: 'WEB-PROD-01', status: 'Active' },
    changed_by: 'John Admin',
    timestamp: '2024-01-15T10:00:00Z',
    description: 'Created new production web server'
  },
  {
    id: '2',
    table_name: 'vms',
    operation: 'UPDATE',
    record_id: '2',
    old_values: { last_password_changed_date: '2024-01-20', password_changer: 'System' },
    new_values: { last_password_changed_date: '2024-02-15', password_changer: 'Sarah DBA' },
    changed_by: 'Sarah DBA',
    timestamp: '2024-02-15T14:30:00Z',
    description: 'Updated database server password'
  },
  {
    id: '3',
    table_name: 'customers',
    operation: 'CREATE',
    record_id: '4',
    old_values: null,
    new_values: { department_name: 'Marketing & Sales Department' },
    changed_by: 'System Admin',
    timestamp: '2024-01-16T10:00:00Z',
    description: 'Added new customer department'
  },
  {
    id: '4',
    table_name: 'gp_accounts',
    operation: 'UPDATE',
    record_id: '3',
    old_values: { status: 'Active' },
    new_values: { status: 'Suspended' },
    changed_by: 'Security Admin',
    timestamp: '2024-02-10T16:45:00Z',
    description: 'Suspended GP account due to security policy'
  },
  {
    id: '5',
    table_name: 'contracts',
    operation: 'UPDATE',
    record_id: '4',
    old_values: { status: 'Active' },
    new_values: { status: 'Expired' },
    changed_by: 'System',
    timestamp: '2024-01-20T23:59:59Z',
    description: 'Contract automatically expired'
  }
];

let activityLogStore: ActivityLog[] = [
  {
    id: '1',
    action: 'VM Created',
    entity_type: 'VM',
    entity_id: '1',
    entity_name: 'WEB-PROD-01',
    user: 'John Admin',
    timestamp: '2024-01-15T10:00:00Z',
    details: 'Created production web server with 4 vCPU, 16GB RAM',
    severity: 'success'
  },
  {
    id: '2',
    action: 'Password Updated',
    entity_type: 'VM',
    entity_id: '2',
    entity_name: 'DB-MASTER-01',
    user: 'Sarah DBA',
    timestamp: '2024-02-15T14:30:00Z',
    details: 'Updated database server root password',
    severity: 'info'
  },
  {
    id: '3',
    action: 'VM Status Changed',
    entity_type: 'VM',
    entity_id: '3',
    entity_name: 'APP-DEV-01',
    user: 'Dev Team Lead',
    timestamp: '2024-02-20T09:15:00Z',
    details: 'Changed status from Active to Maintenance for updates',
    severity: 'warning'
  },
  {
    id: '4',
    action: 'Contract Expired',
    entity_type: 'Contract',
    entity_id: '4',
    entity_name: 'CT-2023-015',
    user: 'System',
    timestamp: '2024-01-20T23:59:59Z',
    details: 'Legacy System Support contract has expired',
    severity: 'warning'
  },
  {
    id: '5',
    action: 'GP Account Suspended',
    entity_type: 'GPAccount',
    entity_id: '3',
    entity_name: 'hr_user001',
    user: 'Security Admin',
    timestamp: '2024-02-10T16:45:00Z',
    details: 'Account suspended due to failed security audit',
    severity: 'error'
  },
  {
    id: '6',
    action: 'Customer Created',
    entity_type: 'Customer',
    entity_id: '4',
    entity_name: 'Marketing & Sales Department',
    user: 'System Admin',
    timestamp: '2024-01-16T10:00:00Z',
    details: 'Added new customer department with contacts and contracts',
    severity: 'success'
  },
  {
    id: '7',
    action: 'VM Backup Configured',
    entity_type: 'VM',
    entity_id: '1',
    entity_name: 'WEB-PROD-01',
    user: 'Backup Admin',
    timestamp: '2024-01-16T11:30:00Z',
    details: 'Configured automated daily backups',
    severity: 'info'
  },
  {
    id: '8',
    action: 'Security Scan Completed',
    entity_type: 'VM',
    entity_id: '2',
    entity_name: 'DB-MASTER-01',
    user: 'Security Scanner',
    timestamp: '2024-02-01T02:00:00Z',
    details: 'Monthly security scan completed - no vulnerabilities found',
    severity: 'success'
  },
  {
    id: '9',
    action: 'Password Change Overdue',
    entity_type: 'GPAccount',
    entity_id: '5',
    entity_name: 'ops_user001',
    user: 'System',
    timestamp: '2024-02-21T00:00:00Z',
    details: 'GP Account password change is overdue by 6 days',
    severity: 'error'
  },
  {
    id: '10',
    action: 'Contract Renewal Required',
    entity_type: 'Contract',
    entity_id: '3',
    entity_name: 'CT-2024-003',
    user: 'System',
    timestamp: '2024-02-20T00:00:00Z',
    details: 'Contract expires in 8 days - renewal required',
    severity: 'warning'
  },
  {
    id: '11',
    action: 'VM Password Overdue',
    entity_type: 'VM',
    entity_id: '3',
    entity_name: 'APP-DEV-01',
    user: 'System',
    timestamp: '2024-02-21T00:00:00Z',
    details: 'VM password change is overdue by 1 day',
    severity: 'error'
  },
  {
    id: '12',
    action: 'GP Account Password Overdue',
    entity_type: 'GPAccount',
    entity_id: '2',
    entity_name: 'finance_user001',
    user: 'System',
    timestamp: '2024-02-21T00:00:00Z',
    details: 'GP Account password change is overdue by 1 day',
    severity: 'error'
  }
];

let nodeStore: Node[] = [
  {
    id: '1',
    cluster_id: '1',
    node_name: 'node01',
    hostname: 'node01.cluster.local',
    cpu_vendor: 'Intel',
    cpu_model: 'Intel Xeon Gold 6248R',
    total_physical_cores: 24,
    total_logical_threads: 48,
    cpu_clock_speed_ghz: 3.0,
    total_cpu_ghz: 72,
    allocated_cpu_ghz: 20,
    available_cpu_ghz: 52,
    total_ram_gb: 128,
    dimm_slots_used: 8,
    dimm_slots_total: 16,
    ram_type: 'DDR4',
    allocated_ram_gb: 32,
    available_ram_gb: 96,
    storage_type: 'NVMe',
    storage_capacity_gb: 2000,
    raid_configuration: 'RAID 10',
    disk_vendor_model: 'Samsung 980 PRO',
    allocated_storage_gb: 500,
    available_storage_gb: 1500,
    nic_count: 4,
    nic_speed: '10GbE',
    teaming_bonding: 'LACP',
    vlan_tagging_support: true,
    vm_count: 5,
    status: 'Active',
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-01-01T10:00:00Z'
  },
  {
    id: '2',
    cluster_id: '1',
    node_name: 'node02',
    hostname: 'node02.cluster.local',
    cpu_vendor: 'AMD',
    cpu_model: 'AMD EPYC 7543',
    total_physical_cores: 32,
    total_logical_threads: 64,
    cpu_clock_speed_ghz: 2.8,
    total_cpu_ghz: 89.6,
    allocated_cpu_ghz: 30,
    available_cpu_ghz: 59.6,
    total_ram_gb: 256,
    dimm_slots_used: 16,
    dimm_slots_total: 16,
    ram_type: 'DDR4',
    allocated_ram_gb: 64,
    available_ram_gb: 192,
    storage_type: 'SSD',
    storage_capacity_gb: 4000,
    raid_configuration: 'RAID 5',
    disk_vendor_model: 'Intel DC S4610',
    allocated_storage_gb: 1000,
    available_storage_gb: 3000,
    nic_count: 2,
    nic_speed: '25GbE',
    vlan_tagging_support: true,
    vm_count: 8,
    status: 'Active',
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-01-01T10:00:00Z'
  }
]

// let clusterStore: Cluster[] = [];

// Helper function to generate unique IDs
const generateId = () => Date.now().toString() + Math.random().toString(36).substr(2, 9);

// Helper function to add audit log
const addAuditLog = (
  tableName: string,
  operation: 'CREATE' | 'UPDATE' | 'DELETE',
  recordId: string,
  oldValues: any,
  newValues: any,
  changedBy: string,
  description: string
) => {
  const auditLog: AuditLog = {
    id: generateId(),
    table_name: tableName,
    operation,
    record_id: recordId,
    old_values: oldValues,
    new_values: newValues,
    changed_by: changedBy,
    timestamp: new Date().toISOString(),
    description
  };
  auditLogStore.unshift(auditLog);
};

// Helper function to add activity log
const addActivityLog = (
  action: string,
  entityType: 'VM' | 'Customer' | 'Contract' | 'GPAccount' | 'Contact' | 'Cluster',
  entityId: string,
  entityName: string,
  user: string,
  details: string,
  severity: 'info' | 'warning' | 'error' | 'success' = 'info'
) => {
  const activityLog: ActivityLog = {
    id: generateId(),
    action,
    entity_type: entityType,
    entity_id: entityId,
    entity_name: entityName,
    user,
    timestamp: new Date().toISOString(),
    details,
    severity
  };
  activityLogStore.unshift(activityLog);
};

export const useDataStore = () => {
  const [vms, setVMs] = useState<VM[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [gpAccounts, setGPAccounts] = useState<GPAccount[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  // const [clusters, setClusters] = useState<Cluster[]>([]);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [loading, setLoading] = useState(false);

  // Load all data
  const loadAllData = async () => {
    try {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setVMs([...vmStore]);
      setCustomers([...customerStore]);
      setContracts([...contractStore]);
      setClusters([...clusterStore]);
      setNodes([...nodeStore]);
      setGPAccounts([...gpAccountStore]);
      setContacts([...contactStore]);
      setAuditLogs([...auditLogStore]);
      setActivityLogs([...activityLogStore]);
      
      // Initialize with some sample clusters if empty
      // if (clusters.length === 0) {
      //   const sampleClusters: Cluster[] = [
      //     {
      //       id: '1',
      //       cluster_name: 'Production Cluster',
      //       cluster_type: 'VMware',
      //       status: 'Active',
      //       created_at: new Date().toISOString(),
      //       updated_at: new Date().toISOString()
      //     },
      //     {
      //       id: '2',
      //       cluster_name: 'Development Cluster',
      //       cluster_type: 'Kubernetes',
      //       status: 'Active',
      //       created_at: new Date().toISOString(),
      //       updated_at: new Date().toISOString()
      //     }
      //   ];
      //   setClusters(sampleClusters);
      // }
    } catch (error) {
      showToast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // VM CRUD operations
  const createVM = async (vmData: Omit<VM, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setLoading(true);

      const requestedRAM = parseInt(vmData.ram.split(' ')[0]) || 0;
      const requestedCPU = parseInt(vmData.cpu) || 0;
      const requestedStorage = parseInt(vmData.storage.split(' ')[0]) || 0;
      
      const newVM: VM = {
        ...vmData,
        id: generateId(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      await new Promise(resolve => setTimeout(resolve, 1000));
      
      vmStore.push(newVM);
      setVMs([...vmStore]);

      // Update node resources (subtract allocated resources)
      const nodeIndex = nodeStore.findIndex(n => n.id === vmData.node_id);
      if (nodeIndex !== -1) {
        nodeStore[nodeIndex] = {
          ...nodeStore[nodeIndex],
          allocated_cpu_ghz: nodeStore[nodeIndex].allocated_cpu_ghz + requestedCPU,
          allocated_ram_gb: nodeStore[nodeIndex].allocated_ram_gb + requestedRAM,
          allocated_storage_gb: nodeStore[nodeIndex].allocated_storage_gb + requestedStorage,
          available_cpu_ghz: nodeStore[nodeIndex].available_cpu_ghz - requestedCPU,
          available_ram_gb: nodeStore[nodeIndex].available_ram_gb - requestedRAM,
          available_storage_gb: nodeStore[nodeIndex].available_storage_gb - requestedStorage,
          vm_count: nodeStore[nodeIndex].vm_count + 1,
          updated_at: new Date().toISOString()
        };
        setNodes([...nodeStore]);
      }
      
      addAuditLog('vms', 'CREATE', newVM.id, null, newVM, 'System Admin', `Created VM: ${newVM.vm_name}`);
      addActivityLog('VM Created', 'VM', newVM.id, newVM.vm_name, 'System Admin', 
        `Created ${newVM.vm_name} with ${newVM.cpu}, ${newVM.ram}`, 'success');
      
      setAuditLogs([...auditLogStore]);
      setActivityLogs([...activityLogStore]);
      
      showToast.success('VM created successfully');
      return { success: true, data: newVM };
    } catch (error) {
      showToast.error('Failed to create VM');
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  const updateVM = async (id: string, updates: Partial<VM>) => {
    try {
      setLoading(true);
      const index = vmStore.findIndex(vm => vm.id === id);
      if (index === -1) throw new Error('VM not found');

      const oldVM = { ...vmStore[index] };
      const updatedVM = {
        ...vmStore[index],
        ...updates,
        updated_at: new Date().toISOString()
      };

      await new Promise(resolve => setTimeout(resolve, 800));
      
      vmStore[index] = updatedVM;
      setVMs([...vmStore]);
      
      addAuditLog('vms', 'UPDATE', id, oldVM, updatedVM, 'System Admin', `Updated VM: ${updatedVM.vm_name}`);
      addActivityLog('VM Updated', 'VM', id, updatedVM.vm_name, 'System Admin', 
        `Updated VM configuration`, 'info');
      
      setAuditLogs([...auditLogStore]);
      setActivityLogs([...activityLogStore]);
      
      showToast.success('VM updated successfully');
      return { success: true, data: updatedVM };
    } catch (error) {
      showToast.error('Failed to update VM');
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  const deleteVM = async (id: string) => {
    try {
      setLoading(true);
      const vm = vmStore.find(vm => vm.id === id);
      if (!vm) throw new Error('VM not found');

      // Parse resource requirements to free up
      const requestedRAM = parseInt(vm.ram.split(' ')[0]) || 0;
      const requestedStorage = parseInt(vm.storage.split(' ')[0]) || 0;
      const requestedCPU = vm.cpu_ghz || 0;

      await new Promise(resolve => setTimeout(resolve, 600));
      
      vmStore = vmStore.filter(vm => vm.id !== id);
      setVMs([...vmStore]);

      // Update node resources (add back freed resources)
      if (vm.node_id) {
        const nodeIndex = nodeStore.findIndex(n => n.id === vm.node_id);
        if (nodeIndex !== -1) {
          nodeStore[nodeIndex] = {
            ...nodeStore[nodeIndex],
            allocated_cpu_ghz: Math.max(0, nodeStore[nodeIndex].allocated_cpu_ghz - requestedCPU),
            allocated_ram_gb: Math.max(0, nodeStore[nodeIndex].allocated_ram_gb - requestedRAM),
            allocated_storage_gb: Math.max(0, nodeStore[nodeIndex].allocated_storage_gb - requestedStorage),
            available_cpu_ghz: nodeStore[nodeIndex].available_cpu_ghz + requestedCPU,
            available_ram_gb: nodeStore[nodeIndex].available_ram_gb + requestedRAM,
            available_storage_gb: nodeStore[nodeIndex].available_storage_gb + requestedStorage,
            vm_count: Math.max(0, nodeStore[nodeIndex].vm_count - 1),
            updated_at: new Date().toISOString()
          };
          setNodes([...nodeStore]);
        }
      }
      
      addAuditLog('vms', 'DELETE', id, vm, null, 'System Admin', `Deleted VM: ${vm.vm_name}`);
      addActivityLog('VM Deleted', 'VM', id, vm.vm_name, 'System Admin', 
        `Permanently deleted VM and all associated data`, 'error');
      
      setAuditLogs([...auditLogStore]);
      setActivityLogs([...activityLogStore]);
      
      showToast.success('VM deleted successfully');
      return { success: true };
    } catch (error) {
      showToast.error('Failed to delete VM');
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  // Customer CRUD operations
  const createCustomer = async (
    customerData: { department_name: string },
    contactsData: Omit<Contact, 'id' | 'customer_id' | 'created_at'>[],
    contractsData: Omit<Contract, 'id' | 'customer_id' | 'created_at' | 'updated_at'>[],
    gpAccountsData: Omit<GPAccount, 'id' | 'customer_id' | 'created_at' | 'updated_at'>[],
    clusterData: Omit<Cluster, 'id'| 'created_at' | 'updated_at'>[]
  ) => {
    try {
      setLoading(true);
      

      const customerId = generateId();
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
        id: generateId(),
        customer_id: customerId,
        created_at: now
      }));
      
      // Create contracts
      const newContracts: Contract[] = contractsData.map(contract => ({
        ...contract,
        id: generateId(),
        customer_id: customerId,
        created_at: now,
        updated_at: now
      }));

      const newClusters: Cluster[] = clusterData.map(cluster => ({
        ...cluster,
        id: generateId(),
        // customer_id: customerId,
        created_at: now,
        updated_at: now

      }))
      
      // Create GP accounts
      const newGPAccounts: GPAccount[] = gpAccountsData.map(account => ({
        ...account,
        id: generateId(),
        customer_id: customerId,
        created_at: now,
        updated_at: now
      }));

      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update stores
      customerStore.push(newCustomer);
      contactStore.push(...newContacts);
      contractStore.push(...newContracts);
      gpAccountStore.push(...newGPAccounts);
      clusterStore.push(...newClusters);
      
      setCustomers([...customerStore]);
      setContacts([...contactStore]);
      setContracts([...contractStore]);
      setGPAccounts([...gpAccountStore]);
      setClusters([...clusterStore]);
      
      addAuditLog('customers', 'CREATE', customerId, null, newCustomer, 'System Admin', 
        `Created customer: ${newCustomer.department_name}`);
      addActivityLog('Customer Created', 'Customer', customerId, newCustomer.department_name, 
        'System Admin', `Added new customer with ${newContacts.length} contacts, ${newContracts.length} contracts`, 'success');
      
      setAuditLogs([...auditLogStore]);
      setActivityLogs([...activityLogStore]);
      
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
      const index = customerStore.findIndex(customer => customer.id === id);
      if (index === -1) throw new Error('Customer not found');

      const oldCustomer = { ...customerStore[index] };
      const updatedCustomer = {
        ...customerStore[index],
        ...updates,
        updated_at: new Date().toISOString()
      };

      await new Promise(resolve => setTimeout(resolve, 600));
      
      customerStore[index] = updatedCustomer;
      setCustomers([...customerStore]);
      
      addAuditLog('customers', 'UPDATE', id, oldCustomer, updatedCustomer, 'System Admin', 
        `Updated customer: ${updatedCustomer.department_name}`);
      addActivityLog('Customer Updated', 'Customer', id, updatedCustomer.department_name, 
        'System Admin', `Updated customer information`, 'info');
      
      setAuditLogs([...auditLogStore]);
      setActivityLogs([...activityLogStore]);
      
      showToast.success('Customer updated successfully');
      return { success: true, data: updatedCustomer };
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
      const customer = customerStore.find(c => c.id === id);
      if (!customer) throw new Error('Customer not found');

      await new Promise(resolve => setTimeout(resolve, 600));
      
      // Delete related data
      customerStore = customerStore.filter(c => c.id !== id);
      contactStore = contactStore.filter(contact => contact.customer_id !== id);
      contractStore = contractStore.filter(contract => contract.customer_id !== id);
      gpAccountStore = gpAccountStore.filter(account => account.customer_id !== id);
      clusterStore = clusterStore.filter(cluster => cluster.id !== id);
      
      setCustomers([...customerStore]);
      setContacts([...contactStore]);
      setContracts([...contractStore]);
      setGPAccounts([...gpAccountStore]);
      setClusters([...clusterStore]);
      
      addAuditLog('customers', 'DELETE', id, customer, null, 'System Admin', 
        `Deleted customer: ${customer.department_name}`);
      addActivityLog('Customer Deleted', 'Customer', id, customer.department_name, 
        'System Admin', `Deleted customer and all associated data`, 'error');
      
      setAuditLogs([...auditLogStore]);
      setActivityLogs([...activityLogStore]);
      
      showToast.success('Customer deleted successfully');
      return { success: true };
    } catch (error) {
      showToast.error('Failed to delete customer');
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  // Contact CRUD operations
  const createContact = async (contactData: Omit<Contact, 'id' | 'created_at'>) => {
    try {
      setLoading(true);
      const newContact: Contact = {
        ...contactData,
        id: generateId(),
        created_at: new Date().toISOString()
      };

      await new Promise(resolve => setTimeout(resolve, 600));
      
      contactStore.push(newContact);
      setContacts([...contactStore]);
      
      addAuditLog('contacts', 'CREATE', newContact.id, null, newContact, 'System Admin', 
        `Created contact: ${newContact.name}`);
      addActivityLog('Contact Created', 'Contact', newContact.id, newContact.name, 
        'System Admin', `Added new contact for customer`, 'success');
      
      setAuditLogs([...auditLogStore]);
      setActivityLogs([...activityLogStore]);
      
      showToast.success('Contact created successfully');
      return { success: true, data: newContact };
    } catch (error) {
      showToast.error('Failed to create contact');
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  const updateContact = async (id: string, updates: Partial<Contact>) => {
    try {
      setLoading(true);
      const index = contactStore.findIndex(contact => contact.id === id);
      if (index === -1) throw new Error('Contact not found');

      const oldContact = { ...contactStore[index] };
      const updatedContact = {
        ...contactStore[index],
        ...updates
      };

      await new Promise(resolve => setTimeout(resolve, 600));
      
      contactStore[index] = updatedContact;
      setContacts([...contactStore]);
      
      addAuditLog('contacts', 'UPDATE', id, oldContact, updatedContact, 'System Admin', 
        `Updated contact: ${updatedContact.name}`);
      addActivityLog('Contact Updated', 'Contact', id, updatedContact.name, 
        'System Admin', `Updated contact information`, 'info');
      
      setAuditLogs([...auditLogStore]);
      setActivityLogs([...activityLogStore]);
      
      showToast.success('Contact updated successfully');
      return { success: true, data: updatedContact };
    } catch (error) {
      showToast.error('Failed to update contact');
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  const deleteContact = async (id: string) => {
    try {
      setLoading(true);
      const contact = contactStore.find(c => c.id === id);
      if (!contact) throw new Error('Contact not found');

      await new Promise(resolve => setTimeout(resolve, 600));
      
      contactStore = contactStore.filter(c => c.id !== id);
      setContacts([...contactStore]);
      
      addAuditLog('contacts', 'DELETE', id, contact, null, 'System Admin', 
        `Deleted contact: ${contact.name}`);
      addActivityLog('Contact Deleted', 'Contact', id, contact.name, 
        'System Admin', `Deleted contact`, 'error');
      
      setAuditLogs([...auditLogStore]);
      setActivityLogs([...activityLogStore]);
      
      showToast.success('Contact deleted successfully');
      return { success: true };
    } catch (error) {
      showToast.error('Failed to delete contact');
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  // Contract CRUD operations
  const createContract = async (contractData: Omit<Contract, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setLoading(true);
      const newContract: Contract = {
        ...contractData,
        id: generateId(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      await new Promise(resolve => setTimeout(resolve, 800));
      
      contractStore.push(newContract);
      setContracts([...contractStore]);
      
      addAuditLog('contracts', 'CREATE', newContract.id, null, newContract, 'System Admin', 
        `Created contract: ${newContract.contract_number}`);
      addActivityLog('Contract Created', 'Contract', newContract.id, newContract.contract_number, 
        'System Admin', `Created new contract worth $${newContract.value}`, 'success');
      
      setAuditLogs([...auditLogStore]);
      setActivityLogs([...activityLogStore]);
      
      showToast.success('Contract created successfully');
      return { success: true, data: newContract };
    } catch (error) {
      showToast.error('Failed to create contract');
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  const updateContract = async (id: string, updates: Partial<Contract>) => {
    try {
      setLoading(true);
      const index = contractStore.findIndex(contract => contract.id === id);
      if (index === -1) throw new Error('Contract not found');

      const oldContract = { ...contractStore[index] };
      const updatedContract = {
        ...contractStore[index],
        ...updates,
        updated_at: new Date().toISOString()
      };

      await new Promise(resolve => setTimeout(resolve, 600));
      
      contractStore[index] = updatedContract;
      setContracts([...contractStore]);
      
      addAuditLog('contracts', 'UPDATE', id, oldContract, updatedContract, 'System Admin', 
        `Updated contract: ${updatedContract.contract_number}`);
      addActivityLog('Contract Updated', 'Contract', id, updatedContract.contract_number, 
        'System Admin', `Updated contract details`, 'info');
      
      setAuditLogs([...auditLogStore]);
      setActivityLogs([...activityLogStore]);
      
      showToast.success('Contract updated successfully');
      return { success: true, data: updatedContract };
    } catch (error) {
      showToast.error('Failed to update contract');
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  const deleteContract = async (id: string) => {
    try {
      setLoading(true);
      const contract = contractStore.find(c => c.id === id);
      if (!contract) throw new Error('Contract not found');

      await new Promise(resolve => setTimeout(resolve, 600));
      
      contractStore = contractStore.filter(c => c.id !== id);
      setContracts([...contractStore]);
      
      addAuditLog('contracts', 'DELETE', id, contract, null, 'System Admin', 
        `Deleted contract: ${contract.contract_number}`);
      addActivityLog('Contract Deleted', 'Contract', id, contract.contract_number, 
        'System Admin', `Permanently deleted contract`, 'error');
      
      setAuditLogs([...auditLogStore]);
      setActivityLogs([...activityLogStore]);
      
      showToast.success('Contract deleted successfully');
      return { success: true };
    } catch (error) {
      showToast.error('Failed to delete contract');
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  //Cluster CRUD operations
  const createCluster = async (clusterData: Omit<Cluster, 'id' | 'created_at' | 'updated_at'>) => {
    try{
      setLoading(true);
      const newClusters: Cluster = {
        ...clusterData,
        id: generateId(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      await new Promise(resolve => setTimeout(resolve, 800));

      clusterStore.push(newClusters);
      setClusters([...clusterStore]);

      addAuditLog('clusters', 'CREATE', newClusters.id, null, newClusters, 'System Admin', 
        `Created Cluster: ${newClusters.cluster_name}`);
      addActivityLog('Cluster Created', 'Cluster', newClusters.id, newClusters.cluster_name, 
        'System Admin', `Created new Cluster for IP ${newClusters.cluster_location}`, 'success');
      
      setAuditLogs([...auditLogStore]);
      setActivityLogs([...activityLogStore]);
      

      showToast.success('Cluster created successfully');
      return {  success: true, data: newClusters }
    } catch (error) {
      showToast.error('Failed to create Cluster ');
      return { success: false, error };
    }finally{
      setLoading(false);
    }
  }

  const updateCluster = async (id: string, updates: Partial<Cluster>) => {
    try {
      setLoading(true);
      const index = clusterStore.findIndex(cluster => cluster.id === id);
      if (index === -1) throw new Error('Cluster not found');

      const oldCluster = { ...clusterStore[index] };
      const updatedCluster = {
        ...clusterStore[index],
        ...updates,
        updated_at: new Date().toISOString()
      };

      await new Promise(resolve => setTimeout(resolve, 800));
      
      clusterStore[index] = updatedCluster;
      setClusters([...clusterStore]);
      
      showToast.success('Cluster updated successfully');
      return { success: true, data: updatedCluster };
    } catch (error) {
      showToast.error('Failed to update cluster');
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  const deleteCluster = async (id: string) => {
    try {
      setLoading(true);
      const cluster = clusterStore.find(c => c.id === id);
      if (!cluster) throw new Error('Cluster not found');

      await new Promise(resolve => setTimeout(resolve, 600));
      
      clusterStore = clusterStore.filter(c => c.id !== id);
      setClusters([...clusterStore]);
      
      showToast.success('Cluster deleted successfully');
      return { success: true };
    } catch (error) {
      showToast.error('Failed to delete cluster');
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  // Node CRUD operations
  const createNode = async (nodeData: Omit<Node, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setLoading(true);
      const newNode: Node = {
        ...nodeData,
        id: generateId(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      await new Promise(resolve => setTimeout(resolve, 800));

      nodeStore.push(newNode);
      setNodes([...nodeStore]);

      showToast.success('Node created successfully');
      return { success: true, data: newNode };
    } catch (error) {
      showToast.error('Failed to create node');
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  const updateNode = async (id: string, updates: Partial<Node>) => {
    try {
      setLoading(true);
      const index = nodeStore.findIndex(node => node.id === id);
      if (index === -1) throw new Error('Node not found');

      const oldNode = { ...nodeStore[index] };
      const updatedNode = {
        ...nodeStore[index],
        ...updates,
        updated_at: new Date().toISOString()
      };

      await new Promise(resolve => setTimeout(resolve, 800));
      
      nodeStore[index] = updatedNode;
      setNodes([...nodeStore]);
      
      showToast.success('Node updated successfully');
      return { success: true, data: updatedNode };
    } catch (error) {
      showToast.error('Failed to update node');
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  const deleteNode = async (id: string) => {
    try {
      setLoading(true);
      const node = nodeStore.find(n => n.id === id);
      if (!node) throw new Error('Node not found');

      await new Promise(resolve => setTimeout(resolve, 600));
      
      nodeStore = nodeStore.filter(n => n.id !== id);
      setNodes([...nodeStore]);
      
      showToast.success('Node deleted successfully');
      return { success: true };
    } catch (error) {
      showToast.error('Failed to delete node');
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  // GP Account CRUD operations
  const createGPAccount = async (gpAccountData: Omit<GPAccount, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setLoading(true);
      const newGPAccount: GPAccount = {
        ...gpAccountData,
        id: generateId(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      await new Promise(resolve => setTimeout(resolve, 800));
      
      gpAccountStore.push(newGPAccount);
      setGPAccounts([...gpAccountStore]);
      
      addAuditLog('gp_accounts', 'CREATE', newGPAccount.id, null, newGPAccount, 'System Admin', 
        `Created GP account: ${newGPAccount.gp_username}`);
      addActivityLog('GP Account Created', 'GPAccount', newGPAccount.id, newGPAccount.gp_username, 
        'System Admin', `Created new GP account for IP ${newGPAccount.gp_ip}`, 'success');
      
      setAuditLogs([...auditLogStore]);
      setActivityLogs([...activityLogStore]);
      
      showToast.success('GP Account created successfully');
      return { success: true, data: newGPAccount };
    } catch (error) {
      showToast.error('Failed to create GP Account');
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  const updateGPAccount = async (id: string, updates: Partial<GPAccount>) => {
    try {
      setLoading(true);
      const index = gpAccountStore.findIndex(account => account.id === id);
      if (index === -1) throw new Error('GP Account not found');

      const oldAccount = { ...gpAccountStore[index] };
      const updatedAccount = {
        ...gpAccountStore[index],
        ...updates,
        updated_at: new Date().toISOString()
      };

      await new Promise(resolve => setTimeout(resolve, 600));
      
      gpAccountStore[index] = updatedAccount;
      setGPAccounts([...gpAccountStore]);
      
      addAuditLog('gp_accounts', 'UPDATE', id, oldAccount, updatedAccount, 'System Admin', 
        `Updated GP account: ${updatedAccount.gp_username}`);
      addActivityLog('GP Account Updated', 'GPAccount', id, updatedAccount.gp_username, 
        'System Admin', `Updated GP account details`, 'info');
      
      setAuditLogs([...auditLogStore]);
      setActivityLogs([...activityLogStore]);
      
      showToast.success('GP Account updated successfully');
      return { success: true, data: updatedAccount };
    } catch (error) {
      showToast.error('Failed to update GP Account');
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  const deleteGPAccount = async (id: string) => {
    try {
      setLoading(true);
      const account = gpAccountStore.find(a => a.id === id);
      if (!account) throw new Error('GP Account not found');

      await new Promise(resolve => setTimeout(resolve, 600));
      
      gpAccountStore = gpAccountStore.filter(a => a.id !== id);
      setGPAccounts([...gpAccountStore]);
      
      addAuditLog('gp_accounts', 'DELETE', id, account, null, 'System Admin', 
        `Deleted GP account: ${account.gp_username}`);
      addActivityLog('GP Account Deleted', 'GPAccount', id, account.gp_username, 
        'System Admin', `Permanently deleted GP account`, 'error');
      
      setAuditLogs([...auditLogStore]);
      setActivityLogs([...activityLogStore]);
      
      showToast.success('GP Account deleted successfully');
      return { success: true };
    } catch (error) {
      showToast.error('Failed to delete GP Account');
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  // Helper functions for relationships
  const getClusterNodes = (clusterId: string) => {
    return nodeStore.filter(node => node.cluster_id === clusterId);
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

  const getCustomerVMs = (customerId: string): VM[] => {
    return vmStore.filter(vm => vm.customer_id === customerId);
  };

  const getNodeVMs = (nodeId: string): VM[] => {
    return vmStore.filter(vm => vm.node_id === nodeId);
  };

  // Real-time calculations for dashboard
  const getDashboardMetrics = () => {
    const today = new Date();
    
    // Near due dates (within 7 days)
    const nearVMPasswordDue = vmStore.filter(vm => {
      const dueDate = new Date(vm.next_password_due_date);
      const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilDue <= 7 && daysUntilDue > 0;
    }).length;

    const nearGPPasswordDue = gpAccountStore.filter(account => {
      const dueDate = new Date(account.next_password_due_date);
      const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilDue <= 7 && daysUntilDue > 0;
    }).length;

    const nearContractExpiry = contractStore.filter(contract => {
      const endDate = new Date(contract.service_end_date);
      const daysUntilExpiry = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
    }).length;

    // Overdue items
    const overdueVMPasswords = vmStore.filter(vm => {
      const dueDate = new Date(vm.next_password_due_date);
      return dueDate < today;
    }).length;

    const overdueGPPasswords = gpAccountStore.filter(account => {
      const dueDate = new Date(account.next_password_due_date);
      return dueDate < today;
    }).length;

    const overdueContracts = contractStore.filter(contract => {
      const endDate = new Date(contract.service_end_date);
      return endDate < today && contract.status === 'Active';
    }).length;

    return {
      totalVMs: vmStore.length,
      activeVMs: vmStore.filter(vm => vm.status === 'Active').length,
      inactiveVMs: vmStore.filter(vm => vm.status === 'Inactive').length,
      maintenanceVMs: vmStore.filter(vm => vm.status === 'Maintenance').length,
      totalCustomers: customerStore.length,
      totalContracts: contractStore.length,
      activeContracts: contractStore.filter(c => c.status === 'Active').length,
      totalGPAccounts: gpAccountStore.length,
      activeGPAccounts: gpAccountStore.filter(gp => gp.status === 'Active').length,
      totalRevenue: contractStore.filter(c => c.status === 'Active').reduce((sum, c) => sum + c.value, 0),
      
      // Near due dates
      nearVMPasswordDue,
      nearGPPasswordDue,
      nearContractExpiry,
      
      // Overdue items
      overdueVMPasswords,
      overdueGPPasswords,
      overdueContracts,
      
      // Resource utilization
      totalCPU: vmStore.reduce((sum, vm) => sum + parseInt(vm.cpu.split(' ')[0]), 0),
      totalRAM: vmStore.reduce((sum, vm) => sum + parseInt(vm.ram.split(' ')[0]), 0),
      totalStorage: vmStore.reduce((sum, vm) => sum + parseInt(vm.storage.split(' ')[0]), 0)
    };
  };

  useEffect(() => {
    loadAllData();
  }, []);

  return {
    // Data
    vms,
    customers,
    contracts,
    gpAccounts,
    contacts,
    auditLogs,
    activityLogs,
    clusters,
    nodes,
    loading,
    
    // VM operations
    createVM,
    updateVM,
    deleteVM,
    
    // Customer operations
    createCustomer,
    updateCustomer,
    deleteCustomer,
    
    // Contact operations
    createContact,
    updateContact,
    deleteContact,
    
    // Contract operations
    createContract,
    updateContract,
    deleteContract,

    // Cluster
    createCluster,
    updateCluster,
    deleteCluster,

    // Node
    createNode,
    updateNode,
    deleteNode,
    
    // GP Account operations
    createGPAccount,
    updateGPAccount,
    deleteGPAccount,
    
    // Helper functions
    getClusterNodes,
    getCustomerContracts,
    getCustomerGPAccounts,
    getCustomerContacts,
    getCustomerVMs,
    getDashboardMetrics,
    getNodeVMs,
    
    // Refresh data
    loadAllData
  };
};