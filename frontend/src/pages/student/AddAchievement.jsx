import { useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import api from '../../api/axios';
import { UploadCloud } from 'lucide-react';
import toast from 'react-hot-toast';

const AddAchievement = () => {
  const [formData, setFormData] = useState({ title: '', date: '', category: 'Academic', description: '' });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const data = new FormData();
    data.append('title', formData.title);
    data.append('event_date', formData.date);
    data.append('category', formData.category);
    data.append('description', formData.description);
    if (file) data.append('proof', file);

    try {
      await api.post('/achievements', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Achievement submitted successfully!');
      setFormData({ title: '', date: '', category: 'Academic', description: '' });
      setFile(null);
    } catch (err) {
      toast.error('Upload failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout title="Add Achievement" role="student">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded shadow">
        <h2 className="text-xl font-bold mb-6">Submit New Achievement</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              required
              className="w-full border p-2 rounded"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Hackathon Winner"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Date</label>
              <input
                type="date"
                required
                className="w-full border p-2 rounded"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select
                className="w-full border p-2 rounded"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                <option>Academic</option>
                <option>Sports</option>
                <option>Cultural</option>
                <option>Research</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              required
              className="w-full border p-2 rounded h-24"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe your achievement..."
            />
          </div>

          <div className="border-2 border-dashed border-gray-300 p-6 rounded text-center cursor-pointer hover:bg-gray-50">
            <input type="file" id="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            <label htmlFor="file" className="cursor-pointer flex flex-col items-center">
              <UploadCloud size={32} className="text-gray-400 mb-2" />
              <span className="text-sm text-gray-500">{file ? file.name : 'Click to upload certificate (PDF/JPG)'}</span>
            </label>
          </div>

          <button disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
            {loading ? 'Uploading...' : 'Submit for Approval'}
          </button>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default AddAchievement;
