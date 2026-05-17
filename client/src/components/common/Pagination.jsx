// pagination component
function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  const btnBase = "px-4 py-2 border rounded-xl text-sm font-bold cursor-pointer transition-all duration-200 flex items-center justify-center min-w-[40px]";
  const btnActive = "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20";
  const btnInactive = "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-indigo-500/50 hover:text-indigo-600 dark:hover:text-indigo-400";

  return (
    <div className="flex justify-center items-center gap-2 mt-8 mb-4" id="pagination-controls">
      <button
        className={`${btnBase} ${currentPage === 1 ? 'opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800' : btnInactive}`}
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        ← Prev
      </button>

      {getPageNumbers().map(page => (
        <button
          key={page}
          className={`${btnBase} ${page === currentPage ? btnActive : btnInactive}`}
          onClick={() => onPageChange(page)}
        >
          {page}
        </button>
      ))}

      <button
        className={`${btnBase} ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800' : btnInactive}`}
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        Next →
      </button>
    </div>
  );
}

export default Pagination;
