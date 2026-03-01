const express = require('express');
const router = express.Router();
const path = require('path');
const pool = require('../../config/database');

// ===========================
// PAGE ROUTE
// ===========================
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// ===========================
// CSS & JS STATIC ASSETS
// ===========================
router.get('/admin.css', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.css'));
});

router.get('/admin.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.js'));
});

// ===========================
// GET /api/admin/stats/today
// ===========================
router.get('/stats/today', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE booking_status = 'confirmed') AS total,
        COUNT(*) FILTER (WHERE status = 'pending' AND booking_status = 'confirmed') AS pending,
        COUNT(*) FILTER (WHERE status = 'in_progress') AS in_progress,
        COUNT(*) FILTER (WHERE status IN ('done', 'picked_up')) AS done
      FROM bookings
      WHERE DATE(created_at) = CURRENT_DATE
    `);

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ===========================
// GET /api/admin/bookings/today
// ===========================
router.get('/bookings/today', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        b.id,
        b.reference_code,
        b.guest_name,
        b.guest_email,
        b.status,
        b.booking_status,
        b.payment_method,
        b.is_walkin,
        a.date AS booking_date,
        s.name AS service_name,
        sv.name AS variant_name
      FROM bookings b
      LEFT JOIN availability a ON a.id = b.availability_id
      LEFT JOIN services s ON s.id = b.service_id
      LEFT JOIN service_variants sv ON sv.id = b.variant_id
      WHERE DATE(a.date) = CURRENT_DATE
        AND b.booking_status = 'confirmed'
      ORDER BY b.created_at DESC
    `);

    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Bookings today error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ===========================
// GET /api/admin/bookings/pickup-pending
// ===========================
router.get('/bookings/pickup-pending', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        b.id,
        b.reference_code,
        b.guest_name,
        b.status,
        s.name AS service_name,
        p.is_fully_paid,
        p.remaining_balance
      FROM bookings b
      LEFT JOIN services s ON s.id = b.service_id
      LEFT JOIN payments p ON p.booking_id = b.id
      WHERE b.status = 'done'
        AND b.booking_status = 'confirmed'
      ORDER BY b.updated_at DESC
    `);

    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Pickup pending error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ===========================
// GET /api/admin/bookings
// ===========================
router.get('/bookings', async (req, res) => {
  try {
    const { status, search } = req.query;

    let query = `
      SELECT
        b.id,
        b.reference_code,
        b.guest_name,
        b.guest_email,
        b.status,
        b.booking_status,
        b.payment_method,
        b.is_walkin,
        a.date AS booking_date,
        s.name AS service_name,
        sv.name AS variant_name,
        sv.price AS variant_price
      FROM bookings b
      LEFT JOIN availability a ON a.id = b.availability_id
      LEFT JOIN services s ON s.id = b.service_id
      LEFT JOIN service_variants sv ON sv.id = b.variant_id
      WHERE b.booking_status = 'confirmed'
    `;

    const params = [];

    if (status) {
      params.push(status);
      query += ` AND b.status = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (b.reference_code ILIKE $${params.length} OR b.guest_name ILIKE $${params.length} OR b.guest_email ILIKE $${params.length})`;
    }

    query += ` ORDER BY b.created_at DESC LIMIT 100`;

    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Get bookings error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ===========================
// PATCH /api/admin/bookings/:id/status
// ===========================
router.patch('/bookings/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const updatedBy = req.session?.user?.id || null;

    const allowed = ['in_progress', 'done', 'picked_up'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    await pool.query(
      `UPDATE bookings
       SET status = $1, updated_by = $2, updated_at = NOW()
       WHERE id = $3`,
      [status, updatedBy, id]
    );

    // Audit log
    if (updatedBy) {
      await pool.query(
        `INSERT INTO audit_logs (user_id, action, target_table, target_id, details)
         VALUES ($1, $2, 'bookings', $3, $4)`,
        [updatedBy, `Updated booking status to ${status}`, id, `Status changed to ${status}`]
      );
    }

    res.json({ success: true, message: 'Status updated' });
  } catch (err) {
    console.error('Update status error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ===========================
// POST /api/admin/bookings/walkin
// ===========================
router.post('/bookings/walkin', async (req, res) => {
  try {
    const {
      guest_name,
      guest_email,
      guest_phone,
      service_id,
      variant_id,
      motorcycle_plate,
      motorcycle_description,
    } = req.body;

    if (!guest_name || !guest_phone || !service_id || !variant_id) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // get variant price
    const variantResult = await pool.query(
      'SELECT price FROM service_variants WHERE id = $1',
      [variant_id]
    );

    if (variantResult.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Variant not found' });
    }

    const price = variantResult.rows[0].price;

    // generate reference code
    const refCode = 'WI-' + Date.now().toString(36).toUpperCase();

    // get today's availability for the service
    const availResult = await pool.query(
      `SELECT id FROM availability
       WHERE service_id = $1 AND date = CURRENT_DATE AND is_open = true
       LIMIT 1`,
      [service_id]
    );

    const availabilityId = availResult.rows[0]?.id || null;

    // get next queue number for today
    const queueResult = await pool.query(
      `SELECT COALESCE(MAX(queue_number), 0) + 1 AS next_queue
       FROM bookings
       WHERE DATE(created_at) = CURRENT_DATE`
    );
    const queueNumber = queueResult.rows[0].next_queue;

    // insert walk-in booking
    const bookingResult = await pool.query(
      `INSERT INTO bookings (
        availability_id, service_id, variant_id,
        guest_name, guest_email, guest_phone,
        reference_code, queue_number,
        motorcycle_plate, motorcycle_description,
        is_walkin, payment_method,
        status, booking_status
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,true,'cash','pending','confirmed')
      RETURNING id, reference_code, queue_number`,
      [
        availabilityId, service_id, variant_id,
        guest_name, guest_email || null, guest_phone,
        refCode, queueNumber,
        motorcycle_plate || null, motorcycle_description || null,
      ]
    );

    const booking = bookingResult.rows[0];

    // insert payment record
    await pool.query(
      `INSERT INTO payments (booking_id, amount, amount_paid, remaining_balance, payment_type, is_fully_paid, status, paid_at)
       VALUES ($1, $2, $2, 0, 'full', true, 'paid', NOW())`,
      [booking.id, price]
    );

    // audit log
    const staffId = req.session?.user?.id || null;
    if (staffId) {
      await pool.query(
        `INSERT INTO audit_logs (user_id, action, target_table, target_id, details)
         VALUES ($1, 'Created walk-in booking', 'bookings', $2, $3)`,
        [staffId, booking.id, `Walk-in for ${guest_name}, ref: ${refCode}`]
      );
    }

    res.json({
      success: true,
      booking_id: booking.id,
      reference_code: booking.reference_code,
      queue_number: booking.queue_number,
    });
  } catch (err) {
    console.error('Walk-in booking error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ===========================
// GET /api/admin/services
// ===========================
router.get('/services', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        s.id,
        s.name,
        s.description,
        s.price,
        s.duration_hours,
        s.is_active,
        json_agg(
          json_build_object(
            'id', sv.id,
            'name', sv.name,
            'price', sv.price
          ) ORDER BY sv.price ASC
        ) FILTER (WHERE sv.id IS NOT NULL) AS variants
      FROM services s
      LEFT JOIN service_variants sv ON sv.service_id = s.id AND sv.is_active = true
      WHERE s.is_active = true
      GROUP BY s.id
      ORDER BY s.created_at ASC
    `);

    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Get services error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ===========================
// GET /api/admin/availability
// ===========================
router.get('/availability', async (req, res) => {
  try {
    const { date } = req.query;

    let query = `
      SELECT
        a.id,
        a.date,
        a.capacity,
        a.is_open,
        s.name AS service_name,
        COUNT(b.id) FILTER (WHERE b.booking_status IN ('locked','confirmed')) AS bookings_count
      FROM availability a
      LEFT JOIN services s ON s.id = a.service_id
      LEFT JOIN bookings b ON b.availability_id = a.id
    `;

    const params = [];

    if (date) {
      params.push(date);
      query += ` WHERE a.date = $1`;
    } else {
      query += ` WHERE a.date >= CURRENT_DATE`;
    }

    query += ` GROUP BY a.id, a.date, a.capacity, a.is_open, s.name ORDER BY a.date ASC LIMIT 60`;

    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Get availability error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ===========================
// GET /api/admin/closed-dates
// ===========================
router.get('/closed-dates', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM closed_dates ORDER BY created_at DESC`
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Get closed dates error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ===========================
// GET /api/admin/staff
// ===========================
router.get('/staff', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, role, created_at
       FROM users
       WHERE role IN ('admin','staff')
       ORDER BY created_at DESC`
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Get staff error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ===========================
// GET /api/admin/payments
// ===========================
router.get('/payments', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        p.id,
        p.amount,
        p.amount_paid,
        p.remaining_balance,
        p.payment_type,
        p.is_fully_paid,
        p.status,
        p.paid_at,
        b.reference_code,
        b.guest_name
      FROM payments p
      LEFT JOIN bookings b ON b.id = p.booking_id
      ORDER BY p.created_at DESC
      LIMIT 100
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Get payments error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ===========================
// GET /api/admin/audit-logs
// ===========================
router.get('/audit-logs', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        al.id,
        al.action,
        al.target_table,
        al.target_id,
        al.details,
        al.created_at,
        u.name AS user_name
      FROM audit_logs al
      LEFT JOIN users u ON u.id = al.user_id
      ORDER BY al.created_at DESC
      LIMIT 100
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Get audit logs error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;