/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
  // USERS
  pgm.createTable('users', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    name: { type: 'varchar(255)', notNull: true },
    email: { type: 'varchar(255)', notNull: true, unique: true },
    google_id: { type: 'varchar(255)' },
    phone: { type: 'varchar(20)' },
    password: { type: 'varchar(255)' },
    role: { type: 'varchar(50)', default: 'customer' },
    created_at: { type: 'timestamp', default: pgm.func('now()') },
  });

  // SERVICES
  pgm.createTable('services', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    name: { type: 'varchar(255)', notNull: true },
    description: { type: 'text' },
    price: { type: 'decimal(10,2)', notNull: true },
    duration_hours: { type: 'int' },
    image_url: { type: 'varchar(500)' },
    is_active: { type: 'boolean', default: true },
    created_at: { type: 'timestamp', default: pgm.func('now()') },
  });

  // SERVICE VARIANTS
  pgm.createTable('service_variants', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    service_id: { type: 'uuid', references: 'services' },
    name: { type: 'varchar(255)', notNull: true },
    price: { type: 'decimal(10,2)', notNull: true },
    duration_hours: { type: 'int' },
    is_active: { type: 'boolean', default: true },
    created_at: { type: 'timestamp', default: pgm.func('now()') },
  });

  // AVAILABILITY
  pgm.createTable('availability', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    service_id: { type: 'uuid', references: 'services' },
    date: { type: 'date', notNull: true },
    capacity: { type: 'int', notNull: true },
    is_open: { type: 'boolean', default: true },
    created_at: { type: 'timestamp', default: pgm.func('now()') },
  }, {
    constraints: {
      unique: ['service_id', 'date'],
    },
  });

  // CLOSED DATES
  pgm.createTable('closed_dates', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    type: { type: 'varchar(50)', notNull: true },
    day_of_week: { type: 'int' },
    date: { type: 'date' },
    reason: { type: 'varchar(255)' },
    created_at: { type: 'timestamp', default: pgm.func('now()') },
  });
  pgm.addConstraint('closed_dates', 'check_closure_type', {
    check: `
      (type = 'recurring' AND day_of_week IS NOT NULL AND date IS NULL) OR
      (type = 'specific' AND date IS NOT NULL AND day_of_week IS NULL)
    `,
  });

  // BOOKINGS
  pgm.createTable('bookings', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    user_id: { type: 'uuid', references: 'users' },
    service_id: { type: 'uuid', references: 'services' },
    variant_id: { type: 'uuid', references: 'service_variants' },
    availability_id: { type: 'uuid', references: 'availability' },
    guest_name: { type: 'varchar(255)' },
    guest_email: { type: 'varchar(255)' },
    guest_phone: { type: 'varchar(20)' },
    reference_code: { type: 'varchar(20)', unique: true },
    queue_number: { type: 'int' },
    motorcycle_plate: { type: 'varchar(100)' },
    motorcycle_description: { type: 'text' },
    motorcycle_color: { type: 'varchar(100)' },
    motorcycle_model: { type: 'varchar(100)' },
    is_walkin: { type: 'boolean', default: false },
    payment_method: { type: 'varchar(50)', default: 'online' },
    status: { type: 'varchar(50)', default: 'pending' },
    booking_status: { type: 'varchar(50)', default: 'locked' },
    qr_code: { type: 'text' },
    expires_at: { type: 'timestamp' },
    ip_address: { type: 'varchar(45)' },
    updated_by: { type: 'uuid', references: 'users' },
    updated_at: { type: 'timestamp' },
    created_at: { type: 'timestamp', default: pgm.func('now()') },
  });

  // PAYMENTS
  pgm.createTable('payments', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    booking_id: { type: 'uuid', references: 'bookings' },
    xendit_invoice_id: { type: 'varchar(255)' },
    amount: { type: 'decimal(10,2)', notNull: true },
    amount_paid: { type: 'decimal(10,2)', notNull: true },
    remaining_balance: { type: 'decimal(10,2)', default: 0 },
    payment_type: { type: 'varchar(50)', default: 'full' },
    is_fully_paid: { type: 'boolean', default: false },
    status: { type: 'varchar(50)', default: 'unpaid' },
    payment_attempts: { type: 'int', default: 0 },
    paid_at: { type: 'timestamp' },
    created_at: { type: 'timestamp', default: pgm.func('now()') },
  });

  // NOTIFICATIONS
  pgm.createTable('notifications', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    booking_id: { type: 'uuid', references: 'bookings' },
    email: { type: 'varchar(255)', notNull: true },
    type: { type: 'varchar(100)', notNull: true },
    sent_at: { type: 'timestamp', default: pgm.func('now()') },
  });

  // AUDIT LOGS
  pgm.createTable('audit_logs', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    user_id: { type: 'uuid', references: 'users' },
    action: { type: 'varchar(255)', notNull: true },
    target_table: { type: 'varchar(100)' },
    target_id: { type: 'uuid' },
    details: { type: 'text' },
    created_at: { type: 'timestamp', default: pgm.func('now()') },
  });

  // BOOKING STATUS LOGS
  pgm.createTable('booking_status_logs', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    booking_id: { type: 'uuid', references: 'bookings' },
    status: { type: 'varchar(50)', notNull: true },
    changed_by: { type: 'uuid', references: 'users' },
    created_at: { type: 'timestamp', default: pgm.func('now()') },
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.dropTable('booking_status_logs');
  pgm.dropTable('audit_logs');
  pgm.dropTable('notifications');
  pgm.dropTable('payments');
  pgm.dropTable('bookings');
  pgm.dropTable('closed_dates');
  pgm.dropTable('availability');
  pgm.dropTable('service_variants');
  pgm.dropTable('services');
  pgm.dropTable('users');
};