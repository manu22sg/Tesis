import { useState, useRef, useEffect } from 'react';
import { Avatar, Tag, Tooltip, Button, Space, Switch, message, Modal,Popconfirm } from 'antd';
import { UserOutlined, SaveOutlined, UndoOutlined, LockOutlined, UnlockOutlined,DeleteOutlined } from '@ant-design/icons';

const CampoAlineacion = ({ jugadores = [], onActualizarPosiciones, onEliminarJugador }) => {
  

  const [jugadoresConPosicion, setJugadoresConPosicion] = useState([]);
  const [jugadorArrastrado, setJugadorArrastrado] = useState(null);
  const [modoEdicion, setModoEdicion] = useState(true);
  const [cambiosPendientes, setCambiosPendientes] = useState(false);
  const [zonaEliminacionActiva, setZonaEliminacionActiva] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [jugadorParaEliminar, setJugadorParaEliminar] = useState(null);
  const campoRef = useRef(null);

  const posicionesDefecto = {
    'portero': { x: 50, y: 90 },
    'defensa central': { x: 50, y: 75 },
    'defensa central derecho': { x: 60, y: 75 },
    'defensa central izquierdo': { x: 40, y: 75 },
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
      if (campoRef.current) campoRef.current.getBoundingClientRect();
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    const jugadoresInicializados = jugadores.map(j => {
      const posKey = j.posicion?.toLowerCase() || 'mediocentro';
      const posDefecto = posicionesDefecto[posKey] || { x: 50, y: 50 };
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
    setZonaEliminacionActiva(true);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    if (!modoEdicion) return;
    e.preventDefault();
  };

  const handleDrop = (e) => {
    if (!modoEdicion || !jugadorArrastrado) return;
    e.preventDefault();
    const rect = campoRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
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
    setZonaEliminacionActiva(false);
  };

  const handleDropEnZonaEliminacion = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!jugadorArrastrado) return;
    if (!onEliminarJugador) {
      message.warning('No se puede eliminar el jugador desde aquí');
      setJugadorArrastrado(null);
      setZonaEliminacionActiva(false);
      return;
    }
    setJugadorParaEliminar(jugadorArrastrado);
    setConfirmVisible(true);
    setJugadorArrastrado(null);
    setZonaEliminacionActiva(false);
  };

  const handleDragEnd = () => {
    setJugadorArrastrado(null);
    setZonaEliminacionActiva(false);
  };

  const handleGuardarPosiciones = async () => {
    if (!onActualizarPosiciones) {
      message.info('Posiciones actualizadas localmente');
      setCambiosPendientes(false);
      return;
    }
    try {
      await onActualizarPosiciones(jugadoresConPosicion);
      setCambiosPendientes(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleResetearPosiciones = () => {
    const jugadoresReset = jugadores.map(j => {
      const posKey = j.posicion?.toLowerCase() || 'mediocentro';
      const posDefecto = posicionesDefecto[posKey] || { x: 50, y: 50 };
      return { ...j, x: posDefecto.x, y: posDefecto.y };
    });
    setJugadoresConPosicion(jugadoresReset);
    setCambiosPendientes(true);
  };

  const renderJugador = (jugador) => {
    const nombre = `${jugador.jugador?.usuario?.nombre || ''} ${jugador.jugador?.usuario?.apellido || ''} `.trim();
    const iniciales = nombre.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    return (
      <div
        key={jugador.jugadorId}
        draggable={modoEdicion}
        onDragStart={(e) => handleDragStart(e, jugador)}
        onDragEnd={handleDragEnd}
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
              <div><strong>{nombre}</strong></div>
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
              <div className="jugador-nombre-campo">{nombre}</div>
              {jugador.orden && <Tag className="jugador-numero-campo" color="blue">#{jugador.orden}</Tag>}
            </div>
          </div>
        </Tooltip>
      </div>
    );
  };

  return (
    <div>
      {/* 🎨 CSS completo */}
      <style>{`
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
          height: 700px;
          position: relative;
          box-shadow: inset 0 0 100px rgba(0, 0, 0, 0.4),
                      0 10px 40px rgba(0, 0, 0, 0.3);
          overflow: hidden;
          border: 4px solid #1a4d2e;
        }

        .campo-futbol-interactivo::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 0;
          right: 0;
          height: 3px;
          background: rgba(255, 255, 255, 0.4);
          transform: translateY(-50%);
        }

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
        }

        .area-grande {
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          width: 50%;
          height: 18%;
          border: 3px solid rgba(255, 255, 255, 0.3);
        }

        .area-grande.top { top: 0; border-top: none; }
        .area-grande.bottom { bottom: 0; border-bottom: none; }

        .punto-central {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 8px;
          height: 8px;
          background: rgba(255, 255, 255, 0.6);
          border-radius: 50%;
          transform: translate(-50%, -50%);
        }

        .jugador-card { display: flex; flex-direction: column; align-items: center; gap: 8px; }
        .jugador-info-overlay {
          background: linear-gradient(135deg, rgba(24, 144, 255, 0.95), rgba(16, 100, 200, 0.95));
          padding: 6px 12px;
          border-radius: 8px;
          color: white;
          font-weight: bold;
          text-align: center;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }

        .zona-eliminacion {
          position: fixed;
          bottom: 24px;
          right: 24px;
          width: 120px;
          height: 120px;
          background: linear-gradient(135deg, #ff4d4f 0%, #cf1322 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 48px;
          box-shadow: 0 8px 24px rgba(255, 77, 79, 0.4);
          border: 4px solid white;
          opacity: 0;
          transform: scale(0.5);
          transition: all 0.3s ease;
          pointer-events: none;
        }

        .zona-eliminacion.activa {
          opacity: 1;
          transform: scale(1);
          pointer-events: all;
          animation: pulse 1.5s infinite;
        }

        .zona-eliminacion-texto {
          position: absolute;
          bottom: 12px;
          font-size: 12px;
          font-weight: bold;
        }

        @keyframes pulse {
          0%, 100% { box-shadow: 0 8px 24px rgba(255, 77, 79, 0.4); }
          50% { box-shadow: 0 8px 32px rgba(255, 77, 79, 0.7); }
        }
      `}</style>

      <div className="campo-interactivo-container">
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
            <div style={{ background: '#fff7e6', border: '1px solid #ffd591', padding: '8px 12px', borderRadius: 4 }}>
               Tienes cambios sin guardar
            </div>
          )}

          <Space>
            <Button icon={<UndoOutlined />} onClick={handleResetearPosiciones} disabled={!modoEdicion}>
              Resetear
            </Button>
            <Button type="primary" icon={<SaveOutlined />} onClick={handleGuardarPosiciones} disabled={!cambiosPendientes}>
              Guardar Posiciones
            </Button>
          </Space>
        </div>

        <div ref={campoRef} className="campo-futbol-interactivo" onDragOver={handleDragOver} onDrop={handleDrop}>
          <div className="punto-central" />
          <div className="area-grande top" />
          <div className="area-grande bottom" />
          {jugadoresConPosicion.map(renderJugador)}
        </div>

        {modoEdicion && (
          <div style={{ marginTop: 16, padding: 12, background: '#e6f7ff', border: '1px solid #91d5ff', borderRadius: 8 }}>
             <strong>Instrucciones:</strong> Arrastra jugadores hacia la papelera para eliminarlos.
          </div>
        )}

        <div
          className={`zona-eliminacion ${zonaEliminacionActiva ? 'activa' : ''}`}
          onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
          onDrop={handleDropEnZonaEliminacion}
        >
          <div>🗑️</div>
          <div className="zona-eliminacion-texto">Eliminar</div>
        </div>

     <Popconfirm
  title="¿Eliminar jugador de la alineación?"
  description={
    <span>
      ¿Estás seguro de quitar a{' '}
      <strong>
        {jugadorParaEliminar?.jugador?.usuario?.nombre || ''}{' '}
        {jugadorParaEliminar?.jugador?.usuario?.apellido || ''}
      </strong>{' '}
      de la alineación?
    </span>
  }
  open={confirmVisible}
  onConfirm={async () => {
    if (!jugadorParaEliminar || !onEliminarJugador) return;
    try {
      await onEliminarJugador(jugadorParaEliminar.jugadorId);
    } catch (error) {
      console.error(error);
      message.error('Error al eliminar el jugador');
    } finally {
      setConfirmVisible(false);
      setJugadorParaEliminar(null);
    }
  }}
  onCancel={() => {
    setConfirmVisible(false);
    setJugadorParaEliminar(null);
  }}
  okText="Sí, eliminar"
  cancelText="Cancelar"
  okButtonProps={{ danger: true }}
>
  {/* Aquí va el botón o elemento que dispara el popconfirm */}
  <Button danger icon={<DeleteOutlined />} />
</Popconfirm>
      </div>
    </div>
  );
};

export default CampoAlineacion;
