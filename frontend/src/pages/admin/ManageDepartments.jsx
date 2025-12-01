import { useEffect, useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { Building2, Plus, Edit, Trash2 } from 'lucide-react';

const ManageDepartments = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      // Mock data - replace with actual API call
      setDepartments([
        { _id: '1', name: 'Computer Science', hod: 'Dr. John Smith', faculty: 25, students: 450 },
        { _id: '2', name: 'Mechanical Engineering', hod: 'Prof. Jane Doe', faculty: 20, students: 380 },
        { _id: '3', name: 'Electrical Engineering', hod: 'Dr. Mike Wilson', faculty: 18, students: 320 },
        { _id: '4', name: 'Civil Engineering', hod: 'Prof. Sarah Brown', faculty: 22, students: 290 },
      ]);
    } catch (error) {
      console.error('Error fetching departments:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout title="Manage Departments" role="admin">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Department Management</h2>
          <p className="text-gray-600">Manage all departments in the institution</p>
        </div>
        <button className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
          <Plus size={20} />
          <span>Add Department</span>
        </button>
      </div>

      {loading ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500">Loading departments...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {departments.map((dept) => (
            <div key={dept._id} className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 hover:shadow-md transition">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <Building2 className="text-blue-600" size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">{dept.name}</h3>
                    <p className="text-sm text-gray-500">HOD: {dept.hod}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="p-2 text-blue-600 hover:bg-blue-50 rounded transition">
                    <Edit size={18} />
                  </button>
                  <button className="p-2 text-red-600 hover:bg-red-50 rounded transition">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="bg-purple-50 p-3 rounded">
                  <p className="text-sm text-gray-600">Faculty</p>
                  <p className="text-2xl font-bold text-purple-700">{dept.faculty}</p>
                </div>
                <div className="bg-green-50 p-3 rounded">
                  <p className="text-sm text-gray-600">Students</p>
                  <p className="text-2xl font-bold text-green-700">{dept.students}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};

export default ManageDepartments;
