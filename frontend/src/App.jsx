import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Planner from './pages/Planner'
import RoutePage from './pages/Route'
import MyPlans from './pages/MyPlans'
import About from './pages/About'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/planner" element={<Planner />} />
        <Route path="/route" element={<RoutePage />} />
        <Route path="/plans" element={<MyPlans />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App