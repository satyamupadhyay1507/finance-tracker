import { useState, useEffect, useMemo } from 'react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  BarChart, Bar
} from 'recharts';
import { fetchSummary, fetchMonthlyOverview, fetchCategoryBreakdown, fetchTrends } from '../services/dataService';
import { useAuth } from '../context/AuthContext';

const COLORS = ['#6366f1','#8b5cf6','#a855f7','#d946ef','#ec4899','#f43f5e','#f97316','#eab308','#22c55e','#14b8a6','#06b6d4'];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// dashboard page
function DashboardPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [monthly, setMonthly] = useState(null);
  const [categories, setCategories] = useState(null);
  const [trends, setTrends] = useState(null);
  const [loading, setLoading] = useState(true);

  // fetched data goes here
  useEffect(() => {
    // parallel fetching is faster
    Promise.all([
      fetchSummary(),
      fetchMonthlyOverview(new Date().getFullYear()),
      fetchCategoryBreakdown(),
      fetchTrends(6)
    ]).then(([s, m, c, t]) => {
      setSummary(s);
      setMonthly(m);
      setCategories(c);
      setTrends(t);
    }).catch(err => {
      console.log("error loading dashboard", err);
    }).finally(() => {
      setLoading(false);
    });
  }, []);

  // useMemo caches the array so it doesnt recompute on every render
  const monthlyData = useMemo(() => {
    if (!monthly?.months) return [];
    return monthly.months.map(m => ({ name: MONTHS[m.month-1], income: m.income, expense: m.expense }));
  }, [monthly]);

  const pieData = useMemo(() => {
    // eslint-disable-next-line
    if (!categories?.categories) return [];
    return categories.categories.map(c => ({ name: c.name, value: c.total, icon: c.icon }));
  }, [categories]);

  const trendData = useMemo(() => {
    if (!trends?.trends) return [];
    return trends.trends.map(t => ({ period: t.period, income: t.income, expense: t.expense }));
  }, [trends]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-4">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        <div className="text-gray-500 dark:text-gray-400 font-medium animate-pulse">Loading your dashboard...</div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Welcome back, <span className="font-semibold text-indigo-600 dark:text-indigo-400">{user?.name}</span></p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        
        <div className="group p-6 rounded-2xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150"></div>
          <div className="flex flex-col relative z-10">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Total Income</span>
            <span className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">₹{summary?.totalIncome?.toLocaleString() || 0}</span>
            <div className="mt-4 flex items-center text-xs font-semibold text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 w-fit px-2 py-1 rounded-md">
              <span className="mr-1">↑</span> Income
            </div>
          </div>
        </div>

        <div className="group p-6 rounded-2xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150"></div>
          <div className="flex flex-col relative z-10">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Total Expenses</span>
            <span className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">₹{summary?.totalExpenses?.toLocaleString() || 0}</span>
            <div className="mt-4 flex items-center text-xs font-semibold text-rose-500 bg-rose-50 dark:bg-rose-500/10 w-fit px-2 py-1 rounded-md">
              <span className="mr-1">↓</span> Expenses
            </div>
          </div>
        </div>

        <div className="group p-6 rounded-2xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150"></div>
          <div className="flex flex-col relative z-10">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Total Balance</span>
            <span className={`text-3xl font-black tracking-tight ${summary?.balance >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-600 dark:text-rose-400'}`}>
              ₹{summary?.balance?.toLocaleString() || 0}
            </span>
            <div className="mt-4 flex items-center text-xs font-semibold text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 w-fit px-2 py-1 rounded-md">
              Current
            </div>
          </div>
        </div>

        <div className="group p-6 rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 dark:from-indigo-900 dark:to-purple-900 shadow-sm border border-gray-800 dark:border-indigo-800 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150"></div>
          <div className="flex flex-col relative z-10">
            <span className="text-sm font-medium text-gray-400 mb-1">Total Transactions</span>
            <span className="text-3xl font-black text-white tracking-tight">{summary?.transactionCount || 0}</span>
            <div className="mt-4 flex items-center text-xs font-semibold text-white bg-white/20 w-fit px-2 py-1 rounded-md backdrop-blur-md">
              All time
            </div>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="p-8 rounded-3xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Monthly Overview</h3>
            <span className="text-xs font-semibold bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full text-gray-600 dark:text-gray-300">This Year</span>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} tickFormatter={(val) => `₹${val}`} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' }}
                cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
              />
              <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '13px' }} />
              <Line type="monotone" dataKey="income" name="Income" stroke="#10b981" strokeWidth={3} dot={false} activeDot={{ r: 6, strokeWidth: 0 }} />
              <Line type="monotone" dataKey="expense" name="Expense" stroke="#f43f5e" strokeWidth={3} dot={false} activeDot={{ r: 6, strokeWidth: 0 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="p-8 rounded-3xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Expense Categories</h3>
            <span className="text-xs font-semibold bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 px-3 py-1 rounded-full">All Time</span>
          </div>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie 
                  data={pieData} 
                  cx="50%" cy="50%" 
                  innerRadius={70} 
                  outerRadius={100} 
                  dataKey="value" 
                  paddingAngle={5}
                  stroke="none"
                >
                  {pieData.map((e,i) => <Cell key={i} fill={COLORS[i%COLORS.length]} />)}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                  formatter={(value) => [`₹${value}`, 'Amount']}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-400 text-sm">
              No expense data available
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
