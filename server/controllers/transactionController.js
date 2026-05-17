const { body, validationResult } = require('express-validator');
const Transaction = require('../models/Transaction');
const { invalidateUserCache } = require('../utils/cacheHelper');

const transactionValidation = [
  body('type').isIn(['income', 'expense']).withMessage('Type must be income or expense'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('category_id').isInt().withMessage('Category is required'),
  body('date').isDate().withMessage('Valid date is required')
];

// get all transactions
async function getTransactions(req, res) {
  try {
    const userId = req.user.id;
    const { page, limit, type, category_id, search, startDate, endDate, sortBy, sortOrder } = req.query;

    const result = await Transaction.findByUser(userId, {
      page: page || 1,
      limit: limit || 10,
      type,
      category_id,
      search,
      startDate,
      endDate,
      sortBy,
      sortOrder
    });

    res.json(result);
  } catch (err) {
    console.log('error in get transactions', err);
    res.status(500).json({ message: 'Failed to fetch transactions.' });
  }
}

// single transaction
async function getTransaction(req, res) {
  try {
    const transaction = await Transaction.findById(req.params.id, req.user.id);
    if (!transaction) {
      return res.status(404).json({ message: 'not found' });
    }
    res.json({ transaction });
  } catch (err) {
    res.status(500).json({ message: 'error' });
  }
}

// create transaction
async function createTransaction(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // console.log("body is", req.body)

    const { type, amount, category_id, description, date } = req.body;
    const transaction = await Transaction.create({
      user_id: req.user.id,
      type,
      amount,
      category_id,
      description,
      date
    });

    // clear cache because data changed
    await invalidateUserCache(req.user.id);

    res.status(201).json({ message: 'Transaction created', transaction });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create transaction.' });
  }
}

// update
async function updateTransaction(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const existing = await Transaction.findById(req.params.id, req.user.id);
    if (!existing) {
      return res.status(404).json({ message: 'not found' });
    }

    const { type, amount, category_id, description, date } = req.body;
    await Transaction.update(req.params.id, req.user.id, {
      type, amount, category_id, description, date
    });

    // clear cache here too
    await invalidateUserCache(req.user.id);

    res.json({ message: 'updated' });
  } catch (err) {
    res.status(500).json({ message: 'error updating' });
  }
}

// delete
async function deleteTransaction(req, res) {
  try {
    const deleted = await Transaction.delete(req.params.id, req.user.id);
    if (!deleted) {
      return res.status(404).json({ message: 'not found' });
    }

    // clear cache 
    await invalidateUserCache(req.user.id);

    res.json({ message: 'deleted' });
  } catch (err) {
    res.status(500).json({ message: 'error' });
  }
}

// categories
async function getCategories(req, res) {
  try {
    const categories = await Transaction.getCategories();
    res.json({ categories });
  } catch (err) {
    res.status(500).json({ message: 'error' });
  }
}

module.exports = {
  getTransactions,
  getTransaction,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getCategories,
  transactionValidation
};
