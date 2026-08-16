const express = require('express');
const path = require('path');
const router = express.Router();

router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'landing.html'));
});

// STATIC assets
router.get('/landing.css', (req, res) => {
  res.sendFile(path.join(__dirname, 'landing.css'));
});

router.get('/landing.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'landing.js'));
});

module.exports = router;
