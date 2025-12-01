import React from 'react'
import { Link, useLocation } from 'react-router-dom'

const Sidebar = () => {
  const location = useLocation()
  
  const menuItems = [
    { path: '/admin/dashboard', label: 'Dashboard', role: 'admin' },
    { path: '/admin/users', label: 'Manage Users', role: 'admin' },
    { path: '/admin/reports', label: 'Manage Reports', role: 'admin' },
    { path: '/faculty/dashboard', label: 'Dashboard', role: 'faculty' },
    { path: '/faculty/achievement', label: 'Add Achievement', role: 'faculty' },
    { path: '/student/dashboard', label: 'Dashboard', role: 'student' },
    { path: '/student/events', label: 'View Events', role: 'student' },
  ]

  return (
    <aside className="w-64 bg-gray-800 text-white min-h-screen p-4">
      <div className="mb-8">
        <h2 className="text-2xl font-bold">Menu</h2>
      </div>
      <nav>
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`block px-4 py-2 rounded transition ${
                  location.pathname === item.path
                    ? 'bg-blue-600 text-white'
                    : 'hover:bg-gray-700'
                }`}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}

export default Sidebar
