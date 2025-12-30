-- Add policy for users to view their own analytics events
CREATE POLICY "Users can view their own events"
ON analytics_events
FOR SELECT
USING (auth.uid() = user_id);