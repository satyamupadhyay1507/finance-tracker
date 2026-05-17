const pool = require('../config/db');

// user model - all database queries related to users
const User = {
  // find user by email (for login)
  async findByEmail(email) {
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    return rows[0] || null;
  },

  // find user by id
  async findById(id) {
    const [rows] = await pool.execute(
      'SELECT id, name, email, role, created_at FROM users WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  },

  // create new user in db
  async create({ name, email, password, role = 'user' }) {
    const [result] = await pool.execute(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, password, role]
    );
    return { id: result.insertId, name, email, role };
  },

  // get all users for admin page
  async findAll() {
    const [rows] = await pool.execute(
      'SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC'
    );
    return rows;
  },

  // update role of a user
  async updateRole(id, role) {
    await pool.execute(
      'UPDATE users SET role = ? WHERE id = ?',
      [role, id]
    );
  },

  // delete a user from db
  async delete(id) {
    await pool.execute('DELETE FROM users WHERE id = ?', [id]);
  }
};

module.exports = User;
