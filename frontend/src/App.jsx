import { useState } from 'react';
import { ConfigProvider, theme, Button } from 'antd';
import { ubbLightTheme, ubbDarkTheme } from './theme';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import ScrollToTop from './components/ScrollToTop';
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
import Evaluaciones from './pages/Evaluaciones.jsx';
import NotFound from './pages/NotFound';
import AprobarReservasPage from './pages/AprobarReservasPage.jsx';
import GestionCanchas from './pages/GestionarCanchas.jsx';
import MisEvaluaciones from './pages/MisEvaluaciones';
import Entrenamientos from './pages/Entrenamientos';
import GestionLesiones from './pages/GestionLesiones.jsx';
import MisLesiones from './pages/MisLesiones.jsx';
import Estadisticas from './pages/Estadisticas.jsx';
import MisEstadisticas from './pages/MisEstadisticas.jsx';
import AlineacionCompleta from './pages/AlineacionCompleta.jsx';
import Campeonatos from './pages/Campeonatos.jsx';
import CampeonatoInfo from './pages/CampeonatoInfo';
import CampeonatoEquipos from './pages/CampeonatoEquipos';
import CampeonatoFixture from './pages/CampeonatoFixture';
import CampeonatoTabla from './pages/CampeonatoTabla';
import EstadisticaCampeonato from './pages/EstadisticaCampeonato.jsx';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';

// Componente para manejar la redirección de la raíz
function RootRedirect() {
  const { usuario } = useAuth();
  
  if (!usuario) {
    return <Navigate to="/login" replace />;
  }
  
  return <Navigate to="/dashboard" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      
      {/* Redirección de raíz */}
      <Route path="/" element={<RootRedirect />} />
      
      {/* Login - público */}
      <Route path="/login" element={<Login />} />

      {/* Dashboard - Todos los usuarios autenticados */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      {/* ========== CAMPEONATOS - Todos los usuarios autenticados ========== */}
      <Route
        path="/campeonatos"
        element={
          <ProtectedRoute>
            <Campeonatos />
          </ProtectedRoute>
        }
      />
      <Route path="/campeonatos/:id/info" element={<CampeonatoInfo />} />
  <Route path="/campeonatos/:id/equipos" element={<CampeonatoEquipos />} />
  <Route path="/campeonatos/:id/fixture" element={<CampeonatoFixture />} />
  <Route path="/campeonatos/:id/tabla" element={<CampeonatoTabla />} />
  <Route path="/campeonatos/:id/estadisticas" element={<EstadisticaCampeonato />} />
  
      {/* Alineación Completa - Entrenador y SuperAdmin */}
      

      {/* Disponibilidad de Canchas - Todos los usuarios */}
      <Route
        path="/canchas"
        element={
          <ProtectedRoute>
            <DisponibilidadCancha />
          </ProtectedRoute>
        }
      />
      <Route
        path="/gestion-canchas"
        element={
          <ProtectedRoute roles={['entrenador', 'superadmin']}>
            <GestionCanchas />
          </ProtectedRoute>
        }
      />
      {/* ========== ENTRENAMIENTOS - Entrenador y SuperAdmin ========== */}
      <Route
        path="/entrenamientos"
        element={
          <ProtectedRoute roles={['entrenador', 'superadmin']}>
            <Entrenamientos />
          </ProtectedRoute>
        }
      />
      <Route
        path="/sesiones/:sesionId/entrenamientos"
        element={
          <ProtectedRoute roles={['entrenador', 'superadmin']}>
            <Entrenamientos />
          </ProtectedRoute>
        }
      />
      {/* ========== GESTIÓN DE LESIONES - Entrenador y SuperAdmin ========== */}
      <Route
        path="/lesiones"
        element={
          <ProtectedRoute roles={['entrenador', 'superadmin']}>
            <GestionLesiones />
          </ProtectedRoute>
        }
      />

      {/* ========== ESTADÍSTICAS - Todos los usuarios autenticados ========== */}
      <Route
        path="/estadisticas"
        element={
          <ProtectedRoute>
            <Estadisticas />
          </ProtectedRoute>
        }
      />

      

      {/* ========== RESERVAS - Solo Estudiantes y Académicos ========== */}
      <Route
        path="/reservas/nueva"
        element={
          <ProtectedRoute roles={['estudiante', 'academico']}>
            <ReservaNueva />
          </ProtectedRoute>
        }
      />
      {/* Mis Lesiones - Solo Estudiantes  */}
      <Route
        path="/mis-lesiones"
        element={
          <ProtectedRoute roles={['estudiante', ]}>
            <MisLesiones />
          </ProtectedRoute>
        }
      />
       <Route
        path="/mis-estadisticas"
        element={
          <ProtectedRoute roles={['estudiante', ]}>
            <MisEstadisticas />
          </ProtectedRoute>
        }
      />


      {/* Mis Evaluaciones - Solo Estudiantes  */}
      <Route
        path="/mis-evaluaciones"
        element={
          <ProtectedRoute roles={['estudiante']}>
            <MisEvaluaciones />
          </ProtectedRoute>
        }
      />

      <Route
        path="/reservas/mis-reservas"
        element={
          <ProtectedRoute roles={['estudiante', 'academico']}>
            <MisReservas />
          </ProtectedRoute>
        }
      />

      {/* ========== SESIONES - Entrenador y SuperAdmin ========== */}
      <Route
        path="/sesiones"
        element={
          <ProtectedRoute roles={['entrenador']}>
            <Sesiones />
          </ProtectedRoute>
        }
      />
      <Route
        path="/aprobar-reservas"
        element={
          <ProtectedRoute roles={['entrenador', 'superadmin']}>
            <AprobarReservasPage />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/sesiones/editar/:id"
        element={
          <ProtectedRoute roles={['entrenador', 'superadmin']}>
            <EditarSesion />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/sesiones/nueva"
        element={
          <ProtectedRoute roles={['entrenador', 'superadmin']}>
            <SesionNueva />
          </ProtectedRoute>
        }
      />

      <Route
  path="/sesiones/:sesionId/alineacion"
  element={
    <ProtectedRoute roles={['entrenador', 'superadmin']}>
      <AlineacionCompleta />
    </ProtectedRoute>
  }
/>

      {/* ========== ASISTENCIAS ========== */}
      {/* Marcar Asistencia - Solo Estudiantes */}
      <Route
        path="/marcar-asistencia"
        element={
          <ProtectedRoute roles={['estudiante']}>
            <MarcarAsistencia />
          </ProtectedRoute>
        }
      />
      
      {/* Gestionar Asistencias - Entrenador y SuperAdmin */}
      <Route
        path="/sesiones/:sesionId/asistencias"
        element={
          <ProtectedRoute roles={['entrenador', 'superadmin']}>
            <GestionarAsistencias />
          </ProtectedRoute>
        }
      />

      {/* ========== JUGADORES - Entrenador y Admin ========== */}
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

      {/* ========== GRUPOS - Entrenador y Admin ========== */}
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

      {/* ========== EVALUACIONES ========== */}
      <Route
        path="/evaluaciones"
        element={
          <ProtectedRoute roles={['entrenador', 'superadmin']}>
            <Evaluaciones />
          </ProtectedRoute>
        }
      />

      {/* Página 404 - Debe estar al final */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default function App() {
  const [darkMode, setDarkMode] = useState(false);
  const toggleTheme = () => setDarkMode(!darkMode);

  return (
    <ConfigProvider theme={darkMode ? ubbDarkTheme : ubbLightTheme}>
      <Router>
        <ScrollToTop />
        <AuthProvider>
          <div
            style={{
              position: 'fixed',
              top: 16,
              left: 800,
              zIndex: 1000,
            }}
          >
           {/* <Button type="primary" onClick={toggleTheme}>
              {darkMode ? 'Modo Claro ☀️' : 'Modo Oscuro 🌙'}
            </Button> */}
          </div>

          <AppRoutes />
        </AuthProvider>
      </Router>
    </ConfigProvider>
  );
}