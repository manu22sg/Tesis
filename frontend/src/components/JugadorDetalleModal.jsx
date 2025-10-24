import { Modal, Tag, Space, Typography } from 'antd';
import { UserOutlined, TeamOutlined } from '@ant-design/icons';

const { Text } = Typography;

const ESTADO_COLORS = {
  activo: 'success',
  inactivo: 'default',
  lesionado: 'error',
  suspendido: 'warning'
};

export default function JugadorDetalleModal({ 
  visible, 
  onClose, 
  jugador, 
  loading 
}) {
  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <UserOutlined />
          <span>Detalle del Jugador</span>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={700}
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <UserOutlined style={{ fontSize: 48, color: '#ccc' }} />
          <p>Cargando...</p>
        </div>
      ) : jugador ? (
        <div>
          {/* Información Personal */}
          <h3 style={{ marginTop: 0 }}>Información Personal</h3>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: 16,
            marginBottom: 24 
          }}>
            <div>
              <Text strong>Nombre:</Text>
              <div>{jugador.usuario?.nombre || '—'}</div>
            </div>
            <div>
              <Text strong>RUT:</Text>
              <div>{jugador.usuario?.rut || '—'}</div>
            </div>
            <div>
              <Text strong>Email:</Text>
              <div>{jugador.usuario?.email || '—'}</div>
            </div>
            <div>
              <Text strong>Teléfono:</Text>
              <div>{jugador.telefono || '—'}</div>
            </div>
            <div>
              <Text strong>Fecha de Nacimiento:</Text>
              <div>
                {jugador.fechaNacimiento 
                  ? new Date(jugador.fechaNacimiento).toLocaleDateString('es-ES')
                  : '—'}
              </div>
            </div>
            <div>
              <Text strong>Estado:</Text>
              <div>
                <Tag color={ESTADO_COLORS[jugador.estado]}>
                  {jugador.estado?.toUpperCase() || 'N/A'}
                </Tag>
              </div>
            </div>
          </div>

          {/* Información Deportiva */}
          {(jugador.posicion || jugador.lateralidad || jugador.altura || jugador.peso) && (
            <>
              <h3>Información Deportiva</h3>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: 16,
                marginBottom: 24 
              }}>
                {jugador.posicion && (
                  <div>
                    <Text strong>Posición:</Text>
                    <div>{jugador.posicion}</div>
                  </div>
                )}
                {jugador.lateralidad && (
                  <div>
                    <Text strong>Lateralidad:</Text>
                    <div>{jugador.lateralidad}</div>
                  </div>
                )}
                {jugador.altura && (
                  <div>
                    <Text strong>Altura:</Text>
                    <div>{jugador.altura} cm</div>
                  </div>
                )}
                {jugador.peso && (
                  <div>
                    <Text strong>Peso:</Text>
                    <div>{jugador.peso} kg</div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Información Académica */}
          <h3>Información Académica</h3>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: 16,
            marginBottom: 24 
          }}>
            <div>
              <Text strong>Carrera:</Text>
              <div>{jugador.carrera || '—'}</div>
            </div>
            <div>
              <Text strong>Año de Ingreso:</Text>
              <div>{jugador.anioIngreso || '—'}</div>
            </div>
          </div>

          {/* Grupos */}
          <h3>Grupos Asignados</h3>
          {jugador.jugadorGrupos?.length > 0 ? (
            <Space wrap>
              {jugador.jugadorGrupos.map((jg) => (
                <Tag 
                  key={jg.grupo?.id} 
                  icon={<TeamOutlined />} 
                  color="blue"
                  style={{ padding: '4px 12px' }}
                >
                  {jg.grupo?.nombre}
                </Tag>
              ))}
            </Space>
          ) : (
            <Text type="secondary">No está asignado a ningún grupo</Text>
          )}
        </div>
      ) : null}
    </Modal>
  );
}