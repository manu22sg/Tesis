import React, { useState } from 'react';
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
  BarChartOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const { Sider, Content, Header } = Layout;

function getItem(label, key, icon, children) {
  return { key, icon, children, label };
}

const MainLayout = ({ children, breadcrumb, selectedKeyOverride }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { usuario, logout } = useAuth();
  const token = theme.useToken().token;
  const [collapsed, setCollapsed] = useState(false);

  // 🔐 Determinar rol
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
      getItem('Gestionar Canchas', 'canchas-gestion', <EditOutlined />),
      getItem('Ver Canchas', 'canchas-ver', <EyeOutlined />),
    ]),

    getItem('Sesiones', 'sub_sesiones', <CalendarOutlined />, [
      getItem('Ver Sesiones', 'sesiones', <EyeOutlined />),
      getItem('Nueva Sesión', 'sesiones-nueva', <PlusOutlined />),
    ]),

    // ⚽ Entrenamientos
    getItem('Entrenamientos', 'entrenamientos', <FileTextOutlined />),

    getItem('Aprobar Reservas', 'aprobar-reservas', <CheckCircleOutlined />),

    // 👥 Jugadores + Lesiones
    getItem('Jugadores', 'sub_jugadores', <UserOutlined />, [
      getItem('Ver Jugadores', 'jugadores', <EyeOutlined />),
      getItem('Ver Lesiones', 'lesiones', <MedicineBoxOutlined />),
    ]),

    getItem('Grupos', 'grupos', <TeamOutlined />),
    getItem('Evaluaciones', 'evaluaciones', <TrophyOutlined />),
    
    // 📊 Estadísticas para Entrenador
    getItem('Estadísticas', 'estadisticas', <BarChartOutlined />),
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
    
    // 📊 Estadísticas para SuperAdmin
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

    // 🩹 Mis Lesiones
    getItem('Mis Lesiones', 'mis-lesiones', <MedicineBoxOutlined />),
    
    // 📊 Mis Estadísticas
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

  // 🗺️ Rutas ↔ keys
  const pathToKey = {
    '/dashboard': 'dashboard',

    // 🏟️ Canchas
    '/gestion-canchas': 'canchas-gestion',
    '/canchas': 'canchas',

    // 📅 Reservas
    '/reservas/nueva': 'reservas-nueva',
    '/reservas/mis-reservas': 'reservas-mis',
    '/aprobar-reservas': 'aprobar-reservas',

    // 📆 Sesiones
    '/sesiones': 'sesiones',
    '/sesiones/nueva': 'sesiones-nueva',

    // ⚽ Entrenamientos
    '/entrenamientos': 'entrenamientos',

    // 🩹 Lesiones
    '/lesiones': 'lesiones',
    '/mis-lesiones': 'mis-lesiones',

    // 📊 Estadísticas
    '/estadisticas': 'estadisticas',
    '/mis-estadisticas': 'mis-estadisticas',

    // ✅ Otras rutas
    '/marcar-asistencia': 'marcar-asistencia',
    '/jugadores': 'jugadores',
    '/grupos': 'grupos',
    '/evaluaciones': 'evaluaciones',
    '/mis-evaluaciones': 'mis-evaluaciones',
  };

  // Detectar si estamos en entrenamientos dentro de sesión
  let selectedKey = selectedKeyOverride;
  if (!selectedKey) {
    if (location.pathname.match(/^\/sesiones\/\d+\/entrenamientos$/)) {
      selectedKey = 'entrenamientos';
    } else {
      selectedKey = pathToKey[location.pathname] || 'dashboard';
    }
  }

  // 🔓 Submenús abiertos por defecto
  const [openKeys, setOpenKeys] = useState(() => {
    if (location.pathname.startsWith('/sesiones')) return ['sub_sesiones'];
    if (location.pathname.startsWith('/reservas')) return ['sub_reservas'];
    if (location.pathname.startsWith('/canchas')) return ['sub_canchas'];
    if (location.pathname.startsWith('/jugadores') || location.pathname.startsWith('/lesiones'))
      return ['sub_jugadores'];
    return [];
  });

  // 🔀 Navegación al hacer click
  const onMenuClick = ({ key }) => {
    const keyToPath = {
      dashboard: '/dashboard',

      // 🏟️ Canchas
      'canchas-gestion': '/gestion-canchas',
      'canchas-ver': '/canchas',
      canchas: '/canchas',

      // 📅 Reservas
      'reservas-nueva': '/reservas/nueva',
      'reservas-mis': '/reservas/mis-reservas',
      'aprobar-reservas': '/aprobar-reservas',

      // 📆 Sesiones
      sesiones: '/sesiones',
      'sesiones-nueva': '/sesiones/nueva',

      // ⚽ Entrenamientos
      entrenamientos: '/entrenamientos',

      // 🩹 Lesiones
      lesiones: '/lesiones',
      'mis-lesiones': '/mis-lesiones',

      // 📊 Estadísticas
      estadisticas: '/estadisticas',
      'mis-estadisticas': '/mis-estadisticas',

      // ✅ Otras
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
  );
};

export default MainLayout;