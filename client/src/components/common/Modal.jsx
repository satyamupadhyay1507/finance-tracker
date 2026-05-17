// modal popup component
function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-gray-900/40 dark:bg-black/60 backdrop-blur-md flex items-center justify-center z-[1000] p-5 transition-opacity"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-[500px] rounded-3xl bg-white dark:bg-gray-900 border border-white/20 dark:border-gray-700 shadow-2xl shadow-black/20 dark:shadow-black/40 overflow-hidden transform transition-all animate-modal-in"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center px-8 py-6 bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
          <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">{title}</h3>
          <button 
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer border-none"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        <div className="p-8">
          {children}
        </div>
      </div>
    </div>
  );
}

export default Modal;
