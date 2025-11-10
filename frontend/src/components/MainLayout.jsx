import React, { useState, createContext, useContext } from 'react';
import { Layout, Menu, theme, Avatar, Dropdown } from 'antd';
import {
  DashboardOutlined,
  CalendarOutlined,
  UserOutlined,
  TeamOutlined,
  TrophyOutlined,
  FieldTimeOutlined,
  CheckCircleOutlined,
  LogoutOutlined,
  PlusOutlined,
  EyeOutlined,
  ScheduleOutlined,
  EditOutlined,
  FileTextOutlined,
  MedicineBoxOutlined,
  BarChartOutlined,
  InfoCircleOutlined,
  StarOutlined,
  UnorderedListOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const { Sider, Content, Header } = Layout;

// 🌟 Context para Campeonato Activo
const CampeonatoActivoContext = createContext();

export const useCampeonatoActivo = () => {
  const context = useContext(CampeonatoActivoContext);
  if (!context) {
    throw new Error('useCampeonatoActivo debe usarse dentro de CampeonatoActivoProvider');
  }
  return context;
};

function getItem(label, key, icon, children) {
  return { key, icon, children, label };
}

const MainLayout = ({ children, breadcrumb, selectedKeyOverride }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { usuario, logout } = useAuth();
  const token = theme.useToken().token;
  const [collapsed, setCollapsed] = useState(false);
  
  //  Estado para campeonato activo
  const [campeonatoActivo, setCampeonatoActivo] = useState(null);

  //  Determinar rol
  const rol = (usuario?.rol?.nombre || usuario?.rol || '').toLowerCase();
  const userRole =
    rol === 'superadmin'
      ? 'superadmin'
      : rol === 'entrenador'
      ? 'entrenador'
      : rol === 'academico'
      ? 'academico'
      : 'estudiante';

  // 🏋️ Menús según rol
  const entrenadorItems = [
    getItem('Dashboard', 'dashboard', <DashboardOutlined />),
    getItem('Canchas', 'sub_canchas', <FieldTimeOutlined />, [
      getItem('Gestionar', 'canchas-gestion', <EditOutlined />),
      getItem('Ver Canchas', 'canchas-ver', <EyeOutlined />),
    ]),

    getItem('Sesiones', 'sub_sesiones', <CalendarOutlined />, [
      getItem('Ver Sesiones', 'sesiones', <EyeOutlined />),
      getItem('Nueva Sesión', 'sesiones-nueva', <PlusOutlined />),
    ]),

    getItem('Entrenamientos', 'entrenamientos', <FileTextOutlined />),
    getItem('Gestión reservas', 'aprobar-reservas', <CheckCircleOutlined />),

    getItem('Jugadores', 'sub_jugadores', <UserOutlined />, [
      getItem('Ver Jugadores', 'jugadores', <EyeOutlined />),
      getItem('Ver Lesiones', 'lesiones', <MedicineBoxOutlined />),
    ]),

    getItem('Grupos', 'grupos', <TeamOutlined />),
    getItem('Evaluaciones', 'evaluaciones', <TrophyOutlined />),
    getItem('Estadísticas', 'estadisticas', <BarChartOutlined />),
    
    // 🏆 Campeonatos con submenu dinámico
    getItem('Campeonatos', 'sub_campeonatos', <TrophyOutlined />, [
      getItem('Ver todos', 'campeonatos-lista', <UnorderedListOutlined />),
      
      //  Solo aparece si hay campeonato activo
      ...(campeonatoActivo ? [
        { type: 'divider', key: 'divider-campeonato' },
        getItem(
          ` ${campeonatoActivo.nombre}`, 
          'sub_campeonato_activo', 
          <StarOutlined />, 
          [
            getItem('Información', `campeonato-${campeonatoActivo.id}-info`, <InfoCircleOutlined />),
            getItem('Equipos', `campeonato-${campeonatoActivo.id}-equipos`, <TeamOutlined />),
            getItem('Fixture', `campeonato-${campeonatoActivo.id}-fixture`, <CalendarOutlined />),
            getItem('Tabla', `campeonato-${campeonatoActivo.id}-tabla`, <BarChartOutlined />),
          ]
        ),
      ] : [])
    ]),
  ];

  const superAdminItems = [
    getItem('Dashboard', 'dashboard', <DashboardOutlined />),

    getItem('Canchas', 'sub_canchas', <FieldTimeOutlined />, [
      getItem('Gestionar Canchas', 'canchas-gestion', <EditOutlined />),
      getItem('Ver Canchas', 'canchas-ver', <EyeOutlined />),
    ]),

    getItem('Sesiones', 'sub_sesiones', <CalendarOutlined />, [
      getItem('Ver Sesiones', 'sesiones', <EyeOutlined />),
      getItem('Nueva Sesión', 'sesiones-nueva', <PlusOutlined />),
    ]),

    getItem('Entrenamientos', 'entrenamientos', <FileTextOutlined />),

    getItem('Jugadores', 'sub_jugadores', <UserOutlined />, [
      getItem('Ver Jugadores', 'jugadores', <EyeOutlined />),
      getItem('Ver Lesiones', 'lesiones', <MedicineBoxOutlined />),
    ]),

    getItem('Grupos', 'grupos', <TeamOutlined />),
    getItem('Evaluaciones', 'evaluaciones', <TrophyOutlined />),
    getItem('Estadísticas', 'estadisticas', <BarChartOutlined />),
  ];

  const estudianteItems = [
    getItem('Dashboard', 'dashboard', <DashboardOutlined />),
    getItem('Canchas', 'canchas', <FieldTimeOutlined />),
    getItem('Reservas', 'sub_reservas', <CalendarOutlined />, [
      getItem('Nueva Reserva', 'reservas-nueva', <PlusOutlined />),
      getItem('Mis Reservas', 'reservas-mis', <ScheduleOutlined />),
    ]),
    getItem('Marcar Asistencia', 'marcar-asistencia', <CheckCircleOutlined />),
    getItem('Mis Evaluaciones', 'mis-evaluaciones', <TrophyOutlined />),
    getItem('Mis Lesiones', 'mis-lesiones', <MedicineBoxOutlined />),
    getItem('Mis Estadísticas', 'mis-estadisticas', <BarChartOutlined />),
  ];

  const academicoItems = [
    getItem('Dashboard', 'dashboard', <DashboardOutlined />),
    getItem('Disponibilidad Canchas', 'canchas', <FieldTimeOutlined />),
    getItem('Reservas', 'sub_reservas', <CalendarOutlined />, [
      getItem('Nueva Reserva', 'reservas-nueva', <PlusOutlined />),
      getItem('Mis Reservas', 'reservas-mis', <ScheduleOutlined />),
    ]),
  ];

  //  Rutas ↔ keys
  const pathToKey = {
    '/dashboard': 'dashboard',
    '/gestion-canchas': 'canchas-gestion',
    '/canchas': 'canchas',
    '/campeonatos': 'campeonatos-lista',
    '/reservas/nueva': 'reservas-nueva',
    '/reservas/mis-reservas': 'reservas-mis',
    '/aprobar-reservas': 'aprobar-reservas',
    '/sesiones': 'sesiones',
    '/sesiones/nueva': 'sesiones-nueva',
    '/entrenamientos': 'entrenamientos',
    '/lesiones': 'lesiones',
    '/mis-lesiones': 'mis-lesiones',
    '/estadisticas': 'estadisticas',
    '/mis-estadisticas': 'mis-estadisticas',
    '/marcar-asistencia': 'marcar-asistencia',
    '/jugadores': 'jugadores',
    '/grupos': 'grupos',
    '/evaluaciones': 'evaluaciones',
    '/mis-evaluaciones': 'mis-evaluaciones',
  };

  // Detectar rutas dinámicas de campeonatos
  let selectedKey = selectedKeyOverride;
  if (!selectedKey) {
    const campeonatoMatch = location.pathname.match(/^\/campeonatos\/(\d+)\/(info|equipos|fixture|tabla)$/);
    if (campeonatoMatch) {
      const [, id, seccion] = campeonatoMatch;
      selectedKey = `campeonato-${id}-${seccion}`;
    } else if (location.pathname.match(/^\/sesiones\/\d+\/entrenamientos$/)) {
      selectedKey = 'entrenamientos';
    } else {
      selectedKey = pathToKey[location.pathname] || 'dashboard';
    }
  }

  // Submenús abiertos por defecto
  const [openKeys, setOpenKeys] = useState(() => {
    if (location.pathname.startsWith('/campeonatos')) return ['sub_campeonatos', 'sub_campeonato_activo'];
    if (location.pathname.startsWith('/sesiones')) return ['sub_sesiones'];
    if (location.pathname.startsWith('/reservas')) return ['sub_reservas'];
    if (location.pathname.startsWith('/canchas')) return ['sub_canchas'];
    if (location.pathname.startsWith('/jugadores') || location.pathname.startsWith('/lesiones'))
      return ['sub_jugadores'];
    return [];
  });

  // Navegación al hacer click
  const onMenuClick = ({ key }) => {
    // Rutas dinámicas de campeonatos
    const campeonatoMatch = key.match(/^campeonato-(\d+)-(info|equipos|fixture|tabla)$/);
    if (campeonatoMatch) {
      const [, id, seccion] = campeonatoMatch;
      navigate(`/campeonatos/${id}/${seccion}`);
      return;
    }

    const keyToPath = {
      dashboard: '/dashboard',
      'canchas-gestion': '/gestion-canchas',
      'canchas-ver': '/canchas',
      canchas: '/canchas',
      'campeonatos-lista': '/campeonatos',
      'reservas-nueva': '/reservas/nueva',
      'reservas-mis': '/reservas/mis-reservas',
      'aprobar-reservas': '/aprobar-reservas',
      sesiones: '/sesiones',
      'sesiones-nueva': '/sesiones/nueva',
      entrenamientos: '/entrenamientos',
      lesiones: '/lesiones',
      'mis-lesiones': '/mis-lesiones',
      estadisticas: '/estadisticas',
      'mis-estadisticas': '/mis-estadisticas',
      'marcar-asistencia': '/marcar-asistencia',
      jugadores: '/jugadores',
      grupos: '/grupos',
      evaluaciones: '/evaluaciones',
      'mis-evaluaciones': '/mis-evaluaciones',
    };

    const route = keyToPath[key];
    if (route) navigate(route);
  };

  // 🧩 Menús por rol
  const itemsByRole = {
    superadmin: superAdminItems,
    entrenador: entrenadorItems,
    estudiante: estudianteItems,
    academico: academicoItems,
  };

  // 👤 Menú usuario superior derecho
  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: usuario?.nombre || 'Usuario',
      disabled: true,
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Cerrar Sesión',
      onClick: logout,
      danger: true,
    },
  ];

  return (
    <CampeonatoActivoContext.Provider value={{ campeonatoActivo, setCampeonatoActivo }}>
      <Layout style={{ minHeight: '100vh' }}>
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          collapsedWidth={80}
          style={{
            position: 'fixed',
            height: '100vh',
            left: 0,
            top: 0,
            bottom: 0,
            zIndex: 100,
            overflow: 'auto',
          }}
        >
          <div
            style={{
              height: 64,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: collapsed ? '16px' : '20px',
              fontWeight: 'bold',
              padding: '0 16px',
            }}
          >
            {collapsed ? '⚽' : '⚽ Sistema Deportivo'}
          </div>

          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[selectedKey]}
            openKeys={openKeys}
            onOpenChange={setOpenKeys}
            onClick={onMenuClick}
            items={itemsByRole[userRole]}
          />
        </Sider>

        <Layout style={{ marginLeft: collapsed ? 80 : 200 }}>
          <Header
            style={{
              padding: '0 24px',
              background: token.colorBgContainer,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
          >
            <div style={{ flex: 1 }}>{breadcrumb}</div>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Avatar style={{ backgroundColor: '#1890ff' }} icon={<UserOutlined />} />
                {!collapsed && <span>{usuario?.nombre || 'Usuario'}</span>}
              </div>
            </Dropdown>
          </Header>

          <Content style={{ margin: '24px' }}>
            <div
              style={{
                padding: 24,
                minHeight: 360,
                background: token.colorBgContainer,
                borderRadius: token.borderRadiusLG,
              }}
            >
              {children}
            </div>
          </Content>
        </Layout>
      </Layout>
    </CampeonatoActivoContext.Provider>
  );
};

export default MainLayout;
