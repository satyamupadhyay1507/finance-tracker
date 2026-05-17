import { useState, useEffect, useCallback, useMemo } from 'react';
import { fetchTransactions, fetchCategories, createTransaction, updateTransaction, deleteTransaction } from '../services/dataService';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/common/Modal';
import Pagination from '../components/common/Pagination';
import { List } from 'react-window';

// transactions page
function TransactionsPage() {
  const { canEdit } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({ type: '', category_id: '', search: '', startDate: '', endDate: '' });
  const [showModal, setShowModal] = useState(false);
  const [editingTx, setEditingTx] = useState(null);
  const [formData, setFormData] = useState({ type: 'expense', amount: '', category_id: '', description: '', date: new Date().toISOString().split('T')[0] });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { loadCategories(); }, []);
  useEffect(() => { loadTransactions(); }, [page, filters]);

  async function loadCategories() {
    try { setCategories(await fetchCategories()); } catch (err) { console.error('Failed to load categories:', err); }
  }

  // usecallback avoids recreating function on every render
  const loadTransactions = useCallback(async () => {
    try {
      setLoading(true);
      // loading 50 instead of 10 to show virtual scrolling
      const params = { page, limit: 50 };
      if (filters.type) params.type = filters.type;
      if (filters.category_id) params.category_id = filters.category_id;
      if (filters.search) params.search = filters.search;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      const data = await fetchTransactions(params);
      // console.log("got transactions from api", data); // debug
      setTransactions(data.transactions);
      setTotalPages(data.totalPages);
    } catch (err) { console.error('Failed to load transactions:', err); }
    finally { setLoading(false); }
  }, [page, filters]);

  const handleFilterChange = useCallback((field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPage(1);
  }, []);

  const openAddModal = useCallback(() => {
    setEditingTx(null);
    setFormData({ type: 'expense', amount: '', category_id: categories[0]?.id || '', description: '', date: new Date().toISOString().split('T')[0] });
    setFormError('');
    setShowModal(true);
  }, [categories]);

  const openEditModal = useCallback((tx) => {
    setEditingTx(tx);
    setFormData({ type: tx.type, amount: tx.amount, category_id: tx.category_id, description: tx.description, date: tx.date.split('T')[0] });
    setFormError('');
    setShowModal(true);
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setFormError('');
    if (!formData.amount || parseFloat(formData.amount) <= 0) { setFormError('Amount must be greater than 0'); return; }
    if (!formData.category_id) { setFormError('Please select a category'); return; }
    setSubmitting(true);
    try {
      const payload = { ...formData, amount: parseFloat(formData.amount), category_id: parseInt(formData.category_id) };
      if (editingTx) { await updateTransaction(editingTx.id, payload); }
      else { await createTransaction(payload); }
      setShowModal(false);
      loadTransactions();
    } catch (err) {
      // console.log(err); // debugging this took me 2 hours
      setFormError(err.response?.data?.message || 'Failed to save transaction.');
    } finally { setSubmitting(false); }
  }, [formData, editingTx, loadTransactions]);

  const handleDelete = useCallback(async (id) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) return;
    try { await deleteTransaction(id); loadTransactions(); } catch (err) { console.error('Delete failed:', err); }
  }, [loadTransactions]);

  const filteredCategories = useMemo(() => {
    if (!formData.type) return categories;
    return categories.filter(c => c.type === formData.type || c.type === 'both');
  }, [categories, formData.type]);

  const totals = useMemo(() => {
    let inc = 0;
    let exp = 0;
    for (let i = 0; i < transactions.length; i++) {
      if (transactions[i].type === 'income') inc += parseFloat(transactions[i].amount);
      if (transactions[i].type === 'expense') exp += parseFloat(transactions[i].amount);
    }
    return { income: inc, expense: exp };
  }, [transactions]);

  const inputClass = "px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500";

  // virtual scrolling row component
  const Row = ({ index, style }) => {
    const tx = transactions[index];
    return (
      <div style={{ ...style, paddingBottom: '12px' }}>
        <div
          className="flex items-center gap-4 px-6 py-4 rounded-2xl border bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group overflow-hidden relative"
        >
          <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${tx.type === 'income' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
          <div className="flex-1 min-w-0 pl-2">
            <span className="block font-bold text-gray-900 dark:text-white text-base">{tx.description || tx.category_name}</span>
            <span className="text-xs font-medium text-gray-500 mt-1 flex items-center gap-2">
              <span className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider">{tx.category_name}</span>
              {new Date(tx.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
          <div className="flex items-center gap-5 shrink-0">
            <span className={`text-lg font-black tracking-tight ${tx.type === 'income' ? 'text-emerald-500' : 'text-rose-500'}`}>
              {tx.type === 'income' ? '+' : '-'}₹{parseFloat(tx.amount).toLocaleString()}
            </span>
            {canEdit() && (
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 cursor-pointer text-xs font-bold px-3 py-1.5 rounded-lg text-gray-700 dark:text-gray-300 transition-colors" onClick={() => openEditModal(tx)}>Edit</button>
                <button className="bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-500 hover:text-white cursor-pointer text-xs font-bold px-3 py-1.5 rounded-lg text-rose-600 dark:text-rose-400 transition-colors" onClick={() => handleDelete(tx.id)}>Delete</button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div id="transactions-page">
      <div className="flex justify-between items-start mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">Transactions</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium">Manage and view all your financial activity.</p>
          {/* todo: make this mobile responsive later */}
        </div>
        {canEdit() && (
          <button
            className="px-6 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:-translate-y-0.5 transition-all duration-300"
            onClick={openAddModal}
          >
            + Add Transaction
          </button>
        )}
      </div>

      <div className="flex gap-4 mb-6 flex-wrap bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
        <input type="text" placeholder="Search transactions..." value={filters.search} onChange={e => handleFilterChange('search', e.target.value)} className={`${inputClass} flex-1 min-w-[200px]`} />
        <select value={filters.type} onChange={e => handleFilterChange('type', e.target.value)} className={`${inputClass} min-w-[140px]`}>
          <option value="">All Types</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
        <select value={filters.category_id} onChange={e => handleFilterChange('category_id', e.target.value)} className={`${inputClass} min-w-[160px]`}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div className="flex gap-6 mb-6 text-sm font-bold bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl inline-flex">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span className="text-gray-600 dark:text-gray-400">Total Income:</span>
          <span className="text-emerald-500 tracking-tight">₹{totals.income.toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-rose-500"></span>
          <span className="text-gray-600 dark:text-gray-400">Total Expenses:</span>
          <span className="text-rose-500 tracking-tight">₹{totals.expense.toLocaleString()}</span>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] gap-4">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <div className="text-gray-500 font-medium">Loading transactions...</div>
        </div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 border-dashed">
          <div className="text-5xl mb-4">📭</div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No transactions found</h3>
          <p className="text-gray-500 dark:text-gray-400">Try adjusting your filters or add a new transaction.</p>
        </div>
      ) : (
        <div className="mb-6 h-[450px]">
          {/* virtual scrolling list */}
          <List
            style={{ height: 450, width: "100%" }}
            rowCount={transactions.length}
            rowHeight={90}
            rowComponent={Row}
            rowProps={{}}
          />
        </div>
      )}

      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />

      {/* modal logic remains same */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingTx ? 'Edit' : 'Add'}>
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col gap-1.5 mb-4">
            <label className="text-sm">Amount</label>
            <input type="number" step="0.01" value={formData.amount} onChange={e => setFormData(p => ({ ...p, amount: e.target.value }))} required className={inputClass} />
          </div>
          <div className="flex flex-col gap-1.5 mb-4">
            <label className="text-sm">Category</label>
            <select value={formData.category_id} onChange={e => setFormData(p => ({ ...p, category_id: e.target.value }))} required className={inputClass}>
              <option value="">Select</option>
              {filteredCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5 mb-4">
            <label className="text-sm">Description</label>
            <input type="text" value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} className={inputClass} />
          </div>
          <button type="submit" disabled={submitting} className="w-full py-3.5 mt-2 rounded-xl text-white font-bold bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all duration-300">
            {submitting ? 'Saving...' : 'Save Transaction'}
          </button>
        </form>
      </Modal>
    </div>
  );
}

export default TransactionsPage;
