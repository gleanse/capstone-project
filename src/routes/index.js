const express = require('express');

const auth = require('../shared/middlewares/auth');
const servicesRoutes = require('../features/services/routes');
const authRoutes = require('../features/auth/auth.routes');
const bookingRoutes = require('../features/bookings/routes');
// const adminRoutes = require('../features/admin/admin.routes');

// PAGE router serves HTML pages
const pagesRouter = express.Router();
// NOTE: temporary redirect change this to landing page later
pagesRouter.get('/', (req, res) => {
  res.redirect('/services');
});
pagesRouter.use('/services', servicesRoutes);
pagesRouter.use('/auth', authRoutes);
pagesRouter.use('/booking', bookingRoutes);
// pagesRouter.use('/admin', auth, adminRoutes);

// API router serves JSON data
const apiRouter = express.Router();
apiRouter.use('/services', servicesRoutes);
apiRouter.use('/auth', authRoutes);
apiRouter.use('/booking', bookingRoutes);
// apiRouter.use('/admin', auth, adminRoutes);

module.exports = { apiRouter, pagesRouter };
