const express = require('express');
const path = require('path');
const router = express.Router();
const pool = require('../../config/database');

router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'track.html'));
});

// redirect middleware based on role
router.get('/:referenceCode', async (req, res) => {
  try {
    const { referenceCode } = req.params;

    // verify reference code exists first
    const result = await pool.query(
      'SELECT id FROM bookings WHERE reference_code = $1',
      [referenceCode]
    );

    if (!result.rows.length) {
      return res.redirect(`/track?error=not_found&code=${referenceCode}`);
    }

    const user = req.session?.user;

    // staff or admin (TEMPORARY FOR NOW NEED TO CHANGE LATER STAFF AND ADMIN MIGHT HAVE DIFFERENT ROUTES)
    if (user && ['staff', 'admin'].includes(user.role)) {
      return res.redirect(`/staff/bookings/${referenceCode}`);
    }

    // customer with account their account booking details inside
    if (user && user.role === 'customer') {
      return res.redirect(`/account/bookings/${referenceCode}`);
    }

    // guest or no auth public tracking page
    return res.redirect(`/booking/public/${referenceCode}`);
  } catch (err) {
    console.error('Track route error:', err);
    return res.redirect('/track?error=server');
  }
});

module.exports = router;
