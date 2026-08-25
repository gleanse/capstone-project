require('dotenv').config();
const { Client } = require('pg');

async function ensureDatabaseExists() {
  const dbName = process.env.DB_NAME;

  const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: 'postgres',
  });

  await client.connect();
  const res = await client.query(`SELECT 1 FROM pg_database WHERE datname = $1`, [dbName]);

  if (res.rowCount === 0) {
    console.log(`Database "${dbName}" not found — creating it...`);
    await client.query(`CREATE DATABASE "${dbName}"`);
  } else {
    console.log(`Database "${dbName}" already exists.`);
  }

  await client.end();
}

ensureDatabaseExists();