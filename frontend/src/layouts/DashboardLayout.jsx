import { useNavigate } from 'react-router-dom';
import { LogOut, LayoutDashboard, Users, FileText } from 'lucide-react';

const DashboardLayout = ({ title, role, children }) => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  // Define sidebar links based on role
  const getLinks = () => {
    if (role === 'admin') return [
      { name: 'Dashboard', icon: <LayoutDashboard size={20}/>, path: '/admin' },
      { name: 'Users', icon: <Users size={20}/>, path: '/admin/users' },
      { name: 'Departments', icon: <FileText size={20}/>, path: '/admin/departments' },
      { name: 'Reports', icon: <FileText size={20}/>, path: '/admin/reports' },
    ];
    if (role === 'faculty') return [
      { name: 'Dashboard', icon: <LayoutDashboard size={20}/>, path: '/faculty' },
      { name: 'Verify Data', icon: <FileText size={20}/>, path: '/faculty/verify' },
    ];
    return [
      { name: 'Dashboard', icon: <LayoutDashboard size={20}/>, path: '/student' },
      { name: 'Achievements', icon: <FileText size={20}/>, path: '/student/achievements' },
    ];
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-4 text-xl font-bold border-b border-slate-700">
          AnnualReport<span className="text-blue-400">Portal</span>
        </div>
        <div className="flex-1 p-4 space-y-2">
          {getLinks().map((link) => (
            <div 
              key={link.name} 
              onClick={() => navigate(link.path)}
              className="flex items-center space-x-3 p-3 hover:bg-slate-800 rounded cursor-pointer"
            >
              {link.icon}
              <span>{link.name}</span>
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-slate-700">
          <button onClick={handleLogout} className="flex items-center space-x-2 text-red-400 hover:text-red-300">
            <LogOut size={20} /> <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <header className="bg-white shadow p-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-800">{title}</h1>
          <div className="flex items-center space-x-3">
             <div className="text-right">
                <p className="text-sm font-bold">{user?.name}</p>
                <p className="text-xs text-gray-500 uppercase">{user?.role}</p>
             </div>
             <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold">
                {user?.name?.charAt(0)}
             </div>
          </div>
        </header>
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
