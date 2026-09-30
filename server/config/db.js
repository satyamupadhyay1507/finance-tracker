const mysql = require('mysql2/promise');
require('dotenv').config();

function getPoolConfig() {
  const connectionUrl = process.env.MYSQL_URL || process.env.DATABASE_URL;

  if (connectionUrl && (connectionUrl.startsWith('mysql://') || connectionUrl.startsWith('mysql2://'))) {
    try {
      const parsed = new URL(connectionUrl);
      const isLocalHost = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
      const useSSL = process.env.DB_SSL === 'true' || (process.env.DB_SSL !== 'false' && !isLocalHost);

      return {
        uri: connectionUrl,
        ssl: useSSL ? { rejectUnauthorized: false } : undefined,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 10000,
        connectTimeout: 30000,
        multipleStatements: true,
        _host: parsed.hostname,
        _isUrl: true
      };
    } catch (e) {
      console.warn('Failed to parse database connection URL, falling back to individual parameters:', e.message);
    }
  }

  // Resolve host: check MYSQLHOST, DB_HOST, or default to localhost
  const rawHost = process.env.MYSQLHOST || process.env.DB_HOST || 'localhost';
  const isLocalHost = rawHost === 'localhost' || rawHost === '127.0.0.1';
  // If not local, enable SSL unless explicitly turned off with DB_SSL=false
  const useSSL = process.env.DB_SSL === 'true' || (process.env.DB_SSL !== 'false' && !isLocalHost);

  return {
    host: rawHost,
    user: process.env.MYSQLUSER || process.env.DB_USER || 'root',
    password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || '',
    database: process.env.MYSQLDATABASE || process.env.DB_NAME || 'finance_tracker',
    port: Number(process.env.MYSQLPORT || process.env.DB_PORT || 3306),
    ssl: useSSL ? { rejectUnauthorized: false } : undefined,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
    connectTimeout: 30000,
    multipleStatements: true,
    _host: rawHost,
    _isUrl: false
  };
}

const poolConfig = getPoolConfig();
const pool = mysql.createPool(poolConfig);

pool.on('error', (err) => {
  console.error('MySQL Pool Error:', err.message);
});

// Auto-initialize tables, indexes, default categories, and demo users
async function initializeDatabase() {
  let conn;
  try {
    conn = await pool.getConnection();
    console.log(`Connected to MySQL successfully at ${poolConfig._host || 'host'}`);

    // Create users table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(150) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin', 'user', 'read-only') DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create categories table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(50) NOT NULL UNIQUE,
        icon VARCHAR(50) DEFAULT 'misc',
        type ENUM('income', 'expense', 'both') DEFAULT 'both'
      )
    `);

    // Create transactions table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        type ENUM('income', 'expense') NOT NULL,
        amount DECIMAL(12,2) NOT NULL,
        category_id INT NOT NULL,
        description VARCHAR(255),
        date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES categories(id)
      )
    `);

    // Add indexes safely if they don't already exist
    try { await conn.query(`CREATE INDEX idx_transactions_user ON transactions(user_id)`); } catch (_) {}
    try { await conn.query(`CREATE INDEX idx_transactions_date ON transactions(date)`); } catch (_) {}
    try { await conn.query(`CREATE INDEX idx_transactions_type ON transactions(type)`); } catch (_) {}

    // Seed default categories if table is empty
    const [cats] = await conn.query(`SELECT COUNT(*) as cnt FROM categories`);
    if (cats[0].cnt === 0) {
      await conn.query(`
        INSERT INTO categories (name, icon, type) VALUES
          ('Food', 'food', 'expense'),
          ('Transport', 'transport', 'expense'),
          ('Entertainment', 'entertainment', 'expense'),
          ('Shopping', 'shopping', 'expense'),
          ('Bills', 'bills', 'expense'),
          ('Health', 'health', 'expense'),
          ('Education', 'education', 'expense'),
          ('Salary', 'salary', 'income'),
          ('Freelance', 'freelance', 'income'),
          ('Investment', 'investment', 'income'),
          ('Other', 'other', 'both')
      `);
      console.log('Default categories inserted.');
    }

    // Seed demo accounts if users table is empty
    const [userRows] = await conn.query(`SELECT COUNT(*) as cnt FROM users`);
    if (userRows[0].cnt === 0) {
      const bcrypt = require('bcryptjs');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('password123', salt);

      await conn.query(`
        INSERT INTO users (name, email, password, role) VALUES
          ('Admin User', 'admin@demo.com', ?, 'admin'),
          ('Regular User', 'user@demo.com', ?, 'user'),
          ('Read Only User', 'readonly@demo.com', ?, 'read-only')
      `, [hashedPassword, hashedPassword, hashedPassword]);
      console.log('Default demo accounts created.');
    }

    console.log('Database initialization completed successfully.');
    return { success: true };
  } catch (err) {
    console.error('Database initialization / connection error:', err.message);
    return { success: false, error: err.message };
  } finally {
    if (conn) conn.release();
  }
}

// Initial connection test & schema setup
initializeDatabase();

module.exports = pool;
module.exports.initializeDatabase = initializeDatabase;
module.exports.dbHost = poolConfig._host;