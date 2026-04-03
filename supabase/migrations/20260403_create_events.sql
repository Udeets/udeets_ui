-- Events table
CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  hub_id UUID NOT NULL REFERENCES hubs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  location TEXT,
  cover_image_url TEXT,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Event RSVPs
CREATE TABLE IF NOT EXISTS event_rsvps (
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('going', 'maybe', 'not_going')),
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (event_id, user_id)
);

-- RLS for events
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_rsvps ENABLE ROW LEVEL SECURITY;

-- Anyone can read events for public hubs
CREATE POLICY "Anyone can read events" ON events FOR SELECT USING (true);

-- Hub members can create events (simplified: any authenticated user for now)
CREATE POLICY "Authenticated users can create events" ON events FOR INSERT
  WITH CHECK (auth.uid()::text = created_by);

-- Creator can update their events
CREATE POLICY "Creator can update own events" ON events FOR UPDATE
  USING (auth.uid()::text = created_by);

-- Creator can delete their events
CREATE POLICY "Creator can delete own events" ON events FOR DELETE
  USING (auth.uid()::text = created_by);

-- RSVP policies
CREATE POLICY "Anyone can read RSVPs" ON event_rsvps FOR SELECT USING (true);
CREATE POLICY "Users can manage own RSVP" ON event_rsvps FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "Users can update own RSVP" ON event_rsvps FOR UPDATE
  USING (auth.uid()::text = user_id);
CREATE POLICY "Users can delete own RSVP" ON event_rsvps FOR DELETE
  USING (auth.uid()::text = user_id);

-- Indexes
CREATE INDEX idx_events_hub_id ON events(hub_id);
CREATE INDEX idx_events_event_date ON events(event_date);
CREATE INDEX idx_event_rsvps_event_id ON event_rsvps(event_id);
