# External Services

## Database — Supabase
- Dashboard: https://supabase.com/dashboard/project/vtcxyktxeplpjgqjefqg
- Used for: production Postgres (via DATABASE_URL)
- Free tier note: pauses after inactivity, just visit dashboard to wake it up
- Only using raw Postgres connection, NOT their Auth/Storage/PostgREST features or any backend services

## Image Storage — Cloudinary
- Dashboard: https://console.cloudinary.com/app/settings/api-keys
- Used for: service images, QR codes (stored under "herco-qr" folder)
- Free tier note: no auto-delete on inactivity, data persists

## Session Store, OTP, & Abuse Prevention — Upstash Redis
- Dashboard: https://console.upstash.com
- Used for:
  1. Session storage (all logged-in users - customer/staff/admin) - see src/app.js UpstashSessionStore
  2. OTP codes for password reset & email change (10 min TTL)
  3. Booking abuse prevention - temporary 2-hour block after 3 cancelled bookings within 1 hour (per IP and per user)
- Free tier note: AUTO-DELETES after 14 days inactivity - recreate if needed, update .env after
- IMPORTANT: if Redis is down/deleted, ALL active user sessions break too, not just booking limits

## Payments — Xendit
- Dashboard: https://dashboard.xendit.co
- Used for: booking payments
- Currently using TEST/sandbox keys
- Webhook URL must be manually set in Xendit dashboard (Settings > Webhooks/Callbacks)
  - Format: {APP_URL}/api/booking/webhook
  - Example: https://carita-solar-darci.ngrok-free.dev/api/booking/webhook
  - IMPORTANT: does NOT auto-sync with .env's APP_URL - if APP_URL changes (new ngrok tunnel, new deploy), update it manually in Xendit's dashboard too, or payment confirmations won't reach the app

## Email — Brevo
- Dashboard: https://app.brevo.com/settings/keys/api
- Used for: booking confirmation emails
- NOTE: Brevo may block API calls from new/unrecognized IPs after the key's initial 30-day "learning phase" ends.
  If emails suddenly stop sending, check for a Brevo security email about a blocked IP and authorize it at:
  Settings > Security > Authorized IPs

## Hosting — Render
- Dashboard: https://dashboard.render.com
- Free tier note: cold starts after 15 min inactivity (30-60s wake time)

## Local Dev Database — Docker
- See docker-compose.yml
- Run: docker compose up -d