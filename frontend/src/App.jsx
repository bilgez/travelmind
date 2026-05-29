import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Planner from './pages/Planner'
import RoutePage from './pages/Route'
import MyPlans from './pages/MyPlans'
import About from './pages/About'
import Profile from './pages/Profile'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token')
  if (!token) return <Navigate to="/login" replace />
  return children
}

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/planner" element={<Planner />} />
        <Route path="/route" element={<RoutePage />} />
        <Route path="/plans" element={<MyPlans />} />
        <Route path="/about" element={<About />} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
