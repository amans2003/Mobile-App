import { useAuth } from '../context/AuthContext';

/**
 * Navbar - Top bar showing page title and admin info
 */
const Navbar = ({ title }) => {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="flex items-center justify-between px-8 py-4">
        {/* Page Title */}
        <h2 className="text-xl font-semibold text-gray-800">{title}</h2>

        {/* Admin Info */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-700">{user?.name || 'Admin'}</p>
            <p className="text-xs text-gray-400">{user?.email}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-sm shadow-lg">
            {user?.name?.charAt(0)?.toUpperCase() || 'A'}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
