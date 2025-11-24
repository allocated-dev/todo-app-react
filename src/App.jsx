import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import HomePage from './pages/HomePage.jsx'
import TodoPage from './pages/TodoPage.jsx'
import AboutPage from './pages/AboutPage.jsx'

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/todos" element={<TodoPage />} />
        <Route path="/about" element={<AboutPage />} />
      </Routes>
    </>
  )
}

export default App
