// admin.routes.js — JSON API ONLY (used by apiRouter)
const express = require('express');
const router  = express.Router();
const path    = require('path');
const fs      = require('fs');
const pool    = require('../../config/database');

const PUBLIC_DIR  = path.join(__dirname, '..', '..', '..', 'public');
const UPLOADS_DIR = path.join(PUBLIC_DIR, 'uploads', 'services');

// Safely create uploads folder
try {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    console.log('[admin] Created uploads dir:', UPLOADS_DIR);
  }
} catch (e) {
  console.warn('[admin] Could not create uploads dir:', e.message);
}

// ── Save base64 image to disk ──────────────────────────
function saveBase64Image(base64String, oldImageUrl) {
  try {
    const matches = base64String.match(/^data:(.+);base64,(.+)$/);
    if (!matches) return null;

    const mimeType = matches[1];
    const data     = matches[2];
    const ext      = mimeType.split('/')[1].replace('jpeg', 'jpg').replace('svg+xml', 'svg');
    const filename = `svc_${Date.now()}.${ext}`;
    const filepath = path.join(UPLOADS_DIR, filename);

    fs.writeFileSync(filepath, Buffer.from(data, 'base64'));

    // Delete replaced local file
    if (oldImageUrl && oldImageUrl.startsWith('/uploads/services/')) {
      const oldPath = path.join(PUBLIC_DIR, oldImageUrl);
      if (fs.existsSync(oldPath)) {
        try { fs.unlinkSync(oldPath); } catch (_) {}
      }
    }

    return `/uploads/services/${filename}`;
  } catch (e) {
    console.error('[admin] saveBase64Image error:', e.message);
    return null;
  }
}

// ===========================
// GET /api/admin/stats/today
// ===========================
router.get('/stats/today', async (req, res) => {
  try {
    const result = await pool.query(`
  SELECT
    COUNT(*) FILTER (WHERE b.booking_status = 'confirmed') AS total,
    COUNT(*) FILTER (WHERE b.status = 'pending' AND b.booking_status = 'confirmed') AS pending,
    COUNT(*) FILTER (WHERE b.status = 'in_progress') AS in_progress,
    COUNT(*) FILTER (WHERE b.status IN ('done', 'picked_up')) AS done
  FROM bookings b
  LEFT JOIN availability a ON a.id = b.availability_id
  WHERE b.booking_status = 'confirmed'
    AND (
      DATE(a.date) = CURRENT_DATE
      OR (b.availability_id IS NULL AND DATE(b.created_at) = CURRENT_DATE)
    )
`);
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ===========================
// GET /api/admin/bookings/today
// ===========================
router.get('/bookings/today', async (req, res) => {
  try {
    const result = await pool.query(`
  SELECT b.id, b.reference_code, b.guest_name, b.guest_email,
         b.status, b.booking_status, b.payment_method, b.is_walkin,
         a.date AS booking_date, s.name AS service_name, sv.name AS variant_name
  FROM bookings b
  LEFT JOIN availability a      ON a.id  = b.availability_id
  LEFT JOIN services s          ON s.id  = b.service_id
  LEFT JOIN service_variants sv ON sv.id = b.variant_id
  WHERE b.booking_status = 'confirmed'
    AND (
      DATE(a.date) = CURRENT_DATE
      OR (b.availability_id IS NULL AND DATE(b.created_at) = CURRENT_DATE)
    )
  ORDER BY b.created_at DESC
`);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ===========================
// GET /api/admin/bookings/pickup-pending
// ===========================
router.get('/bookings/pickup-pending', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT b.id, b.reference_code, b.guest_name, b.status,
             s.name AS service_name, p.is_fully_paid, p.remaining_balance
      FROM bookings b
      LEFT JOIN services s ON s.id = b.service_id
      LEFT JOIN payments p ON p.booking_id = b.id
      WHERE b.status = 'done' AND b.booking_status = 'confirmed'
      ORDER BY b.updated_at DESC
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) {
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
      SELECT b.id, b.reference_code, b.guest_name, b.guest_email,
             b.status, b.booking_status, b.payment_method, b.is_walkin,
             a.date AS booking_date, s.name AS service_name,
             sv.name AS variant_name, sv.price AS variant_price
      FROM bookings b
      LEFT JOIN availability a      ON a.id  = b.availability_id
      LEFT JOIN services s          ON s.id  = b.service_id
      LEFT JOIN service_variants sv ON sv.id = b.variant_id
      WHERE b.booking_status = 'confirmed'
    `;
    const params = [];
    if (status) { params.push(status); query += ` AND b.status = $${params.length}`; }
    if (search) {
      params.push(`%${search}%`);
      query += ` AND (b.reference_code ILIKE $${params.length} OR b.guest_name ILIKE $${params.length} OR b.guest_email ILIKE $${params.length})`;
    }
    query += ` ORDER BY b.created_at DESC LIMIT 100`;
    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (err) {
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
      `UPDATE bookings SET status=$1, updated_by=$2, updated_at=NOW() WHERE id=$3`,
      [status, updatedBy, id]
    );
    if (updatedBy) {
      await pool.query(
        `INSERT INTO audit_logs (user_id,action,target_table,target_id,details) VALUES ($1,$2,'bookings',$3,$4)`,
        [updatedBy, `Updated booking status to ${status}`, id, `Status changed to ${status}`]
      );
    }
    res.json({ success: true, message: 'Status updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ===========================
// POST /api/admin/bookings/walkin
// ===========================
router.post('/bookings/walkin', async (req, res) => {
  try {
    const { guest_name, guest_email, guest_phone, service_id, variant_id,
            motorcycle_plate, motorcycle_description } = req.body;

    if (!guest_name || !guest_phone || !service_id || !variant_id) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const variantResult = await pool.query('SELECT price FROM service_variants WHERE id=$1', [variant_id]);
    if (!variantResult.rows.length) {
      return res.status(400).json({ success: false, message: 'Variant not found' });
    }
    const price   = variantResult.rows[0].price;
    const refCode = 'WI-' + Date.now().toString(36).toUpperCase();

    const availResult = await pool.query(
      `SELECT id FROM availability WHERE service_id=$1 AND date=CURRENT_DATE AND is_open=true LIMIT 1`,
      [service_id]
    );
    const availabilityId = availResult.rows[0]?.id || null;

    const queueResult = await pool.query(
      `SELECT COALESCE(MAX(queue_number),0)+1 AS next_queue FROM bookings WHERE DATE(created_at)=CURRENT_DATE`
    );
    const queueNumber = queueResult.rows[0].next_queue;

    const bookingResult = await pool.query(
      `INSERT INTO bookings (availability_id,service_id,variant_id,guest_name,guest_email,guest_phone,
        reference_code,queue_number,motorcycle_plate,motorcycle_description,
        is_walkin,payment_method,status,booking_status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,true,'cash','pending','confirmed')
       RETURNING id,reference_code,queue_number`,
      [availabilityId, service_id, variant_id, guest_name, guest_email||null, guest_phone,
       refCode, queueNumber, motorcycle_plate||null, motorcycle_description||null]
    );
    const booking = bookingResult.rows[0];

    await pool.query(
      `INSERT INTO payments (booking_id,amount,amount_paid,remaining_balance,payment_type,is_fully_paid,status,paid_at)
       VALUES ($1,$2,$2,0,'full',true,'paid',NOW())`,
      [booking.id, price]
    );

    const staffId = req.session?.user?.id || null;
    if (staffId) {
      await pool.query(
        `INSERT INTO audit_logs (user_id,action,target_table,target_id,details) VALUES ($1,'Created walk-in booking','bookings',$2,$3)`,
        [staffId, booking.id, `Walk-in for ${guest_name}, ref: ${refCode}`]
      );
    }

    res.json({ success: true, booking_id: booking.id, reference_code: booking.reference_code, queue_number: booking.queue_number });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ===========================
// GET /api/admin/services
// ===========================
router.get('/services', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT s.id, s.name, s.description, s.price, s.duration_hours, s.is_active, s.image_url,
             json_agg(
               json_build_object('id',sv.id,'name',sv.name,'price',sv.price)
               ORDER BY sv.price ASC
             ) FILTER (WHERE sv.id IS NOT NULL) AS variants
      FROM services s
      LEFT JOIN service_variants sv ON sv.service_id=s.id AND sv.is_active=true
      WHERE s.is_active=true
      GROUP BY s.id ORDER BY s.created_at ASC
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Get services error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ===========================
// POST /api/admin/services
// ===========================
router.post('/services', async (req, res) => {
  try {
    const { name, description, price, duration_hours, image_base64 } = req.body;

    if (!name || !price) {
      return res.status(400).json({ success: false, message: 'Name and price are required' });
    }
    if (isNaN(parseFloat(price)) || parseFloat(price) < 0) {
      return res.status(400).json({ success: false, message: 'Price must be a valid positive number' });
    }

    let finalImageUrl = null;
    if (image_base64 && image_base64.startsWith('data:image/')) {
      finalImageUrl = saveBase64Image(image_base64, null);
    }

    const result = await pool.query(
      `INSERT INTO services (name,description,price,duration_hours,image_url,is_active)
       VALUES ($1,$2,$3,$4,$5,true) RETURNING id,name,description,price,duration_hours,image_url`,
      [name.trim(), description?.trim()||null, parseFloat(price),
       duration_hours ? parseInt(duration_hours) : null, finalImageUrl]
    );

    const service = result.rows[0];
    const staffId = req.session?.user?.id || null;
    if (staffId) {
      await pool.query(
        `INSERT INTO audit_logs (user_id,action,target_table,target_id,details) VALUES ($1,'Created service','services',$2,$3)`,
        [staffId, service.id, `Service "${name}" created`]
      );
    }

    res.status(201).json({ success: true, data: service, message: 'Service created successfully' });
  } catch (err) {
    console.error('Create service error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ===========================
// PUT /api/admin/services/:id
// ===========================
router.put('/services/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, duration_hours, image_base64, clear_image } = req.body;

    if (!name || !price) {
      return res.status(400).json({ success: false, message: 'Name and price are required' });
    }

    const oldResult   = await pool.query('SELECT image_url FROM services WHERE id=$1', [id]);
    const oldImageUrl = oldResult.rows[0]?.image_url || null;

    let finalImageUrl = oldImageUrl;
    if (clear_image) {
      finalImageUrl = null;
      if (oldImageUrl && oldImageUrl.startsWith('/uploads/services/')) {
        const oldPath = path.join(PUBLIC_DIR, oldImageUrl);
        if (fs.existsSync(oldPath)) { try { fs.unlinkSync(oldPath); } catch (_) {} }
      }
    } else if (image_base64 && image_base64.startsWith('data:image/')) {
      finalImageUrl = saveBase64Image(image_base64, oldImageUrl);
    }

    const result = await pool.query(
      `UPDATE services SET name=$1,description=$2,price=$3,duration_hours=$4,image_url=$5
       WHERE id=$6 AND is_active=true
       RETURNING id,name,description,price,duration_hours,image_url`,
      [name.trim(), description?.trim()||null, parseFloat(price),
       duration_hours ? parseInt(duration_hours) : null, finalImageUrl, id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    const staffId = req.session?.user?.id || null;
    if (staffId) {
      await pool.query(
        `INSERT INTO audit_logs (user_id,action,target_table,target_id,details) VALUES ($1,'Updated service','services',$2,$3)`,
        [staffId, id, `Service "${name}" updated`]
      );
    }

    res.json({ success: true, data: result.rows[0], message: 'Service updated successfully' });
  } catch (err) {
    console.error('Update service error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ===========================
// DELETE /api/admin/services/:id
// ===========================
router.delete('/services/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `UPDATE services SET is_active=false WHERE id=$1 RETURNING name`, [id]
    );
    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }
    const staffId = req.session?.user?.id || null;
    if (staffId) {
      await pool.query(
        `INSERT INTO audit_logs (user_id,action,target_table,target_id,details) VALUES ($1,'Deleted service','services',$2,$3)`,
        [staffId, id, `Service "${result.rows[0].name}" soft-deleted`]
      );
    }
    res.json({ success: true, message: 'Service deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ===========================
// GET /api/admin/services/:id/variants
// ===========================
router.get('/services/:id/variants', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id,name,price,duration_hours,is_active FROM service_variants
       WHERE service_id=$1 ORDER BY price ASC`, [req.params.id]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ===========================
// POST /api/admin/services/:id/variants
// ===========================
router.post('/services/:id/variants', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, duration_hours } = req.body;
    if (!name || !price) {
      return res.status(400).json({ success: false, message: 'Name and price are required' });
    }
    const result = await pool.query(
      `INSERT INTO service_variants (service_id,name,price,duration_hours,is_active)
       VALUES ($1,$2,$3,$4,true) RETURNING id,name,price,duration_hours`,
      [id, name.trim(), parseFloat(price), duration_hours ? parseInt(duration_hours) : null]
    );
    res.status(201).json({ success: true, data: result.rows[0], message: 'Variant added successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ===========================
// DELETE /api/admin/services/:serviceId/variants/:variantId
// ===========================
router.delete('/services/:serviceId/variants/:variantId', async (req, res) => {
  try {
    await pool.query(
      `UPDATE service_variants SET is_active=false WHERE id=$1 AND service_id=$2`,
      [req.params.variantId, req.params.serviceId]
    );
    res.json({ success: true, message: 'Variant removed' });
  } catch (err) {
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
      SELECT a.id, a.date, a.capacity, a.is_open, s.name AS service_name,
             COUNT(b.id) FILTER (WHERE b.booking_status IN ('locked','confirmed')) AS bookings_count
      FROM availability a
      LEFT JOIN services s ON s.id=a.service_id
      LEFT JOIN bookings b ON b.availability_id=a.id
    `;
    const params = [];
    if (date) { params.push(date); query += ` WHERE a.date=$1`; }
    else       { query += ` WHERE a.date>=CURRENT_DATE`; }
    query += ` GROUP BY a.id,a.date,a.capacity,a.is_open,s.name ORDER BY a.date ASC LIMIT 60`;
    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ===========================
// GET /api/admin/closed-dates
// ===========================
router.get('/closed-dates', async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM closed_dates ORDER BY created_at DESC`);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ===========================
// GET /api/admin/staff
// ===========================
router.get('/staff', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id,name,email,role,created_at FROM users WHERE role IN ('admin','staff') ORDER BY created_at DESC`
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ===========================
// GET /api/admin/payments
// ===========================
router.get('/payments', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.id,p.amount,p.amount_paid,p.remaining_balance,p.payment_type,
             p.is_fully_paid,p.status,p.paid_at,b.reference_code,b.guest_name
      FROM payments p LEFT JOIN bookings b ON b.id=p.booking_id
      ORDER BY p.created_at DESC LIMIT 100
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ===========================
// GET /api/admin/audit-logs
// ===========================
router.get('/audit-logs', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT al.id,al.action,al.target_table,al.target_id,al.details,al.created_at,u.name AS user_name
      FROM audit_logs al LEFT JOIN users u ON u.id=al.user_id
      ORDER BY al.created_at DESC LIMIT 100
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ===========================
// POST /api/admin/availability
// ===========================
router.post('/availability', async (req, res) => {
  try {
    const { service_id, date, capacity, is_open } = req.body;

    if (!service_id || !date || !capacity) {
      return res.status(400).json({ success: false, message: 'service_id, date, and capacity are required' });
    }
    if (parseInt(capacity) < 1) {
      return res.status(400).json({ success: false, message: 'Capacity must be at least 1' });
    }

    const result = await pool.query(
      `INSERT INTO availability (service_id, date, capacity, is_open)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (service_id, date)
       DO UPDATE SET capacity = $3, is_open = $4
       RETURNING id, date, capacity, is_open`,
      [service_id, date, parseInt(capacity), is_open !== false]
    );

    const staffId = req.session?.user?.id || null;
    if (staffId) {
      await pool.query(
        `INSERT INTO audit_logs (user_id, action, target_table, target_id, details)
         VALUES ($1, 'Set availability capacity', 'availability', $2, $3)`,
        [staffId, result.rows[0].id, `Capacity ${capacity} set for date ${date}`]
      );
    }

    res.status(201).json({ success: true, data: result.rows[0], message: 'Capacity saved successfully' });
  } catch (err) {
    console.error('Create availability error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ===========================
// PUT /api/admin/availability/:id
// ===========================
router.put('/availability/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { capacity, is_open, date } = req.body;

    if (!capacity || parseInt(capacity) < 1) {
      return res.status(400).json({ success: false, message: 'Capacity must be at least 1' });
    }

    const result = await pool.query(
      `UPDATE availability
       SET capacity = $1, is_open = $2, date = COALESCE($3, date)
       WHERE id = $4
       RETURNING id, date, capacity, is_open`,
      [parseInt(capacity), is_open !== false, date || null, id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: 'Availability entry not found' });
    }

    res.json({ success: true, data: result.rows[0], message: 'Capacity updated successfully' });
  } catch (err) {
    console.error('Update availability error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ===========================
// DELETE /api/admin/availability/:id
// ===========================
router.delete('/availability/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `DELETE FROM availability WHERE id = $1 RETURNING id`,
      [id]
    );
    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: 'Availability entry not found' });
    }
    res.json({ success: true, message: 'Availability entry deleted' });
  } catch (err) {
    console.error('Delete availability error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ===========================
// POST /api/admin/closed-dates
// ===========================
router.post('/closed-dates', async (req, res) => {
  try {
    const { type, day_of_week, date, reason } = req.body;

    if (!type || !['recurring', 'specific'].includes(type)) {
      return res.status(400).json({ success: false, message: 'Type must be recurring or specific' });
    }
    if (type === 'recurring' && day_of_week === undefined) {
      return res.status(400).json({ success: false, message: 'day_of_week is required for recurring closure' });
    }
    if (type === 'specific' && !date) {
      return res.status(400).json({ success: false, message: 'date is required for specific closure' });
    }

    const result = await pool.query(
      `INSERT INTO closed_dates (type, day_of_week, date, reason)
       VALUES ($1, $2, $3, $4)
       RETURNING id, type, day_of_week, date, reason`,
      [type, type === 'recurring' ? parseInt(day_of_week) : null, type === 'specific' ? date : null, reason || null]
    );

    const staffId = req.session?.user?.id || null;
    if (staffId) {
      await pool.query(
        `INSERT INTO audit_logs (user_id, action, target_table, target_id, details)
         VALUES ($1, 'Added closed date', 'closed_dates', $2, $3)`,
        [staffId, result.rows[0].id, `Closure: ${type}, ${reason || 'no reason'}`]
      );
    }

    res.status(201).json({ success: true, data: result.rows[0], message: 'Closure added successfully' });
  } catch (err) {
    console.error('Create closed date error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ===========================
// DELETE /api/admin/closed-dates/:id
// ===========================
router.delete('/closed-dates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `DELETE FROM closed_dates WHERE id = $1 RETURNING id`,
      [id]
    );
    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: 'Closed date not found' });
    }
    res.json({ success: true, message: 'Closure deleted successfully' });
  } catch (err) {
    console.error('Delete closed date error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ===========================
// GET /api/admin/notifications/count
// ===========================
router.get('/notifications/count', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT COUNT(*) AS count
      FROM bookings b
      LEFT JOIN availability a ON a.id = b.availability_id
      WHERE b.booking_status = 'confirmed'
        AND b.status IN ('pending', 'done')
        AND (
          DATE(a.date) = CURRENT_DATE
          OR (b.availability_id IS NULL AND DATE(b.created_at) = CURRENT_DATE)
        )
    `);
    res.json({ success: true, count: parseInt(result.rows[0].count) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ===========================
// GET /api/admin/notifications/list
// ===========================
router.get('/notifications/list', async (req, res) => {
  try {
    // 1. New bookings today (confirmed today)
    const newRes = await pool.query(`
      SELECT b.id, b.reference_code, b.guest_name, b.status,
             s.name AS service_name, sv.name AS variant_name
      FROM bookings b
      LEFT JOIN availability a      ON a.id  = b.availability_id
      LEFT JOIN services s          ON s.id  = b.service_id
      LEFT JOIN service_variants sv ON sv.id = b.variant_id
      WHERE b.booking_status = 'confirmed'
        AND DATE(b.created_at) = CURRENT_DATE
      ORDER BY b.created_at DESC
    `);

    // 2. Pending bookings (confirmed but not yet in_progress) — today
    const pendingRes = await pool.query(`
      SELECT b.id, b.reference_code, b.guest_name, b.status,
             s.name AS service_name
      FROM bookings b
      LEFT JOIN availability a ON a.id = b.availability_id
      LEFT JOIN services s     ON s.id = b.service_id
      WHERE b.booking_status = 'confirmed'
        AND b.status = 'pending'
        AND (
          DATE(a.date) = CURRENT_DATE
          OR (b.availability_id IS NULL AND DATE(b.created_at) = CURRENT_DATE)
        )
      ORDER BY b.created_at ASC
    `);

    // 3. Done — waiting for pickup
    const pickupRes = await pool.query(`
      SELECT b.id, b.reference_code, b.guest_name, b.status,
             s.name AS service_name
      FROM bookings b
      LEFT JOIN services s ON s.id = b.service_id
      WHERE b.booking_status = 'confirmed'
        AND b.status = 'done'
      ORDER BY b.updated_at DESC
    `);

    // 4. Expired bookings today
    const expiredRes = await pool.query(`
      SELECT b.id, b.reference_code, b.guest_name, b.status,
             s.name AS service_name
      FROM bookings b
      LEFT JOIN services s ON s.id = b.service_id
      WHERE b.booking_status = 'expired'
        AND DATE(b.created_at) = CURRENT_DATE
      ORDER BY b.created_at DESC
    `);

    res.json({
      success: true,
      data: {
        newBookings: newRes.rows,
        pending:     pendingRes.rows,
        pickup:      pickupRes.rows,
        expired:     expiredRes.rows,
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;