import DashboardLayout from '../../layouts/DashboardLayout';

const Card = ({ label, value, accent }) => (
  <div className="bg-white p-6 rounded-lg shadow">
    <p className="text-sm text-gray-500">{label}</p>
    <p className={`text-3xl font-bold mt-2 ${accent}`}>{value}</p>
  </div>
);

const StudentDashboard = () => {
  return (
    <DashboardLayout title="Student Dashboard" role="student">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card label="Submitted Achievements" value="--" accent="text-blue-600" />
        <Card label="Approved" value="--" accent="text-green-600" />
        <Card label="Pending" value="--" accent="text-amber-500" />
      </div>
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-2">What to do next?</h2>
        <p className="text-gray-600">Use the sidebar to submit achievements or review upcoming events.</p>
      </div>
    </DashboardLayout>
  );
};

export default StudentDashboard;
