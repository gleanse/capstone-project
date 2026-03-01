const cron = require('node-cron');
const pool = require('../../config/database');

const startCronJobs = () => {
  // runs every minute checks for expired locked bookings
  cron.schedule('* * * * *', async () => {
    try {
      const result = await pool.query(
        `UPDATE bookings
         SET booking_status = 'expired'
         WHERE booking_status = 'locked'
         AND expires_at < NOW()
         RETURNING id`
      );

      if (result.rows.length > 0) {
        console.log(`[CRON] Expired ${result.rows.length} locked booking(s)`);
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

module.exports = { startCronJobs };
