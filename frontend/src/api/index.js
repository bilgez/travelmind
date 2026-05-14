import axios from 'axios'

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000',
})

export const register = (data) => api.post('/auth/register', data)
export const login = (data) => api.post('/auth/login', data)
export const parseInput = (data) => api.post('/api/parse-input', data)
export const getTrips = (userId) => api.get(`/api/trips/${userId}`)
export const getRecommendations = (userId, category) =>
  api.get(`/api/recommendations?user_id=${userId}&category=${category}`)
export const getAllActivities = () => api.get('/api/activities')
export const optimizeRoute = (data) => api.post('/api/optimize-route', data)
export const getBudget = (tripId) => api.get(`/api/budget/${tripId}`)