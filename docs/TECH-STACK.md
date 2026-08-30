# Tech Stack

## Core

- **Node.js + Express** - backend runtime and web framework
- **PostgreSQL** - primary database (native locally, Supabase in production - see [`EXTERNAL-SERVICES.md`](EXTERNAL-SERVICES.md))
- **node-pg-migrate** - schema migrations
- **Docker Compose** - containerizes both the app and Postgres for local dev (see [`SETUP.md`](SETUP.md) for the native vs. Docker setup options)
- **Upstash Redis** - session storage, OTP codes, and booking abuse prevention (see [`EXTERNAL-SERVICES.md`](EXTERNAL-SERVICES.md))
- **Tailwind CSS v4** - styling

## Supporting libraries

- **bcrypt** - password hashing and comparison, used across auth, admin, and customer account flows
- **qrcode** - generates the QR code for each walk-in booking, linking to the staff scan page used to look up that booking
- **pdfkit** - generates the downloadable PDF booking reference slip (customer info, service, payment breakdown)
- **node-cron** - runs two scheduled jobs (see `src/shared/utils/cron.js`):
  - Every minute: expires stale "locked" bookings and feeds abandoned ones into the Redis abuse-prevention counters
  - Weekly (Sunday midnight): purges expired bookings older than 30 days
- **GSAP** - landing page animation. Used sparingly and kept lean to stay performant on low-end devices; may be extended later but intentionally not used to animate everything
- **express-session** - session middleware, backed by the Redis session store
- **dotenv** - loads `.env` configuration