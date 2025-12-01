import { useEffect, useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { Users, FileText, CheckCircle, Clock } from 'lucide-react';
import api from '../../api/axios';

const AdminDashboard = () => {
  const [stats, setStats] = useState({ students: 0, faculty: 0, reports: 0, pending: 0 });

  useEffect(() => {
    // In a real app, you fetch this from API
    // api.get('/stats').then(res => setStats(res.data));
    setStats({ students: 1240, faculty: 85, reports: 120, pending: 15 }); // Mock
  }, []);

  const cards = [
    { title: 'Total Students', value: stats.students, icon: <Users className="text-blue-600"/>, color: 'bg-blue-50' },
    { title: 'Total Faculty', value: stats.faculty, icon: <Users className="text-green-600"/>, color: 'bg-green-50' },
    { title: 'Reports Submitted', value: stats.reports, icon: <FileText className="text-purple-600"/>, color: 'bg-purple-50' },
    { title: 'Pending Approval', value: stats.pending, icon: <Clock className="text-orange-600"/>, color: 'bg-orange-50' },
  ];

  return (
    <DashboardLayout title="Admin Overview" role="admin">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {cards.map((card, idx) => (
          <div key={idx} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-center space-x-4">
            <div className={`p-3 rounded-full ${card.color}`}>{card.icon}</div>
            <div>
              <p className="text-gray-500 text-sm">{card.title}</p>
              <h3 className="text-2xl font-bold">{card.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity Table (Placeholder) */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 font-bold">Recent Report Submissions</div>
        <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 text-sm">
                <tr>
                    <th className="p-4">Department</th>
                    <th className="p-4">Submitted By</th>
                    <th className="p-4">Date</th>
                    <th className="p-4">Status</th>
                </tr>
            </thead>
            <tbody>
                <tr className="border-t border-gray-50">
                    <td className="p-4">Computer Science</td>
                    <td className="p-4">Dr. Smith (HOD)</td>
                    <td className="p-4">Oct 24, 2025</td>
                    <td className="p-4"><span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">Approved</span></td>
                </tr>
                 <tr className="border-t border-gray-50">
                    <td className="p-4">Mechanical Eng.</td>
                    <td className="p-4">Prof. Doe</td>
                    <td className="p-4">Oct 23, 2025</td>
                    <td className="p-4"><span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">Pending</span></td>
                </tr>
            </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
