import { BrowserRouter, Route, Routes } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import AuthPlaceholderPage from './pages/AuthPlaceholderPage'
import RegisterPage from './pages/RegisterPage'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/login"
          element={
            <AuthPlaceholderPage
              title="Log in"
              description="The login page is coming soon. You'll sign in to TaskFlow from here."
            />
          }
        />
        <Route path="/register" element={<RegisterPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
