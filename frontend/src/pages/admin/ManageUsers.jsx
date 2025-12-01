import { useEffect, useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { Users as UsersIcon, Trash2, Edit, UserPlus } from 'lucide-react';
import api from '../../api/axios';

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'faculty', department: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setForm({ name: '', email: '', password: '', role: 'faculty', department: '' });
    setShowAdd(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // call register endpoint which hashes password server-side
      const payload = { ...form };
      const res = await api.post('/register', payload);
      window.alert('User added successfully');
      setShowAdd(false);
      fetchUsers();
    } catch (err) {
      console.error('Add user error', err);
      const msg = err?.response?.data?.detail || err.message || 'Error adding user';
      window.alert(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await api.delete(`/users/${id}`);
      window.alert('User deleted');
      fetchUsers();
    } catch (err) {
      console.error('Delete error', err);
      window.alert('Delete failed');
    }
  };

  const getRoleBadge = (role) => {
    const colors = {
      admin: 'bg-red-100 text-red-700',
      faculty: 'bg-blue-100 text-blue-700',
      student: 'bg-green-100 text-green-700',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${colors[role]}`}>
        {role.toUpperCase()}
      </span>
    );
  };

  return (
    <DashboardLayout title="Manage Users" role="admin">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">User Management</h2>
          <p className="text-gray-600">Manage all users in the system</p>
        </div>
        <button onClick={openAdd} className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
          <UserPlus size={20} />
          <span>Add New User</span>
        </button>
      </div>

      {loading ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500">Loading users...</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left p-4 text-gray-700 font-semibold">Name</th>
                <th className="text-left p-4 text-gray-700 font-semibold">Email</th>
                <th className="text-left p-4 text-gray-700 font-semibold">Role</th>
                <th className="text-left p-4 text-gray-700 font-semibold">Department</th>
                <th className="text-left p-4 text-gray-700 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold">
                        {user.name.charAt(0)}
                      </div>
                      <span className="font-medium">{user.name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-gray-600">{user.email}</td>
                  <td className="p-4">{getRoleBadge(user.role)}</td>
                  <td className="p-4 text-gray-600">{user.department || '-'}</td>
                  <td className="p-4">
                    <div className="flex items-center space-x-2">
                      <button className="p-2 text-blue-600 hover:bg-blue-50 rounded transition">
                        <Edit size={18} />
                      </button>
                      <button onClick={() => handleDelete(user._id)} className="p-2 text-red-600 hover:bg-red-50 rounded transition">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add User Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4">Add New User</h3>
            <form onSubmit={handleAdd} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input name="name" value={form.name} onChange={handleChange} required className="mt-1 block w-full rounded border-gray-200" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input name="email" type="email" value={form.email} onChange={handleChange} required className="mt-1 block w-full rounded border-gray-200" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <input name="password" type="password" value={form.password} onChange={handleChange} required className="mt-1 block w-full rounded border-gray-200" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Role</label>
                <select name="role" value={form.role} onChange={handleChange} className="mt-1 block w-full rounded border-gray-200">
                  <option value="faculty">Faculty</option>
                  <option value="student">Student</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Department (optional)</label>
                <input name="department" value={form.department} onChange={handleChange} className="mt-1 block w-full rounded border-gray-200" />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 rounded border">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-blue-600 text-white rounded">
                  {submitting ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default ManageUsers;
