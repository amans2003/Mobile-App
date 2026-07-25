import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import DashboardCard from '../components/DashboardCard';
import Loader from '../components/Loader';
import { fetchProducts } from '../services/api';
import { fetchUserCount } from '../services/api';

/**
 * Dashboard Page - Overview with metric cards
 * Displays Total Users and Total Products counts
 */
const Dashboard = () => {
  const [userCount, setUserCount] = useState(0);
  const [productCount, setProductCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [usersRes, productsRes] = await Promise.all([
          fetchUserCount(),
          fetchProducts(),
        ]);

        setUserCount(usersRes.data.count);
        setProductCount(productsRes.data.length);
      } catch (error) {
        console.error('Dashboard data error:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  if (loading) return <Loader />;

  return (
    <div>
      <Navbar title="Dashboard" />

      <div className="p-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-gray-800">Welcome back! 👋</h3>
          <p className="text-gray-400 mt-1">Here's what's happening with your store today.</p>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <DashboardCard
            title="Total Users"
            value={userCount}
            color="blue"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            }
          />

          <DashboardCard
            title="Total Products"
            value={productCount}
            color="green"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            }
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
