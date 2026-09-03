'use client';

import { useRouter } from 'next/navigation';
import { LogOut, CheckSquare } from 'lucide-react';

interface NavbarProps {
  userEmail?: string;
  onLogoutSuccess?: () => void;
}

export default function Navbar({ userEmail, onLogoutSuccess }: NavbarProps) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      if (onLogoutSuccess) {
        onLogoutSuccess();
      } else {
        router.push('/login');
        router.refresh();
      }
    } catch (err) {
      console.error('Logout failed', err);
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="bg-indigo-600 text-white p-2 rounded-lg shadow-xs">
            <CheckSquare className="w-5 h-5" />
          </div>
          <span className="font-bold text-slate-900 text-lg tracking-tight">Task Board</span>
        </div>

        {userEmail && (
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-slate-600 hidden sm:inline-block">
              {userEmail}
            </span>
            <button
              onClick={handleLogout}
              className="inline-flex items-center space-x-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-md transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
