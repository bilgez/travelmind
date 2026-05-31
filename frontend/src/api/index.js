import axios from 'axios'

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000',
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export const register = (data) => api.post('/auth/register', data)
export const login = (data) => api.post('/auth/login', data)
export const parseInput = (data) => api.post('/api/parse-input', data)
export const planChat = (data) => api.post('/api/plan-chat', data)
export const getTrips = (userId) => api.get(`/api/trips/${userId}`)
export const getRecommendations = (userId, category) =>
  api.get(`/api/recommendations?user_id=${userId}&category=${category}`)
export const getAllActivities = () => api.get('/api/activities')
export const optimizeRoute = (data) => api.post('/api/optimize-route', data)
export const getBudget = (tripId) => api.get(`/api/budget/${tripId}`)

export const getMe = () => api.get('/auth/me')
export const updateProfile = (data) => api.put('/auth/profile', data)

export const savePlan = (data) => api.post('/api/plans', data)
export const getMyPlans = () => api.get('/api/plans')
export const deletePlan = (id) => api.delete(`/api/plans/${id}`)
export const updatePlanStatus = (id, body) => api.patch(`/api/plans/${id}/status`, body)