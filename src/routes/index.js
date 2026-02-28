const express = require('express');
const router = express.Router();

const servicesRoutes = require('../features/services/routes');
const authRoutes = require('../features/auth/auth.routes');

router.use('/services', servicesRoutes);
router.use('/auth', authRoutes);

module.exports = router;
