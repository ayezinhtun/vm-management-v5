-- Create indexes for better performance
CREATE INDEX idx_vms_customer_id ON vms(customer_id);
CREATE INDEX idx_vms_node_id ON vms(node_id);
CREATE INDEX idx_nodes_cluster_id ON nodes(cluster_id);
CREATE INDEX idx_contracts_customer_id ON contracts(customer_id);
CREATE INDEX idx_gp_accounts_customer_id ON gp_accounts(customer_id);
CREATE INDEX idx_contacts_customer_id ON contacts(customer_id);
CREATE INDEX idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX idx_activity_logs_entity_type ON activity_logs(entity_type);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_activity_logs_timestamp ON activity_logs(timestamp);