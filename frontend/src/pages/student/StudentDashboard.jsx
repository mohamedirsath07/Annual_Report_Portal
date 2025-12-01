import React from 'react'

const StudentDashboard = () => {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Student Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-2">My Achievements</h3>
          <p className="text-3xl font-bold text-blue-600">8</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-2">Upcoming Events</h3>
          <p className="text-3xl font-bold text-green-600">3</p>
        </div>
      </div>
    </div>
  )
}

export default StudentDashboard
