import { Card, Statistic, Row, Col, Progress, Alert } from 'antd';
import { 
  TeamOutlined, 
  UserOutlined, 
  CheckCircleOutlined,
  WarningOutlined 
} from '@ant-design/icons';

const EstadisticasAlineacion = ({ estadisticas, jugadores = [] }) => {
  if (!estadisticas) {
    return null;
  }

  const porcentajeTitulares = (estadisticas.titulares / 11) * 100;
  const estaCompleta = estadisticas.tieneTitularesCompletos;

  return (
    <div style={{ marginBottom: 16 }}>
      {/* Alerta de estado */}
    

      {estaCompleta && (
        <Alert
          message="Alineación Completa"
          description="Los 11 titulares están definidos"
          type="success"
          icon={<CheckCircleOutlined />}
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {/* Estadísticas principales */}
      <Row gutter={16}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Jugadores"
              value={estadisticas.total}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Titulares"
              value={estadisticas.titulares}
              suffix="/ 11"
              prefix={<UserOutlined />}
              valueStyle={{ 
                color: estadisticas.titulares === 11 ? '#52c41a' : '#faad14' 
              }}
            />
            <Progress
              percent={porcentajeTitulares}
              strokeColor={estadisticas.titulares === 11 ? '#52c41a' : '#faad14'}
              showInfo={false}
              style={{ marginTop: 8 }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Suplentes"
              value={estadisticas.suplentes}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>

       
      </Row>
    </div>
  );
};

export default EstadisticasAlineacion;