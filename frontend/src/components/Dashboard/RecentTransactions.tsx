// src/components/Dashboard/RecentTransactions.tsx
import React, { useMemo, ChangeEvent, useEffect, useRef } from 'react';
import { TransactionSortBy, SortOrder } from '../../types/types';
import { useTransactions } from '../../hooks/useTransactions';
import { FaTrashAlt, FaSort, FaSortUp, FaSortDown, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

interface RecentTransactionsProps {
  dataVersion: number;
}

const RecentTransactions: React.FC<RecentTransactionsProps> = ({ dataVersion }) => {
  const {
    transactions, deleteTransaction, loading, error, queryParams,
    setQueryParams, currentPage, totalPages, totalCount, refreshTransactions,
  } = useTransactions(); // Власний екземпляр useTransactions

  const prevDataVersionRef = useRef(dataVersion);

  useEffect(() => {
    // Реагуємо, тільки якщо dataVersion prop дійсно змінився
    if (dataVersion !== prevDataVersionRef.current) {
      console.log("RecentTransactions: dataVersion prop changed from", prevDataVersionRef.current, "to", dataVersion, ". Refreshing its own transactions.");
      refreshTransactions(); // Викликаємо refreshTransactions цього екземпляра хука
    }
    prevDataVersionRef.current = dataVersion; // Оновлюємо ref для наступного порівняння
  }, [dataVersion, refreshTransactions]); // refreshTransactions має бути стабільним

  const categories = useMemo(() => {
    if (!transactions || transactions.length === 0) return [];
    const uniqueCategories = new Set<string>();
    transactions.forEach(t => uniqueCategories.add(t.category));
    return Array.from(uniqueCategories).sort();
  }, [transactions]);

  const handleFilterChange = (e: ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setQueryParams({ [name]: value === '' ? undefined : value });
  };

  const handleSort = (field: TransactionSortBy) => {
    let newSortOrder: SortOrder = 'ASC';
    if (queryParams.sortBy === field) {
      if (queryParams.sortOrder === 'ASC') newSortOrder = 'DESC';
      else { setQueryParams({ sortBy: 'transactionDate', sortOrder: 'DESC' }); return; }
    }
    setQueryParams({ sortBy: field, sortOrder: newSortOrder });
  };

  const getSortIcon = (field: TransactionSortBy) => {
    if (queryParams.sortBy !== field) return <FaSort className="inline ml-1 text-gray-400" />;
    if (queryParams.sortOrder === 'ASC') return <FaSortUp className="inline ml-1 text-indigo-600" />;
    return <FaSortDown className="inline ml-1 text-indigo-600" />;
  };

  const formatDate = (dateString: string | Date): string => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return String(dateString || 'Invalid Date');
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const handleDeleteClick = async (id: string, category: string, amount: number) => {
    if (window.confirm(`Are you sure you want to delete the transaction for "${category}" ($${Number(amount).toFixed(2)})?`)) {
      try {
        await deleteTransaction(id);
      } catch (delError: any) {
        console.error('RecentTransactions: Failed to delete transaction:', delError);
        alert(`Error deleting transaction: ${delError.message || 'Unknown error'}`);
      }
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage && !loading) {
      setQueryParams({ page: newPage });
    }
  };
  
  const columnCount = 6;

  // JSX залишається таким самим, як у попередній відповіді
  return (
    <div className="bg-white p-4 md:p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-semibold mb-4 text-gray-700">Transactions List</h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 p-4 border rounded-md bg-gray-50">
        <div>
          <label htmlFor="typeFilter" className="block text-sm font-medium text-gray-700 mb-1">Filter by Type:</label>
          <select
            id="typeFilter" name="type" value={queryParams.type || ''}
            onChange={handleFilterChange} disabled={loading}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100"
          >
            <option value="">All Types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
        </div>
        <div>
          <label htmlFor="categoryFilter" className="block text-sm font-medium text-gray-700 mb-1">Filter by Category:</label>
          <select
            id="categoryFilter" name="category" value={queryParams.category || ''}
            onChange={handleFilterChange} disabled={loading || categories.length === 0}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {error && !loading && (
        <div className="my-4 p-3 bg-red-100 text-red-700 border border-red-300 rounded text-sm">
          <p className="font-semibold">Error:</p>
          <p>{error}</p>
          <button onClick={refreshTransactions} className="mt-2 text-xs font-medium text-blue-600 hover:underline">
            Try to reload
          </button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors" onClick={() => handleSort('transactionDate')}>
                Date {getSortIcon('transactionDate')}
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors" onClick={() => handleSort('category')}>
                Category {getSortIcon('category')}
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors" onClick={() => handleSort('type')}>
                Type {getSortIcon('type')}
              </th>
              <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors" onClick={() => handleSort('amount')}>
                Amount {getSortIcon('amount')}
              </th>
              <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading && transactions.length === 0 ? ( 
              <tr>
                <td colSpan={columnCount} className="text-center py-10 text-gray-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                  Loading transactions...
                </td>
              </tr>
            ) : !loading && transactions.length === 0 && !error ? (
              <tr>
                <td colSpan={columnCount} className="text-center py-10 text-gray-500">
                  {queryParams.type || queryParams.category ? 'No transactions match your current filters.' : 'No transactions recorded yet.'}
                </td>
              </tr>
            ) : (
              transactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{formatDate(transaction.transactionDate)}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate" title={transaction.description}>{transaction.description || '-'}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{transaction.category}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        transaction.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {transaction.type}
                    </span>
                  </td>
                  <td className={`px-4 py-3 whitespace-nowrap text-sm text-right font-medium ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                    {transaction.type === 'income' ? '+' : '-'}${Number(transaction.amount).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center text-sm font-medium">
                    <button
                      onClick={() => handleDeleteClick(transaction.id, transaction.category, transaction.amount)}
                      className="text-red-500 hover:text-red-700 disabled:text-gray-400 transition-colors p-1"
                      title="Delete transaction"
                      disabled={loading} 
                    >
                      <FaTrashAlt size="1em" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!loading && totalCount > 0 && totalPages > 1 && !error && (
        <div className="mt-6 flex flex-col sm:flex-row justify-between items-center text-sm text-gray-700">
          <div className="mb-2 sm:mb-0">
            Page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{totalPages}</span>
            <span className="mx-2">|</span>
            Total <span className="font-medium">{totalCount}</span> transactions
          </div>
          <div className="flex">
            <button 
              onClick={() => handlePageChange(currentPage - 1)} 
              disabled={currentPage === 1 || loading}
              className="px-3 py-1.5 border rounded-l-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              <FaChevronLeft size="0.8em" className="mr-1" /> Previous
            </button>
            <button 
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages || loading}
              className="px-3 py-1.5 border-t border-b border-r rounded-r-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              Next <FaChevronRight size="0.8em" className="ml-1" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecentTransactions;