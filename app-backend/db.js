const { Pool } = require('pg');
const mongoose = require('mongoose');

// PostgreSQL Connection Pool
const pgPool = new Pool({
  connectionString: process.env.POSTGRES_URI,
  // If connecting to AWS RDS from outside, SSL is often required
  ssl: {
    rejectUnauthorized: false // This bypasses strict CA validation for the hackathon
  }
});

// MongoDB Connection
const connectMongo = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};

// Initialize PostgreSQL Tables if they don't exist
const initPostgres = async () => {
  const client = await pgPool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS organizations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        city VARCHAR(100) NOT NULL,
        area VARCHAR(255),
        type VARCHAR(100),
        response_time VARCHAR(50),
        phone VARCHAR(50),
        notification_endpoint VARCHAR(255),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('PostgreSQL tables initialized');
  } catch (err) {
    console.error('Error initializing PostgreSQL tables:', err);
  } finally {
    client.release();
  }
};

module.exports = {
  pgPool,
  connectMongo,
  initPostgres
};
