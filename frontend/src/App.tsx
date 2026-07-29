import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { Navbar } from './components/Navbar'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { Events } from './pages/Events'
import { EventDetail } from './pages/EventDetail'
import { Checkout } from './pages/Checkout'
import { MyOrders } from './pages/MyOrders'
import { CreateEvent } from './pages/CreateEvent'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<Navigate to="/eventos" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registrar" element={<Register />} />
          <Route path="/eventos" element={<Events />} />
          <Route path="/eventos/:id" element={<EventDetail />} />
          <Route
            path="/checkout/:ticketId"
            element={
              <ProtectedRoute>
                <Checkout />
              </ProtectedRoute>
            }
          />
          <Route
            path="/meus-pedidos"
            element={
              <ProtectedRoute>
                <MyOrders />
              </ProtectedRoute>
            }
          />
          <Route
            path="/criar-evento"
            element={
              <ProtectedRoute roles={['ADMIN', 'ORGANIZER']}>
                <CreateEvent />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/eventos" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
