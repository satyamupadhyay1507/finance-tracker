const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { sanitizeInput, securityHeaders } = require('./middleware/sanitize');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./swagger');
const pool = require('./config/db');
const { initializeDatabase, getDbStatus } = require('./config/db');

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});

process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
});

// dotenv config
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001; // default 5001 (prevents macOS AirPlay port 5000 conflict)

// middlewares
app.use(securityHeaders());
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: false
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(sanitizeInput);

app.get("/", (req, res) => {
  res.send("Backend Working");
});

// routes
const authRoutes = require('./routes/auth');
const transactionRoutes = require('./routes/transactions');
const analyticsRoutes = require('./routes/analytics');
const userRoutes = require('./routes/users');

// swagger docs route
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/users', userRoutes);

// test route with database connection health check
app.get('/api/health', async (req, res) => {
  try {
    const dbInfo = getDbStatus();
    const [userRows] = await pool.query('SELECT COUNT(*) as count FROM users').catch(() => [[{ count: 0 }]]);
    res.json({
      status: 'ok',
      database: dbInfo.mode === 'mysql' ? 'connected' : 'resilient-storage',
      engine: dbInfo.mode,
      configuredDbHost: dbInfo.mysqlConfiguredHost || 'localhost',
      usersCount: userRows[0]?.count || 0
    });
  } catch (err) {
    res.status(503).json({
      status: 'error',
      database: 'disconnected',
      error: err.message,
      code: err.code
    });
  }
});

// seed route: ensures tables and demo data exist
app.get('/api/seed', async (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');

    // 1. Ensure tables, indexes, default categories, and demo accounts exist
    const initResult = await initializeDatabase();
    if (!initResult.success) {
      return res.status(500).json({ error: 'Database initialization failed: ' + initResult.error });
    }

    // 2. Load seed_data.sql if present and execute each statement
    const sqlPath = path.join(__dirname, '../database/seed_data.sql');
    if (fs.existsSync(sqlPath)) {
      const sqlContent = fs.readFileSync(sqlPath, 'utf8');
      const statements = sqlContent
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      let executed = 0;
      for (const statement of statements) {
        try {
          await pool.query(statement);
          executed++;
        } catch (e) {
          if (e.code !== 'ER_DUP_ENTRY') {
            console.warn('Seed statement warning:', e.message);
          }
        }
      }
      res.json({ message: 'Database seeded successfully with demo data!', statementsExecuted: executed });
    } else {
      res.json({ message: 'Database schema and demo users ready!' });
    }
  } catch (err) {
    console.error('Seed error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 404
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// errors
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ message: 'Internal server error', error: err.message });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`server is running on port ${PORT}`);
});
