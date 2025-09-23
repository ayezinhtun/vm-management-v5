-- Enable Row Level Security (RLS)
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE clusters ENABLE ROW LEVEL SECURITY;
ALTER TABLE nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE vms ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE gp_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all operations for now)
CREATE POLICY "Allow all operations" ON customers FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON clusters FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON nodes FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON vms FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON contracts FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON gp_accounts FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON contacts FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON audit_logs FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON activity_logs FOR ALL USING (true);