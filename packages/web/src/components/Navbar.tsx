import { Link } from 'react-router-dom';
import Filters from './Filters';

export default function Navbar() {
  return (
    <nav className="p-2 bg-gray-800 flex items-center gap-4">
      <Link to="/">Checklist</Link>
      <Filters />
      <Link to="/login" className="ml-auto">
        Login
      </Link>
    </nav>
  );
}
