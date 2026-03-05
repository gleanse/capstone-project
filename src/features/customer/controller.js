// CONTROLLER OF CUSTOMER
const path = require('path');
const pool = require('../../config/database');
const bcrypt = require('bcrypt');

const getLoginPage = (req, res) => {
  // redirect to account if already logged in as customer
  if (req.session?.user?.role === 'customer') {
    return res.redirect('/customer/account');
  }
  res.sendFile(path.join(__dirname, 'login.html'));
};

const getRegisterPage = (req, res) => {
  if (req.session?.user?.role === 'customer') {
    return res.redirect('/customer/account');
  }
  res.sendFile(path.join(__dirname, 'register.html'));
};

const getAccountPage = (req, res) => {
  res.sendFile(path.join(__dirname, 'account.html'));
};

const register = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    // validation
    if (!name || name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Name must be at least 2 characters.',
      });
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res
        .status(400)
        .json({ success: false, message: 'Enter a valid email address.' });
    }

    if (!phone || !phone.trim()) {
      return res
        .status(400)
        .json({ success: false, message: 'Phone number is required.' });
    }

    if (!/^09\d{9}$/.test(phone.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Enter a valid PH number (09XXXXXXXXX).',
      });
    }

    if (!password || password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters.',
      });
    }

    // check if email already exists
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [
      email.toLowerCase(),
    ]);
    if (existing.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (name, email, phone, password, role)
       VALUES ($1, $2, $3, $4, 'customer')
       RETURNING id, name, email, phone, role`,
      [name.trim(), email.toLowerCase(), phone.trim(), hashedPassword]
    );

    const user = result.rows[0];

    req.session.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
    };

    res.json({
      success: true,
      message: 'Account created successfully.',
      redirect: '/customer/account',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('Customer register error:', err);
    res
      .status(500)
      .json({ success: false, message: 'Server error: ' + err.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: 'Email and password are required.' });
    }

    const result = await pool.query(
      'SELECT id, name, email, phone, password, role FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res
        .status(401)
        .json({ success: false, message: 'Invalid email or password.' });
    }

    const user = result.rows[0];

    // only customers can login here
    if (user.role !== 'customer') {
      return res
        .status(403)
        .json({ success: false, message: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: 'Invalid email or password.' });
    }

    req.session.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
    };

    res.json({
      success: true,
      message: 'Login successful.',
      redirect: '/customer/account',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('Customer login error:', err);
    res
      .status(500)
      .json({ success: false, message: 'Server error: ' + err.message });
  }
};

const logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res
        .status(500)
        .json({ success: false, message: 'Logout failed.' });
    }
    res.json({ success: true, redirect: '/customer/login' });
  });
};

const getMe = (req, res) => {
  if (!req.session?.user) {
    return res
      .status(401)
      .json({ success: false, message: 'Not authenticated.' });
  }
  res.json({ success: true, user: req.session.user });
};

module.exports = {
  getLoginPage,
  getRegisterPage,
  getAccountPage,
  register,
  login,
  logout,
  getMe,
};
