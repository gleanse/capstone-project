const express = require('express');

const {
  isAuth,
  isStaff,
  isAdmin,
  isCustomer,
} = require('../shared/middlewares/auth');
const servicesRoutes = require('../features/services/routes');
const authRoutes = require('../features/auth/auth.routes');
const bookingRoutes = require('../features/bookings/routes');
const adminRoutes = require('../features/admin/admin.routes'); // JSON API only
const adminPages = require('../features/admin/admin.pages'); // HTML pages only
const trackRoutes = require('../features/track/track.routes');

// PAGE router serves HTML pages
const pagesRouter = express.Router();
// NOTE: temporary redirect change this to landing page later
pagesRouter.get('/', (req, res) => {
  res.redirect('/services');
});
pagesRouter.use('/services', servicesRoutes);
pagesRouter.use('/auth', authRoutes);
pagesRouter.use('/booking', bookingRoutes);
pagesRouter.use('/admin', isAdmin, adminPages);
pagesRouter.use('/track', trackRoutes); // PUBLIC routes
// NOTE: temporary might delete later or edit since this is not official routes or will be
pagesRouter.get('/staff/bookings/:referenceCode', (req, res) => {
  res.send('Staff page coming soon');
});

// API router serves JSON data
const apiRouter = express.Router();
apiRouter.use('/services', servicesRoutes);
apiRouter.use('/auth', authRoutes);
apiRouter.use('/booking', bookingRoutes);
apiRouter.use('/admin', isAdmin, adminRoutes);
// TODO: uncomment once built
// apiRouter.use('/staff', isStaff, staffRoutes);
// apiRouter.use('/account', isCustomer, accountRoutes);

module.exports = { apiRouter, pagesRouter };
