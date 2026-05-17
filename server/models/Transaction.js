const pool = require('../config/db');

// transaction model - handles all transaction related db queries
const Transaction = {
  // getting transactions with filters and pagination
  async findByUser(userId, { page = 1, limit = 10, type, category_id, search, startDate, endDate, sortBy = 'date', sortOrder = 'DESC' }) {
    let query = `SELECT t.*, c.name as category_name, c.icon as category_icon 
                 FROM transactions t 
                 JOIN categories c ON t.category_id = c.id 
                 WHERE t.user_id = ?`;
    let countQuery = 'SELECT COUNT(*) as total FROM transactions t WHERE t.user_id = ?';
    let params = [userId];
    let countParams = [userId];

    // adding filters if they exist
    if (type) {
      query += ' AND t.type = ?';
      countQuery += ' AND t.type = ?';
      params.push(type);
      countParams.push(type);
    }

    if (category_id) {
      query += ' AND t.category_id = ?';
      countQuery += ' AND t.category_id = ?';
      params.push(category_id);
      countParams.push(category_id);
    }

    if (search) {
      query += ' AND t.description LIKE ?';
      countQuery += ' AND t.description LIKE ?';
      const searchTerm = `%${search}%`;
      params.push(searchTerm);
      countParams.push(searchTerm);
    }

    if (startDate) {
      query += ' AND t.date >= ?';
      countQuery += ' AND t.date >= ?';
      params.push(startDate);
      countParams.push(startDate);
    }

    if (endDate) {
      query += ' AND t.date <= ?';
      countQuery += ' AND t.date <= ?';
      params.push(endDate);
      countParams.push(endDate);
    }

    // sorting - only allowing these columns to be safe
    const allowedSorts = ['date', 'amount', 'created_at'];
    const sort = allowedSorts.includes(sortBy) ? sortBy : 'date';
    const order = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    query += ` ORDER BY t.${sort} ${order}`;

    // pagination calculation
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const offset = (pageNum - 1) * limitNum;
    query += ` LIMIT ${limitNum} OFFSET ${offset}`;

    // using query() instead of execute() because LIMIT needs integer type
    const [rows] = await pool.query(query, params);
    const [countResult] = await pool.query(countQuery, countParams);

    return {
      transactions: rows,
      total: countResult[0].total,
      page: pageNum,
      totalPages: Math.ceil(countResult[0].total / limitNum)
    };
  },

  // get all transactions without pagination (for admin)
  async findAllByUser(userId) {
    const [rows] = await pool.execute(
      `SELECT t.*, c.name as category_name, c.icon as category_icon 
       FROM transactions t 
       JOIN categories c ON t.category_id = c.id 
       WHERE t.user_id = ? 
       ORDER BY t.date DESC`,
      [userId]
    );
    return rows;
  },

  // get single transaction
  async findById(id, userId) {
    const [rows] = await pool.execute(
      `SELECT t.*, c.name as category_name, c.icon as category_icon 
       FROM transactions t 
       JOIN categories c ON t.category_id = c.id 
       WHERE t.id = ? AND t.user_id = ?`,
      [id, userId]
    );
    return rows[0] || null;
  },

  // insert new transaction
  async create({ user_id, type, amount, category_id, description, date }) {
    const [result] = await pool.execute(
      'INSERT INTO transactions (user_id, type, amount, category_id, description, date) VALUES (?, ?, ?, ?, ?, ?)',
      [user_id, type, amount, category_id, description || '', date]
    );
    return { id: result.insertId, user_id, type, amount, category_id, description, date };
  },

  // update existing transaction
  async update(id, userId, { type, amount, category_id, description, date }) {
    await pool.execute(
      'UPDATE transactions SET type = ?, amount = ?, category_id = ?, description = ?, date = ? WHERE id = ? AND user_id = ?',
      [type, amount, category_id, description || '', date, id, userId]
    );
  },

  // delete transaction
  async delete(id, userId) {
    const [result] = await pool.execute(
      'DELETE FROM transactions WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    return result.affectedRows > 0;
  },

  // get all categories for dropdown
  async getCategories() {
    const [rows] = await pool.execute('SELECT * FROM categories ORDER BY name');
    return rows;
  }
};

module.exports = Transaction;
