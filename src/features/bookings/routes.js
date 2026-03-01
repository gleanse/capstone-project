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
} = require('./controller');

// STATIC assets
router.get('/booking.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'booking.js'));
});

// API routes
router.get('/service/:serviceId', getServiceDetails);
router.get('/availability/:serviceId', getAvailability);
router.post('/lock', lockBookingSlot);
router.patch('/release', releaseBookingSlot);
router.patch('/:bookingId', updateBooking);

// PAGE route
router.get('/:serviceId', getBookingPage);

module.exports = router;
