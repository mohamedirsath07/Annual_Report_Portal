import DashboardLayout from '../../layouts/DashboardLayout';

const FacultyDashboard = () => {
  return (
    <DashboardLayout title="Faculty Dashboard" role="faculty">
       <div className="bg-white p-8 rounded shadow text-center">
          <h2 className="text-2xl font-bold mb-2">Welcome Back!</h2>
          <p className="text-gray-600">Use the sidebar to manage student data and submit your achievements.</p>
       </div>
       {/* Add Charts/Tables specific to Faculty here */}
    </DashboardLayout>
  );
};

export default FacultyDashboard;
