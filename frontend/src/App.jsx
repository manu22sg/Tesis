import { useState } from 'react';
import { ConfigProvider, theme, Button } from 'antd';
import { ubbLightTheme, ubbDarkTheme } from './theme';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import DisponibilidadCancha from './pages/DisponibilidadCancha';
import ReservaNueva from './pages/ReservaNueva';
import ProtectedRoute from './components/ProtectedRoute';
import MisReservas from './pages/MisReservas.jsx';
import { AuthProvider } from './context/AuthContext.jsx'; // 

export default function App() {
  const [darkMode, setDarkMode] = useState(false);
  const toggleTheme = () => setDarkMode(!darkMode);

  return (
    <ConfigProvider theme={darkMode ? ubbDarkTheme : ubbLightTheme}>
      <Router>
        <AuthProvider>
          <div
            style={{
              position: 'fixed',
              top: 16,
              right: 16,
              zIndex: 1000,
            }}
          >
            <Button type="primary" onClick={toggleTheme}>
              {darkMode ? 'Modo Claro ☀️' : 'Modo Oscuro 🌙'}
            </Button>
          </div>

          <Routes>
            <Route path="/login" element={<Login />} />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/canchas"
              element={
                <ProtectedRoute>
                  <DisponibilidadCancha />
                </ProtectedRoute>
              }
            />

            <Route
              path="/reservas/nueva"
              element={
                <ProtectedRoute>
                  <ReservaNueva />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/reservas/mis-reservas"
              element={
                <ProtectedRoute>
                  <MisReservas />
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </Router>
    </ConfigProvider>
  );
}
