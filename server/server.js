const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { sanitizeInput, securityHeaders } = require('./middleware/sanitize');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./swagger');

// dotenv config
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000; // default 5000

// middlewares
app.use(securityHeaders()); // added security headers
// console.log("starting middleware"); // debug // added security headers
// console.log("starting middleware");
app.use(cors({
  origin: [process.env.CLIENT_URL || 'http://localhost:5173', 'http://localhost:5174'],
  credentials: true
}));
app.use(express.json());
app.use(sanitizeInput);

// routes
const authRoutes = require('./routes/auth');
const transactionRoutes = require('./routes/transactions');
const analyticsRoutes = require('./routes/analytics');
const userRoutes = require('./routes/users');

// swagger docs route
// todo: maybe change this path if conflicting
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/users', userRoutes);

// test route
app.get('/api/health', (req, res) => {
  // console.log("health check called")
  res.json({ status: 'ok' });
});

// seed route
app.get('/api/seed', async (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    const pool = require('./config/db');
    const sqlPath = path.join(__dirname, '../database/seed_data.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    await pool.query(sql);
    res.json({ message: 'Database seeded successfully with demo data!' });
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
  console.error('error happened:', err);
  res.status(500).json({ message: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`server is running on port ${PORT}`);
});
