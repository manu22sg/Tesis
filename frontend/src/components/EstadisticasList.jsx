import React, { useState, useEffect, useMemo } from 'react';
import { 
  Card, 
  Table, 
  Button, 
  Space, 
  message, 
  Tag, 
  Pagination, 
  ConfigProvider, 
  Tooltip, 
  Popconfirm, 
  Avatar, 
  Typography 
} from 'antd';
import locale from 'antd/locale/es_ES';
import { EditOutlined, DeleteOutlined, UserOutlined } from '@ant-design/icons';
import {
  obtenerEstadisticasPorJugador,
  obtenerEstadisticasPorSesion,
  obtenerMisEstadisticas,
  eliminarEstadistica,
} from '../services/estadistica.services.js';
import dayjs from 'dayjs';
import { formatearHora, formatearFecha } from '../utils/formatters.js';
import 'dayjs/locale/es';

dayjs.locale('es');
const { Text } = Typography;

const ListaEstadisticas = ({
  tipo = 'sesion',
  id = null,
  onEdit = null,
  userRole = 'entrenador',
  reloadKey = 0,
}) => {
  const [estadisticas, setEstadisticas] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [paginacion, setPaginacion] = useState({
    actual: 1,
    tamanioPagina: 10,
    total: 0,
  });

  const cargarEstadisticas = async (pagina = 1, limite = 10) => {
    setCargando(true);
    try {
      let respuesta;
      if (tipo === 'mias') {
        respuesta = await obtenerMisEstadisticas(pagina, limite);
      } else if (tipo === 'jugador' && id) {
        respuesta = await obtenerEstadisticasPorJugador(id, pagina, limite);
      } else if (tipo === 'sesion' && id) {
        respuesta = await obtenerEstadisticasPorSesion(id, pagina, limite);
      }
      const datos = respuesta?.data || respuesta;
      setEstadisticas(datos.estadisticas || []);
      setPaginacion({
        actual: datos.pagina || pagina,
        tamanioPagina: limite,
        total: datos.total || (datos.estadisticas?.length ?? 0),
      });
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
      message.error(error.message || 'Error al cargar las estadísticas');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarEstadisticas(paginacion.actual, paginacion.tamanioPagina);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipo, id, reloadKey]);

  const manejarCambioTabla = (pagina, tamanioPagina) => {
    cargarEstadisticas(pagina, tamanioPagina);
  };

  const manejarEliminar = async (estadisticaId) => {
    try {
      await eliminarEstadistica(estadisticaId);
      message.success('Estadística eliminada correctamente');
      setEstadisticas((prev) => prev.filter((e) => e.id !== estadisticaId));
      setPaginacion((prev) => ({ ...prev, total: Math.max(0, prev.total - 1) }));
    } catch (error) {
      console.error('Error al eliminar estadística:', error);
      message.error('Error al eliminar la estadística');
    }
  };

  // ===== Totales (para sesion, jugador o mias) =====
  const mostrarResumen = tipo === 'sesion' || tipo === 'jugador' || tipo === 'mias';
  const totales = useMemo(() => {
    const acc = {
      goles: 0,
      asistencias: 0,
      minutosJugados: 0,
      tarjetasAmarillas: 0,
      tarjetasRojas: 0,
      arcosInvictos: 0,
    };
    for (const e of estadisticas) {
      acc.goles += Number(e.goles) || 0;
      acc.asistencias += Number(e.asistencias) || 0;
      acc.minutosJugados += Number(e.minutosJugados) || 0;
      acc.tarjetasAmarillas += Number(e.tarjetasAmarillas) || 0;
      acc.tarjetasRojas += Number(e.tarjetasRojas) || 0;
      acc.arcosInvictos += Number(e.arcosInvictos) || 0;
    }
    return acc;
  }, [estadisticas]);

  // ===== Columnas =====
  const columnas = [
    ...(tipo === 'sesion'
      ? [
          {
            title: 'Jugador',
            key: 'jugador',
            render: (_, record) => {
              const usuario = record.jugador?.usuario;
              return (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Avatar size={40} icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }} />
                  <div>
                    <div style={{ fontWeight: 500 }}>{usuario?.nombre || 'Sin nombre'}</div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {usuario?.rut || 'Sin RUT'}
                    </Text>
                  </div>
                </div>
              );
            },
            width: 220,
          },
        ]
      : []),

    ...(tipo === 'jugador' || tipo === 'mias'
      ? [
          {
            title: 'Sesión',
            dataIndex: ['sesion', 'nombre'],
            key: 'sesion',
            render: (nombre, record) => {
              const fecha = formatearFecha(record.sesion?.fecha);
              const horainicio = formatearHora(record.sesion?.horaInicio);
              const horafin = formatearHora(record.sesion?.horaFin);
              return (
                <div>
                  <strong>{nombre || 'Sin nombre'}</strong>
                  <br />
                  <small style={{ color: '#888' }}>
                    {fecha} — {horainicio} - {horafin}
                  </small>
                </div>
              );
            },
            width: 250,
          },
        ]
      : []),

    { title: 'Goles', dataIndex: 'goles', key: 'goles', align: 'center', width: 100,
      render: (v) => <Tag color={v > 0 ? 'green' : 'default'}>{v}</Tag> },
    { title: 'Asistencias', dataIndex: 'asistencias', key: 'asistencias', align: 'center', width: 120,
      render: (v) => <Tag color={v > 0 ? 'blue' : 'default'}>{v}</Tag> },
    { title: 'Minutos', dataIndex: 'minutosJugados', key: 'minutosJugados', align: 'center', width: 100 },
    { title: 'T. Amarillas', dataIndex: 'tarjetasAmarillas', key: 'tarjetasAmarillas', align: 'center', width: 120,
      render: (v) => <Tag color={v > 0 ? 'gold' : 'default'}>{v}</Tag> },
    { title: 'T. Rojas', dataIndex: 'tarjetasRojas', key: 'tarjetasRojas', align: 'center', width: 100,
      render: (v) => <Tag color={v > 0 ? 'red' : 'default'}>{v}</Tag> },
    { title: 'Arcos Invictos', dataIndex: 'arcosInvictos', key: 'arcosInvictos', align: 'center', width: 140,
      render: (v) => <Tag color={v > 0 ? 'cyan' : 'default'}>{v}</Tag> },

    ...(userRole !== 'estudiante'
      ? [
          {
            title: 'Acciones',
            key: 'acciones',
            align: 'center',
            width: 120,
            render: (_, record) => (
              <Space size="small">
                {onEdit && (
                  <Tooltip title="Editar">
                    <Button type="text" size="middle" icon={<EditOutlined />} onClick={() => onEdit(record)} />
                  </Tooltip>
                )}
                <Popconfirm
                  title="¿Eliminar estadística?"
                  onConfirm={() => manejarEliminar(record.id)}
                  okText="Eliminar"
                  cancelText="Cancelar"
                  okButtonProps={{ danger: true }}
                >
                  <Tooltip title="Eliminar">
                    <Button type="text" size="middle" danger icon={<DeleteOutlined />} />
                  </Tooltip>
                </Popconfirm>
              </Space>
            ),
          },
        ]
      : []),
  ];

  // ¿hay columna de acciones al final?
  const tieneAcciones = userRole !== 'estudiante';

  return (
    <Card bodyStyle={{ paddingBottom: 0 }}>
      <ConfigProvider locale={locale}>
        <Table
          columns={columnas}
          dataSource={estadisticas}
          rowKey="id"
          loading={cargando}
          pagination={false}
          scroll={false}
          summary={
            mostrarResumen && estadisticas.length > 0
              ? () => {
                  return (
                    <Table.Summary>
                      <Table.Summary.Row>
                        {/* Primera celda: "Totales" */}
                        <Table.Summary.Cell 
                          index={0}
                          style={{ 
                            background: '#e8e8e8', 
                            fontWeight: 700,
                            borderTop: '2px solid #d0d0d0'
                          }}
                        >
                          <div style={{ textAlign: 'left', paddingLeft: 8 }}>
                            Totales
                          </div>
                        </Table.Summary.Cell>

                        {/* Stats */}
                        <Table.Summary.Cell 
                          index={1}
                          align="center"
                          style={{ 
                            background: '#e8e8e8', 
                            fontWeight: 700,
                            borderTop: '2px solid #d0d0d0'
                          }}
                        >
                          {totales.goles}
                        </Table.Summary.Cell>
                        <Table.Summary.Cell 
                          index={2}
                          align="center"
                          style={{ 
                            background: '#e8e8e8', 
                            fontWeight: 700,
                            borderTop: '2px solid #d0d0d0'
                          }}
                        >
                          {totales.asistencias}
                        </Table.Summary.Cell>
                        <Table.Summary.Cell 
                          index={3}
                          align="center"
                          style={{ 
                            background: '#e8e8e8', 
                            fontWeight: 700,
                            borderTop: '2px solid #d0d0d0'
                          }}
                        >
                          {totales.minutosJugados}
                        </Table.Summary.Cell>
                        <Table.Summary.Cell 
                          index={4}
                          align="center"
                          style={{ 
                            background: '#e8e8e8', 
                            fontWeight: 700,
                            borderTop: '2px solid #d0d0d0'
                          }}
                        >
                          {totales.tarjetasAmarillas}
                        </Table.Summary.Cell>
                        <Table.Summary.Cell 
                          index={5}
                          align="center"
                          style={{ 
                            background: '#e8e8e8', 
                            fontWeight: 700,
                            borderTop: '2px solid #d0d0d0'
                          }}
                        >
                          {totales.tarjetasRojas}
                        </Table.Summary.Cell>
                        <Table.Summary.Cell 
                          index={6}
                          align="center"
                          style={{ 
                            background: '#e8e8e8', 
                            fontWeight: 700,
                            borderTop: '2px solid #d0d0d0'
                          }}
                        >
                          {totales.arcosInvictos}
                        </Table.Summary.Cell>

                        {/* Acciones (si existe) */}
                        {tieneAcciones && (
                          <Table.Summary.Cell 
                            index={7}
                            style={{ 
                              background: '#e8e8e8',
                              borderTop: '2px solid #d0d0d0'
                            }}
                          />
                        )}
                      </Table.Summary.Row>
                    </Table.Summary>
                  );
                }
              : undefined
          }
        />

        {estadisticas.length > 0 && (
          <div style={{ textAlign: 'center', marginTop: 16, padding: '12px 0' }}>
            <Pagination
              current={paginacion.actual}
              pageSize={paginacion.tamanioPagina}
              total={paginacion.total}
              onChange={manejarCambioTabla}
              onShowSizeChange={manejarCambioTabla}
              showSizeChanger
              showTotal={(total) => `Total: ${total} registros`}
              pageSizeOptions={['5', '10', '20', '50']}
            />
          </div>
        )}
      </ConfigProvider>
    </Card>
  );
};

export default ListaEstadisticas;