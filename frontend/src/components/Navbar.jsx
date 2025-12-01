import React from 'react'
import { Link } from 'react-router-dom'
import { logout } from '../utils/auth'

const Navbar = () => {
  const handleLogout = () => {
    logout()
    window.location.href = '/login'
  }

  return (
    <nav className="bg-white shadow-md px-6 py-4 flex justify-between items-center">
      <div className="text-xl font-bold text-gray-800">
        Annual Report Portal
      </div>
      <div className="flex items-center gap-4">
        <span className="text-gray-600">Welcome, User</span>
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
        >
          Logout
        </button>
      </div>
    </nav>
  )
}

export default Navbar
