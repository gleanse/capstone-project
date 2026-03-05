const cron = require('node-cron');
const pool = require('../../config/database');
const redis = require('../../config/redis');

const ABUSE_WINDOW_SECONDS = 60 * 60; // 1 hour window for counting abandons
const ABUSE_BLOCK_SECONDS = 60 * 60 * 2; // 2 hour block
const ABUSE_LIMIT = 3;

const incrementAbuseCounter = async (ip, userId) => {
  try {
    if (ip) {
      const ipKey = `abuse:ip:${ip}`;
      const ipCount = await redis.incr(ipKey);
      if (ipCount === 1) await redis.expire(ipKey, ABUSE_WINDOW_SECONDS);
      if (ipCount >= ABUSE_LIMIT) {
        await redis.set(`block:ip:${ip}`, '1', { ex: ABUSE_BLOCK_SECONDS });
      }
    }

    if (userId) {
      const userKey = `abuse:user:${userId}`;
      const userCount = await redis.incr(userKey);
      if (userCount === 1) await redis.expire(userKey, ABUSE_WINDOW_SECONDS);
      if (userCount >= ABUSE_LIMIT) {
        await redis.set(`block:user:${userId}`, '1', {
          ex: ABUSE_BLOCK_SECONDS,
        });
      }
    }
  } catch (error) {
    console.error('[CRON] Redis increment error:', error.message);
  }
};

const startCronJobs = () => {
  // runs every minute checks for expired locked bookings
  cron.schedule('* * * * *', async () => {
    try {
      const result = await pool.query(
        `UPDATE bookings
         SET booking_status = 'expired'
         WHERE booking_status = 'locked'
         AND expires_at < NOW()
         RETURNING id, ip_address, user_id`
      );

      if (result.rows.length > 0) {
        console.log(`[CRON] Expired ${result.rows.length} locked booking(s)`);

        for (const booking of result.rows) {
          await incrementAbuseCounter(booking.ip_address, booking.user_id);
        }
      }
    } catch (error) {
      console.error('[CRON] Error expiring bookings:', error.message);
    }
  });

  // runs every SUNDAY midnight purges expired bookings older than 30 days
  cron.schedule('0 0 * * 0', async () => {
    try {
      const result = await pool.query(
        `DELETE FROM bookings
         WHERE booking_status = 'expired'
         AND expires_at < NOW() - INTERVAL '30 days'
         RETURNING id`
      );

      if (result.rows.length > 0) {
        console.log(`[CRON] Purged ${result.rows.length} expired booking(s)`);
      }
    } catch (error) {
      console.error('[CRON] Error purging bookings:', error.message);
    }
  });

  console.log('[CRON] Jobs started');
};

module.exports = { startCronJobs, incrementAbuseCounter };
