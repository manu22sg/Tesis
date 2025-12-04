import React, { useState, useEffect, useMemo } from 'react';
import {
  Card, Button, Modal, App, Space, Descriptions,
  Alert, Spin, Empty, Table, Typography, Tooltip, Dropdown
} from 'antd';
import {
  ThunderboltOutlined, PlayCircleOutlined, TrophyOutlined,
  FireOutlined, CheckCircleOutlined, CalendarOutlined,
  TeamOutlined, BarChartOutlined, FileExcelOutlined,    
  FilePdfOutlined, DownloadOutlined
} from '@ant-design/icons';
import { campeonatoService } from '../services/campeonato.services.js';
import { partidoService } from '../services/partido.services.js';
import { obtenerCanchas } from '../services/cancha.services.js';
import { buscarUsuarios } from '../services/auth.services.js';
import RegistrarResultadoModal from './RegistrarResultadoModal.jsx';
import EstadisticasPartidoModal from './EstadisticasPartidoModal.jsx';
import ProgramarPartidoModal from './ProgramarPartidoModal.jsx';

import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import 'dayjs/locale/es';

import {
  formatearFecha,
  formatearRangoHoras
} from '../utils/formatters';

dayjs.extend(customParseFormat);
dayjs.locale('es');

const { Text } = Typography;

const FixtureManager = ({ campeonatoId, onUpdate }) => {
  const { message } = App.useApp(); 

  const [loading, setLoading] = useState(false);
  const [campeonato, setCampeonato] = useState(null);
  const [partidos, setPartidos] = useState([]);
  const [canchas, setCanchas] = useState([]);
  const [modalEstadisticas, setModalEstadisticas] = useState(false);

  // Modales
  const [modalResultado, setModalResultado] = useState(false);
  const [modalProgramar, setModalProgramar] = useState(false);
  const [partidoSeleccionado, setPartidoSeleccionado] = useState(null);

  const nombreGanador = useMemo(() => {
    if (campeonato?.estado !== 'finalizado' || !partidos || !campeonato?.equipos) {
      return null;
    }
    const partidoFinal = partidos.find(p => p.ronda === 'final');
    if (!partidoFinal || !partidoFinal.ganadorId) return null;
    const equipoGanador = campeonato.equipos.find(e => e.id === partidoFinal.ganadorId);
    return equipoGanador?.nombre || null;
  }, [campeonato?.estado, partidos, campeonato?.equipos]);

  useEffect(() => {
    if (campeonatoId) {
      cargarDatos();
      cargarCanchas();
    }
  }, [campeonatoId]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const data = await campeonatoService.obtener(campeonatoId);
      setCampeonato(data);
      setPartidos(data.partidos || []);
      if (onUpdate) onUpdate();
    } catch (error) {
      message.error(error?.response?.data?.error || 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const cargarCanchas = async () => {
    try {
      const responseCanchas = await obtenerCanchas();
      setCanchas(responseCanchas.canchas || []);
    } catch (error) {
      console.error('Error al cargar canchas:', error);
      setCanchas([]);
    }
  };

  const verificarDisponibilidad = async (params) => {
  try {
    const resp = await partidoService.verificarDisponibilidad(params);
    return resp; // <<--- el modal espera un objeto con { disponible: true/false, message: ... }
  } catch (error) {
    console.error("Error al verificar disponibilidad:", error);
    throw error;
  }
};


const handleSortearPrimeraRonda = async () => {
  Modal.confirm({
    title: '¿Sortear Primera Ronda?',
    content: 'Esto generará automáticamente los partidos de la primera ronda basándose en los equipos inscritos.',
    okText: 'Sí, sortear',
    cancelText: 'Cancelar',
    onOk: async () => {
      setLoading(true);
      try {
        const resultado = await campeonatoService.sortearPrimeraRonda(campeonatoId);

        
        
 
       

        const cantidadPartidos = Array.isArray(resultado.partidosCreados) 
          ? resultado.partidosCreados.length 
          : (resultado.partidosCreados || 0);

  

        message.success(
          <div>
            <div><strong>¡Primera ronda generada!</strong></div>
            {resultado.ronda && <div>Ronda: {getRondaNombre(resultado.ronda)}</div>}
            <div>Partidos creados: {cantidadPartidos}</div>
            {resultado.byes?.length > 0 && (
              <div>Equipos con BYE: {resultado.byes.length}</div>
            )}
          </div>,
          6
        );

        cargarDatos();
      } catch (error) {
        console.error('Error completo:', error);
        message.error(error?.response?.data?.error || error.message || 'Error al sortear la primera ronda');
      } finally {
        setLoading(false);
      }
    }
  });
};


const handleGenerarSiguienteRonda = async () => {
  const partidosAgrupados = agruparPartidosPorRonda();
  const rondasOrdenadas = Object.keys(partidosAgrupados).sort((a, b) => {
    const orden = { final: 1, semifinal: 2, cuartos: 3, octavos: 4, dieciseisavos: 5 };
    return (orden[a] || 99) - (orden[b] || 99);
  });
  const ultimaRonda = rondasOrdenadas[0];
  const partidosUltimaRonda = partidosAgrupados[ultimaRonda] || [];
  const partidosPendientes = partidosUltimaRonda.filter(p => p.estado !== 'finalizado');

  if (partidosPendientes.length > 0) {
    Modal.warning({
      title: 'Partidos pendientes',
      content: (
        <div>
          <p>Hay {partidosPendientes.length} partido(s) pendiente(s) en la ronda "{getRondaNombre(ultimaRonda)}".</p>
          <p>Debe finalizar todos los partidos y asignar ganadores antes de generar la siguiente ronda.</p>
        </div>
      ),
    });
    return;
  }

  Modal.confirm({
    title: '¿Generar Siguiente Ronda?',
    content: (
      <div>
        <p>Se generará automáticamente la siguiente ronda con los ganadores de "{getRondaNombre(ultimaRonda)}".</p>
        <Alert
          message="Importante"
          description="Asegúrate de que todos los partidos estén finalizados y tengan un ganador asignado."
          type="info"
          showIcon
          style={{ marginTop: 12 }}
        />
      </div>
    ),
    okText: 'Sí, generar',
    cancelText: 'Cancelar',
    icon: <PlayCircleOutlined />,
    onOk: async () => {
      setLoading(true);
      try {
        const resultado = await campeonatoService.generarSiguienteRonda(campeonatoId);

       

        // ✅ Manejar partidosCreados como array o número
        const cantidadPartidos = Array.isArray(resultado.partidosCreados) 
          ? resultado.partidosCreados.length 
          : (resultado.partidosCreados || 0);

    

        // Si el campeonato finalizó
        if (resultado.fin && !resultado.ronda) {
          message.success(
            <div>
              <div><strong>¡Campeonato Finalizado! 🏆</strong></div>
              {resultado.nombreGanador && (
                <div>Campeón: {resultado.nombreGanador}</div>
              )}
              {resultado.mensaje && <div>{resultado.mensaje}</div>}
            </div>,
            6
          );
        } else {
          // Siguiente ronda generada normalmente
          message.success(
            <div>
              <div><strong>¡Siguiente ronda generada!</strong></div>
              {resultado.rondaAnterior && <div>Ronda anterior: {getRondaNombre(resultado.rondaAnterior)}</div>}
              {resultado.ronda && <div>Nueva ronda: {getRondaNombre(resultado.ronda)}</div>}
              <div>Partidos creados: {cantidadPartidos}</div>
            </div>,
            4
          );
        }

        cargarDatos();
      } catch (error) {
        message.error(error?.response?.data?.error || 'Error al generar siguiente ronda');
      } finally {
        setLoading(false);
      }
    }
  });
};


  const handleAbrirModalResultado = (partido) => {
    setPartidoSeleccionado(partido);
    setModalResultado(true);
  };

  const handleAbrirModalProgramar = (partido) => {
    setPartidoSeleccionado(partido);
    setModalProgramar(true);
  };

  const handleRegistrarResultado = async (datos) => {
    const { partidoId, golesA, golesB, penalesA, penalesB } = datos;
    const esLaFinal = partidoSeleccionado?.ronda === 'final';

    try {
      const payload = {
        golesA: Number(golesA),
        golesB: Number(golesB),
        penalesA: penalesA !== null && penalesA !== undefined ? Number(penalesA) : null,
        penalesB: penalesB !== null && penalesB !== undefined ? Number(penalesB) : null
      };

      await partidoService.registrarResultado(partidoId, payload);

      if (esLaFinal) {
        setLoading(true);
        
        try {
          const resultado = await campeonatoService.generarSiguienteRonda(campeonatoId);
          if (resultado.fin) {
            message.success('¡Campeonato ha finalizado!', 3);
          }
        } catch (finError) {
          message.error('Error al llegar a la final del campeonato.');
        } finally {
          setLoading(false);
        }
      } else {
        message.success('Resultado registrado exitosamente');
      }

      setModalResultado(false);
      setPartidoSeleccionado(null);
      cargarDatos();

    } catch (error) {
      console.error('Error completo:', error);
      console.error('Response data:', error?.response?.data);
      message.error(error?.response?.data?.error || error?.message || 'Error al registrar resultado');
    }
  };
const handleProgramar = async (values, arbitroSeleccionado) => {
  setLoading(true);
  try {
    const data = {
      canchaId: values.canchaId,
      fecha: values.fecha.format('YYYY-MM-DD'),
      horaInicio: values.horaInicio.format('HH:mm'),
      horaFin: values.horaFin.format('HH:mm'),
      arbitroId: arbitroSeleccionado.id
    };

    const partidoActualizado = await partidoService.programar(partidoSeleccionado.id, data);
    
    // ✅ Actualizar los estados
    setCampeonato(prev => ({
      ...prev,
      partidos: prev.partidos.map(p => 
        p.id === partidoActualizado.id ? partidoActualizado : p
      )
    }));
    
    setPartidos(prev => prev.map(p => 
      p.id === partidoActualizado.id ? partidoActualizado : p
    ));
    
    message.success('Partido programado exitosamente');
    setModalProgramar(false);
    setPartidoSeleccionado(null);  
    
  } catch (error) {
    console.error('❌ Error al programar:', error);
    message.error(error?.response?.data?.error || 'Error al programar partido');
  } finally {
    setLoading(false);
  }
};

  const agruparPartidosPorRonda = () => {
    const grupos = {};
    partidos.forEach(partido => {
      if (!grupos[partido.ronda]) {
        grupos[partido.ronda] = [];
      }
      grupos[partido.ronda].push(partido);
    });
    
    Object.keys(grupos).forEach(ronda => {
      grupos[ronda].sort((a, b) => a.id - b.id);
    });
    
    return grupos;
  };

  const getEstadoText = (estado) => {
    const texts = {
      pendiente: 'Pendiente',
      programado: 'Programado',
      en_curso: 'En Curso',
      en_juego: 'En Juego',
      finalizado: 'Finalizado',
      cancelado: 'Cancelado'
    };
    return texts[estado] || estado;
  };

  const getRondaNombre = (ronda) => {
    const nombres = {
      final: 'Final',
      semifinal: 'Semifinal',
      cuartos: 'Cuartos de Final',
      octavos: 'Octavos de Final',
      dieciseisavos: 'Dieciseisavos de Final'
    };
    return nombres[ronda] || ronda.replace('_', ' ').toUpperCase();
  };

  const handleExportarExcel = async () => {
  try {
    const result = await campeonatoService.exportarFixtureExcel(campeonatoId);

    if (result.modo === "web" && result.blob) {
      descargarArchivo(result.blob, result.nombre);
      message.success("Excel descargado correctamente");
    } else if (result.modo === "mobile" && result.base64) {
      console.log("BASE64 recibido:", result.base64);
      message.success("Archivo generado (mobile)");
    }

  } catch (error) {
    console.error('Error:', error);
    message.error(error.message || 'Error al exportar a Excel');
  }
};

const handleExportarPDF = async () => {
  try {
    const result = await campeonatoService.exportarFixturePDF(campeonatoId);

    if (result.modo === "web" && result.blob) {
      descargarArchivo(result.blob, result.nombre);
      message.success("PDF descargado correctamente");
    } else if (result.modo === "mobile" && result.base64) {
      console.log("BASE64 recibido:", result.base64);
      message.success("Archivo generado (mobile)");
    }

  } catch (error) {
    console.error('Error:', error);
    message.error(error.message || 'Error al exportar a PDF');
  }
};

function descargarArchivo(blob, nombre) {
  if (typeof window === 'undefined' || !window.URL?.createObjectURL) {
    console.error('createObjectURL no disponible');
    return;
  }

  try {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = nombre;
    a.click();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error al descargar archivo:', error);
  }
}


  if (!campeonato) {
    return (
      <Card>
        <Spin tip="Cargando..." />
      </Card>
    );
  }

  const partidosAgrupados = agruparPartidosPorRonda();
  const rondasOrdenadas = Object.keys(partidosAgrupados).sort((a, b) => {
    const orden = { final: 1, semifinal: 2, cuartos: 3, octavos: 4, dieciseisavos: 5};
    return (orden[a] || 99) - (orden[b] || 99);
  });
  const ultimaRonda = rondasOrdenadas[0];
  const esRondaFinal = ultimaRonda === 'final';

  const totalPartidos = partidos.length;
  const cantidadEquipos = campeonato?.equipos?.length || 0;
  const hayEquiposSuficientes = cantidadEquipos >= 2;

  const columns = [
    {
      title: 'N°',
      dataIndex: 'orden',
      key: 'orden',
      width: 60,
      align: 'center',
      render: (orden) => <Text strong>{orden}</Text>
    },
    {
      title: 'Equipo A',
      dataIndex: 'equipoAId',
      key: 'equipoA',
      width: 180,
      render: (id) => {
        const equipo = campeonato.equipos?.find(e => e.id === id);
        return (
          <Space>
            <TeamOutlined style={{ color: '#014898' }} />
            <Text strong>{equipo?.nombre || `Equipo ${id}`}</Text>
          </Space>
        );
      }
    },
    {
      title: 'Resultado',
      key: 'resultado',
      align: 'center',
      width: 140,
      render: (_, record) => (
        <div>
          <Text strong style={{ fontSize: 16 }}>
            {record.golesA ?? '-'} - {record.golesB ?? '-'}
          </Text>
          {record.definidoPorPenales && (
            <div>
              <Text type="warning" style={{ fontSize: 12 }}>
                Penales: {record.penalesA} - {record.penalesB}
              </Text>
            </div>
          )}
        </div>
      )
    },
    {
      title: 'Equipo B',
      dataIndex: 'equipoBId',
      key: 'equipoB',
      width: 180,
      render: (id) => {
        const equipo = campeonato.equipos?.find(e => e.id === id);
        return (
          <Space>
            <TeamOutlined style={{ color: '#006B5B' }} />
            <Text strong>{equipo?.nombre || `Equipo ${id}`}</Text>
          </Space>
        );
      }
    },
    {
      title: 'Ganador',
      dataIndex: 'ganadorId',
      key: 'ganador',
      width: 150,
      render: (id) => {
        if (!id) return <Text type="secondary">-</Text>;
        const equipo = campeonato.equipos?.find(e => e.id === id);
        return (
          <span style={{
            padding: '2px 8px',
            borderRadius: 4,
            fontSize: '12px',
            fontWeight: 500,
            border: '1px solid #B9BBBB',
            backgroundColor: '#f5f5f5'
          }}>
            {equipo?.nombre || `Equipo ${id}`}
          </span>
        );
      }
    },
    {
      title: 'Cancha',
      dataIndex: 'canchaId',
      key: 'cancha',
      width: 130,
      render: (id) => {
        if (!id) return <Text type="secondary">Sin asignar</Text>;
        const cancha = canchas.find(c => c.id === id);
        return <Text>{cancha?.nombre || `Cancha ${id}`}</Text>;
      }
    },
    {
      title: 'Fecha/Hora',
      key: 'fechaHora',
      width: 180,
      render: (_, record) => {
        if (!record.fecha) return <Text type="secondary">No programado</Text>;
        return (
          <Space direction="vertical" size={0}>
            <Text>{formatearFecha(record.fecha)}</Text>
            {(record.horaInicio || record.horaFin) && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                {formatearRangoHoras(record.horaInicio, record.horaFin || '')}
              </Text>
            )}
          </Space>
        );
      }
    },
    {
      title: 'Estado',
      dataIndex: 'estado',
      key: 'estado',
      width: 120,
      render: (estado) => (
        <span style={{
          padding: '2px 8px',
          borderRadius: 4,
          fontSize: '12px',
          fontWeight: 500,
          border: '1px solid #B9BBBB',
          backgroundColor: '#f5f5f5'
        }}>
          {getEstadoText(estado)}
        </span>
      )
    },
    {
      title: 'Acciones',
      key: 'acciones',
      width: 180,
      render: (_, record) => (
        <Space size="small">
          {record.estado === 'finalizado' ? (
            <>
              <Tooltip title="Partido finalizado">
                <Button type="text" size="medium" icon={<CalendarOutlined />} disabled />
              </Tooltip>
              <Tooltip title="Partido finalizado">
                <Button type="primary" size="medium" icon={<TrophyOutlined />} disabled />
              </Tooltip>
              <Tooltip title="Ver/Editar Estadísticas">
                <Button
                  type="default"
                  size="medium"
                  icon={<BarChartOutlined />}
                  onClick={() => {
                    setPartidoSeleccionado(record);
                    setModalEstadisticas(true);
                  }}
                />
              </Tooltip>
            </>
          ) : (
            <>
              {['pendiente', 'programado'].includes(record.estado) && (
                <Tooltip title="Programar">
                  <Button
                    type="text"
                    size="medium"
                    icon={<CalendarOutlined />}
                    onClick={() => handleAbrirModalProgramar(record)}
                  />
                </Tooltip>
              )}
              <Tooltip title={record.estado === 'pendiente' ? "Debe programar el partido primero" : "Registrar Resultado"}>
                <Button
                  type="primary"
                  size="medium"
                  icon={<TrophyOutlined />}
                  onClick={() => handleAbrirModalResultado(record)}
                  disabled={record.estado === 'pendiente'}
                />
              </Tooltip>
            </>
          )}
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card
        title={
          <Space>
            <TrophyOutlined />
            <span>{campeonato.nombre}</span>
          </Space>
        }
        extra={
          <Space>
            {totalPartidos > 0 && (
              <Dropdown
                menu={{
                  items: [
                    {
                      key: 'excel',
                      icon: <FileExcelOutlined />,
                      label: 'Exportar a Excel',
                      onClick: handleExportarExcel,
                    },
                    {
                      key: 'pdf',
                      icon: <FilePdfOutlined />,
                      label: 'Exportar a PDF',
                      onClick: handleExportarPDF,
                    },
                  ],
                }}
                placement="bottomRight"
              >
                <Button icon={<DownloadOutlined />}>
                  Exportar Fixture
                </Button>
              </Dropdown>
            )}

            {campeonato.estado === 'creado' && totalPartidos === 0 && (
              <Button
                type="primary"
                icon={<ThunderboltOutlined />}
                onClick={handleSortearPrimeraRonda}
                loading={loading}
                disabled={!hayEquiposSuficientes}
              >
                Sortear Primera Ronda
              </Button>
            )}

            {campeonato.estado === 'en_juego' && !esRondaFinal && (
              <Button
                type="primary"
                icon={<PlayCircleOutlined />}
                onClick={handleGenerarSiguienteRonda}
                loading={loading}
              >
                Generar Siguiente Ronda
              </Button>
            )}
          </Space>
        }
        style={{ marginBottom: 16 }}
      >
        <Descriptions column={4} size="small">
          <Descriptions.Item label="Formato">
            <span style={{
              padding: '2px 8px',
              borderRadius: 4,
              fontSize: '12px',
              fontWeight: 500,
              border: '1px solid #B9BBBB',
              backgroundColor: '#f5f5f5'
            }}>
              {campeonato.formato}
            </span>
          </Descriptions.Item>
          <Descriptions.Item label="Género">
            <span style={{
              padding: '2px 8px',
              borderRadius: 4,
              fontSize: '12px',
              fontWeight: 500,
              border: '1px solid #B9BBBB',
              backgroundColor: '#f5f5f5'
            }}>
              {campeonato.genero.charAt(0).toUpperCase() + campeonato.genero.slice(1)}
            </span>
          </Descriptions.Item>
          <Descriptions.Item label="Estado">
            <span style={{
              padding: '2px 8px',
              borderRadius: 4,
              fontSize: '12px',
              fontWeight: 500,
              border: '1px solid #B9BBBB',
              backgroundColor: '#f5f5f5'
            }}>
              {getEstadoText(campeonato.estado)}
            </span>
          </Descriptions.Item>
          <Descriptions.Item label="Año/Semestre">
            {campeonato.anio} - S{campeonato.semestre}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {campeonato.estado === 'creado' && totalPartidos === 0 && !hayEquiposSuficientes && (
        <Alert
          message="Equipos insuficientes"
          description={`Se necesitan al menos 2 equipos para generar el fixture. Actualmente hay ${cantidadEquipos} equipo(s) inscrito(s).`}
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {campeonato.estado === 'creado' && totalPartidos === 0 && hayEquiposSuficientes && (
        <Alert
          message="Campeonato sin fixture"
          description={`Este campeonato tiene ${cantidadEquipos} equipos inscritos. Haz clic en "Sortear Primera Ronda" para generar el fixture automáticamente.`}
          type="info"
          showIcon
          icon={<ThunderboltOutlined />}
          style={{ marginBottom: 16 }}
        />
      )}

      {campeonato.estado === 'finalizado' && (
        <Alert
          message={
            <Space style={{ fontSize: 15, fontWeight: 'bold' }}>
              ¡Campeonato Finalizado!
            </Space>
          }
          description={
            nombreGanador
              ? `Este campeonato ha concluido. ¡El campeón es ${nombreGanador}!`
              : "Este campeonato ha concluido. Consulta la ronda final para ver al campeón."
          }
          type="success"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {totalPartidos > 0 ? (
        <div>
          {rondasOrdenadas.map((ronda) => {
            const partidosRonda = partidosAgrupados[ronda];
            const partidosFinalizados = partidosRonda.filter(p => p.estado === 'finalizado').length;
            const todosFinalizados = partidosFinalizados === partidosRonda.length;

            return (
              <Card
                key={ronda}
                title={
                  <Space>
                    <FireOutlined style={{ color: '#ff4d4f' }} />
                    <span>{getRondaNombre(ronda)}</span>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: 4,
                      fontSize: '12px',
                      fontWeight: 500,
                      border: '1px solid #B9BBBB',
                      backgroundColor: '#f5f5f5'
                    }}>
                      {partidosRonda.length} {partidosRonda.length === 1 ? 'partido' : 'partidos'}
                    </span>
                    {todosFinalizados && (
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: 4,
                        fontSize: '12px',
                        fontWeight: 500,
                        border: '1px solid #B9BBBB',
                        backgroundColor: '#f5f5f5',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <CheckCircleOutlined /> Completa
                      </span>
                    )}
                  </Space>
                }
                style={{ marginBottom: 16 }}
              >
                <Table
                  dataSource={partidosRonda.map((partido, idx) => ({
                    ...partido,
                    orden: idx + 1
                  }))}
                  rowKey="id"
                  pagination={false}
                  size="small"
                  columns={columns}
                  scroll={{ x: false }}
                />
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="No hay partidos generados"
          >
            {campeonato.estado === 'creado' && hayEquiposSuficientes && (
              <Button
                type="primary"
                icon={<ThunderboltOutlined />}
                onClick={handleSortearPrimeraRonda}
              >
                Sortear Primera Ronda
              </Button>
            )}
          </Empty>
        </Card>
      )}

      {/* Modal para registrar resultado */}
      <RegistrarResultadoModal
        visible={modalResultado}
        onCancel={() => {
          setModalResultado(false);
          setPartidoSeleccionado(null);
        }}
        onSuccess={handleRegistrarResultado}
        partido={partidoSeleccionado}
        equipos={campeonato.equipos}
      />

      {/* Modal para programar partido */}
      <ProgramarPartidoModal
        visible={modalProgramar}
        onCancel={() => {
          setModalProgramar(false);
          setPartidoSeleccionado(null);
        }}
        onSuccess={handleProgramar}
        partido={partidoSeleccionado}
        canchas={canchas}
        equipos={campeonato.equipos}
        loading={loading}
        buscarUsuarios={buscarUsuarios}
        formatearFecha={formatearFecha}
        formatearRangoHoras={formatearRangoHoras}
        getRondaNombre={getRondaNombre}
        verificarDisponibilidad={verificarDisponibilidad}
      />

      {/* Modal de estadísticas */}
      <EstadisticasPartidoModal
        visible={modalEstadisticas}
        onCancel={() => {
          setModalEstadisticas(false);
          setPartidoSeleccionado(null);
        }}
        partido={partidoSeleccionado}
        campeonatoId={campeonatoId}
        equipos={campeonato.equipos}
        getRondaNombre={getRondaNombre}
      />
    </div>
  );
};

export default FixtureManager;