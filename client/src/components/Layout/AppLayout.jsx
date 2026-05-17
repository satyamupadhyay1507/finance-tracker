import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

// layout with navbar and content area
function AppLayout() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <Navbar />
      <main className="max-w-[1200px] mx-auto px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}

export default AppLayout;
