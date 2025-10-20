import { useState } from 'react';
import { ConfigProvider, theme, Button } from 'antd';
import { ubbLightTheme, ubbDarkTheme } from './theme';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import DisponibilidadCancha from './pages/DisponibilidadCancha';
import ReservaNueva from './pages/ReservaNueva';
import ProtectedRoute from './components/ProtectedRoute';
import MisReservas from './pages/MisReservas';
import Sesiones from './pages/Sesiones';
import EditarSesion from './pages/EditarSesion';
import SesionNueva from './pages/SesionNueva';
import MarcarAsistencia from './pages/MarcarAsistencia';
import GestionarAsistencias from './pages/GestionarAsistencias';
import Jugadores from './pages/Jugadores';
import JugadorForm from './pages/JugadorForm';
import JugadorGrupos from './pages/JugadorGrupos';
import Grupos from './pages/Grupo';
import GrupoMiembros from './pages/GrupoMiembros';


import { AuthProvider } from './context/AuthContext.jsx';  

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
            <Route
              path="/sesiones"
              element={
                <ProtectedRoute>
                  <Sesiones />
                </ProtectedRoute>
              }
            />
            <Route
              path="/sesiones/editar/:id"
              element={
                <ProtectedRoute>
                  <EditarSesion />
                </ProtectedRoute>
              }
            />
            <Route
              path="/sesiones/nueva"
              element={
                <ProtectedRoute>
                  <SesionNueva />
                </ProtectedRoute>
              }
            />
            <Route
              path="/marcar-asistencia"
              element={
                <ProtectedRoute>
                  <MarcarAsistencia />
                </ProtectedRoute>
              }
            />
            <Route
              path="/sesiones/:sesionId/asistencias"
              element={
                <ProtectedRoute>
                  <GestionarAsistencias />
                </ProtectedRoute>
              }
            />
            <Route 
              path="/jugadores" 
              element={
               <ProtectedRoute roles={['entrenador', 'admin']}>
                <Jugadores />
              </ProtectedRoute>
             } 
            />
      <Route 
      path="/jugadores/nuevo" 
      element={
        <ProtectedRoute roles={['entrenador', 'admin']}>
        <JugadorForm />
         </ProtectedRoute>
          }   
          />
          <Route 
            path="/jugadores/editar/:id" 
            element={
            <ProtectedRoute roles={['entrenador', 'admin']}>
              <JugadorForm />
            </ProtectedRoute>
          } 
          />

          <Route 
          path="/jugadores/:id/grupos" 
           element={
            <ProtectedRoute roles={['entrenador', 'admin']}>
                <JugadorGrupos />
              </ProtectedRoute>
          } 
          />
          <Route 
          path="/grupos" 
           element={
            <ProtectedRoute roles={['entrenador', 'admin']}>
                <Grupos />
              </ProtectedRoute>
       } 
        />
        <Route 
          path="/grupos/:id/miembros" 
          element={
            <ProtectedRoute roles={['entrenador', 'admin']}>
              <GrupoMiembros />
            </ProtectedRoute>
          } 
        />
          </Routes>
        </AuthProvider>
      </Router>
    </ConfigProvider>
  );
}
