-- Allow anyone to select unapproved moments for moderation (for prototype purposes)
-- In a real app, this would be restricted to an admin role
CREATE POLICY "Enable read access for all users for unapproved moments" 
ON moments FOR SELECT 
USING (is_approved = false OR is_approved = true);

-- Allow anyone to update moments (for prototype purposes)
CREATE POLICY "Enable update for all users"
ON moments FOR UPDATE
USING (true);

-- Allow anyone to delete moments (for prototype purposes)
CREATE POLICY "Enable delete for all users"
ON moments FOR DELETE
USING (true);
