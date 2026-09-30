const mysql = require('mysql2/promise');
const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config();

let dbHostName = 'localhost';
let dbPortNum = 3306;

function getPoolConfig() {
  const connectionUrl = process.env.MYSQL_URL || process.env.DATABASE_URL;

  if (connectionUrl && (connectionUrl.startsWith('mysql://') || connectionUrl.startsWith('mysql2://'))) {
    try {
      const parsed = new URL(connectionUrl);
      dbHostName = parsed.hostname;
      dbPortNum = Number(parsed.port || 3306);
      const isLocalHost = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
      const useSSL = process.env.DB_SSL === 'true' || (process.env.DB_SSL !== 'false' && !isLocalHost);

      return {
        uri: connectionUrl,
        port: dbPortNum,
        ssl: useSSL ? { rejectUnauthorized: false } : undefined,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 10000,
        connectTimeout: 20000,
        multipleStatements: true
      };
    } catch (e) {
      console.warn('Failed to parse database connection URL:', e.message);
    }
  }

  const rawHost = process.env.MYSQLHOST || process.env.DB_HOST || 'localhost';
  dbHostName = rawHost;
  dbPortNum = Number(process.env.MYSQLPORT || process.env.DB_PORT || 3306);
  const isLocalHost = rawHost === 'localhost' || rawHost === '127.0.0.1';
  const useSSL = process.env.DB_SSL === 'true' || (process.env.DB_SSL !== 'false' && !isLocalHost);

  return {
    host: rawHost,
    user: process.env.MYSQLUSER || process.env.DB_USER || 'root',
    password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || '',
    database: process.env.MYSQLDATABASE || process.env.DB_NAME || 'finance_tracker',
    port: dbPortNum,
    ssl: useSSL ? { rejectUnauthorized: false } : undefined,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
    connectTimeout: 20000,
    multipleStatements: true
  };
}

const poolConfig = getPoolConfig();
let mysqlPool = null;
let mysqlHealthy = false;
let sqliteDb = null;
let lastMysqlError = null;
let isInitializing = false;

// Persistent SQLite file path
const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  try { fs.mkdirSync(dataDir, { recursive: true }); } catch (_) {}
}
const sqliteFilePath = path.join(dataDir, 'finance_tracker.db');

// Save SQLite database to disk
function persistSqlite() {
  if (sqliteDb) {
    try {
      const data = sqliteDb.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(sqliteFilePath, buffer);
    } catch (err) {
      console.warn('Could not persist SQLite database:', err.message);
    }
  }
}

// Initialize SQLite Fallback Database
async function initSqliteEngine() {
  if (sqliteDb) return sqliteDb;

  const SQL = await initSqlJs();
  if (fs.existsSync(sqliteFilePath)) {
    try {
      const fileBuffer = fs.readFileSync(sqliteFilePath);
      sqliteDb = new SQL.Database(fileBuffer);
      console.log('Loaded existing persistent SQLite database');
    } catch (e) {
      console.warn('Could not load SQLite file, creating fresh in-memory database:', e.message);
      sqliteDb = new SQL.Database();
    }
  } else {
    sqliteDb = new SQL.Database();
  }

  // Create tables in SQLite
  sqliteDb.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      icon TEXT DEFAULT 'misc',
      type TEXT DEFAULT 'both'
    );
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      category_id INTEGER NOT NULL,
      description TEXT,
      date TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Default categories
  const catCheck = sqliteDb.exec("SELECT COUNT(*) FROM categories");
  const catCount = catCheck[0]?.values[0]?.[0] || 0;
  if (catCount === 0) {
    sqliteDb.run(`
      INSERT OR IGNORE INTO categories (name, icon, type) VALUES
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
        ('Other', 'other', 'both');
    `);
  }

  // Load and apply seed data if users are empty
  const userCheck = sqliteDb.exec("SELECT COUNT(*) FROM users");
  const userCount = userCheck[0]?.values[0]?.[0] || 0;
  if (userCount === 0) {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('password123', salt);

    sqliteDb.run(`
      INSERT OR IGNORE INTO users (name, email, password, role) VALUES
        ('Admin User', 'admin@demo.com', ?, 'admin'),
        ('Regular User', 'user@demo.com', ?, 'user'),
        ('Read Only User', 'readonly@demo.com', ?, 'read-only');
    `, [hash, hash, hash]);

    // Import seed_data.sql for rich transactions
    const seedPath = path.join(__dirname, '../../database/seed_data.sql');
    if (fs.existsSync(seedPath)) {
      try {
        const rawSql = fs.readFileSync(seedPath, 'utf8');
        const cleaned = rawSql
          .replace(/ON DUPLICATE KEY UPDATE [^;]+/gi, '')
          .replace(/INSERT INTO/gi, 'INSERT OR IGNORE INTO');
        const stmts = cleaned
          .split(';')
          .map(s => s.trim())
          .filter(s => s.length > 0 && !s.startsWith('--'));

        for (const s of stmts) {
          try { sqliteDb.run(s); } catch (_) {}
        }
        console.log('Seeded demo transactions into SQLite fallback');
      } catch (e) {
        console.warn('Could not seed SQLite fallback:', e.message);
      }
    }
  }

  persistSqlite();
  return sqliteDb;
}

// Try connecting to MySQL
async function tryConnectMysql() {
  try {
    if (!mysqlPool) {
      mysqlPool = mysql.createPool(poolConfig);
      mysqlPool.on('error', (err) => {
        console.error('MySQL Pool Error:', err.message);
        mysqlHealthy = false;
        lastMysqlError = err.message;
      });
    }

    const conn = await mysqlPool.getConnection();
    await conn.ping();
    conn.release();
    mysqlHealthy = true;
    lastMysqlError = null;
    console.log(`Connected to MySQL successfully at ${dbHostName}`);
    return true;
  } catch (err) {
    mysqlHealthy = false;
    lastMysqlError = err.message;
    console.warn(`MySQL connection unavailable (${dbHostName}):`, err.message);
    console.log('Running in resilient storage mode (SQLite engine active).');
    return false;
  }
}

// Background attempt every 60 seconds to reconnect to MySQL if down
setInterval(() => {
  if (!mysqlHealthy) {
    tryConnectMysql();
  }
}, 60000);

// SQLite execute helper with SQL dialect translation and safe parameter binding
function executeSqlite(sql, params = []) {
  if (!sqliteDb) throw new Error('SQLite engine not initialized');

  // Translate MySQL-specific syntax to native SQLite syntax
  let cleanSql = sql
    .replace(/DATE_FORMAT\s*\(\s*([a-zA-Z0-9_.]+)\s*,\s*['"][^'"]*['"]\s*\)/gi, 'SUBSTR($1, 1, 7)')
    .replace(/MONTH\s*\(\s*([a-zA-Z0-9_.]+)\s*\)/gi, 'CAST(SUBSTR($1, 6, 2) AS INTEGER)')
    .replace(/YEAR\s*\(\s*([a-zA-Z0-9_.]+)\s*\)/gi, 'CAST(SUBSTR($1, 1, 4) AS INTEGER)')
    .replace(/CURDATE\s*\(\s*\)/gi, "date('now')")
    .replace(/ON DUPLICATE KEY UPDATE [^;]+/gi, '')
    .trim();

  const safeParams = params.map(p => p === undefined ? null : p);
  const isSelect = /^(SELECT|PRAGMA|SHOW)/i.test(cleanSql);

  if (isSelect) {
    const stmt = sqliteDb.prepare(cleanSql);
    if (safeParams.length > 0) {
      stmt.bind(safeParams);
    }
    const rows = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject());
    }
    stmt.free();
    return [rows, []];
  } else {
    sqliteDb.run(cleanSql, safeParams);
    const isInsert = /^INSERT/i.test(cleanSql);
    let insertId = 0;
    let affectedRows = 0;

    if (isInsert) {
      const idRes = sqliteDb.exec("SELECT last_insert_rowid() AS id");
      insertId = idRes[0]?.values[0]?.[0] || 0;
      affectedRows = 1;
    } else {
      const chRes = sqliteDb.exec("SELECT changes() AS affectedRows");
      affectedRows = chRes[0]?.values[0]?.[0] || 0;
    }

    persistSqlite();
    return [{ insertId, affectedRows }, []];
  }
}

// Unified query router
async function query(sql, params = []) {
  if (mysqlHealthy && mysqlPool) {
    try {
      return await mysqlPool.query(sql, params);
    } catch (err) {
      if (err.code === 'PROTOCOL_CONNECTION_LOST' || err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
        mysqlHealthy = false;
        lastMysqlError = err.message;
        console.warn('MySQL disconnected, falling back to SQLite:', err.message);
        await initSqliteEngine();
        return executeSqlite(sql, params);
      }
      throw err;
    }
  }
  await initSqliteEngine();
  return executeSqlite(sql, params);
}

async function execute(sql, params = []) {
  if (mysqlHealthy && mysqlPool) {
    try {
      return await mysqlPool.execute(sql, params);
    } catch (err) {
      if (err.code === 'PROTOCOL_CONNECTION_LOST' || err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
        mysqlHealthy = false;
        lastMysqlError = err.message;
        console.warn('MySQL disconnected, falling back to SQLite:', err.message);
        await initSqliteEngine();
        return executeSqlite(sql, params);
      }
      throw err;
    }
  }
  await initSqliteEngine();
  return executeSqlite(sql, params);
}

async function getConnection() {
  if (mysqlHealthy && mysqlPool) {
    try {
      return await mysqlPool.getConnection();
    } catch (_) {
      mysqlHealthy = false;
    }
  }
  await initSqliteEngine();
  return {
    query: (sql, params) => Promise.resolve(executeSqlite(sql, params)),
    execute: (sql, params) => Promise.resolve(executeSqlite(sql, params)),
    ping: () => Promise.resolve(),
    release: () => {}
  };
}

// Auto-initialize schema in MySQL if available, or SQLite
async function initializeDatabase() {
  if (isInitializing) return { success: true };
  isInitializing = true;

  try {
    const isMysqlOk = await tryConnectMysql();
    if (isMysqlOk) {
      let conn;
      try {
        conn = await mysqlPool.getConnection();
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
        await conn.query(`
          CREATE TABLE IF NOT EXISTS categories (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(50) NOT NULL UNIQUE,
            icon VARCHAR(50) DEFAULT 'misc',
            type ENUM('income', 'expense', 'both') DEFAULT 'both'
          )
        `);
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
        try { await conn.query(`CREATE INDEX idx_transactions_user ON transactions(user_id)`); } catch (_) {}
        try { await conn.query(`CREATE INDEX idx_transactions_date ON transactions(date)`); } catch (_) {}
        try { await conn.query(`CREATE INDEX idx_transactions_type ON transactions(type)`); } catch (_) {}

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
        }

        const [userRows] = await conn.query(`SELECT COUNT(*) as cnt FROM users`);
        if (userRows[0].cnt === 0) {
          const salt = await bcrypt.genSalt(10);
          const hash = await bcrypt.hash('password123', salt);
          await conn.query(`
            INSERT INTO users (name, email, password, role) VALUES
              ('Admin User', 'admin@demo.com', ?, 'admin'),
              ('Regular User', 'user@demo.com', ?, 'user'),
              ('Read Only User', 'readonly@demo.com', ?, 'read-only')
          `, [hash, hash, hash]);
        }
        return { success: true, mode: 'mysql' };
      } catch (err) {
        console.warn('MySQL schema init error, switching to SQLite:', err.message);
      } finally {
        if (conn) conn.release();
      }
    }

    // Fallback to SQLite initialization
    await initSqliteEngine();
    return { success: true, mode: 'sqlite' };
  } finally {
    isInitializing = false;
  }
}

// Kick off initialization immediately
initializeDatabase().catch(err => {
  console.error('Database initialization fatal error:', err);
});

// Proxy pool export
const pool = {
  query,
  execute,
  getConnection,
  on: (event, handler) => {
    if (mysqlPool) mysqlPool.on(event, handler);
  }
};

module.exports = pool;
module.exports.initializeDatabase = initializeDatabase;
module.exports.getDbStatus = () => ({
  healthy: true,
  mode: mysqlHealthy ? 'mysql' : 'sqlite-resilient',
  mysqlConfiguredHost: dbHostName,
  mysqlPort: dbPortNum,
  mysqlError: lastMysqlError
});