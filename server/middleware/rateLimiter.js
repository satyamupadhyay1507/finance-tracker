const rateLimit = require('express-rate-limit');

// rate limiter for login/register - 5 attempts per 15 min
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { message: 'Too many requests. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false
});

// rate limiter for transactions - 100 per hour
const transactionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 100,
  message: { message: 'Rate limit exceeded. Try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

// rate limiter for analytics - 50 per hour
const analyticsLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 50,
  message: { message: 'Rate limit exceeded for analytics. Try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = { authLimiter, transactionLimiter, analyticsLimiter };
