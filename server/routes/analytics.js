const express = require('express');
const router = express.Router();
const { getSummary, getMonthlyOverview, getCategoryBreakdown, getIncomeVsExpense } = require('../controllers/analyticsController');
const { verifyToken } = require('../middleware/auth');
const { analyticsLimiter } = require('../middleware/rateLimiter');

// all analytics routes need login
router.use(verifyToken);
router.use(analyticsLimiter);

router.get('/summary', getSummary);
router.get('/monthly', getMonthlyOverview);
router.get('/categories', getCategoryBreakdown);
router.get('/trends', getIncomeVsExpense);

module.exports = router;
