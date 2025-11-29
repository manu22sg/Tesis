import React, { useState, useEffect, useMemo } from 'react';
import {
  Card, Button, Modal, message, Space, Tag, Descriptions,
  Alert, Spin, Empty, Table, Typography, Form, Select,
  DatePicker, TimePicker, Row, Col, Tooltip,Statistic, Divider,Dropdown
} from 'antd';
import {
  ThunderboltOutlined, PlayCircleOutlined, TrophyOutlined,
  FireOutlined, CheckCircleOutlined, CalendarOutlined,
  TeamOutlined,BarChartOutlined,FileExcelOutlined,    
  FilePdfOutlined,      
  DownloadOutlined      

} from '@ant-design/icons';
import { campeonatoService } from '../services/campeonato.services.js';
import { partidoService } from '../services/partido.services.js';
import { obtenerCanchas } from '../services/cancha.services.js';
import RegistrarResultadoModal from './RegistrarResultadoModal.jsx';
import EstadisticasPartidoModal from './EstadisticasPartidoModal';

import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import 'dayjs/locale/es';

import {
  formatearFecha,
  formatearRangoHoras
} from '../utils/formatters';

dayjs.extend(customParseFormat);
dayjs.locale('es');

const { Title, Text } = Typography;
const { Option } = Select;

const FixtureManager = ({ campeonatoId, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [campeonato, setCampeonato] = useState(null);
  const [partidos, setPartidos] = useState([]);
  const [canchas, setCanchas] = useState([]);
  const [modalEstadisticas, setModalEstadisticas] = useState(false);

  // Modales
  const [modalResultado, setModalResultado] = useState(false);
  const [modalProgramar, setModalProgramar] = useState(false);
  const [partidoSeleccionado, setPartidoSeleccionado] = useState(null);

  // Formularios
  const [formProgramar] = Form.useForm();

  // Helper para convertir hora (ISO o "HH:mm") a dayjs para TimePicker
  const toTimeDayjs = (v) => {
    if (!v) return null;
    // Si viene ISO (contiene "T"), parsea directo
    if (typeof v === 'string' && v.includes('T')) return dayjs(v);
    // Si viene "HH:mm" o "HH:mm:ss"
    return dayjs(v, v?.length > 5 ? 'HH:mm:ss' : 'HH:mm');
  };

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

          message.success(
            <div>
              <div><strong>¡Primera ronda generada!</strong></div>
              <div>Ronda: {resultado.ronda}</div>
              <div>Partidos creados: {resultado.partidosCreados?.length || 0}</div>
              {resultado.byes?.length > 0 && (
                <div>Equipos con BYE: {resultado.byes.length}</div>
              )}
            </div>,
            6
          );

          cargarDatos();
        } catch (error) {
          console.log(error.message)
          message.error(error?.response?.data?.error ||error.message || 'Error al sortear la primera ronda');
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const handleGenerarSiguienteRonda = async () => {
    const partidosAgrupados = agruparPartidosPorRonda();
    const rondasOrdenadas = Object.keys(partidosAgrupados).sort((a, b) => {
      const orden = { final: 1, semifinal: 2, cuartos: 3, octavos: 4 };
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
            <p>Debes finalizar todos los partidos y asignar ganadores antes de generar la siguiente ronda.</p>
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

          message.success(
          <div>
            <div><strong>¡Siguiente ronda generada!</strong></div>
            {/* Usamos '&&' para evitar mostrar "Ronda anterior: null" */}
            {resultado.rondaAnterior && <div>Ronda anterior: {getRondaNombre(resultado.rondaAnterior)}</div>}
            {resultado.ronda && <div>Nueva ronda: {getRondaNombre(resultado.ronda)}</div>}
            <div>Partidos creados: {resultado.partidosCreados}</div>
          </div>,
          4
        );

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
    formProgramar.resetFields();

    // Soporta fecha ISO o YYYY-MM-DD y hora ISO o HH:mm
    formProgramar.setFieldsValue({
      canchaId: partido.canchaId || undefined,
      fecha: partido.fecha ? dayjs(partido.fecha) : null,
      horaInicio: toTimeDayjs(partido.horaInicio),
      horaFin: toTimeDayjs(partido.horaFin),
    });

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
        message.error('Error al llegar a la final del campeonato. ');
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
    console.error(' Error completo:', error);
    console.error(' Response data:', error?.response?.data);
    message.error(error?.response?.data?.error || error?.message || 'Error al registrar resultado');
  }
};
  const handleProgramar = async (values) => {
    setLoading(true);
    try {
      const data = {
        canchaId: values.canchaId,
        fecha: values.fecha.format('YYYY-MM-DD'),
        horaInicio: values.horaInicio.format('HH:mm'),
        horaFin: values.horaFin.format('HH:mm')
      };

      await partidoService.programar(partidoSeleccionado.id, data);
      message.success('Partido programado exitosamente');
      setModalProgramar(false);
      cargarDatos();
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
    
    // Ordenar partidos dentro de cada ronda por ID para mantener orden consistente
    Object.keys(grupos).forEach(ronda => {
      grupos[ronda].sort((a, b) => a.id - b.id);
    });
    
    return grupos;
  };

  const getEstadoColor = (estado) => {
    const colors = {
      pendiente: 'default',
      programado: 'blue',
      en_curso: 'processing',
      en_juego: 'orange',
      finalizado: 'success',
      cancelado: 'error'
    };
    return colors[estado] || 'default';
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
      octavos: 'Octavos de Final'
    };
    return nombres[ronda] || ronda.replace('_', ' ').toUpperCase();
  };

  const disabledDate = (current) => {
    if (!current) return false;
    if (current < dayjs().startOf('day')) return true;
    const day = current.day();
    return day === 0 || day === 6;
  };

  const disabledTime = () => ({
    disabledHours: () => {
      const hours = [];
      for (let i = 0; i < 8; i++) hours.push(i);     // 00:00 - 07:59
      for (let i = 19; i < 24; i++) hours.push(i);   // 19:00 - 23:59
      return hours;
    },
  });
  const handleExportarExcel = async () => {
  try {
    const blob = await campeonatoService.exportarFixtureExcel(campeonatoId);
    
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `fixture_${campeonato.nombre.replace(/\s/g, '_')}_${Date.now()}.xlsx`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);

    message.success('Excel exportado correctamente');
  } catch (error) {
    console.error('Error:', error);
    message.error('Error al exportar a Excel');
  }
};

const handleExportarPDF = async () => {
  try {
    const blob = await campeonatoService.exportarFixturePDF(campeonatoId);
    
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `fixture_${campeonato.nombre.replace(/\s/g, '_')}_${Date.now()}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);

    message.success('PDF exportado correctamente');
  } catch (error) {
    console.error('Error:', error);
    message.error('Error al exportar a PDF');
  }
};


  if (!campeonato) {
    return (
      <Card>
        <Spin tip="Cargando..." />
      </Card>
    );
  }

  const partidosAgrupados = agruparPartidosPorRonda();
  const rondasOrdenadas = Object.keys(partidosAgrupados).sort((a, b) => {
    const orden = { final: 1, semifinal: 2, cuartos: 3, octavos: 4 };
    return (orden[a] || 99) - (orden[b] || 99);
  });
  const ultimaRonda = rondasOrdenadas[0];
  const esRondaFinal = ultimaRonda === 'final';

  const totalPartidos = partidos.length;
  const cantidadEquipos = campeonato?.equipos?.length || 0;
  const hayEquiposSuficientes = cantidadEquipos >= 2;

  // Columnas (con fechas y horas usando formatters)
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
                <Button type="primary" size="medium" icon={<TrophyOutlined />} disabled>
                </Button>
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
              <Tooltip title={record.estado === 'pendiente' ? "Debes programar el partido primero" : "Registrar Resultado"}>
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
      {/* Información del campeonato */}
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

      {/* Alertas de estado */}
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

      {/* Fixture por rondas */}
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
      <Modal
        title={
          <Space>
            <CalendarOutlined />
            <span>Programar Partido</span>
          </Space>
        }
        open={modalProgramar}
        onCancel={() => {
          setModalProgramar(false);
          setPartidoSeleccionado(null);
        }}
        onOk={() => formProgramar.submit()}
        confirmLoading={loading}
        okText="Programar"
        cancelText="Cancelar"
        width={600}
      >
        {partidoSeleccionado && (
          <>
        <Card size="small" style={{ marginBottom: 16, backgroundColor: '#f0f5ff', border: '1px solid #d6e4ff' }}>
  {/* Fila de Nombres de Equipo */}
  <Row gutter={16} align="middle">
    <Col span={10} style={{ textAlign: 'left' }}>
      <div style={{ fontSize: 16, fontWeight: 600, color: 'rgba(0, 0, 0, 0.88)' }}>
        {campeonato.equipos?.find(e => e.id === partidoSeleccionado.equipoAId)?.nombre || 'Equipo A'}
      </div>
    </Col>
    <Col span={4} style={{ textAlign: 'center' }}>
      <Text strong style={{ fontSize: 16 }}>VS</Text>
    </Col>
    <Col span={10} style={{ textAlign: 'right' }}>
      <div style={{ fontSize: 16, fontWeight: 600, color: 'rgba(0, 0, 0, 0.88)' }}>
        {campeonato.equipos?.find(e => e.id === partidoSeleccionado.equipoBId)?.nombre || 'Equipo B'}
      </div>
    </Col>
  </Row>

  <Divider style={{ margin: '8px 0' }} />

  {/* Fila de Info */}
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
   <span style={{
  padding: '2px 8px',
  borderRadius: 4,
  fontSize: '12px',
  fontWeight: 500,
  border: '1px solid #B9BBBB',
  backgroundColor: '#f5f5f5'
}}>
  {getRondaNombre(partidoSeleccionado.ronda)}
</span>    
    {(partidoSeleccionado.fecha || partidoSeleccionado.horaInicio) && (
      <Text type="secondary" style={{ fontSize: 12 }}>
        {partidoSeleccionado.fecha ? formatearFecha(partidoSeleccionado.fecha) : ''}
        {partidoSeleccionado.horaInicio ? ` · ${formatearRangoHoras(partidoSeleccionado.horaInicio, partidoSeleccionado.horaFin || '')}` : ''}
      </Text>
    )}
  </div>
</Card>

           <Alert
  message="Horario permitido: 08:00 a 18:00"
  type="info"
  showIcon
  style={{ marginBottom: 16 }}
/>

            <Form
              form={formProgramar}
              layout="vertical"
              onFinish={handleProgramar}
            >
              <Form.Item
                name="canchaId"
                label="Cancha"
                rules={[{ required: true, message: 'Selecciona una cancha' }]}
              >
                <Select placeholder="Seleccionar cancha">
                  {canchas.map(cancha => (
                    <Option key={cancha.id} value={cancha.id}>
                      <Space>
                        
                        {cancha.nombre}
                        {cancha.estado && (
                          <span style={{
  padding: '2px 8px',
  borderRadius: 4,
  fontSize: '12px',
  fontWeight: 500,
  border: '1px solid #B9BBBB',
  backgroundColor: '#f5f5f5'
}}>
  {cancha.estado}
</span>
                        )}
                      </Space>
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                name="fecha"
                label="Fecha"
                rules={[{ required: true, message: 'Selecciona una fecha' }]}
              >
                <DatePicker
                  style={{ width: '100%' }}
                  format="DD/MM/YYYY"
                  disabledDate={disabledDate}
                  placeholder="Seleccionar fecha"
                />
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="horaInicio"
                    label="Hora de Inicio"
                    rules={[
                      { required: true, message: 'Hora requerida' },
                      {
                        validator: (_, value) => {
                          if (!value) return Promise.resolve();
                          const hour = value.hour();
                          if (hour < 8 || hour > 18) {
                            return Promise.reject(new Error('La hora debe estar entre 08:00 y 18:00'));
                          }
                          return Promise.resolve();
                        }
                      }
                    ]}
                  >
                    <TimePicker
                      style={{ width: '100%' }}
                      format="HH:mm"
                      minuteStep={15}
                      placeholder="Entre 08:00 y 18:00"
                      disabledTime={disabledTime}
                      hideDisabledOptions
                      showNow={false}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="horaFin"
                    label="Hora de Fin"
                    dependencies={['horaInicio']}
                    rules={[
                      { required: true, message: 'Hora requerida' },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          if (!value) return Promise.resolve();
                          const horaInicio = getFieldValue('horaInicio');
                          if (!horaInicio) return Promise.resolve();

                          const hour = value.hour();
                          if (hour < 8 || hour > 18) {
                            return Promise.reject(new Error('La hora debe estar entre 08:00 y 18:00'));
                          }

                          if (value.isBefore(horaInicio) || value.isSame(horaInicio)) {
                            return Promise.reject(new Error('Debe ser posterior a la hora de inicio'));
                          }
                          return Promise.resolve();
                        },
                      }),
                    ]}
                  >
                    <TimePicker
                      style={{ width: '100%' }}
                      format="HH:mm"
                      minuteStep={15}
                      placeholder="Entre 08:00 y 18:00"
                      disabledTime={disabledTime}
                      hideDisabledOptions
                      showNow={false}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          </>
        )}
      </Modal>
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
