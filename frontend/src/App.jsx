import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Planner from './pages/Planner'
import RoutePage from './pages/Route'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/planner" element={<Planner />} />
        <Route path="/route" element={<RoutePage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App