const express = require('express');
const router = express.Router();
const { getServices } = require('./controller');

router.get('/', getServices);

module.exports = router;
