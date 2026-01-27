require('dotenv').config();
const express = require('express');
const path = require('path');
const pool = require('./config/database');
const { Xendit } = require('xendit-node');

const app = express();

// MIDDLEWARE
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// initialize xendit
const xenditClient = new Xendit({
  secretKey: process.env.XENDIT_SECRET_KEY,
});

// test DATABASE connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection failed:', err.message);
  } else {
    console.log('Database connected at:', res.rows[0].now);
  }
});

// ROUTES
app.get('/', (req, res) => {
  res.send('Server is running!!!');
});

// TEST XENDIT
app.get('/test-xendit', async (req, res) => {
  try {
    const { Invoice } = xenditClient;

    const invoice = await Invoice.createInvoice({
      data: {
        externalId: `test-${Date.now()}`,
        amount: 100,
        payerEmail: 'customer@example.com',
        description: 'Test Payment',
      },
    });

    res.json({
      success: true,
      message: 'Xendit is working!',
      payment_url: invoice.invoiceUrl,
    });
  } catch (error) {
    res.json({
      success: false,
      error: error.message,
    });
  }
});

// BOOKING WITH PAYMENT
app.post('/api/create-booking', async (req, res) => {
  try {
    const { name, email, phone, service, date, time, amount } = req.body;

    const serviceNames = {
      'premium-detailing': 'Premium Detailing',
      'ceramic-coating': 'Ceramic Coating',
      'powder-coating': 'Powder Coating',
    };

    // get service_id from database
    const serviceResult = await pool.query(
      'SELECT service_id FROM services WHERE service_name = $1',
      [serviceNames[service]]
    );

    if (serviceResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Service not found',
      });
    }

    const serviceId = serviceResult.rows[0].service_id;

    // insert booking to database
    const bookingResult = await pool.query(
      `INSERT INTO bookings (guest_name, guest_email, guest_phone, service_id, booking_date, booking_time, status, total_price)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7)
       RETURNING booking_id`,
      [name, email, phone, serviceId, date, time, amount]
    );

    const bookingId = bookingResult.rows[0].booking_id;

    // xendit invoice
    const { Invoice } = xenditClient;
    const invoice = await Invoice.createInvoice({
      data: {
        externalId: `booking-${bookingId}`,
        amount: amount,
        payerEmail: email,
        description: `Herco Detailing Garage - ${serviceNames[service]}`,
        customer: {
          givenNames: name,
          email: email,
          mobileNumber: phone,
        },
        invoiceDuration: 86400,
      },
    });

    res.json({
      success: true,
      booking_id: bookingId,
      payment_url: invoice.invoiceUrl,
    });
  } catch (error) {
    console.error('Booking error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = app;
