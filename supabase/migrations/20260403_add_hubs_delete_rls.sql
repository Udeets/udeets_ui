-- Allow hub creators to delete their own hubs
CREATE POLICY "Hub creators can delete own hubs" ON hubs FOR DELETE
  USING (auth.uid()::text = created_by);
