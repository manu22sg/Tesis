import { Card, Row, Col, Avatar, Descriptions, Tag, Space, Statistic } from 'antd';
import { 
  UserOutlined, 
  IdcardOutlined, 
  MailOutlined, 
  CalendarOutlined,
  TrophyOutlined,
  BookOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  RiseOutlined
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext.jsx';
import MainLayout from '../components/MainLayout.jsx';

export default function Dashboard() {
  const { usuario } = useAuth();

  const getInitials = (nombre, apellido) => {
    return `${nombre?.charAt(0) || ''}${apellido?.charAt(0) || ''}`.toUpperCase();
  };

  const esEstudiante = usuario?.rol === 'estudiante';
  const esAcademico = usuario?.rol === 'academico';
  const tienePerfilJugador = usuario?.jugador !== null && usuario?.jugador !== undefined;

  return (
    <MainLayout>
      <div style={{ padding: '24px', background: '#f0f2f5', minHeight: 'calc(100vh - 64px)' }}>
        {/* Header con bienvenida */}
        <Card 
          style={{ 
            marginBottom: 24, 
            background: 'linear-gradient(135deg, #014898 0%, #0066cc 100%)',
            color: 'white',
            border: 'none'
          }}
          bodyStyle={{ padding: '32px' }}
        >
          <Row align="middle" gutter={24}>
            <Col>
              <Avatar 
                size={80} 
                style={{ 
                  backgroundColor: '#fff', 
                  color: '#014898', 
                  fontSize: 32, 
                  fontWeight: 'bold',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }}
              >
                {getInitials(usuario?.nombre, usuario?.apellido)}
              </Avatar>
            </Col>
            <Col flex="auto">
              <h1 style={{ color: 'white', margin: 0, fontSize: 28, fontWeight: 600 }}>
                Bienvenido, {usuario?.nombre} {usuario?.apellido}
              </h1>
              <Space size="middle" style={{ marginTop: 12 }}>
                <Tag 
                  color="#014898" 
                  style={{ 
                    fontSize: 14, 
                    padding: '6px 16px',
                    borderRadius: 6,
                    fontWeight: 500,
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    color: 'white'
                  }}
                >
                  {usuario?.rol?.toUpperCase()}
                </Tag>
                <Tag 
                  color="#52c41a"
                  style={{ 
                    fontSize: 14, 
                    padding: '6px 16px',
                    borderRadius: 6,
                    fontWeight: 500
                  }}
                >
                  {usuario?.estado?.toUpperCase()}
                </Tag>
              </Space>
            </Col>
          </Row>
        </Card>

        <Row gutter={[16, 16]}>
          {/* Información Personal */}
          <Col xs={24} lg={12}>
            <Card 
              title={
                <Space>
                  <UserOutlined style={{ color: '#014898', fontSize: 18 }} />
                  <span style={{ fontSize: 16, fontWeight: 600 }}>Información Personal</span>
                </Space>
              }
              hoverable
              style={{ height: '100%' }}
              headStyle={{ 
                backgroundColor: '#f5f8fc', 
                borderBottom: '2px solid #014898' 
              }}
            >
              <Descriptions column={1} bordered size="middle">
                <Descriptions.Item 
                  label={
                    <Space>
                      <IdcardOutlined style={{ color: '#014898' }} />
                      <span>RUT</span>
                    </Space>
                  }
                >
                  <strong>{usuario?.rut || 'No disponible'}</strong>
                </Descriptions.Item>
                <Descriptions.Item 
                  label={
                    <Space>
                      <UserOutlined style={{ color: '#014898' }} />
                      <span>Nombre Completo</span>
                    </Space>
                  }
                >
                  <strong>{usuario?.nombre} {usuario?.apellido}</strong>
                </Descriptions.Item>
                <Descriptions.Item 
                  label={
                    <Space>
                      <MailOutlined style={{ color: '#014898' }} />
                      <span>Correo Electrónico</span>
                    </Space>
                  }
                >
                  {usuario?.email}
                </Descriptions.Item>
                <Descriptions.Item 
                  label={
                    <Space>
                      <UserOutlined style={{ color: '#014898' }} />
                      <span>Sexo</span>
                    </Space>
                  }
                >
                  {usuario?.sexo || 'No especificado'}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>

          {/* Información Académica */}
          {(esEstudiante || esAcademico) && (
            <Col xs={24} lg={12}>
              <Card 
                title={
                  <Space>
                    <BookOutlined style={{ color: '#014898', fontSize: 18 }} />
                    <span style={{ fontSize: 16, fontWeight: 600 }}>Información Académica</span>
                  </Space>
                }
                hoverable
                style={{ height: '100%' }}
                headStyle={{ 
                  backgroundColor: '#f5f8fc', 
                  borderBottom: '2px solid #014898' 
                }}
              >
                <Descriptions column={1} bordered size="middle">
                  {esEstudiante && (
                    <>
                      <Descriptions.Item 
                        label={
                          <Space>
                            <BookOutlined style={{ color: '#014898' }} />
                            <span>Carrera</span>
                          </Space>
                        }
                      >
                        <strong>{usuario?.carrera?.nombre || 'No especificada'}</strong>
                      </Descriptions.Item>
                      <Descriptions.Item 
                        label={
                          <Space>
                            <CalendarOutlined style={{ color: '#014898' }} />
                            <span>Año de Ingreso</span>
                          </Space>
                        }
                      >
                        {usuario?.anioIngresoUniversidad || 'No especificado'}
                      </Descriptions.Item>
                      {usuario?.anioIngresoUniversidad && (
                        <Descriptions.Item 
                          label={
                            <Space>
                              <RiseOutlined style={{ color: '#014898' }} />
                              <span>Años en la Universidad</span>
                            </Space>
                          }
                        >
                          {new Date().getFullYear() - usuario.anioIngresoUniversidad} años
                        </Descriptions.Item>
                      )}
                    </>
                  )}
                  {esAcademico && (
                    <>
                      <Descriptions.Item 
                        label={
                          <Space>
                            <BookOutlined style={{ color: '#014898' }} />
                            <span>Departamento</span>
                          </Space>
                        }
                      >
                        <strong>{usuario?.carrera?.nombre || 'No especificado'}</strong>
                      </Descriptions.Item>
                      <Descriptions.Item 
                        label={
                          <Space>
                            <UserOutlined style={{ color: '#014898' }} />
                            <span>Cargo</span>
                          </Space>
                        }
                      >
                        Académico
                      </Descriptions.Item>
                    </>
                  )}
                </Descriptions>
              </Card>
            </Col>
          )}

          {/* Información Deportiva */}
          {tienePerfilJugador && (
            <Col xs={24} lg={12}>
              <Card 
                title={
                  <Space>
                    <TrophyOutlined style={{ color: '#014898', fontSize: 18 }} />
                    <span style={{ fontSize: 16, fontWeight: 600 }}>Perfil Deportivo</span>
                  </Space>
                }
                hoverable
                style={{ height: '100%' }}
                headStyle={{ 
                  backgroundColor: '#f5f8fc', 
                  borderBottom: '2px solid #014898' 
                }}
              >
                <Descriptions column={1} bordered size="middle">
                  <Descriptions.Item 
                    label={
                      <Space>
                        <TeamOutlined style={{ color: '#014898' }} />
                        <span>Posición</span>
                      </Space>
                    }
                  >
                    <strong>{usuario?.jugador?.posicion || 'No especificada'}</strong>
                  </Descriptions.Item>
                  <Descriptions.Item 
                    label={
                      <Space>
                        <CalendarOutlined style={{ color: '#014898' }} />
                        <span>Año de Ingreso Deportivo</span>
                      </Space>
                    }
                  >
                    {usuario?.jugador?.anioIngreso || 'No especificado'}
                  </Descriptions.Item>
                  <Descriptions.Item 
                    label={
                      <Space>
                        <TrophyOutlined style={{ color: '#014898' }} />
                        <span>Estado</span>
                      </Space>
                    }
                  >
                    <Tag color={usuario?.jugador?.estado === 'activo' ? '#52c41a' : '#999'}>
                      {usuario?.jugador?.estado?.toUpperCase() || 'NO ESPECIFICADO'}
                    </Tag>
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            </Col>
          )}

          {/* Estadísticas de Actividad */}
          <Col xs={24} lg={tienePerfilJugador ? 12 : 24}>
            <Card 
              title={
                <Space>
                  <ClockCircleOutlined style={{ color: '#014898', fontSize: 18 }} />
                  <span style={{ fontSize: 16, fontWeight: 600 }}>Estadísticas de Actividad</span>
                </Space>
              }
              hoverable
              style={{ height: '100%' }}
              headStyle={{ 
                backgroundColor: '#f5f8fc', 
                borderBottom: '2px solid #014898' 
              }}
            >
              <Row gutter={16}>
                <Col xs={24} sm={8}>
                  <Statistic
                    title="Reservas Realizadas"
                    value={0}
                    prefix={<CalendarOutlined />}
                    valueStyle={{ color: '#014898', fontSize: 28, fontWeight: 600 }}
                  />
                </Col>
                <Col xs={24} sm={8}>
                  <Statistic
                    title="Partidos Jugados"
                    value={0}
                    prefix={<TrophyOutlined />}
                    valueStyle={{ color: '#014898', fontSize: 28, fontWeight: 600 }}
                  />
                </Col>
                <Col xs={24} sm={8}>
                  <Statistic
                    title="Horas en Cancha"
                    value={0}
                    suffix="hrs"
                    prefix={<ClockCircleOutlined />}
                    valueStyle={{ color: '#014898', fontSize: 28, fontWeight: 600 }}
                  />
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      </div>
    </MainLayout>
  );
}