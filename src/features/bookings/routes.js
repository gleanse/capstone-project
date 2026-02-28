const express = require('express');
const router = express.Router();
const {
  getBookingPage,
  getServiceDetails,
  getAvailability,
  lockBookingSlot,
} = require('./controller');

// API routes
router.get('/service/:serviceId', getServiceDetails);
router.get('/availability/:serviceId', getAvailability);
router.post('/lock', lockBookingSlot);

// PAGE route
router.get('/:serviceId', getBookingPage);

module.exports = router;
