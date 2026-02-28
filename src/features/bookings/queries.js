const pool = require('../../config/database');

const getServiceById = async (serviceId) => {
  const result = await pool.query(
    `
    SELECT 
      s.id,
      s.name,
      s.description,
      s.price,
      s.duration_hours,
      s.image_url,
      json_agg(
        json_build_object(
          'id', sv.id,
          'name', sv.name,
          'price', sv.price,
          'duration_hours', sv.duration_hours
        ) ORDER BY sv.price ASC
      ) FILTER (WHERE sv.id IS NOT NULL) AS variants
    FROM services s
    LEFT JOIN service_variants sv ON sv.service_id = s.id AND sv.is_active = true
    WHERE s.is_active = true AND s.id = $1
    GROUP BY s.id
  `,
    [serviceId]
  );
  return result.rows[0] || null;
};

const getAvailableDates = async (serviceId) => {
  const result = await pool.query(
    `
    SELECT 
      a.id AS availability_id,
      a.date,
      a.capacity,
      COUNT(b.id) FILTER (
        WHERE b.booking_status IN ('locked', 'confirmed')
      ) AS booked_count,
      a.capacity - COUNT(b.id) FILTER (
        WHERE b.booking_status IN ('locked', 'confirmed')
      ) AS remaining
    FROM availability a
    LEFT JOIN bookings b ON b.availability_id = a.id
    WHERE 
      a.service_id = $1
      AND a.is_open = true
      AND a.date > CURRENT_DATE
      AND NOT EXISTS (
        SELECT 1 FROM closed_dates cd
        WHERE 
          (cd.type = 'specific' AND cd.date = a.date)
          OR (cd.type = 'recurring' AND cd.day_of_week = EXTRACT(DOW FROM a.date))
      )
    GROUP BY a.id, a.date, a.capacity
    HAVING a.capacity - COUNT(b.id) FILTER (
      WHERE b.booking_status IN ('locked', 'confirmed')
    ) > 0
    ORDER BY a.date ASC
  `,
    [serviceId]
  );
  return result.rows;
};

const lockSlot = async ({ availabilityId, serviceId, variantId, userId }) => {
  const result = await pool.query(
    `
    INSERT INTO bookings (
      availability_id,
      service_id,
      variant_id,
      user_id,
      booking_status,
      expires_at
    ) VALUES ($1, $2, $3, $4, 'locked', NOW() + INTERVAL '15 minutes')
    RETURNING *
  `,
    [availabilityId, serviceId, variantId || null, userId || null]
  );
  return result.rows[0];
};

module.exports = { getServiceById, getAvailableDates, lockSlot };
