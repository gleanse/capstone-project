require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const pool = require('./config/database');
const { apiRouter, pagesRouter } = require('./routes/index');

const app = express();

// MIDDLEWARE
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// SESSION - before static
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'herco-secret-key-change-this',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 8,
    },
  })
);

app.use(express.static(path.join(__dirname, '../public')));
app.use('/styles', express.static(path.join(__dirname, './styles')));
app.use(
  '/phosphor',
  express.static(
    path.join(__dirname, '../node_modules/@phosphor-icons/web/src')
  )
);

// DATABASE test
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection failed:', err.message);
  } else {
    console.log('Database connected at:', res.rows[0].now);
  }
});

// PAGE routes
app.use('/', pagesRouter);

// API routes
app.use('/api', apiRouter);

module.exports = app;
