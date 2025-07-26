import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Home } from './pages/Home'
import { Admin } from './pages/Admin'
import './index.css'

function App() {
  return (
    <div className="dark min-w-full">
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </Router>
    </div>
  )
}

export default App