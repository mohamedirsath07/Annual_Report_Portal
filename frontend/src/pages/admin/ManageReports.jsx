import { useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import api from '../../api/axios';
import { Download, FileText, Filter } from 'lucide-react';
import toast from 'react-hot-toast';

const ManageReports = () => {
  const [department, setDepartment] = useState('Computer Science');
  const [year, setYear] = useState('2025');
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      const response = await api.get('/reports/generate', {
        params: { department, year },
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Annual_Report_${department}_${year}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Report generated successfully.');
    } catch (err) {
      console.error('Download failed', err);
      toast.error('Failed to generate report. Ensure there is approved data.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout title="Report Generation" role="admin">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Filter size={20} className="text-blue-600" /> Report Configuration
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Academic Year</label>
              <select
                className="w-full border p-2.5 rounded-md bg-gray-50"
                value={year}
                onChange={(e) => setYear(e.target.value)}
              >
                <option value="2025">2024-2025</option>
                <option value="2024">2023-2024</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Target Department</label>
              <select
                className="w-full border p-2.5 rounded-md bg-gray-50"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              >
                <option value="Computer Science">Computer Science</option>
                <option value="Mechanical">Mechanical Engineering</option>
                <option value="Electrical">Electrical Engineering</option>
              </select>
            </div>

            <button
              onClick={handleDownload}
              disabled={loading}
              className={`flex items-center justify-center gap-2 text-white font-medium py-2.5 px-4 rounded-md transition-colors ${
                loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {loading ? 'Generating...' : (
                <>
                  <Download size={18} /> Download PDF Report
                </>
              )}
            </button>
          </div>
        </div>

        <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center bg-gray-50">
          <div className="mx-auto h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <FileText size={32} className="text-blue-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">Ready to Generate</h3>
          <p className="text-gray-500 max-w-sm mx-auto mt-2">
            The report engine aggregates all <strong>Approved</strong> achievements, calculates statistics, and produces a print-ready PDF.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ManageReports;
