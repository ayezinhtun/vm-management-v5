-- Add cluster_id column to vms table
ALTER TABLE vms ADD COLUMN cluster_id UUID REFERENCES clusters(id) ON DELETE SET NULL;

-- Add index for better performance
CREATE INDEX idx_vms_cluster_id ON vms(cluster_id);

-- Update existing VMs to have a cluster_id based on their node's cluster
UPDATE vms 
SET cluster_id = nodes.cluster_id 
FROM nodes 
WHERE vms.node_id = nodes.id 
AND vms.cluster_id IS NULL;