import React, { useEffect, useMemo, useState, useRef } from 'react';
import {
  Card, Table, Space, Tooltip, Popconfirm, Avatar, Typography, Pagination, ConfigProvider, message, Tag, Button
} from 'antd';
import locale from 'antd/locale/es_ES';
import { EditOutlined, DeleteOutlined, UserOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import 'dayjs/locale/es';

import {
  obtenerEstadisticasPorJugador,
  obtenerEstadisticasPorSesion,
  obtenerMisEstadisticas,
  eliminarEstadistica,
} from '../services/estadistica.services.js';
import { formatearHora, formatearFecha } from '../utils/formatters.js';

dayjs.locale('es');
const { Text } = Typography;

const ListaEstadisticas = ({
  tipo = 'sesion',
  id = null,
  filtroJugadorId,
  filtroSesionId,
  userRole = 'entrenador',
  onEdit = null,
  reloadKey = 0,
}) => {
  const [estadisticas, setEstadisticas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [paginacion, setPaginacion] = useState({
    actual: 1,
    tamanioPagina: 10,
    total: 0,
  });

  // ✅ Control de requests (igual que Grupos.jsx)
  const requestIdRef = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // ✅ Función de carga (no useCallback, función normal)
  const cargarDatos = async (page = 1, limit = 10) => {
    if (!id && tipo !== 'mias') {
      setEstadisticas([]);
      setPaginacion({ actual: 1, tamanioPagina: limit, total: 0 });
      return;
    }

    const reqId = ++requestIdRef.current;
    setLoading(true);
    
    try {
      let respuesta;
      if (tipo === 'mias') {
        respuesta = await obtenerMisEstadisticas(page, limit);
      } else if (tipo === 'sesion') {
        respuesta = await obtenerEstadisticasPorSesion(id, page, limit);
      } else if (tipo === 'jugador') {
        respuesta = await obtenerEstadisticasPorJugador(id, page, limit);
      }

      // Ignorar respuestas viejas
      if (reqId !== requestIdRef.current) return;

      const datos = respuesta?.data || respuesta || {};
      const lista = datos.estadisticas || [];
      const total = datos.total ?? lista.length;

      // Filtros secundarios cliente
      const listFiltrada = lista.filter((e) => {
        const okJugador = filtroJugadorId ? Number(e?.jugador?.id) === Number(filtroJugadorId) : true;
        const okSesion  = filtroSesionId ? Number(e?.sesion?.id)  === Number(filtroSesionId)  : true;
        return okJugador && okSesion;
      });

      setEstadisticas(listFiltrada);
      setPaginacion({
        actual: datos.page || page,
        tamanioPagina: limit,
        total: (filtroJugadorId || filtroSesionId) ? listFiltrada.length : total,
      });
    } catch (err) {
      if (!mountedRef.current) return;
      console.error('Error al cargar estadísticas:', err);
      message.error('Error al cargar las estadísticas');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  // ✅ Effect único: solo carga cuando cambian filtros o reloadKey
  // La página siempre es 1 cuando cambian filtros
  useEffect(() => {
    cargarDatos(1, paginacion.tamanioPagina);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipo, id, filtroJugadorId, filtroSesionId, reloadKey, paginacion.tamanioPagina]);

  const onPage = (page, size) => {
    setPaginacion({ ...paginacion, actual: page, tamanioPagina: size });
    cargarDatos(page, size);
  };

  const onDelete = async (estadisticaId) => {
    try {
      await eliminarEstadistica(estadisticaId);
      message.success('Estadística eliminada');
      cargarDatos(paginacion.actual, paginacion.tamanioPagina);
    } catch (e) {
      console.error('Error eliminando estadística:', e);
      message.error('No se pudo eliminar la estadística');
    }
  };

  // Totales
  const totales = useMemo(() => {
    const t = { goles: 0, asistencias: 0, minutosJugados: 0, tarjetasAmarillas: 0, tarjetasRojas: 0, arcosInvictos: 0 };
    for (const e of estadisticas) {
      t.goles            += Number(e.goles) || 0;
      t.asistencias      += Number(e.asistencias) || 0;
      t.minutosJugados   += Number(e.minutosJugados) || 0;
      t.tarjetasAmarillas+= Number(e.tarjetasAmarillas) || 0;
      t.tarjetasRojas    += Number(e.tarjetasRojas) || 0;
      t.arcosInvictos    += Number(e.arcosInvictos) || 0;
    }
    return t;
  }, [estadisticas]);

  // Columnas
  const columnas = useMemo(() => {
    const base = [];

    if (tipo === 'sesion') {
      base.push({
        title: 'Jugador',
        key: 'jugador',
        width: 240,
        render: (_, record) => {
          const u = record?.jugador?.usuario;
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Avatar size={40} icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }} />
              <div>
                <div style={{ fontWeight: 500 }}>{u?.nombre || 'Sin nombre'}</div>
                <Text type="secondary" style={{ fontSize: 12 }}>{u?.rut || 'Sin RUT'}</Text>
              </div>
            </div>
          );
        },
      });
    }

    if (tipo === 'jugador' || tipo === 'mias') {
      base.push({
        title: 'Sesión',
        key: 'sesion',
        width: 260,
        render: (_, record) => {
          const s = record?.sesion;
          const f = formatearFecha(s?.fecha);
          const hi = formatearHora(s?.horaInicio);
          const hf = s?.horaFin ? formatearHora(s?.horaFin) : '';
          return (
            <div>
              <strong>{s?.tipoSesion || 'Sin nombre'}</strong><br />
              <small style={{ color: '#888' }}>{f} — {hi}{hf ? ` - ${hf}` : ''}</small>
            </div>
          );
        }
      });
    }

    base.push(
  { title: 'Goles', dataIndex: 'goles', key: 'goles', align: 'center', width: 90,
    render: (v) => <span style={{
      padding: '2px 8px',
      borderRadius: 4,
      fontSize: '12px',
      fontWeight: 500,
      border: '1px solid #B9BBBB',
      backgroundColor: '#f5f5f5'
    }}>{v ?? 0}</span> },
  { title: 'Asistencias', dataIndex: 'asistencias', key: 'asistencias', align: 'center', width: 110,
    render: (v) => <span style={{
      padding: '2px 8px',
      borderRadius: 4,
      fontSize: '12px',
      fontWeight: 500,
      border: '1px solid #B9BBBB',
      backgroundColor: '#f5f5f5'
    }}>{v ?? 0}</span> },
  { title: 'Minutos', dataIndex: 'minutosJugados', key: 'minutosJugados', align: 'center', width: 100,
    render: (v) => v ?? 0 },
  { title: 'T. Amarillas', dataIndex: 'tarjetasAmarillas', key: 'tarjetasAmarillas', align: 'center', width: 120,
    render: (v) => <span style={{
      padding: '2px 8px',
      borderRadius: 4,
      fontSize: '12px',
      fontWeight: 500,
      border: '1px solid #B9BBBB',
      backgroundColor: '#f5f5f5'
    }}>{v ?? 0}</span> },
  { title: 'T. Rojas', dataIndex: 'tarjetasRojas', key: 'tarjetasRojas', align: 'center', width: 100,
    render: (v) => <span style={{
      padding: '2px 8px',
      borderRadius: 4,
      fontSize: '12px',
      fontWeight: 500,
      border: '1px solid #B9BBBB',
      backgroundColor: '#f5f5f5'
    }}>{v ?? 0}</span> },
  { title: 'Arcos Invictos', dataIndex: 'arcosInvictos', key: 'arcosInvictos', align: 'center', width: 130,
    render: (v) => <span style={{
      padding: '2px 8px',
      borderRadius: 4,
      fontSize: '12px',
      fontWeight: 500,
      border: '1px solid #B9BBBB',
      backgroundColor: '#f5f5f5'
    }}>{v ?? 0}</span> },
);

    if (userRole !== 'estudiante') {
      base.push({
        title: 'Acciones',
        key: 'acciones',
        align: 'center',
        width: 120,
        render: (_, record) => (
          <Space size="small">
            {onEdit && (
              <Tooltip title="Editar">
                <Button type="primary" size="middle" icon={<EditOutlined />} onClick={() => onEdit(record)} />
              </Tooltip>
            )}
            <Popconfirm
              title="¿Eliminar estadística?"
              okText="Eliminar"
              cancelText="Cancelar"
              okButtonProps={{ danger: true }}
              onConfirm={() => onDelete(record.id)}
            >
              <Tooltip title="Eliminar">
                <Button type="text" size="middle" danger icon={<DeleteOutlined />} />
              </Tooltip>
            </Popconfirm>
          </Space>
        ),
      });
    }

    return base;
  }, [tipo, onEdit, userRole]);

  const mostrarResumen = estadisticas.length > 0;

  return (
    <Card bodyStyle={{ paddingBottom: 0 }}>
      <ConfigProvider locale={locale}>
        <Table
          columns={columnas}
          dataSource={estadisticas}
          rowKey="id"
          loading={loading}
          pagination={false}
          scroll={false}
          summary={
            mostrarResumen
              ? () => (
                  <Table.Summary>
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0} style={{ background: '#eee', fontWeight: 700 }}>
                        Totales
                      </Table.Summary.Cell>

                      {(() => {
                        const cells = [
                          totales.goles,
                          totales.asistencias,
                          totales.minutosJugados,
                          totales.tarjetasAmarillas,
                          totales.tarjetasRojas,
                          totales.arcosInvictos,
                        ];
                        return cells.map((val, i) => (
                          <Table.Summary.Cell
                            key={`sum-${i}`}
                            index={1 + i}
                            align="center"
                            style={{ background: '#eee', fontWeight: 700 }}
                          >
                            {val}
                          </Table.Summary.Cell>
                        ));
                      })()}

                      {userRole !== 'estudiante' && (
                        <Table.Summary.Cell index={99} style={{ background: '#eee' }} />
                      )}
                    </Table.Summary.Row>
                  </Table.Summary>
                )
              : undefined
          }
        />

        {estadisticas.length > 0 && (
          <div style={{ textAlign: 'center', marginTop: 16, padding: '12px 0' }}>
            <Pagination
              current={paginacion.actual}
              pageSize={paginacion.tamanioPagina}
              total={paginacion.total}
              onChange={onPage}
              onShowSizeChange={onPage}
              showSizeChanger
              showTotal={(t) => `Total: ${t} registros`}
              pageSizeOptions={['5', '10', '20', '50']}
            />
          </div>
        )}
      </ConfigProvider>
    </Card>
  );
};

export default ListaEstadisticas;