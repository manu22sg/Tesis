import { Card, Avatar, Empty, Tag, Space, Tooltip, Button, Popconfirm } from 'antd';
import { UserOutlined, DeleteOutlined, SwapOutlined } from '@ant-design/icons';

const PanelSuplentes = ({ 
  suplentes = [], 
  sinDefinir = [],
  onEliminarJugador,
  onPromoverATitular 
}) => {
  
  const renderJugador = (jugador, tipo) => {
    const nombre = `${jugador.jugador?.usuario?.nombre || ''} ${jugador.jugador?.usuario?.apellido || ''}`.trim();
    const iniciales = nombre.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    
    return (
      <Card 
        key={jugador.jugadorId} 
        size="small"
        style={{ marginBottom: 8 }}
        hoverable
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar 
            size={40} 
            style={{ 
              backgroundColor: tipo === 'suplente' ? '#faad14' : '#8c8c8c',
              fontWeight: 'bold'
            }}
          >
            {iniciales || <UserOutlined />}
          </Avatar>
          
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 500, fontSize: 13 }}>
              {jugador.orden && (
                <Tag color="default" style={{ marginRight: 4 }}>
                  #{jugador.orden}
                </Tag>
              )}
              {nombre}
            </div>
            <div style={{ fontSize: 11, color: '#999' }}>
              {jugador.posicion}
            </div>
          </div>

          <Space size="small">
            {onPromoverATitular && tipo === 'suplente' && (
              <Tooltip title="Promover a titular">
                <Button
                  type="text"
                  size="small"
                  icon={<SwapOutlined />}
                  onClick={() => onPromoverATitular(jugador)}
                />
              </Tooltip>
            )}
            
            {onEliminarJugador && (
              <Popconfirm
                title="¿Eliminar jugador?"
                description={`¿Quitar a ${nombre} de la alineación?`}
                onConfirm={() => onEliminarJugador(jugador.jugadorId)}
                okText="Sí"
                cancelText="No"
                okButtonProps={{ danger: true }}
              >
                <Tooltip title="Eliminar">
                  <Button
                    type="text"
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                  />
                </Tooltip>
              </Popconfirm>
            )}
          </Space>
        </div>
        
        {jugador.comentario && (
          <div style={{ 
            marginTop: 8, 
            fontSize: 11, 
            color: '#666',
            fontStyle: 'italic',
            paddingTop: 8,
            borderTop: '1px solid #f0f0f0'
          }}>
            💬 {jugador.comentario}
          </div>
        )}
      </Card>
    );
  };

  const totalJugadores = suplentes.length + sinDefinir.length;

  if (totalJugadores === 0) {
    return (
      <Card 
        title="🪑 Suplentes" 
        style={{ height: '100%' }}
        styles={{ body: { height: 'calc(100% - 57px)', display: 'flex', alignItems: 'center', justifyContent: 'center' } }}
      >
        <Empty 
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="No hay suplentes"
          style={{ margin: 0 }}
        />
      </Card>
    );
  }

  return (
    <Card 
      title={
        <Space>
          <span>🪑 Suplentes</span>
          <Tag color="gold">{suplentes.length}</Tag>
          {sinDefinir.length > 0 && (
            <Tag color="default">{sinDefinir.length} sin definir</Tag>
          )}
        </Space>
      }
      style={{ height: '100%' }}
      styles={{ 
        body: { 
          maxHeight: 'calc(100% - 57px)', 
          overflowY: 'auto',
          paddingRight: 8
        } 
      }}
    >
      {/* SUPLENTES */}
      {suplentes.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ 
            fontSize: 12, 
            fontWeight: 600, 
            color: '#faad14',
            marginBottom: 8,
            textTransform: 'uppercase',
            letterSpacing: 0.5
          }}>
            Suplentes ({suplentes.length})
          </div>
          {suplentes.map(j => renderJugador(j, 'suplente'))}
        </div>
      )}

      {/* SIN DEFINIR 
      
       {sinDefinir.length > 0 && (
        <div>
          <div style={{ 
            fontSize: 12, 
            fontWeight: 600, 
            color: '#8c8c8c',
            marginBottom: 8,
            textTransform: 'uppercase',
            letterSpacing: 0.5
          }}>
            Sin Definir ({sinDefinir.length})
          </div>
          {sinDefinir.map(j => renderJugador(j, 'sin_definir'))}
        </div>
      )}
      */}
    
     
    </Card>
  );
};

export default PanelSuplentes;