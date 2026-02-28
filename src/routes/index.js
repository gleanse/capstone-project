const express = require('express');
const router = express.Router();

// NOTE: mount feature routes here as you build them
// const bookingRoutes = require('../features/booking/routes');
// const authRoutes = require('../features/auth/routes');
const servicesRoutes = require('../features/services/routes');
// const staffRoutes = require('../features/staff/routes');
// const adminRoutes = require('../features/admin/routes');

// EXAMPLE ROUTINGS
// router.use('/bookings', bookingRoutes);
// router.use('/auth', authRoutes);
router.use('/services', servicesRoutes);
// router.use('/staff', staffRoutes);
// router.use('/admin', adminRoutes);

module.exports = router;
