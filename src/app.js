require('dotenv').config();
const express = require('express');
const path = require('path');
const pool = require('./config/database');
const routes = require('./routes/index');

const app = express();

// MIDDLEWARE
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));
app.use('/phosphor', express.static(path.join(__dirname, '../node_modules/@phosphor-icons/web/src')));

// test DATABASE connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection failed:', err.message);
  } else {
    console.log('Database connected at:', res.rows[0].now);
  }
});

// ROUTES
app.use('/api', routes);

module.exports = app;
