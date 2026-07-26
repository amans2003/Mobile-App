import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import Attendance from './pages/Attendance';
import Leaves from './pages/Leaves';
import Payroll from './pages/Payroll';
import Expenses from './pages/Expenses';
import Announcements from './pages/Announcements';

/**
 * AdminLayout - Wraps authenticated pages with Sidebar
 */
const AdminLayout = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-gray-50/50">
      <Sidebar />
      <main className="flex-1 ml-64">{children}</main>
    </div>
  );
};

/**
 * App - Enterprise HRIS Admin Portal with routing
 */
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<Login />} />

          {/* Protected Routes */}
          <Route path="/" element={<ProtectedRoute><AdminLayout><Dashboard /></AdminLayout></ProtectedRoute>} />
          <Route path="/employees" element={<ProtectedRoute><AdminLayout><Employees /></AdminLayout></ProtectedRoute>} />
          <Route path="/attendance" element={<ProtectedRoute><AdminLayout><Attendance /></AdminLayout></ProtectedRoute>} />
          <Route path="/leaves" element={<ProtectedRoute><AdminLayout><Leaves /></AdminLayout></ProtectedRoute>} />
          <Route path="/payroll" element={<ProtectedRoute><AdminLayout><Payroll /></AdminLayout></ProtectedRoute>} />
          <Route path="/expenses" element={<ProtectedRoute><AdminLayout><Expenses /></AdminLayout></ProtectedRoute>} />
          <Route path="/announcements" element={<ProtectedRoute><AdminLayout><Announcements /></AdminLayout></ProtectedRoute>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
