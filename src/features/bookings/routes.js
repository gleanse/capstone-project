const express = require('express');
const path = require('path');
const router = express.Router();
const {
  getBookingPage,
  getServiceDetails,
  getAvailability,
  lockBookingSlot,
  releaseBookingSlot,
  updateBooking,
  createInvoice,
  handleWebhook,
  getBookingDetails,
} = require('./controller');

// STATIC assets
router.get('/booking.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'booking.js'));
});
router.get('/details', getBookingDetails);  
router.get('/success', (req, res) => {
  res.sendFile(path.join(__dirname, 'booking-success.html'));
});
router.get('/failed', (req, res) => {
  res.sendFile(path.join(__dirname, 'booking-failed.html'));
});

// API routes
router.get('/service/:serviceId', getServiceDetails);
router.get('/availability/:serviceId', getAvailability);
router.post('/lock', lockBookingSlot);
router.patch('/release', releaseBookingSlot);
router.post('/pay', createInvoice);
router.post('/webhook', handleWebhook);
router.patch('/:bookingId', updateBooking);

// PAGE route
router.get('/:serviceId', getBookingPage);

module.exports = router;
