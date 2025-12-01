import { useEffect, useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { FileText, CheckCircle, XCircle, Clock, Eye } from 'lucide-react';

const ManageReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      // Mock data - replace with actual API call
      setReports([
        { _id: '1', title: 'Annual Research Report 2023', submittedBy: 'Dr. John Smith', department: 'Computer Science', date: '2024-01-15', status: 'pending' },
        { _id: '2', title: 'Faculty Achievements Report', submittedBy: 'Prof. Jane Doe', department: 'Mechanical Engineering', date: '2024-01-14', status: 'approved' },
        { _id: '3', title: 'Student Activities Report Q1', submittedBy: 'Dr. Mike Wilson', department: 'Electrical Engineering', date: '2024-01-13', status: 'pending' },
        { _id: '4', title: 'Infrastructure Development Report', submittedBy: 'Prof. Sarah Brown', department: 'Civil Engineering', date: '2024-01-12', status: 'rejected' },
        { _id: '5', title: 'Academic Performance Analysis', submittedBy: 'Dr. John Smith', department: 'Computer Science', date: '2024-01-11', status: 'approved' },
      ]);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      pending: { icon: Clock, bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pending' },
      approved: { icon: CheckCircle, bg: 'bg-green-100', text: 'text-green-700', label: 'Approved' },
      rejected: { icon: XCircle, bg: 'bg-red-100', text: 'text-red-700', label: 'Rejected' },
    };
    const { icon: Icon, bg, text, label } = config[status];
    return (
      <span className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-semibold ${bg} ${text}`}>
        <Icon size={14} />
        <span>{label}</span>
      </span>
    );
  };

  const filteredReports = filter === 'all' ? reports : reports.filter(r => r.status === filter);

  return (
    <DashboardLayout title="Manage Reports" role="admin">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Report Management</h2>
        <p className="text-gray-600">Review and approve submitted reports</p>
      </div>

      {/* Filter Buttons */}
      <div className="mb-6 flex space-x-2">
        {['all', 'pending', 'approved', 'rejected'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === status
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500">Loading reports...</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left p-4 text-gray-700 font-semibold">Report Title</th>
                <th className="text-left p-4 text-gray-700 font-semibold">Submitted By</th>
                <th className="text-left p-4 text-gray-700 font-semibold">Department</th>
                <th className="text-left p-4 text-gray-700 font-semibold">Date</th>
                <th className="text-left p-4 text-gray-700 font-semibold">Status</th>
                <th className="text-left p-4 text-gray-700 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.map((report) => (
                <tr key={report._id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-4">
                    <div className="flex items-center space-x-3">
                      <FileText className="text-blue-600" size={20} />
                      <span className="font-medium">{report.title}</span>
                    </div>
                  </td>
                  <td className="p-4 text-gray-600">{report.submittedBy}</td>
                  <td className="p-4 text-gray-600">{report.department}</td>
                  <td className="p-4 text-gray-600">{new Date(report.date).toLocaleDateString()}</td>
                  <td className="p-4">{getStatusBadge(report.status)}</td>
                  <td className="p-4">
                    <div className="flex items-center space-x-2">
                      <button className="flex items-center space-x-1 px-3 py-1 text-blue-600 hover:bg-blue-50 rounded transition">
                        <Eye size={16} />
                        <span className="text-sm">View</span>
                      </button>
                      {report.status === 'pending' && (
                        <>
                          <button className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition">
                            Approve
                          </button>
                          <button className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition">
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
};

export default ManageReports;
