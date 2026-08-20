-- queue_number is nullable because it is only assigned at payment confirmation, not at lock time.
-- assigning at confirmation ensures no duplicate queue numbers from expired or abandoned bookings.
ALTER TABLE bookings ALTER COLUMN queue_number DROP NOT NULL;