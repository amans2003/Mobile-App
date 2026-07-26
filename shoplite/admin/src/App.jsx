import { useState } from 'react';
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
 * AdminLayout — Fully Responsive Executive Layout
 * Uses deep slate-900 navigation coupled with clean white data containers on a neutral background.
 */
const AdminLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-800 font-sans antialiased overflow-x-hidden">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col min-w-0 lg:ml-64 transition-all duration-200">
        {/* Responsive Mobile / Tablet Header Bar (slate-900) */}
        <header className="sticky top-0 z-30 lg:hidden bg-slate-900 text-white px-4 py-3 flex items-center justify-between shadow-md border-b border-slate-800">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-black text-sm active:scale-95 transition-all"
              aria-label="Open navigation menu"
            >
              ☰
            </button>
            <span className="text-xs font-black uppercase tracking-wider text-white">Enterprise HRIS</span>
          </div>
          <span className="text-[11px] font-black px-2.5 py-1 rounded bg-white text-slate-900">ADMIN</span>
        </header>

        {/* Structured Content Area */}
        <main className="flex-1 p-3 sm:p-5 md:p-6 w-full max-w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

/**
 * App — Enterprise HRIS Portal with responsive routing
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
