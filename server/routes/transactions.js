const express = require('express');
const router = express.Router();
const {
  getTransactions,
  getTransaction,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getCategories,
  transactionValidation
} = require('../controllers/transactionController');
const { verifyToken } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { transactionLimiter } = require('../middleware/rateLimiter');

// all routes need login
router.use(verifyToken);
router.use(transactionLimiter);

// anyone can view
router.get('/categories', getCategories);
router.get('/', getTransactions);
router.get('/:id', getTransaction);

// only admin and user can add/edit/delete (not read-only)
router.post('/', authorize('admin', 'user'), transactionValidation, createTransaction);
router.put('/:id', authorize('admin', 'user'), transactionValidation, updateTransaction);
router.delete('/:id', authorize('admin', 'user'), deleteTransaction);

module.exports = router;
