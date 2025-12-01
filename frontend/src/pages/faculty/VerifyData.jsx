import { useEffect, useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import api from '../../api/axios';
import { Check, X, FileText } from 'lucide-react';

const statusActions = {
  approved: { label: 'Approve', color: 'bg-green-100 text-green-700 hover:bg-green-200' },
  rejected: { label: 'Reject', color: 'bg-red-100 text-red-700 hover:bg-red-200' },
};

const VerifyData = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingId, setProcessingId] = useState(null);

  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
  const fileBase = apiBase.replace(/\/api$/, '');

  const fetchPending = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/achievements', { params: { status: 'pending' } });
      setItems(res.data || []);
    } catch (err) {
      setError('Unable to load submissions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleStatus = async (id, status) => {
    setProcessingId(id + status);
    try {
      await api.patch(`/achievements/${id}`, { status, reviewer_note: undefined });
      setItems((prev) => prev.filter((item) => (item._id || item.id) !== id));
    } catch (err) {
      window.alert('Action failed');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <DashboardLayout title="Pending Approvals" role="faculty">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Awaiting Review</h2>
        <button onClick={fetchPending} className="text-sm text-blue-600 hover:underline" disabled={loading}>
          Refresh
        </button>
      </div>
      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
      {loading ? (
        <p className="text-gray-500">Loading submissions...</p>
      ) : items.length === 0 ? (
        <p className="text-gray-500 text-center mt-10">No pending submissions.</p>
      ) : (
        <div className="grid gap-4">
          {items.map((item) => {
            const id = item._id || item.id;
            return (
              <div key={id} className="bg-white p-4 rounded shadow border-l-4 border-amber-400 flex justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-lg">{item.title}</h3>
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">{item.category}</span>
                  </div>
                  <p className="text-sm text-gray-500 mb-2">
                    Submitted by: {item.student_name || 'Unknown'} | Event Date: {item.event_date}
                  </p>
                  <p className="text-gray-700 mb-2">{item.description}</p>
                  {item.file_url && (
                    <a
                      href={`${fileBase}${item.file_url}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 text-sm flex items-center gap-1 hover:underline"
                    >
                      <FileText size={14} /> View Proof
                    </a>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => handleStatus(id, 'approved')}
                    disabled={processingId === id + 'approved'}
                    className={`p-2 rounded ${statusActions.approved.color} disabled:opacity-50`}
                    title="Approve"
                  >
                    <Check size={20} />
                  </button>
                  <button
                    onClick={() => handleStatus(id, 'rejected')}
                    disabled={processingId === id + 'rejected'}
                    className={`p-2 rounded ${statusActions.rejected.color} disabled:opacity-50`}
                    title="Reject"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
};

export default VerifyData;
