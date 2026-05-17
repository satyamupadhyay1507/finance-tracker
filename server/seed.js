const bcrypt = require('bcryptjs');
const pool = require('./config/db');
require('dotenv').config();

// seed script - creates demo users and sample transactions
async function seed() {
  try {
    console.log('Starting seed...');

    // hashing password for all demo users
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    // demo users
    const users = [
      { name: 'Admin User', email: 'admin@demo.com', role: 'admin' },
      { name: 'Regular User', email: 'user@demo.com', role: 'user' },
      { name: 'Read Only User', email: 'readonly@demo.com', role: 'read-only' }
    ];

    for (const u of users) {
      try {
        await pool.execute(
          'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
          [u.name, u.email, hashedPassword, u.role]
        );
        console.log(`Created user: ${u.email} (${u.role})`);
      } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          console.log(`User ${u.email} already exists, skipping.`);
        } else {
          throw err;
        }
      }
    }

    // getting user ids and category ids
    const [userRows] = await pool.execute('SELECT id, email FROM users');
    const userMap = {};
    userRows.forEach(u => { userMap[u.email] = u.id; });

    const [catRows] = await pool.execute('SELECT id, name FROM categories');
    const catMap = {};
    catRows.forEach(c => { catMap[c.name] = c.id; });

    // sample transactions data
    const sampleTransactions = [
      { type: 'income', amount: 5000, category: 'Salary', description: 'Monthly salary', daysAgo: 2 },
      { type: 'income', amount: 1200, category: 'Freelance', description: 'Website project', daysAgo: 10 },
      { type: 'income', amount: 800, category: 'Freelance', description: 'Logo design work', daysAgo: 25 },
      { type: 'income', amount: 5000, category: 'Salary', description: 'Monthly salary', daysAgo: 32 },
      { type: 'income', amount: 300, category: 'Investment', description: 'Stock dividends', daysAgo: 45 },
      { type: 'income', amount: 5000, category: 'Salary', description: 'Monthly salary', daysAgo: 62 },
      { type: 'income', amount: 1500, category: 'Freelance', description: 'App development', daysAgo: 75 },
      { type: 'income', amount: 5000, category: 'Salary', description: 'Monthly salary', daysAgo: 92 },
      { type: 'income', amount: 500, category: 'Investment', description: 'Mutual fund returns', daysAgo: 100 },
      { type: 'income', amount: 5000, category: 'Salary', description: 'Monthly salary', daysAgo: 122 },
      { type: 'income', amount: 2000, category: 'Freelance', description: 'Consulting gig', daysAgo: 140 },
      { type: 'expense', amount: 250, category: 'Food', description: 'Grocery shopping', daysAgo: 1 },
      { type: 'expense', amount: 45, category: 'Transport', description: 'Uber rides', daysAgo: 3 },
      { type: 'expense', amount: 120, category: 'Entertainment', description: 'Concert tickets', daysAgo: 5 },
      { type: 'expense', amount: 89, category: 'Shopping', description: 'New headphones', daysAgo: 8 },
      { type: 'expense', amount: 150, category: 'Bills', description: 'Electricity bill', daysAgo: 12 },
      { type: 'expense', amount: 200, category: 'Health', description: 'Gym membership', daysAgo: 15 },
      { type: 'expense', amount: 350, category: 'Education', description: 'Online course', daysAgo: 20 },
      { type: 'expense', amount: 180, category: 'Food', description: 'Restaurant dinner', daysAgo: 22 },
      { type: 'expense', amount: 60, category: 'Transport', description: 'Gas refill', daysAgo: 28 },
      { type: 'expense', amount: 300, category: 'Shopping', description: 'Clothes shopping', daysAgo: 35 },
      { type: 'expense', amount: 75, category: 'Entertainment', description: 'Movie night', daysAgo: 40 },
      { type: 'expense', amount: 130, category: 'Bills', description: 'Internet bill', daysAgo: 42 },
      { type: 'expense', amount: 220, category: 'Food', description: 'Weekly groceries', daysAgo: 50 },
      { type: 'expense', amount: 95, category: 'Health', description: 'Doctor visit', daysAgo: 55 },
      { type: 'expense', amount: 500, category: 'Education', description: 'Textbooks', daysAgo: 65 },
      { type: 'expense', amount: 170, category: 'Food', description: 'Groceries', daysAgo: 70 },
      { type: 'expense', amount: 80, category: 'Transport', description: 'Bus pass', daysAgo: 80 },
      { type: 'expense', amount: 200, category: 'Entertainment', description: 'Gaming subscription', daysAgo: 85 },
      { type: 'expense', amount: 450, category: 'Shopping', description: 'Electronics', daysAgo: 95 },
      { type: 'expense', amount: 160, category: 'Bills', description: 'Phone bill', daysAgo: 105 },
      { type: 'expense', amount: 280, category: 'Food', description: 'Dining out', daysAgo: 115 },
      { type: 'expense', amount: 100, category: 'Health', description: 'Pharmacy', daysAgo: 125 },
      { type: 'expense', amount: 55, category: 'Transport', description: 'Parking fees', daysAgo: 135 },
      { type: 'expense', amount: 190, category: 'Food', description: 'Grocery run', daysAgo: 145 },
    ];

    // inserting transactions for all demo users
    const targetUsers = ['admin@demo.com', 'user@demo.com', 'readonly@demo.com'];

    for (const email of targetUsers) {
      const userId = userMap[email];
      if (!userId) continue;

      // skip if user already has data
      const [existing] = await pool.execute(
        'SELECT COUNT(*) as cnt FROM transactions WHERE user_id = ?',
        [userId]
      );

      if (existing[0].cnt > 0) {
        console.log(`User ${email} already has transactions, skipping.`);
        continue;
      }

      for (const t of sampleTransactions) {
        const date = new Date();
        date.setDate(date.getDate() - t.daysAgo);
        const dateStr = date.toISOString().split('T')[0];

        const catId = catMap[t.category];
        if (!catId) {
          console.warn(`Category "${t.category}" not found, skipping.`);
          continue;
        }

        await pool.execute(
          'INSERT INTO transactions (user_id, type, amount, category_id, description, date) VALUES (?, ?, ?, ?, ?, ?)',
          [userId, t.type, t.amount, catId, t.description, dateStr]
        );
      }
      console.log(`Inserted ${sampleTransactions.length} transactions for ${email}`);
    }

    console.log('Seed complete!');
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seed();
