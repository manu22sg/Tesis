import { useState, useRef, useEffect } from 'react';
import { Avatar, Tag, Tooltip, Button, Space, Switch, message } from 'antd';
import { UserOutlined, SaveOutlined, UndoOutlined, LockOutlined, UnlockOutlined } from '@ant-design/icons';

const CampoAlineacion = ({ jugadores = [], onActualizarPosiciones }) => {
  const [jugadoresConPosicion, setJugadoresConPosicion] = useState([]);
  const [jugadorArrastrado, setJugadorArrastrado] = useState(null);
  const [modoEdicion, setModoEdicion] = useState(true);
  const [cambiosPendientes, setCambiosPendientes] = useState(false);
  const campoRef = useRef(null);
  const [dimensionesCampo, setDimensionesCampo] = useState({ width: 0, height: 0 });

  // Posiciones por defecto según formación clásica
  const posicionesDefecto = {
    'portero': { x: 50, y: 90 },
    'defensa central': { x: 50, y: 75 },
    'lateral derecho': { x: 80, y: 75 },
    'lateral izquierdo': { x: 20, y: 75 },
    'mediocentro defensivo': { x: 50, y: 60 },
    'mediocentro': { x: 50, y: 45 },
    'mediocentro ofensivo': { x: 50, y: 30 },
    'extremo derecho': { x: 80, y: 30 },
    'extremo izquierdo': { x: 20, y: 30 },
    'delantero centro': { x: 50, y: 15 }
  };

  useEffect(() => {
    const updateDimensions = () => {
      if (campoRef.current) {
        const { width, height } = campoRef.current.getBoundingClientRect();
        setDimensionesCampo({ width, height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    // Inicializar posiciones de jugadores
    const jugadoresInicializados = jugadores.map(j => {
      const posicionKey = j.posicion?.toLowerCase() || 'mediocentro';
      const posDefecto = posicionesDefecto[posicionKey] || { x: 50, y: 50 };
      
      // Si tiene posición guardada, úsala, si no usa la default
      return {
        ...j,
        x: j.posicionX || posDefecto.x,
        y: j.posicionY || posDefecto.y
      };
    });
    
    setJugadoresConPosicion(jugadoresInicializados);
  }, [jugadores]);

  const handleDragStart = (e, jugador) => {
    if (!modoEdicion) return;
    setJugadorArrastrado(jugador);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    if (!modoEdicion) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e) => {
    if (!modoEdicion || !jugadorArrastrado) return;
    e.preventDefault();

    const campo = campoRef.current;
    const rect = campo.getBoundingClientRect();
    
    // Calcular posición relativa en porcentaje
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // Limitar dentro del campo (con margen)
    const xLimitado = Math.max(5, Math.min(95, x));
    const yLimitado = Math.max(5, Math.min(95, y));

    setJugadoresConPosicion(prev => 
      prev.map(j => 
        j.jugadorId === jugadorArrastrado.jugadorId
          ? { ...j, x: xLimitado, y: yLimitado }
          : j
      )
    );

    setCambiosPendientes(true);
    setJugadorArrastrado(null);
  };

  const handleGuardarPosiciones = async () => {
    if (!onActualizarPosiciones) {
      message.info('Posiciones actualizadas localmente');
      setCambiosPendientes(false);
      return;
    }

    try {
      // Aquí puedes llamar a una función para guardar en el backend
      await onActualizarPosiciones(jugadoresConPosicion);
      message.success('Posiciones guardadas correctamente');
      setCambiosPendientes(false);
    } catch (error) {
      message.error('Error al guardar posiciones');
    }
  };

  const handleResetearPosiciones = () => {
    const jugadoresReset = jugadores.map(j => {
      const posicionKey = j.posicion?.toLowerCase() || 'mediocentro';
      const posDefecto = posicionesDefecto[posicionKey] || { x: 50, y: 50 };
      return {
        ...j,
        x: posDefecto.x,
        y: posDefecto.y
      };
    });
    
    setJugadoresConPosicion(jugadoresReset);
    setCambiosPendientes(true);
  };

  const renderJugador = (jugador) => {
    const nombreCompleto = `${jugador.jugador?.usuario?.nombre || ''} ${jugador.jugador?.usuario?.apellido || ''}`.trim();
    const iniciales = nombreCompleto
      .split(' ')
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();

    return (
      <div
        key={jugador.jugadorId}
        draggable={modoEdicion}
        onDragStart={(e) => handleDragStart(e, jugador)}
        className={`jugador-interactivo ${modoEdicion ? 'draggable' : ''}`}
        style={{
          position: 'absolute',
          left: `${jugador.x}%`,
          top: `${jugador.y}%`,
          transform: 'translate(-50%, -50%)',
          cursor: modoEdicion ? 'move' : 'default',
          zIndex: 10
        }}
      >
        <Tooltip 
          title={
            <div>
              <div><strong>{nombreCompleto}</strong></div>
              <div>{jugador.posicion}</div>
              {jugador.comentario && <div style={{ fontSize: 11, marginTop: 4 }}>{jugador.comentario}</div>}
            </div>
          }
        >
          <div className="jugador-card">
            <Avatar 
              size={56} 
              style={{ 
                backgroundColor: '#1890ff',
                fontSize: 18,
                fontWeight: 'bold',
                border: '3px solid white',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
              }}
            >
              {iniciales || <UserOutlined />}
            </Avatar>
            <div className="jugador-info-overlay">
              <div className="jugador-nombre-campo">{nombreCompleto}</div>
              {jugador.orden && (
                <Tag className="jugador-numero-campo" color="blue">
                  #{jugador.orden}
                </Tag>
              )}
            </div>
          </div>
        </Tooltip>
      </div>
    );
  };

  return (
    <div>
      <style>{`
        .campo-interactivo-container {
          position: relative;
          width: 100%;
        }

        .campo-controles {
          margin-bottom: 16px;
          padding: 16px;
          background: #f5f5f5;
          border-radius: 8px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
        }

        .campo-futbol-interactivo {
          background: linear-gradient(to bottom, 
            #1a4d2e 0%, 
            #2d5016 20%,
            #3a6b1f 40%, 
            #2d5016 60%, 
            #3a6b1f 80%,
            #1a4d2e 100%
          );
          border-radius: 12px;
          padding: 0;
          height: 700px;
          position: relative;
          box-shadow: 
            inset 0 0 100px rgba(0, 0, 0, 0.4),
            0 10px 40px rgba(0, 0, 0, 0.3);
          overflow: hidden;
          border: 4px solid #1a4d2e;
        }

        /* Líneas del campo */
        .campo-futbol-interactivo::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 0;
          right: 0;
          height: 3px;
          background: rgba(255, 255, 255, 0.4);
          transform: translateY(-50%);
          box-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
        }

        /* Círculo central */
        .campo-futbol-interactivo::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 120px;
          height: 120px;
          border: 3px solid rgba(255, 255, 255, 0.4);
          border-radius: 50%;
          transform: translate(-50%, -50%);
          box-shadow: 0 0 20px rgba(255, 255, 255, 0.2);
        }

        /* Punto central */
        .punto-central {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 8px;
          height: 8px;
          background: rgba(255, 255, 255, 0.6);
          border-radius: 50%;
          transform: translate(-50%, -50%);
          box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
          z-index: 1;
        }

        /* Áreas */
        .area-grande {
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          width: 50%;
          height: 18%;
          border: 3px solid rgba(255, 255, 255, 0.3);
          box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.2);
        }

        .area-grande.top {
          top: 0;
          border-top: none;
        }

        .area-grande.bottom {
          bottom: 0;
          border-bottom: none;
        }

        .area-chica {
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          width: 30%;
          height: 9%;
          border: 3px solid rgba(255, 255, 255, 0.3);
          background: rgba(0, 0, 0, 0.05);
        }

        .area-chica.top {
          top: 0;
          border-top: none;
        }

        .area-chica.bottom {
          bottom: 0;
          border-bottom: none;
        }

        /* Esquinas */
        .corner {
          position: absolute;
          width: 20px;
          height: 20px;
          border: 3px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
        }

        .corner.top-left { top: -10px; left: -10px; border-bottom: none; border-right: none; }
        .corner.top-right { top: -10px; right: -10px; border-bottom: none; border-left: none; }
        .corner.bottom-left { bottom: -10px; left: -10px; border-top: none; border-right: none; }
        .corner.bottom-right { bottom: -10px; right: -10px; border-top: none; border-left: none; }

        .jugador-interactivo {
          transition: transform 0.1s ease;
        }

        .jugador-interactivo.draggable:hover {
          transform: translate(-50%, -50%) scale(1.1) !important;
        }

        .jugador-interactivo.draggable:active {
          cursor: grabbing !important;
          transform: translate(-50%, -50%) scale(1.05) !important;
        }

        .jugador-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.5));
        }

        .jugador-info-overlay {
          background: linear-gradient(135deg, rgba(24, 144, 255, 0.95), rgba(16, 100, 200, 0.95));
          padding: 6px 12px;
          border-radius: 8px;
          text-align: center;
          min-width: 100px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          border: 2px solid rgba(255, 255, 255, 0.3);
        }

        .jugador-nombre-campo {
          font-size: 13px;
          font-weight: 700;
          color: white;
          text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 140px;
        }

        .jugador-numero-campo {
          margin-top: 4px;
          font-weight: bold;
          font-size: 12px;
        }

        .cambios-pendientes {
          background: #fff7e6;
          border: 1px solid #ffd591;
          padding: 8px 12px;
          border-radius: 4px;
          color: #d46b08;
          font-size: 13px;
        }

        @media (max-width: 768px) {
          .campo-futbol-interactivo {
            height: 500px;
          }

          .jugador-info-overlay {
            min-width: 80px;
            padding: 4px 8px;
          }

          .jugador-nombre-campo {
            font-size: 11px;
            max-width: 100px;
          }
        }
      `}</style>

      <div className="campo-interactivo-container">
        {/* Controles */}
        <div className="campo-controles">
          <Space>
            <Switch 
              checked={modoEdicion}
              onChange={setModoEdicion}
              checkedChildren={<UnlockOutlined />}
              unCheckedChildren={<LockOutlined />}
            />
            <span style={{ fontWeight: 500 }}>
              {modoEdicion ? 'Modo Edición' : 'Modo Vista'}
            </span>
          </Space>

          {cambiosPendientes && (
            <div className="cambios-pendientes">
              ⚠️ Tienes cambios sin guardar
            </div>
          )}

          <Space>
            <Button 
              icon={<UndoOutlined />}
              onClick={handleResetearPosiciones}
              disabled={!modoEdicion}
            >
              Resetear
            </Button>
            <Button 
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleGuardarPosiciones}
              disabled={!cambiosPendientes}
            >
              Guardar Posiciones
            </Button>
          </Space>
        </div>

        {/* Campo de fútbol */}
        <div 
          ref={campoRef}
          className="campo-futbol-interactivo"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {/* Elementos del campo */}
          <div className="punto-central" />
          
          {/* Áreas grandes */}
          <div className="area-grande top" />
          <div className="area-grande bottom" />
          
          {/* Áreas chicas */}
          <div className="area-chica top" />
          <div className="area-chica bottom" />
          
          {/* Esquinas */}
          <div className="corner top-left" />
          <div className="corner top-right" />
          <div className="corner bottom-left" />
          <div className="corner bottom-right" />

          {/* Jugadores */}
          {jugadoresConPosicion.map(renderJugador)}
        </div>

        {/* Instrucciones */}
        {modoEdicion && (
          <div style={{ 
            marginTop: 16, 
            padding: 12, 
            background: '#e6f7ff',
            border: '1px solid #91d5ff',
            borderRadius: 8,
            fontSize: 13
          }}>
            💡 <strong>Instrucciones:</strong> Arrastra los jugadores para posicionarlos en el campo. 
            Los cambios se guardarán cuando presiones "Guardar Posiciones".
          </div>
        )}
      </div>
    </div>
  );
};

export default CampoAlineacion;