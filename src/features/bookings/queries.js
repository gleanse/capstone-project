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

const releaseSlot = async (bookingId) => {
  const result = await pool.query(
    `
    UPDATE bookings
    SET booking_status = 'expired'
    WHERE id = $1
    AND booking_status = 'locked'
    RETURNING *
  `,
    [bookingId]
  );
  return result.rows[0] || null;
};

const updateBookingDetails = async (
  bookingId,
  {
    guestName,
    guestEmail,
    guestPhone,
    motorcyclePlate,
    motorcycleModel,
    motorcycleColor,
    motorcycleDescription,
  }
) => {
  const result = await pool.query(
    `
    UPDATE bookings
    SET
      guest_name = $2,
      guest_email = $3,
      guest_phone = $4,
      motorcycle_plate = $5,
      motorcycle_model = $6,
      motorcycle_color = $7,
      motorcycle_description = $8,
      updated_at = NOW()
    WHERE id = $1
    AND booking_status = 'locked'
    RETURNING *
  `,
    [
      bookingId,
      guestName,
      guestEmail,
      guestPhone,
      motorcyclePlate,
      motorcycleModel,
      motorcycleColor,
      motorcycleDescription || null,
    ]
  );
  return result.rows[0] || null;
};

const createPayment = async ({
  bookingId,
  amount,
  amountPaid,
  paymentType,
}) => {
  const result = await pool.query(
    `
    INSERT INTO payments (
      booking_id,
      amount,
      amount_paid,
      remaining_balance,
      payment_type,
      is_fully_paid,
      status
    ) VALUES ($1, $2, $3, $4, $5, $6, 'unpaid')
    RETURNING *
  `,
    [
      bookingId,
      amount,
      amountPaid,
      amount - amountPaid,
      paymentType,
      paymentType === 'full',
    ]
  );
  return result.rows[0];
};

const confirmBooking = async ({ bookingId, xenditInvoiceId }) => {
  const result = await pool.query(
    `
    UPDATE bookings
    SET
      booking_status = 'confirmed',
      reference_code = 'HRC-' || UPPER(SUBSTRING(id::text, 1, 8)),
      queue_number = (
        SELECT COALESCE(MAX(queue_number), 0) + 1
        FROM bookings
        WHERE availability_id = (
          SELECT availability_id FROM bookings WHERE id = $1
        )
        AND booking_status = 'confirmed'
      ),
      updated_at = NOW()
    WHERE id = $1
    RETURNING *
  `,
    [bookingId]
  );

  await pool.query(
    `
    UPDATE payments
    SET
      status = 'paid',
      xendit_invoice_id = $2,
      paid_at = NOW()
    WHERE booking_id = $1
  `,
    [bookingId, xenditInvoiceId]
  );

  return result.rows[0] || null;
};

const getBookingByPaymentId = async (paymentId) => {
  const result = await pool.query(
    `SELECT 
      b.id,
      b.reference_code,
      b.queue_number,
      b.guest_name,
      b.guest_email,
      b.booking_status,
      b.motorcycle_plate,
      b.motorcycle_model,
      b.motorcycle_color,
      a.date AS booking_date,
      s.name AS service_name,
      sv.name AS variant_name,
      p.amount_paid,
      p.remaining_balance,
      p.payment_type,
      p.is_fully_paid
    FROM payments p
    JOIN bookings b ON b.id = p.booking_id
    JOIN availability a ON a.id = b.availability_id
    JOIN services s ON s.id = b.service_id
    LEFT JOIN service_variants sv ON sv.id = b.variant_id
    WHERE p.id = $1`,
    [paymentId]
  );
  return result.rows[0] || null;
};

module.exports = {
  getServiceById,
  getAvailableDates,
  lockSlot,
  releaseSlot,
  updateBookingDetails,
  createPayment,
  confirmBooking,
  getBookingByPaymentId,
};
