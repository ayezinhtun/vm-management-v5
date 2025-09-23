-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Customers table
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    department_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clusters table
CREATE TABLE clusters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cluster_name TEXT NOT NULL,
    cluster_type TEXT,
    cluster_code TEXT,
    cluster_purpose TEXT,
    cluster_location TEXT,
    total_cpu_ghz NUMERIC,
    total_ram_gb NUMERIC,
    storage_type TEXT,
    allocated_cpu_ghz NUMERIC DEFAULT 0,
    total_storage_gb NUMERIC,
    allocated_ram_gb NUMERIC DEFAULT 0,
    allocated_storage_gb NUMERIC DEFAULT 0,
    available_cpu_ghz NUMERIC,
    available_ram_gb NUMERIC,
    available_storage_gb NUMERIC,
    node_count INTEGER DEFAULT 0,
    vm_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'Active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Nodes table
CREATE TABLE nodes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cluster_id UUID REFERENCES clusters(id) ON DELETE CASCADE,
    node_name TEXT NOT NULL,
    hostname TEXT,
    cpu_vendor TEXT,
    cpu_model TEXT,
    total_physical_cores INTEGER,
    total_logical_threads INTEGER,
    cpu_clock_speed_ghz NUMERIC,
    total_cpu_ghz NUMERIC,
    allocated_cpu_ghz NUMERIC DEFAULT 0,
    available_cpu_ghz NUMERIC,
    total_ram_gb INTEGER,
    dimm_slots_used INTEGER,
    dimm_slots_total INTEGER,
    ram_type TEXT,
    allocated_ram_gb INTEGER DEFAULT 0,
    available_ram_gb INTEGER,
    storage_type TEXT,
    storage_capacity_gb INTEGER,
    raid_configuration TEXT,
    disk_vendor_model TEXT,
    allocated_storage_gb INTEGER DEFAULT 0,
    available_storage_gb INTEGER,
    nic_count INTEGER,
    nic_speed TEXT,
    teaming_bonding TEXT,
    vlan_tagging_support BOOLEAN DEFAULT false,
    vm_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'Active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);