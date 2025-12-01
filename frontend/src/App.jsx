import { useState } from 'react';
import './global.css';
import { ConfigProvider, theme, Button, App as AntApp } from 'antd';
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
import CampeonatoPublico from './pages/CampeonatoPublico.jsx';
import DetalleCampeonatoPublico from './pages/DetalleCampeonatoPublico.jsx';
import Register from './pages/Register.jsx';
import VerificarEmail from './pages/VerificarEmail.jsx';
import SolicitarRestablecimiento from './pages/SolicitarRestablecimiento.jsx';
import RestablecerPassword from './pages/RestablecerPassword.jsx';
import PerfilJugador from './pages/PerfilJugador.jsx';
import Ojeador from './pages/Ojeador.jsx';
import Asistencias from './pages/Asistencias.jsx';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';

// Componente para manejar la redirección de la raíz
function RootRedirect() {
  const { usuario, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to="/dashboard" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      {/* ========== RUTAS PÚBLICAS ========== */}
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/solicitar-restablecimiento" element={<SolicitarRestablecimiento />} />
      <Route path="/restablecer-password/:token" element={<RestablecerPassword />} />
      <Route path="/verificar/:token" element={<VerificarEmail />} />

      {/* Campeonatos Públicos - Solo Estudiante y Académico */}
      <Route 
        path="/campeonatos/publico" 
        element={
          <ProtectedRoute roles={['estudiante', 'academico']}>
            <CampeonatoPublico />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/campeonatos/:id/publico" 
        element={
          <ProtectedRoute roles={['estudiante', 'academico']}>
            <DetalleCampeonatoPublico />
          </ProtectedRoute>
        } 
      />

      {/* ========== DASHBOARD ========== */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      {/* Asistencias - Solo Entrenador */}
      <Route
        path="/asistencias"
        element={
          <ProtectedRoute roles={['entrenador']}>
            <Asistencias />
          </ProtectedRoute>
        }
      />

      {/* ========== CAMPEONATOS - Solo Entrenador ========== */}
      <Route
        path="/campeonatos"
        element={
          <ProtectedRoute roles={['entrenador']}>
            <Campeonatos />
          </ProtectedRoute>
        }
      />
      <Route 
        path="/campeonatos/:id/info" 
        element={
          <ProtectedRoute roles={['entrenador']}>
            <CampeonatoInfo />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/campeonatos/:id/equipos" 
        element={
          <ProtectedRoute roles={['entrenador']}>
            <CampeonatoEquipos />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/campeonatos/:id/fixture" 
        element={
          <ProtectedRoute roles={['entrenador']}>
            <CampeonatoFixture />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/campeonatos/:id/tabla" 
        element={
          <ProtectedRoute roles={['entrenador']}>
            <CampeonatoTabla />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/campeonatos/:id/estadisticas" 
        element={
          <ProtectedRoute roles={['entrenador']}>
            <EstadisticaCampeonato />
          </ProtectedRoute>
        } 
      />

      {/* ========== OJEADOR - Solo Entrenador ========== */}
      <Route 
        path="/ojeador" 
        element={
          <ProtectedRoute roles={['entrenador']}>
            <Ojeador />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/ojeador/:usuarioId?" 
        element={
          <ProtectedRoute roles={['entrenador']}>
            <PerfilJugador />
          </ProtectedRoute>
        } 
      />

      {/* ========== CANCHAS ========== */}
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
          <ProtectedRoute roles={['entrenador']}>
            <GestionCanchas />
          </ProtectedRoute>
        }
      />

      {/* ========== ENTRENAMIENTOS - Solo Entrenador ========== */}
      <Route
        path="/entrenamientos"
        element={
          <ProtectedRoute roles={['entrenador']}>
            <Entrenamientos />
          </ProtectedRoute>
        }
      />
      <Route
        path="/sesiones/:sesionId/entrenamientos"
        element={
          <ProtectedRoute roles={['entrenador']}>
            <Entrenamientos />
          </ProtectedRoute>
        }
      />

      {/* ========== GESTIÓN DE LESIONES ========== */}
      <Route
        path="/lesiones"
        element={
          <ProtectedRoute roles={['entrenador']}>
            <GestionLesiones />
          </ProtectedRoute>
        }
      />
      <Route
        path="/mis-lesiones"
        element={
          <ProtectedRoute roles={['estudiante']}>
            <MisLesiones />
          </ProtectedRoute>
        }
      />

      {/* ========== ESTADÍSTICAS ========== */}
      <Route
        path="/estadisticas"
        element={
          <ProtectedRoute>
            <Estadisticas />
          </ProtectedRoute>
        }
      />
      <Route
        path="/mis-estadisticas"
        element={
          <ProtectedRoute roles={['estudiante']}>
            <MisEstadisticas />
          </ProtectedRoute>
        }
      />

      {/* ========== RESERVAS - Estudiante y Académico ========== */}
      <Route
        path="/reservas/nueva"
        element={
          <ProtectedRoute roles={['estudiante', 'academico']}>
            <ReservaNueva />
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
      <Route
        path="/aprobar-reservas"
        element={
          <ProtectedRoute roles={['entrenador']}>
            <AprobarReservasPage />
          </ProtectedRoute>
        }
      />

      {/* ========== SESIONES - Solo Entrenador ========== */}
      <Route
        path="/sesiones"
        element={
          <ProtectedRoute roles={['entrenador']}>
            <Sesiones />
          </ProtectedRoute>
        }
      />
      <Route
        path="/sesiones/editar/:id"
        element={
          <ProtectedRoute roles={['entrenador']}>
            <EditarSesion />
          </ProtectedRoute>
        }
      />
      <Route
        path="/sesiones/nueva"
        element={
          <ProtectedRoute roles={['entrenador']}>
            <SesionNueva />
          </ProtectedRoute>
        }
      />
      <Route
        path="/sesiones/:sesionId/alineacion"
        element={
          <ProtectedRoute roles={['entrenador']}>
            <AlineacionCompleta />
          </ProtectedRoute>
        }
      />

      {/* ========== ASISTENCIAS ========== */}
      <Route
        path="/marcar-asistencia"
        element={
          <ProtectedRoute roles={['estudiante']}>
            <MarcarAsistencia />
          </ProtectedRoute>
        }
      />
      <Route
        path="/sesiones/:sesionId/asistencias"
        element={
          <ProtectedRoute roles={['entrenador']}>
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
          <ProtectedRoute roles={['entrenador']}>
            <Evaluaciones />
          </ProtectedRoute>
        }
      />
      <Route
        path="/mis-evaluaciones"
        element={
          <ProtectedRoute roles={['estudiante']}>
            <MisEvaluaciones />
          </ProtectedRoute>
        }
      />

      {/* ========== 404 ========== */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default function App() {
  const [darkMode, setDarkMode] = useState(false);
  const toggleTheme = () => setDarkMode(!darkMode);

  return (
    <ConfigProvider theme={darkMode ? ubbDarkTheme : ubbLightTheme}>
      <AntApp>
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
      </AntApp>
    </ConfigProvider>
  );
}