-- VMs table
CREATE TABLE vms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vm_name TEXT NOT NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    node_id UUID REFERENCES nodes(id) ON DELETE SET NULL,
    cpu TEXT,
    cpu_ghz NUMERIC,
    ram TEXT,
    storage TEXT,
    services TEXT,
    creation_date DATE,
    service_start_date DATE,
    service_end_date DATE,
    password_created_date DATE,
    last_password_changed_date DATE,
    next_password_due_date DATE,
    password_changer TEXT,
    public_ip INET,
    management_ip INET,
    private_ips INET[],
    allowed_ports TEXT[],
    status TEXT DEFAULT 'Active',
    remarks TEXT,
    custom_fields JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contracts table
CREATE TABLE contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    contract_number TEXT UNIQUE NOT NULL,
    contract_name TEXT NOT NULL,
    service_start_date DATE,
    service_end_date DATE,
    value NUMERIC,
    status TEXT DEFAULT 'Active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- GP Accounts table
CREATE TABLE gp_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    gp_ip INET,
    gp_username TEXT NOT NULL,
    gp_password TEXT,
    account_created_date DATE,
    last_password_changed_date DATE,
    password_changer TEXT,
    account_creator TEXT,
    next_password_due_date DATE,
    status TEXT DEFAULT 'Active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contacts table
CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    department TEXT,
    email TEXT,
    contact_number TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);