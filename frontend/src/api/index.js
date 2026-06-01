import axios from 'axios'

const host = window.location.hostname
const api = axios.create({
  baseURL: (host === 'localhost' || host === '127.0.0.1')
    ? 'http://127.0.0.1:8000'
    : `http://${host}:8000`,
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
export const planBuild = (data) => api.post('/api/plan-build', data)
export const planSuggest = (data) => api.post('/api/plan-suggest', data)
export const planAdd = (data) => api.post('/api/plan-add', data)
export const getTrips = (userId) => api.get(`/api/trips/${userId}`)
export const getAllActivities = () => api.get('/api/activities')
export const getBudget = (tripId) => api.get(`/api/budget/${tripId}`)

export const getMe = () => api.get('/auth/me')
export const updateProfile = (data) => api.put('/auth/profile', data)

export const savePlan = (data) => api.post('/api/plans', data)
export const getMyPlans = () => api.get('/api/plans')
export const deletePlan = (id) => api.delete(`/api/plans/${id}`)
export const updatePlanStatus = (id, body) => api.patch(`/api/plans/${id}/status`, body)