import { Link, Outlet, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';

export default function App() {
  const loc = useLocation();
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-6xl mx-auto p-4 space-y-6">
        <div className="flex items-center gap-3 text-sm text-zinc-400">
          <Link to="/" className={loc.pathname === '/' ? 'text-white' : ''}>liste</Link>
          <span>·</span>
          <Link to="/stats" className={loc.pathname === '/stats' ? 'text-white' : ''}>stats</Link>
          <span>·</span>
          <Link to="/import" className={loc.pathname === '/import' ? 'text-white' : ''}>import</Link>
          <span>·</span>
          <Link to="/wiki" className={loc.pathname.startsWith('/wiki') ? 'text-white' : ''}>wiki</Link>
        </div>
        <Outlet />
      </main>
    </div>
  );
}
