import { useEffect, useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import api from '../../api/axios';
import { Trash2, Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'student', department: '' });

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (err) {
      console.error('Failed to fetch users');
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      await api.post('/register', formData);
      setShowModal(false);
      setFormData({ name: '', email: '', password: '', role: 'student', department: '' });
      fetchUsers();
      toast.success('User added successfully');
    } catch (err) {
      toast.error(`Error adding user: ${err.response?.data?.detail || 'Unknown error'}`);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure?')) return;
    try {
      await api.delete(`/users/${id}`);
      setUsers((prev) => prev.filter((u) => u._id !== id));
      toast.success('User deleted');
    } catch (err) {
      toast.error('Failed to delete user');
    }
  };

  return (
    <DashboardLayout title="Manage Users" role="admin">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">All Users</h2>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-blue-700"
        >
          <Plus size={18} /> Add User
        </button>
      </div>

      <div className="bg-white rounded shadow overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 text-gray-600 uppercase text-sm">
            <tr>
              <th className="p-4 border-b">Name</th>
              <th className="p-4 border-b">Email</th>
              <th className="p-4 border-b">Role</th>
              <th className="p-4 border-b">Department</th>
              <th className="p-4 border-b text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user._id} className="hover:bg-gray-50">
                <td className="p-4 border-b font-medium">{user.name}</td>
                <td className="p-4 border-b text-gray-500">{user.email}</td>
                <td className="p-4 border-b">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-bold ${
                      user.role === 'admin'
                        ? 'bg-red-100 text-red-700'
                        : user.role === 'faculty'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-green-100 text-green-700'
                    }`}
                  >
                    {user.role.toUpperCase()}
                  </span>
                </td>
                <td className="p-4 border-b">{user.department || '-'}</td>
                <td className="p-4 border-b text-right">
                  <button onClick={() => handleDelete(user._id)} className="text-red-500 hover:text-red-700">
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96 shadow-xl relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
            <h3 className="text-lg font-bold mb-4">Add New User</h3>
            <form onSubmit={handleAddUser} className="space-y-3">
              <input
                className="w-full border p-2 rounded"
                placeholder="Full Name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              <input
                className="w-full border p-2 rounded"
                placeholder="Email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
              <input
                className="w-full border p-2 rounded"
                placeholder="Password"
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
              <select
                className="w-full border p-2 rounded"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                <option value="student">Student</option>
                <option value="faculty">Faculty</option>
                <option value="admin">Admin</option>
              </select>
              {formData.role !== 'admin' && (
                <input
                  className="w-full border p-2 rounded"
                  placeholder="Department (e.g., CSE)"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                />
              )}
              <button className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 font-medium">
                Create Account
              </button>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default ManageUsers;
