import { Avatar, Tag, Tooltip } from 'antd';
import { UserOutlined } from '@ant-design/icons';

const CampoAlineacion = ({ jugadores = [] }) => {
  // Agrupar jugadores por posición
  const agruparPorPosicion = () => {
    const grupos = {
      portero: [],
      defensas: [],
      mediocampistas: [],
      delanteros: []
    };

    jugadores.forEach(j => {
      const pos = j.posicion?.toLowerCase() || '';
      
      if (pos.includes('portero')) {
        grupos.portero.push(j);
      } else if (pos.includes('defensa') || pos.includes('lateral')) {
        grupos.defensas.push(j);
      } else if (pos.includes('medio') || pos.includes('extremo')) {
        grupos.mediocampistas.push(j);
      } else if (pos.includes('delantero')) {
        grupos.delanteros.push(j);
      } else {
        // Por defecto a mediocampistas
        grupos.mediocampistas.push(j);
      }
    });

    return grupos;
  };

  const grupos = agruparPorPosicion();

  const renderJugador = (jugador) => {
    const nombreCompleto = `${jugador.jugador?.usuario?.nombre || ''} ${jugador.jugador?.usuario?.apellido || ''}`.trim();
    const iniciales = nombreCompleto
      .split(' ')
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();

    return (
      <Tooltip 
        key={jugador.jugadorId}
        title={
          <div>
            <div><strong>{nombreCompleto}</strong></div>
            <div>{jugador.posicion}</div>
            {jugador.comentario && <div style={{ fontSize: 11, marginTop: 4 }}>{jugador.comentario}</div>}
          </div>
        }
      >
        <div className="jugador-campo">
          <Avatar 
            size={50} 
            style={{ 
              backgroundColor: '#1890ff',
              fontSize: 16,
              fontWeight: 'bold'
            }}
          >
            {iniciales || <UserOutlined />}
          </Avatar>
          <div className="jugador-info">
            <div className="jugador-nombre">{nombreCompleto}</div>
            {jugador.orden && (
              <Tag className="jugador-numero" color="blue">
                #{jugador.orden}
              </Tag>
            )}
          </div>
        </div>
      </Tooltip>
    );
  };

  return (
    <div style={{ position: 'relative' }}>
      <style>{`
        .campo-futbol {
          background: linear-gradient(to bottom, 
            #2d5016 0%, 
            #3a6b1f 25%, 
            #2d5016 50%, 
            #3a6b1f 75%, 
            #2d5016 100%
          );
          border-radius: 8px;
          padding: 30px 20px;
          min-height: 500px;
          display: flex;
          flex-direction: column;
          justify-content: space-around;
          position: relative;
          box-shadow: inset 0 0 50px rgba(0, 0, 0, 0.3);
        }

        .campo-futbol::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 0;
          right: 0;
          height: 2px;
          background: rgba(255, 255, 255, 0.3);
          transform: translateY(-50%);
        }

        .campo-futbol::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 80px;
          height: 80px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          transform: translate(-50%, -50%);
        }

        .linea-campo {
          display: flex;
          justify-content: space-around;
          align-items: center;
          padding: 15px 0;
          gap: 20px;
          z-index: 1;
          flex-wrap: wrap;
        }

        .portero-linea {
          justify-content: center;
        }

        .jugador-campo {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          transition: transform 0.2s;
          animation: fadeIn 0.5s ease-in;
        }

        .jugador-campo:hover {
          transform: scale(1.1);
        }

        .jugador-info {
          background: rgba(255, 255, 255, 0.95);
          padding: 6px 12px;
          border-radius: 6px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
          text-align: center;
          min-width: 100px;
        }

        .jugador-nombre {
          font-size: 12px;
          font-weight: 600;
          color: #333;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 120px;
        }

        .jugador-numero {
          margin-top: 4px;
          font-weight: bold;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 768px) {
          .campo-futbol {
            padding: 20px 10px;
            min-height: 400px;
          }

          .linea-campo {
            gap: 10px;
          }

          .jugador-info {
            min-width: 80px;
          }

          .jugador-nombre {
            font-size: 11px;
            max-width: 80px;
          }
        }
      `}</style>

      <div className="campo-futbol">
        {/* Portero */}
        {grupos.portero.length > 0 && (
          <div className="linea-campo portero-linea">
            {grupos.portero.map(renderJugador)}
          </div>
        )}

        {/* Defensas */}
        {grupos.defensas.length > 0 && (
          <div className="linea-campo defensas-linea">
            {grupos.defensas.map(renderJugador)}
          </div>
        )}

        {/* Mediocampistas */}
        {grupos.mediocampistas.length > 0 && (
          <div className="linea-campo mediocampistas-linea">
            {grupos.mediocampistas.map(renderJugador)}
          </div>
        )}

        {/* Delanteros */}
        {grupos.delanteros.length > 0 && (
          <div className="linea-campo delanteros-linea">
            {grupos.delanteros.map(renderJugador)}
          </div>
        )}
      </div>
    </div>
  );
};

export default CampoAlineacion;