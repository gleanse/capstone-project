// CUSTOMER ROUTES
const express = require('express');
const router = express.Router();
const path = require('path');
const { isCustomer } = require('../../shared/middlewares/auth');
const {
  getLoginPage,
  getRegisterPage,
  getAccountPage,
  register,
  login,
  logout,
  getMe,
} = require('./controller');

// STATIC ASSETS
router.get('/customer.css', (req, res) => {
  res.sendFile(path.join(__dirname, 'customer.css'));
});

router.get('/customer-auth.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'customer-auth.js'));
});

// PAGE ROUTES
router.get('/login', getLoginPage);
router.get('/register', getRegisterPage);
router.get('/account', isCustomer, getAccountPage);

// API ROUTES
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', getMe);

module.exports = router;