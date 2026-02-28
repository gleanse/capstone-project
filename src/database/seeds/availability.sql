-- CLOSED DATES SEED
INSERT INTO closed_dates (type, day_of_week, reason) VALUES
('recurring', 0, 'Closed on Sundays'),
('recurring', 6, 'Closed on Saturdays');

-- AVAILABILITY SEED (next 30 days, Mon-Fri, capacity 3 per service)
INSERT INTO availability (service_id, date, capacity, is_open)
SELECT 
  s.id,
  d.date,
  3,
  true
FROM services s
CROSS JOIN (
  SELECT CURRENT_DATE + i AS date
  FROM generate_series(1, 30) AS i
) d
WHERE EXTRACT(DOW FROM d.date) NOT IN (0, 6)
AND s.is_active = true
ON CONFLICT (service_id, date) DO NOTHING;