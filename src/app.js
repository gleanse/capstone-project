require('dotenv').config();
const express = require('express');
const pool = require('./config/database');

const app = express();

// MIDDLEWARE
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// test DATABASE connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection failed:', err.message);
  } else {
    console.log('Database connected at:', res.rows[0].now);
  }
});

// ROUTES
app.get('/', (req, res) => {
  res.send('Server is running!!!');
});

module.exports = app;