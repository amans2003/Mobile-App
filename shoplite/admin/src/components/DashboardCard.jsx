/**
 * DashboardCard - Displays a metric with icon, value, and label
 * Used on the dashboard page for Total Users, Total Products, etc.
 */
const DashboardCard = ({ title, value, icon, color = 'blue' }) => {
  // Color mappings for different card themes
  const colorMap = {
    blue: {
      bg: 'bg-blue-50',
      icon: 'bg-blue-500',
      text: 'text-blue-600',
    },
    green: {
      bg: 'bg-emerald-50',
      icon: 'bg-emerald-500',
      text: 'text-emerald-600',
    },
    purple: {
      bg: 'bg-purple-50',
      icon: 'bg-purple-500',
      text: 'text-purple-600',
    },
    orange: {
      bg: 'bg-orange-50',
      icon: 'bg-orange-500',
      text: 'text-orange-600',
    },
  };

  const colors = colorMap[color] || colorMap.blue;

  return (
    <div
      className={`${colors.bg} rounded-2xl p-6 border border-white/50 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <p className={`text-3xl font-bold ${colors.text}`}>{value}</p>
        </div>
        <div
          className={`w-14 h-14 ${colors.icon} rounded-2xl flex items-center justify-center text-white shadow-lg`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
};

export default DashboardCard;
