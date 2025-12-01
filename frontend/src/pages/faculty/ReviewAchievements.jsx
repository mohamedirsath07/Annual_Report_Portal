import { useEffect, useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import api from '../../api/axios';

const ReviewAchievements = () => {
  const [achievements, setAchievements] = useState([]);
  const [notes, setNotes] = useState({});
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [error, setError] = useState(null);

  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
  const fileBase = apiBase.replace(/\/api$/, '');

  const fetchPending = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/achievements', { params: { status: 'pending' } });
      setAchievements(res.data || []);
    } catch (err) {
      setError('Failed to load achievements.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleAction = async (id, status) => {
    setProcessingId(id);
    try {
      await api.patch(`/achievements/${id}`, {
        status,
        reviewer_note: notes[id] || undefined,
      });
      fetchPending();
    } catch (err) {
      setError('Unable to update achievement.');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <DashboardLayout title="Review Achievements" role="faculty">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Pending Approvals</h2>
          <button onClick={fetchPending} className="text-sm text-blue-600 hover:underline" disabled={loading}>
            Refresh
          </button>
        </div>
        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
        {loading ? (
          <p className="text-sm text-gray-500">Loading submissions...</p>
        ) : achievements.length === 0 ? (
          <p className="text-sm text-gray-500">No pending submissions right now.</p>
        ) : (
          <div className="space-y-4">
            {achievements.map((item) => {
              const id = item.id || item._id;
              const submittedOn = item.created_at
                ? new Date(item.created_at).toLocaleDateString()
                : '—';
              return (
                <div key={id} className="border rounded-lg p-4">
                  <div className="flex flex-wrap justify-between gap-4">
                    <div>
                      <p className="text-lg font-semibold">{item.title}</p>
                      <p className="text-sm text-gray-500">
                        {item.student_name} • {item.department || 'No Dept'}
                      </p>
                      <p className="text-sm text-gray-500">Event date: {item.event_date}</p>
                      <p className="text-sm text-gray-500">Submitted on: {submittedOn}</p>
                    </div>
                    {item.file_url && (
                      <a
                        href={`${fileBase}${item.file_url}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        View Proof
                      </a>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 mt-3">{item.description}</p>
                  <textarea
                    className="w-full border rounded mt-4 p-2 text-sm"
                    placeholder="Add a note for the student (optional)"
                    value={notes[id] || ''}
                    onChange={(e) => setNotes((prev) => ({ ...prev, [id]: e.target.value }))}
                  />
                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={() => handleAction(id, 'approved')}
                      disabled={processingId === id}
                      className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleAction(id, 'rejected')}
                      disabled={processingId === id}
                      className="flex-1 bg-red-600 text-white py-2 rounded hover:bg-red-700 disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ReviewAchievements;
