import { Card, Row, Col, Tag, Space, Typography, Divider, Tooltip } from 'antd';
import {
  ThunderboltOutlined,
  TrophyOutlined,
  SafetyOutlined,
  TeamOutlined,
  RobotOutlined,
  CalendarOutlined,
  UserOutlined
} from '@ant-design/icons';
import { formatearFechaCompleta } from '../utils/formatters.js';

const { Text, Title } = Typography;

const FORMACIONES_INFO = {
  '4-3-3': {
    descripcion: 'Formación ofensiva con tres delanteros y control del mediocampo',
    distribucion: '1 Portero, 4 Defensas, 3 Mediocampistas, 3 Delanteros'
  },
  '3-4-3': {
    descripcion: 'Formación ultra ofensiva con tres centrales y cuatro mediocampistas',
    distribucion: '1 Portero, 3 Defensas, 4 Mediocampistas, 3 Delanteros'
  },
  '4-2-4': {
    descripcion: 'Formación muy ofensiva con cuatro delanteros',
    distribucion: '1 Portero, 4 Defensas, 2 Mediocampistas, 4 Delanteros'
  },
  '5-4-1': {
    descripcion: 'Formación defensiva con cinco defensores',
    distribucion: '1 Portero, 5 Defensas, 4 Mediocampistas, 1 Delantero'
  },
  '5-3-2': {
    descripcion: 'Formación defensiva con cinco atrás y dos delanteros',
    distribucion: '1 Portero, 5 Defensas, 3 Mediocampistas, 2 Delanteros'
  },
  '4-5-1': {
    descripcion: 'Formación defensiva con mediocampo reforzado',
    distribucion: '1 Portero, 4 Defensas, 5 Mediocampistas, 1 Delantero'
  }
};

export default function InfoAlineacionInteligente({ alineacion }) {
  // Si no es una alineación generada automáticamente, no mostrar nada
  if (!alineacion?.generadaAuto) {
    return null;
  }

  // Extraer información de los comentarios de los jugadores
  const primerJugador = alineacion.jugadores?.[0];
  let formacion = null;
  let tipoAlineacion = null;

  // Intentar extraer la formación del comentario
  if (primerJugador?.comentario) {
    const match = primerJugador.comentario.match(/formación\s+([0-9-]+)/i);
    if (match) {
      formacion = match[1];
    }
  }

  // Determinar el tipo de alineación basándose en la formación
  if (formacion) {
    const formacionesOfensivas = ['4-3-3', '3-4-3', '4-2-4'];
    const formacionesDefensivas = ['5-4-1', '5-3-2', '4-5-1'];
    
    if (formacionesOfensivas.includes(formacion)) {
      tipoAlineacion = 'ofensiva';
    } else if (formacionesDefensivas.includes(formacion)) {
      tipoAlineacion = 'defensiva';
    }
  }

  const infoFormacion = formacion ? FORMACIONES_INFO[formacion] : null;

  const getTipoIcon = () => {
    if (tipoAlineacion === 'ofensiva') {
      return <TrophyOutlined style={{ fontSize: 20, color: '#ff4d4f' }} />;
    }
    if (tipoAlineacion === 'defensiva') {
      return <SafetyOutlined style={{ fontSize: 20, color: '#1890ff' }} />;
    }
    return <TeamOutlined style={{ fontSize: 20, color: '#52c41a' }} />;
  };

  const getTipoColor = () => {
    if (tipoAlineacion === 'ofensiva') return 'red';
    if (tipoAlineacion === 'defensiva') return 'blue';
    return 'green';
  };

  return (
    <Card
      style={{ 
        marginBottom: 16,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        border: 'none'
      }}
      bodyStyle={{ padding: '16px 24px' }}
    >
      <Row align="middle" gutter={[24, 16]}>
        {/* Indicador de Alineación Inteligente */}
        <Col xs={24} sm={24} md={6}>
          <Space direction="vertical" size={4} style={{ width: '100%' }}>
            <Space align="center">
              <RobotOutlined style={{ fontSize: 24, color: '#fff' }} />
              <div>
                <Text strong style={{ color: '#fff', fontSize: 16 }}>
                  Alineación Sugerida
                </Text>
                <br />
                <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12 }}>
                  Generada automáticamente
                </Text>
              </div>
            </Space>
          </Space>
        </Col>

        {/* Tipo de Alineación */}
        {tipoAlineacion && (
          <Col xs={24} sm={8} md={5}>
            <Space direction="vertical" size={4} style={{ width: '100%' }}>
              <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12 }}>
                Tipo
              </Text>
              <Space align="center">
                {getTipoIcon()}
                <Tag 
                  color={getTipoColor()} 
                  style={{ 
                    fontSize: 14, 
                    padding: '4px 12px',
                    fontWeight: 600,
                    textTransform: 'capitalize'
                  }}
                >
                  {tipoAlineacion}
                </Tag>
              </Space>
            </Space>
          </Col>
        )}

        {/* Formación */}
        {formacion && (
          <Col xs={24} sm={8} md={5}>
            <Space direction="vertical" size={4} style={{ width: '100%' }}>
              <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12 }}>
                Formación
              </Text>
              <Text 
                strong 
                style={{ 
                  color: '#fff', 
                  fontSize: 20,
                  fontFamily: 'monospace',
                  letterSpacing: 2
                }}
              >
                {formacion}
              </Text>
            </Space>
          </Col>
        )}

        {/* Información adicional */}
        {infoFormacion && (
          <Col xs={24} sm={8} md={8}>
            <Space direction="vertical" size={4} style={{ width: '100%' }}>
              <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12 }}>
                Distribución
              </Text>
              <Text style={{ color: '#fff', fontSize: 13 }}>
                {infoFormacion.distribucion}
              </Text>
            </Space>
          </Col>
        )}
      </Row>

      {/* Descripción de la formación */}
      {infoFormacion?.descripcion && (
        <>
          <Divider style={{ margin: '12px 0', borderColor: 'rgba(255,255,255,0.2)' }} />
          <Row>
            <Col span={24}>
              <Text 
                style={{ 
                  color: 'rgba(255,255,255,0.95)', 
                  fontSize: 13,
                  fontStyle: 'italic'
                }}
              >
                💡 {infoFormacion.descripcion}
              </Text>
            </Col>
          </Row>
        </>
      )}

      {/* Criterio de selección */}
      <Divider style={{ margin: '12px 0', borderColor: 'rgba(255,255,255,0.2)' }} />
      <Row>
        <Col span={24}>
          <Space size={16} wrap>
               <Tooltip title="Se seleccionaron los mejores jugadores según sus estadísticas registradas en las ultimas 10 sesiones">
              <Space>
                <UserOutlined style={{ color: 'rgba(255,255,255,0.85)' }} />
                <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12 }}>
                  {formacion && ` • Formación ${formacion || 'holaa'}`}
                </Text>
              </Space>
            </Tooltip>
            
            {alineacion.fechaCreacion && (
              <Space>
                <CalendarOutlined style={{ color: 'rgba(255,255,255,0.85)' }} />
                <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12 }}>
                  {formatearFechaCompleta(alineacion.fechaCreacion)}
                </Text>
              </Space>
            )}

            <Tooltip title="Algoritmo que considera goles, asistencias, precisión, recuperaciones y más">
              <Tag 
                color="purple" 
                style={{ 
                  fontSize: 11,
                  padding: '2px 8px',
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  color: '#fff'
                }}
              >
                Algoritmo
              </Tag>
            </Tooltip>
          </Space>
        </Col>
      </Row>
    </Card>
  );
}