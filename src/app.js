// APP JAVASCRIPT
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const pool = require('./config/database');
const redis = require('./config/redis');
const { apiRouter, pagesRouter } = require('./routes/index');

const app = express();

// MIDDLEWARE
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// custom session store using @upstash/redis
class UpstashSessionStore extends session.Store {
  async get(sid, cb) {
    try {
      const data = await redis.get(`sess:${sid}`);
      if (!data) return cb(null, null);
      cb(null, typeof data === 'string' ? JSON.parse(data) : data);
    } catch (err) {
      cb(err);
    }
  }

  async set(sid, sessionData, cb) {
    try {
      const ttl = sessionData.cookie?.maxAge
        ? Math.floor(sessionData.cookie.maxAge / 1000)
        : 60 * 60 * 8;
      await redis.set(`sess:${sid}`, JSON.stringify(sessionData), { ex: ttl });
      cb(null);
    } catch (err) {
      cb(err);
    }
  }

  async destroy(sid, cb) {
    try {
      await redis.del(`sess:${sid}`);
      cb(null);
    } catch (err) {
      cb(err);
    }
  }
}

// SESSION
app.use(
  session({
    store: new UpstashSessionStore(),
    secret: process.env.SESSION_SECRET || 'herco-secret-key-change-this',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
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
