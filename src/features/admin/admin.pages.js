// admin.pages.js — serves HTML pages ONLY (used by pagesRouter)
const express = require('express');
const router  = express.Router();
const path    = require('path');

const PAGES_DIR = path.join(__dirname, 'pages');

router.get('/admin.css',       (req, res) => res.sendFile(path.join(__dirname, 'admin.css')));
router.get('/admin-layout.js', (req, res) => res.sendFile(path.join(__dirname, 'admin-layout.js')));

router.get('/',             (req, res) => res.redirect('/admin/dashboard'));
router.get('/dashboard',    (req, res) => res.sendFile(path.join(PAGES_DIR, 'dashboard.html')));
router.get('/bookings',     (req, res) => res.sendFile(path.join(PAGES_DIR, 'bookings.html')));
router.get('/walkins',      (req, res) => res.sendFile(path.join(PAGES_DIR, 'walkins.html')));
router.get('/services',     (req, res) => res.sendFile(path.join(PAGES_DIR, 'services.html')));
router.get('/availability', (req, res) => res.sendFile(path.join(PAGES_DIR, 'availability.html')));
router.get('/staff',        (req, res) => res.sendFile(path.join(PAGES_DIR, 'staff.html')));
router.get('/payments',     (req, res) => res.sendFile(path.join(PAGES_DIR, 'payments.html')));
router.get('/audit',        (req, res) => res.sendFile(path.join(PAGES_DIR, 'audit.html')));

module.exports = router;