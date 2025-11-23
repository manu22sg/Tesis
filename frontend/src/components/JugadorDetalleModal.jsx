import { Modal, Tag, Space, Typography } from 'antd';
import { UserOutlined, TeamOutlined } from '@ant-design/icons';
import { formatearFecha } from '../utils/formatters';
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
              <div>{jugador.usuario?.nombre || '—'} {jugador.usuario?.apellido || ''}</div>
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
              <Text strong>Fecha de Nacimiento:</Text>
              <div>
                {formatearFecha(jugador.fechaNacimiento) || '—'}
              </div>
            </div>
            
              <div>
    <Text strong>Año de Ingreso al Sistema:</Text>
    <div>{jugador.anioIngreso || '—'}</div>
  </div>
          </div>

     {(
  jugador.posicion ||
  jugador.posicionSecundaria ||
  jugador.piernaHabil ||
  jugador.altura ||
  jugador.peso ||
  jugador.imc ||
  jugador.estado
) && (
  <>
    <h3>Información Deportiva</h3>

    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 16,
        marginBottom: 24
      }}
    >
      {jugador.posicion && (
        <div>
          <Text strong>Posición:</Text>
          <div>{jugador.posicion}</div>
        </div>
      )}

      {jugador.posicionSecundaria && (
        <div>
          <Text strong>Posición Secundaria:</Text>
          <div>{jugador.posicionSecundaria}</div>
        </div>
      )}

      {jugador.piernaHabil && (
        <div>
          <Text strong>Pierna Hábil:</Text>
          <div>{jugador.piernaHabil}</div>
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

      {jugador.imc && (
        <div>
          <Text strong>IMC:</Text>
          <div>{jugador.imc}</div>
        </div>
      )}

      {jugador.estado && (
        <div>
          <Text strong>Estado:</Text>
          <div>
            <Tag color={ESTADO_COLORS[jugador.estado]}>
              {jugador.estado?.toUpperCase() || 'N/A'}
            </Tag>
          </div>
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
              <div>{jugador.usuario?.carrera?.nombre || '—'}</div>
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