/**
 * UserTable - Displays user list in a responsive table
 * Shows name, email, and account creation date
 */
const UserTable = ({ users }) => {
  if (users.length === 0) {
    return (
      <div className="text-center py-16">
        <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
        <p className="text-gray-400 text-lg">No users found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-sm">
      <table className="w-full" id="user-table">
        <thead>
          <tr className="bg-gray-50/80">
            <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
            <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
            <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
            <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
            <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Created Date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {users.map((user, index) => (
            <tr
              key={user._id}
              className="hover:bg-blue-50/30 transition-colors duration-150"
            >
              {/* Index */}
              <td className="px-6 py-4 text-sm text-gray-400">{index + 1}</td>

              {/* Name with Avatar */}
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-bold shadow-sm">
                    {user.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <span className="font-medium text-gray-800 text-sm">{user.name}</span>
                </div>
              </td>

              {/* Email */}
              <td className="px-6 py-4 text-sm text-gray-500">{user.email}</td>

              {/* Role */}
              <td className="px-6 py-4">
                <span
                  className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                    user.role === 'admin'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {user.role}
                </span>
              </td>

              {/* Created Date */}
              <td className="px-6 py-4 text-sm text-gray-500">
                {new Date(user.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UserTable;
