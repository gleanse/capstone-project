const express = require('express');
const router = express.Router();
const pool = require('../../config/database');
const bcrypt = require('bcrypt');

// ===========================
// POST /api/auth/signup
// ===========================
router.post('/signup', async (req, res) => {
  try {
    const { name, email, role, password } = req.body;

    // basic validation
    if (!name || !email || !role || !password) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    if (!['admin', 'staff'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
    }

    // check if email already exists
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'Email already in use' });
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // insert user
    const result = await pool.query(
      `INSERT INTO users (name, email, password, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, role`,
      [name, email.toLowerCase(), hashedPassword, role]
    );

    const user = result.rows[0];

    res.json({
      success: true,
      message: 'Account created successfully',
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });

  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  }
});

// ===========================
// POST /api/auth/login
// ===========================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    // find user
    const result = await pool.query(
      'SELECT id, name, email, password, role FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const user = result.rows[0];

    // only admin and staff can login here
    if (!['admin', 'staff'].includes(user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // save session
    req.session.user = {
      id:    user.id,
      name:  user.name,
      email: user.email,
      role:  user.role,
    };

    res.json({
      success:  true,
      message:  'Login successful',
      redirect: '/features/admin/admin.html',
      user: {
        id:    user.id,
        name:  user.name,
        email: user.email,
        role:  user.role,
      },
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  }
});

// ===========================
// GET /api/auth/me
// ===========================
router.get('/me', (req, res) => {
  if (!req.session?.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }
  res.json({ success: true, user: req.session.user });
});

// ===========================
// POST /api/auth/logout
// ===========================
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Logout failed' });
    }
    res.json({ success: true, message: 'Logged out' });
  });
});

module.exports = router;