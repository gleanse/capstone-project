-- Tracks each booking status change with timestamp
-- Used for displaying status timeline on the booking tracking page
CREATE TABLE booking_status_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id),
  status VARCHAR(50) NOT NULL, -- confirmed, in_progress, done, picked_up
  changed_by UUID REFERENCES users(id) NULL, -- null if system/webhook
  created_at TIMESTAMP DEFAULT NOW()
);