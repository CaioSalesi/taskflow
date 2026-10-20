import { BrowserRouter, Route, Routes } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import AuthPlaceholderPage from './pages/AuthPlaceholderPage'
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
        <Route
          path="/register"
          element={
            <AuthPlaceholderPage
              title="Create your account"
              description="The registration page is coming soon. You'll create your TaskFlow account from here."
            />
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
