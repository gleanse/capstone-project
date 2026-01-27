-- Drop tables if exist (for clean reinstall)
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS roles CASCADE;

-- Roles Table
CREATE TABLE roles (
  role_id SERIAL PRIMARY KEY,
  role_name VARCHAR(50) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE roles IS 'Defines user roles (customer, staff, admin, owner, superadmin, viewer)';

-- Insert default roles
INSERT INTO roles (role_name) VALUES
  ('customer'),
  ('staff'),
  ('admin'),
  ('owner'),
  ('superadmin'),
  ('viewer');

-- Users Table
CREATE TABLE users (
  user_id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  role_id INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(role_id) ON DELETE RESTRICT
);

COMMENT ON TABLE users IS 'Registered users with accounts';

-- Indexes for faster lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role_id);

-- Services Table
CREATE TABLE services (
  service_id SERIAL PRIMARY KEY,
  service_name VARCHAR(255) NOT NULL,
  description TEXT,
  base_price DECIMAL(10,2) NOT NULL CHECK (base_price >= 0),
  duration_minutes INTEGER CHECK (duration_minutes > 0),
  category VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE services IS 'Detailing services offered by Herco Garage';
COMMENT ON COLUMN services.duration_minutes IS 'Estimated time to complete';
COMMENT ON COLUMN services.category IS 'e.g., Exterior, Interior, Premium';

-- Index for active services
CREATE INDEX idx_services_active ON services(is_active);
CREATE INDEX idx_services_category ON services(category);

-- Bookings Table
CREATE TABLE bookings (
  booking_id SERIAL PRIMARY KEY,
  user_id INTEGER,
  guest_name VARCHAR(255),
  guest_email VARCHAR(255),
  guest_phone VARCHAR(20),
  service_id INTEGER NOT NULL,
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  downpayment DECIMAL(10,2) CHECK (downpayment >= 0),
  total_price DECIMAL(10,2),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
  FOREIGN KEY (service_id) REFERENCES services(service_id) ON DELETE RESTRICT,
  CHECK (
    (user_id IS NOT NULL) OR 
    (guest_name IS NOT NULL AND guest_email IS NOT NULL)
  )
);

COMMENT ON TABLE bookings IS 'Customer bookings - handles both registered users and guests';
COMMENT ON COLUMN bookings.user_id IS 'NULL if guest booking';
COMMENT ON COLUMN bookings.downpayment IS 'Paid upfront to secure booking, deducted from total';

-- Indexes for common queries
CREATE INDEX idx_bookings_user ON bookings(user_id);
CREATE INDEX idx_bookings_service ON bookings(service_id);
CREATE INDEX idx_bookings_date ON bookings(booking_date);
CREATE INDEX idx_bookings_status ON bookings(status);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at
  BEFORE UPDATE ON services
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- View for active services with categories
CREATE VIEW active_services AS
SELECT 
  service_id,
  service_name,
  description,
  base_price,
  duration_minutes,
  category
FROM services
WHERE is_active = true
ORDER BY category, service_name;

-- View for upcoming bookings
CREATE VIEW upcoming_bookings AS
SELECT 
  b.booking_id,
  COALESCE(u.username, b.guest_name) as customer_name,
  COALESCE(u.email, b.guest_email) as customer_email,
  s.service_name,
  b.booking_date,
  b.booking_time,
  b.status,
  b.downpayment
FROM bookings b
LEFT JOIN users u ON b.user_id = u.user_id
JOIN services s ON b.service_id = s.service_id
WHERE b.booking_date >= CURRENT_DATE
ORDER BY b.booking_date, b.booking_time;