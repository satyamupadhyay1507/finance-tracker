const pool = require('../config/db');
const { getCache, setCache } = require('../utils/cacheHelper');

// summary data
async function getSummary(req, res) {
  try {
    const userId = req.user.id;
    
    // check cache first
    const cacheKey = `summary_user_${userId}`;
    const cached = await getCache(cacheKey);
    if (cached) {
      return res.json(cached); // return fast
    }

    const [rows] = await pool.execute(
      `SELECT 
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as totalIncome,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as totalExpenses,
        COUNT(*) as transactionCount
       FROM transactions WHERE user_id = ?`,
      [userId]
    );

    const data = {
      totalIncome: parseFloat(rows[0].totalIncome),
      totalExpenses: parseFloat(rows[0].totalExpenses),
      balance: parseFloat(rows[0].totalIncome) - parseFloat(rows[0].totalExpenses),
      transactionCount: rows[0].transactionCount
    };

    // save to cache for 15 mins (900 secs)
    await setCache(cacheKey, data, 900);

    res.json(data);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'error' });
  }
}

// monthly data
async function getMonthlyOverview(req, res) {
  try {
    const userId = req.user.id;
    const year = req.query.year || new Date().getFullYear();

    const [rows] = await pool.execute(
      `SELECT 
        MONTH(date) as month,
        type,
        SUM(amount) as total
       FROM transactions 
       WHERE user_id = ? AND YEAR(date) = ?
       GROUP BY MONTH(date), type
       ORDER BY month`,
      [userId, year]
    );

    const months = [];
    for (let i = 1; i <= 12; i++) {
      const income = rows.find(r => r.month === i && r.type === 'income');
      const expense = rows.find(r => r.month === i && r.type === 'expense');
      months.push({
        month: i,
        income: income ? parseFloat(income.total) : 0,
        expense: expense ? parseFloat(expense.total) : 0
      });
    }

    res.json({ year: parseInt(year), months });
  } catch (err) {
    res.status(500).json({ message: 'error' });
  }
}

// pie chart data
async function getCategoryBreakdown(req, res) {
  try {
    const userId = req.user.id;

    // check cache for categories
    const catCache = `cats_user_${userId}`;
    let cached = await getCache(catCache);
    if(cached) return res.json(cached);

    const [rows] = await pool.execute(
      `SELECT c.name, c.icon, SUM(t.amount) as total, COUNT(t.id) as count
       FROM transactions t
       JOIN categories c ON t.category_id = c.id
       WHERE t.user_id = ? AND t.type = 'expense'
       GROUP BY c.id, c.name, c.icon
       ORDER BY total DESC`,
      [userId]
    );

    const resData = {
      categories: rows.map(r => ({
        name: r.name,
        icon: r.icon,
        total: parseFloat(r.total),
        count: r.count
      }))
    };
    
    // cache for 1 hr (3600)
    await setCache(catCache, resData, 3600);
    res.json(resData);
  } catch (err) {
    res.status(500).json({ message: 'error' });
  }
}

// trends
async function getIncomeVsExpense(req, res) {
  try {
    const userId = req.user.id;
    const months = parseInt(req.query.months) || 6;

    const [rows] = await pool.execute(
      `SELECT 
        DATE_FORMAT(date, '%Y-%m') as period,
        type,
        SUM(amount) as total
       FROM transactions
       WHERE user_id = ? AND date >= DATE_SUB(CURDATE(), INTERVAL ? MONTH)
       GROUP BY period, type
       ORDER BY period`,
      [userId, months]
    );

    const periodsMap = {};
    rows.forEach(r => {
      if (!periodsMap[r.period]) {
        periodsMap[r.period] = { period: r.period, income: 0, expense: 0 };
      }
      periodsMap[r.period][r.type] = parseFloat(r.total);
    });

    res.json({ trends: Object.values(periodsMap) });
  } catch (err) {
    res.status(500).json({ message: 'error' });
  }
}

module.exports = { getSummary, getMonthlyOverview, getCategoryBreakdown, getIncomeVsExpense };
