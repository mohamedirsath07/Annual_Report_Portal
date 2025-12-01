import React, { useState, useEffect } from 'react'
import axios from '../../api/axios'

const ViewEvents = () => {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      const response = await axios.get('/events')
      setEvents(response.data)
    } catch (error) {
      console.error('Error fetching events:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">View Events</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <p>Loading events...</p>
        ) : (
          events.map((event) => (
            <div key={event.id} className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-xl font-semibold mb-2">{event.title}</h3>
              <p className="text-gray-600 mb-2">{event.description}</p>
              <p className="text-sm text-gray-500">Date: {event.date}</p>
              <p className="text-sm text-gray-500">Location: {event.location}</p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default ViewEvents
