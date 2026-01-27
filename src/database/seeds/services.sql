-- Clear existing services
DELETE FROM services;

INSERT INTO services (service_name, description, base_price, duration_minutes, category) VALUES
  ('Premium Detailing', 'Complete interior and exterior detailing with wax and polish', 2500.00, 240, 'Premium'),
  ('Ceramic Coating', 'Long-lasting paint protection with 9H ceramic coating', 8000.00, 360, 'Protection'),
  ('Powder Coating', 'Durable powder coating for wheels and metal parts', 5000.00, 480, 'Coating');