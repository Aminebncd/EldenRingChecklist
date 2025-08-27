import { Link, useNavigate } from 'react-router-dom';

export default function Navbar() {
  const nav = useNavigate();
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return (
    <header className="sticky top-0 z-10 backdrop-blur border-b border-zinc-800 bg-zinc-950/70">
      <div className="max-w-6xl mx-auto p-3 flex items-center gap-3">
        <Link to="/" className="font-semibold">elden ring — checklist</Link>
        <div className="ml-auto flex items-center gap-2">
          {token ? (
            <button
              className="btn"
              onClick={() => {
                localStorage.removeItem('token');
                nav('/');
              }}
            >
              logout
            </button>
          ) : (
            <Link className="btn" to="/login">login</Link>
          )}
        </div>
      </div>
    </header>
  );
}
