import React, { useState } from 'react'
import axios from '../../api/axios'
import Button from '../../components/Button'

const AddAchievement = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    category: '',
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      await axios.post('/achievements', formData)
      setMessage('Achievement added successfully!')
      setFormData({ title: '', description: '', date: '', category: '' })
    } catch (error) {
      setMessage('Error adding achievement. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Add Achievement</h1>
      <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
        {message && (
          <div className={`p-3 rounded mb-4 ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {message}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Title</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="4"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Date</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 mb-2">Category</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select Category</option>
              <option value="research">Research</option>
              <option value="publication">Publication</option>
              <option value="award">Award</option>
              <option value="conference">Conference</option>
            </select>
          </div>
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? 'Submitting...' : 'Add Achievement'}
          </Button>
        </form>
      </div>
    </div>
  )
}

export default AddAchievement
