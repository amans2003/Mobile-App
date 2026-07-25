import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import UserTable from '../components/UserTable';
import Loader from '../components/Loader';
import { fetchUsers } from '../services/api';

/**
 * Users Page - Display all registered users
 * Admin-only page showing user list with name, email, and join date
 */
const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const { data } = await fetchUsers();
        setUsers(data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch users');
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  return (
    <div>
      <Navbar title="Users" />

      <div className="p-8">
        {/* Header */}
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-800">All Users</h3>
          <p className="text-sm text-gray-400 mt-1">{users.length} registered users</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-4">
            {error}
          </div>
        )}

        {/* User Table or Loader */}
        {loading ? <Loader /> : <UserTable users={users} />}
      </div>
    </div>
  );
};

export default Users;
