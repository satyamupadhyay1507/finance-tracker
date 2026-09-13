const mysql = require('mysql2/promise');
require('dotenv').config();

const isLocal = !process.env.DB_HOST || process.env.DB_HOST === 'localhost' || process.env.DB_HOST === '127.0.0.1';
const useSSL = process.env.DB_SSL === 'true' || (process.env.DB_SSL !== 'false' && !isLocal && (process.env.MYSQLHOST || (process.env.DB_HOST && !isLocal)));

// creating connection pool for mysql
const pool = mysql.createPool({
  host: process.env.MYSQLHOST || process.env.DB_HOST || 'localhost',
  user: process.env.MYSQLUSER || process.env.DB_USER || 'root',
  password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || '',
  database: process.env.MYSQLDATABASE || process.env.DB_NAME || 'finance_tracker',
  port: process.env.MYSQLPORT || process.env.DB_PORT || 3306,
  ssl: useSSL ? { rejectUnauthorized: false } : undefined,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  multipleStatements: true
});

// checking if db is connected or not
pool.getConnection()
  .then(conn => {
    console.log('MySQL connected successfully');
    conn.release();
  })
  .catch(err => {
    console.error('MySQL connection failed:', err.message);
  });

module.exports = pool;