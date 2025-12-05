import { useState, useRef, useEffect } from 'react';
import { Avatar, Tooltip, Button, Space, Switch, App, Popconfirm, Alert, Segmented, ColorPicker, Slider } from 'antd';
import { 
  UserOutlined, SaveOutlined, UndoOutlined, LockOutlined, UnlockOutlined,
  EditOutlined, DeleteOutlined, BgColorsOutlined, HighlightOutlined
} from '@ant-design/icons';

const CampoAlineacion = ({ 
  titulares = [],
  onActualizarPosiciones, 
  onEliminarJugador,
  alineacionId // Necesitamos el ID para localStorage
}) => {
  const [jugadoresConPosicion, setJugadoresConPosicion] = useState([]);
  const [jugadorArrastrado, setJugadorArrastrado] = useState(null);
  const [modoEdicion, setModoEdicion] = useState(true);
  const [cambiosPendientes, setCambiosPendientes] = useState(false);
  const [zonaEliminacionActiva, setZonaEliminacionActiva] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [jugadorParaEliminar, setJugadorParaEliminar] = useState(null);
  
  // Estados para el sistema de dibujo
  const [modoDibujo, setModoDibujo] = useState(false);
  const [lineas, setLineas] = useState([]);
  const [puntosActuales, setPuntosActuales] = useState([]);
  const [dibujando, setDibujando] = useState(false);
  const [colorLinea, setColorLinea] = useState('#000000'); // 🆕 Negro por defecto
  const [grosorLinea, setGrosorLinea] = useState(4);
  const [conFlecha, setConFlecha] = useState(true);
  const [tipoLinea, setTipoLinea] = useState('curva'); // 🆕 'curva', 'recta', 'punteada'
  
  const campoRef = useRef(null);
  const svgRef = useRef(null);
  const { message } = App.useApp();

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
    const jugadoresInicializados = titulares.map(j => {
      const posKey = j.posicion?.toLowerCase() || 'mediocentro';
      const posDefecto = posicionesDefecto[posKey] || { x: 50, y: 50 };
      return {
        ...j,
        x: j.posicionX || posDefecto.x,
        y: j.posicionY || posDefecto.y
      };
    });
    setJugadoresConPosicion(jugadoresInicializados);
  }, [titulares]);

  // 🆕 Cargar líneas desde localStorage cuando se monta o cambia la alineación
  useEffect(() => {
    if (!alineacionId) return;
    
    try {
      const clave = `lineas-alineacion-${alineacionId}`;
      const lineasGuardadas = localStorage.getItem(clave);
      
      if (lineasGuardadas) {
        const lineasParseadas = JSON.parse(lineasGuardadas);
        setLineas(lineasParseadas);
        console.log(`✅ ${lineasParseadas.length} líneas cargadas desde localStorage`);
      }
    } catch (error) {
      console.error('Error al cargar líneas desde localStorage:', error);
    }
  }, [alineacionId]);

  // Funciones para dibujo tipo pincel
  const obtenerPosicionRelativa = (e) => {
    if (!campoRef.current) return null;
    const rect = campoRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    return { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) };
  };

  const handleMouseDownDibujo = (e) => {
    if (!modoDibujo) return;
    e.preventDefault();
    const pos = obtenerPosicionRelativa(e);
    if (!pos) return;
    
    setDibujando(true);
    setPuntosActuales([pos]);
  };

  const handleMouseMoveDibujo = (e) => {
    if (!modoDibujo || !dibujando) return;
    e.preventDefault();
    const pos = obtenerPosicionRelativa(e);
    if (!pos) return;
    
    setPuntosActuales(prev => [...prev, pos]);
  };

  const handleMouseUpDibujo = (e) => {
    if (!modoDibujo || !dibujando) return;
    e.preventDefault();
    
    if (puntosActuales.length > 3) {
      const nuevaLinea = {
        id: Date.now(),
        puntos: simplificarPuntos(puntosActuales, 2),
        color: colorLinea,
        grosor: grosorLinea,
        conFlecha: conFlecha,
        tipoLinea: tipoLinea // 🆕 Guardar el tipo de línea
      };
      setLineas(prev => [...prev, nuevaLinea]);
      setCambiosPendientes(true);
    }
    
    setDibujando(false);
    setPuntosActuales([]);
  };

  // Simplificar puntos para hacer la línea más suave
  const simplificarPuntos = (puntos, tolerancia) => {
    if (puntos.length <= 2) return puntos;
    
    const resultado = [puntos[0]];
    let ultimoPunto = puntos[0];
    
    for (let i = 1; i < puntos.length; i++) {
      const punto = puntos[i];
      const distancia = Math.sqrt(
        Math.pow(punto.x - ultimoPunto.x, 2) + 
        Math.pow(punto.y - ultimoPunto.y, 2)
      );
      
      if (distancia > tolerancia) {
        resultado.push(punto);
        ultimoPunto = punto;
      }
    }
    
    resultado.push(puntos[puntos.length - 1]);
    return resultado;
  };

  // Convertir puntos a path SVG suave (curva Catmull-Rom)
  const puntosAPath = (puntos) => {
    if (puntos.length < 2) return '';
    if (puntos.length === 2) {
      return `M ${puntos[0].x} ${puntos[0].y} L ${puntos[1].x} ${puntos[1].y}`;
    }
    
    let path = `M ${puntos[0].x} ${puntos[0].y}`;
    
    for (let i = 0; i < puntos.length - 1; i++) {
      const p0 = puntos[Math.max(i - 1, 0)];
      const p1 = puntos[i];
      const p2 = puntos[i + 1];
      const p3 = puntos[Math.min(i + 2, puntos.length - 1)];
      
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;
      
      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    
    return path;
  };

  const calcularAngulo = (p1, p2) => {
    return Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI;
  };

  const eliminarLinea = (id) => {
    setLineas(prev => prev.filter(l => l.id !== id));
    setCambiosPendientes(true); // Marcar cambios pendientes
  };

  const limpiarTodasLineas = () => {
    setLineas([]);
    setPuntosActuales([]);
    setDibujando(false);
    setCambiosPendientes(true);
    
    // 🆕 Limpiar también de localStorage
    if (alineacionId) {
      const clave = `lineas-alineacion-${alineacionId}`;
      localStorage.removeItem(clave);
      console.log('🗑️ Líneas eliminadas de localStorage');
    }
    
    message.success('Todas las líneas eliminadas');
  };

  const renderLineaCurva = (linea, temporal = false) => {
    const { puntos, color, grosor, conFlecha, tipoLinea: tipo, id } = linea;
    if (puntos.length < 2) return null;
    
    // 🆕 Determinar el path según el tipo de línea
    let path;
    let strokeDasharray = 'none';
    
    if (tipo === 'recta') {
      // Línea recta del primer al último punto
      path = `M ${puntos[0].x} ${puntos[0].y} L ${puntos[puntos.length - 1].x} ${puntos[puntos.length - 1].y}`;
    } else if (tipo === 'punteada') {
      // Línea curva con estilo punteado
      path = puntosAPath(puntos);
      strokeDasharray = '5,5';
    } else {
      // Línea curva suave (por defecto)
      path = puntosAPath(puntos);
    }
    
    const ultimoPunto = puntos[puntos.length - 1];
    const penultimoPunto = puntos[puntos.length - 2] || puntos[0];
    const angulo = calcularAngulo(penultimoPunto, ultimoPunto);

    return (
      <g key={temporal ? 'temporal' : id}>
        <path
          d={path}
          stroke={color}
          strokeWidth={grosor / 10}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={strokeDasharray}
          fill="none"
        />
        
        {conFlecha && (
          <polygon
            points="0,-2 3,0 0,2"
            fill={color}
            transform={`translate(${ultimoPunto.x},${ultimoPunto.y}) rotate(${angulo})`}
          />
        )}
        
        {!temporal && (
          <g
            onClick={() => eliminarLinea(id)}
            style={{ cursor: 'pointer' }}
            opacity="0"
            className="linea-eliminar"
          >
            <circle
              cx={puntos[Math.floor(puntos.length / 2)].x}
              cy={puntos[Math.floor(puntos.length / 2)].y}
              r="3"
              fill="white"
              stroke={color}
              strokeWidth="0.3"
            />
            <text
              x={puntos[Math.floor(puntos.length / 2)].x}
              y={puntos[Math.floor(puntos.length / 2)].y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="3"
              fill={color}
              fontWeight="bold"
            >
              ✕
            </text>
          </g>
        )}
      </g>
    );
  };

  // Funciones originales de jugadores
  const handleDragStart = (e, jugador) => {
    if (!modoEdicion || modoDibujo) return;
    setJugadorArrastrado(jugador);
    setZonaEliminacionActiva(true);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    if (!modoEdicion || modoDibujo) return;
    e.preventDefault();
  };

  const handleDrop = (e) => {
    if (!modoEdicion || !jugadorArrastrado || modoDibujo) return;
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
      // Guardar posiciones de jugadores en BD
      await onActualizarPosiciones(jugadoresConPosicion);
      
      // 🆕 Guardar líneas en localStorage
      if (alineacionId) {
        const clave = `lineas-alineacion-${alineacionId}`;
        localStorage.setItem(clave, JSON.stringify(lineas));
       // console.log(`✅ ${lineas.length} líneas guardadas en localStorage`);
      }
      
      setCambiosPendientes(false);
      
      if (lineas.length > 0) {
        message.success('Posiciones y dibujos guardados correctamente.');
      } else {
        message.success('Posiciones guardadas correctamente');
      }
    } catch (e) {
      console.error(e);
      message.error('Error al guardar posiciones');
    }
  };

  const handleResetearPosiciones = () => {
    const jugadoresReset = titulares.map(j => {
      const posKey = j.posicion?.toLowerCase() || 'mediocentro';
      const posDefecto = posicionesDefecto[posKey] || { x: 50, y: 50 };
      return { ...j, x: posDefecto.x, y: posDefecto.y };
    });
    setJugadoresConPosicion(jugadoresReset);
    setCambiosPendientes(true);
  };

  const renderJugador = (jugador) => {
    const nombre = `${jugador.jugador?.usuario?.nombre || ''} ${jugador.jugador?.usuario?.apellido || ''}`.trim();
    const iniciales = nombre.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    
    return (
      <div
        key={jugador.jugadorId}
        draggable={modoEdicion && !modoDibujo}
        onDragStart={(e) => handleDragStart(e, jugador)}
        onDragEnd={handleDragEnd}
        className={`jugador-interactivo ${modoEdicion && !modoDibujo ? 'draggable' : ''}`}
        style={{
          position: 'absolute',
          left: `${jugador.x}%`,
          top: `${jugador.y}%`,
          transform: 'translate(-50%, -50%)',
          cursor: modoEdicion && !modoDibujo ? 'move' : 'default',
          zIndex: 10,
          pointerEvents: modoDibujo ? 'none' : 'auto'
        }}
      >
        <Tooltip
          title={
            <div>
              <div><strong>{nombre}</strong></div>
              <div>#{jugador.orden} {jugador.posicion}</div>
              {jugador.comentario && (
                <div style={{ fontSize: 11, marginTop: 4 }}>{jugador.comentario}</div>
              )}
            </div>
          }
        >
          <div className="jugador-card">
            <Avatar
              size={56}
              style={{
                backgroundColor: '#014898',
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
            </div>
          </div>
        </Tooltip>
      </div>
    );
  };

  return (
    <div>
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
          max-width: 900px;
          margin: 0 auto;
          position: relative;
          box-shadow: inset 0 0 100px rgba(0, 0, 0, 0.4),
                      0 10px 40px rgba(0, 0, 0, 0.3);
          overflow: hidden;
          border: 4px solid #1a4d2e;
        }

        .campo-futbol-interactivo.modo-dibujo {
          cursor: crosshair;
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
          z-index: 1;
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
          z-index: 1;
        }

        .area-grande, .area-pequena, .punto-penal, .punto-central, 
        .circulo-esquina, .lineas-svg {
          position: absolute;
          z-index: 1;
        }

        .area-grande {
          left: 50%;
          transform: translateX(-50%);
          width: 50%;
          height: 18%;
          border: 3px solid rgba(255, 255, 255, 0.4);
        }

        .area-grande.top { top: 0; border-top: none; }
        .area-grande.bottom { bottom: 0; border-bottom: none; }

        .area-pequena {
          left: 50%;
          transform: translateX(-50%);
          width: 25%;
          height: 8%;
          border: 3px solid rgba(255, 255, 255, 0.4);
        }

        .area-pequena.top { top: 0; border-top: none; }
        .area-pequena.bottom { bottom: 0; border-bottom: none; }

        .punto-penal {
          left: 50%;
          width: 8px;
          height: 8px;
          background: rgba(255, 255, 255, 0.7);
          border-radius: 50%;
          transform: translateX(-50%);
        }

        .punto-penal.top { top: 12%; }
        .punto-penal.bottom { bottom: 12%; }

        .punto-central {
          top: 50%;
          left: 50%;
          width: 8px;
          height: 8px;
          background: rgba(255, 255, 255, 0.7);
          border-radius: 50%;
          transform: translate(-50%, -50%);
        }

        .lineas-svg {
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
        }

        .lineas-dibujo-svg {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 15;
        }

        .lineas-dibujo-svg g.linea-eliminar {
          transition: opacity 0.2s;
          pointer-events: all;
        }

        .lineas-dibujo-svg g:hover .linea-eliminar {
          opacity: 1 !important;
        }

        .circulo-esquina {
          width: 18px;
          height: 18px;
          border: 3px solid rgba(255, 255, 255, 0.4);
          border-radius: 50%;
        }

        .circulo-esquina.top-left { top: -9px; left: -9px; }
        .circulo-esquina.top-right { top: -9px; right: -9px; }
        .circulo-esquina.bottom-left { bottom: -9px; left: -9px; }
        .circulo-esquina.bottom-right { bottom: -9px; right: -9px; }

        .jugador-card { 
          display: flex; 
          flex-direction: column; 
          align-items: center; 
          gap: 8px; 
        }

        .jugador-info-overlay {
          background: linear-gradient(135deg,rgba(24, 144, 255, 0.95), rgba(16, 100, 200, 0.95));
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
          z-index: 1000;
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

        .campo-controles {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 16px;
          padding: 16px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .controles-fila {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
        }

        .panel-dibujo {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          align-items: center;
          padding: 12px;
          background: #f5f5f5;
          border-radius: 6px;
          border: 2px dashed #d9d9d9;
        }

        .panel-dibujo.activo {
          border-color: #1890ff;
          background: #e6f7ff;
        }

        @keyframes pulse {
          0%, 100% { box-shadow: 0 8px 24px rgba(255, 77, 79, 0.4); }
          50% { box-shadow: 0 8px 32px rgba(255, 77, 79, 0.7); }
        }
      `}</style>

      <div className="campo-interactivo-container">
        {titulares.length < 11 && (
          <Alert
            message={`${11 - titulares.length === 1 ? 'Falta' : 'Faltan'} ${11 - titulares.length} ${11 - titulares.length === 1 ? 'titular' : 'titulares'}`}
            description="Solo se muestran los jugadores con dorsal 1-11 en la cancha"
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        <div className="campo-controles">
          <div className="controles-fila">
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
                ⚠️ Tiene cambios sin guardar
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

          {modoEdicion && (
            <div className={`panel-dibujo ${modoDibujo ? 'activo' : ''}`}>
              <Space wrap align="center">
                <Switch
                  checked={modoDibujo}
                  onChange={(checked) => {
                    setModoDibujo(checked);
                    if (checked) {
                      message.info('🎨 Modo dibujo activado. Arrastra para dibujar líneas curvas.');
                    } else {
                      setPuntosActuales([]);
                      setDibujando(false);
                    }
                  }}
                  checkedChildren={<HighlightOutlined />}
                  unCheckedChildren={<EditOutlined />}
                />
                <span style={{ fontWeight: 500 }}>Dibujo Libre</span>
              </Space>

              {modoDibujo && (
                <>
                  <Segmented
                    value={tipoLinea}
                    onChange={setTipoLinea}
                    options={[
                      { label: '〰️ Curva', value: 'curva' },
                      { label: '─ Recta', value: 'recta' },
                      { label: '- - Punteada', value: 'punteada' }
                    ]}
                  />

                  <Space align="center">
                    <span>Flecha al final:</span>
                    <Switch
                      checked={conFlecha}
                      onChange={setConFlecha}
                      checkedChildren="Sí"
                      unCheckedChildren="No"
                    />
                  </Space>

                  <Space align="center">
                    <BgColorsOutlined />
                    <ColorPicker 
                      value={colorLinea}
                      onChange={(color) => setColorLinea(color.toHexString())}
                      presets={[
                        {
                          label: 'Colores',
                          colors: ['#000000', '#ffffff', '#ff4d4f', '#1890ff', '#52c41a', '#faad14', '#722ed1']
                        }
                      ]}
                    />
                  </Space>

                  <Space align="center" style={{ minWidth: 150 }}>
                    <span>Grosor:</span>
                    <Slider
                      min={2}
                      max={10}
                      value={grosorLinea}
                      onChange={setGrosorLinea}
                      style={{ width: 100 }}
                    />
                    <span>{grosorLinea}px</span>
                  </Space>

                  <Space>
                    <Button
                      danger
                      icon={<DeleteOutlined />}
                      onClick={limpiarTodasLineas}
                      disabled={lineas.length === 0}
                    >
                      Limpiar Todo ({lineas.length})
                    </Button>
                  </Space>
                </>
              )}
            </div>
          )}
        </div>

        <div 
          ref={campoRef} 
          className={`campo-futbol-interactivo ${modoDibujo ? 'modo-dibujo' : ''}`}
          onDragOver={handleDragOver} 
          onDrop={handleDrop}
          onMouseDown={handleMouseDownDibujo}
          onMouseMove={handleMouseMoveDibujo}
          onMouseUp={handleMouseUpDibujo}
          onMouseLeave={() => {
            if (dibujando) {
              setDibujando(false);
              setPuntosActuales([]);
            }
          }}
        >
          <svg className="lineas-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M 42 18 A 8 6 0 0 0 58 18" fill="none" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="0.3" />
            <path d="M 42 82 A 8 6 0 0 1 58 82" fill="none" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="0.3" />
          </svg>
          
          <svg 
            ref={svgRef}
            className="lineas-dibujo-svg" 
            viewBox="0 0 100 100" 
            preserveAspectRatio="none"
          >
            {lineas.map(linea => renderLineaCurva(linea))}
            
            {dibujando && puntosActuales.length > 1 && renderLineaCurva({
              puntos: puntosActuales,
              color: colorLinea,
              grosor: grosorLinea,
              conFlecha: conFlecha,
              tipoLinea: tipoLinea
            }, true)}
          </svg>
          
          <div className="punto-central" />
          <div className="area-grande top" />
          <div className="area-grande bottom" />
          <div className="area-pequena top" />
          <div className="area-pequena bottom" />
          <div className="punto-penal top" />
          <div className="punto-penal bottom" />
          <div className="circulo-esquina top-left" />
          <div className="circulo-esquina top-right" />
          <div className="circulo-esquina bottom-left" />
          <div className="circulo-esquina bottom-right" />
          
          {jugadoresConPosicion.map(renderJugador)}
        </div>

        {modoEdicion && !modoDibujo && (
          <div style={{ marginTop: 16, padding: 12, background: '#e6f7ff', border: '1px solid #91d5ff', borderRadius: 8 }}>
            ℹ️ <strong>Instrucciones:</strong> Arrastre a los jugadores para reposicionarlos. Arrastre hacia la papelera para eliminarlos.
          </div>
        )}

        {modoDibujo && (
          <div style={{ marginTop: 16, padding: 12, background: '#fff7e6', border: '1px solid #faad14', borderRadius: 8 }}>
            🖌️ <strong>Modo Dibujo Libre:</strong> Haga clic y arrastre sobre el campo para dibujar. Tipo: <strong>{tipoLinea === 'curva' ? 'Curva suave' : tipoLinea === 'recta' ? 'Línea recta' : 'Línea punteada'}</strong>. {conFlecha && 'Se agregará una flecha automáticamente al final.'} Pase el mouse sobre una línea para eliminarla.
          </div>
        )}

        <Popconfirm
          title="¿Eliminar jugador de la alineación?"
          description={
            <span>
              ¿Está seguro de quitar a{' '}
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
          <div
            className={`zona-eliminacion ${zonaEliminacionActiva ? 'activa' : ''}`}
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onDrop={handleDropEnZonaEliminacion}
          >
            <div>🗑️</div>
            <div className="zona-eliminacion-texto">Eliminar</div>
          </div>
        </Popconfirm>
      </div>
    </div>
  );
};

export default CampoAlineacion;