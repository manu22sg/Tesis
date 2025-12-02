import React, { useEffect, useMemo, useState, useRef } from 'react';
import {
  Card, Table, Space, Tooltip, Popconfirm, Avatar, Typography, Pagination, ConfigProvider, App, Button, Input
} from 'antd';
import locale from 'antd/locale/es_ES';
import { EditOutlined, DeleteOutlined, UserOutlined, EyeOutlined, EyeInvisibleOutlined, SearchOutlined } from '@ant-design/icons';
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
const { Search } = Input;

const ListaEstadisticas = ({
  tipo = 'sesion',
  id = null,
  filtroJugadorId = null, // ✅ Filtro opcional para sesiones
  filtroSesionId = null,  // ✅ Filtro opcional para jugadores
  userRole = 'entrenador',
  onEdit = null,
  reloadKey = 0,
}) => {
  const [estadisticas, setEstadisticas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mostrarTodo, setMostrarTodo] = useState(false);
  const [busqueda, setBusqueda] = useState(''); // ✅ Estado para búsqueda
  const [paginacion, setPaginacion] = useState({
    actual: 1,
    tamanioPagina: 10,
    total: 0,
  });
  const { message } = App.useApp();

  const requestIdRef = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const cargarDatos = async (page = 1, limit = 10, searchTerm = '') => {
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
        respuesta = await obtenerMisEstadisticas(page, limit, searchTerm, filtroSesionId);
      } else if (tipo === 'sesion') {
        // ✅ Pasar filtroJugadorId al backend
        respuesta = await obtenerEstadisticasPorSesion(id, page, limit, searchTerm, filtroJugadorId);
      } else if (tipo === 'jugador') {
        // ✅ Pasar filtroSesionId al backend
        respuesta = await obtenerEstadisticasPorJugador(id, page, limit, searchTerm, filtroSesionId);
      }

      if (reqId !== requestIdRef.current) return;

      const lista = respuesta.estadisticas || [];
      const total = respuesta.total ?? lista.length;

      setEstadisticas(lista);
      setPaginacion({
        actual: Number(respuesta.page) || page,
        tamanioPagina: limit,
        total: total,
      });

    } catch (err) {
      if (!mountedRef.current) return;
      console.error('Error al cargar estadísticas:', err);
      message.error('Error al cargar las estadísticas');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  // ✅ Recargar cuando cambia la búsqueda (con debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      setPaginacion(prev => ({ ...prev, actual: 1 }));
      cargarDatos(1, paginacion.tamanioPagina, busqueda);
    }, 500); // Espera 500ms después de que el usuario deje de escribir

    return () => clearTimeout(timer);
  }, [busqueda]);

  // ✅ Recargar cuando cambia la página o el tamaño
  useEffect(() => {
    cargarDatos(paginacion.actual, paginacion.tamanioPagina, busqueda);
  }, [paginacion.actual, paginacion.tamanioPagina, reloadKey]);

  // ✅ Recargar cuando cambia tipo, id, O los filtros opcionales
  useEffect(() => {
    setBusqueda(''); // Limpiar búsqueda al cambiar contexto
    setPaginacion(prev => ({ ...prev, actual: 1 }));
    cargarDatos(1, paginacion.tamanioPagina, '');
  }, [tipo, id, filtroJugadorId, filtroSesionId]);

  const onPage = (page, size) => {
    setPaginacion({ ...paginacion, actual: page, tamanioPagina: size });
  };

  const onDelete = async (estadisticaId) => {
    try {
      await eliminarEstadistica(estadisticaId);
      message.success('Estadística eliminada');
      cargarDatos(paginacion.actual, paginacion.tamanioPagina, busqueda);
    } catch (e) {
      console.error('Error eliminando estadística:', e);
      message.error('No se pudo eliminar la estadística');
    }
  };

  // Totales
  const totales = useMemo(() => {
    const t = {
      goles: 0, asistencias: 0, minutosJugados: 0,
      tarjetasAmarillas: 0, tarjetasRojas: 0, arcosInvictos: 0,
      tirosAlArco: 0, tirosTotales: 0,
      regatesExitosos: 0, regatesIntentados: 0,
      pasesCompletados: 0, pasesIntentados: 0,
      intercepciones: 0, recuperaciones: 0, despejes: 0,
      duelosGanados: 0, duelosTotales: 0,
      atajadas: 0, golesRecibidos: 0
    };
    for (const e of estadisticas) {
      t.goles += Number(e.goles) || 0;
      t.asistencias += Number(e.asistencias) || 0;
      t.minutosJugados += Number(e.minutosJugados) || 0;
      t.tarjetasAmarillas += Number(e.tarjetasAmarillas) || 0;
      t.tarjetasRojas += Number(e.tarjetasRojas) || 0;
      t.arcosInvictos += Number(e.arcosInvictos) || 0;
      t.tirosAlArco += Number(e.tirosAlArco) || 0;
      t.tirosTotales += Number(e.tirosTotales) || 0;
      t.regatesExitosos += Number(e.regatesExitosos) || 0;
      t.regatesIntentados += Number(e.regatesIntentados) || 0;
      t.pasesCompletados += Number(e.pasesCompletados) || 0;
      t.pasesIntentados += Number(e.pasesIntentados) || 0;
      t.intercepciones += Number(e.intercepciones) || 0;
      t.recuperaciones += Number(e.recuperaciones) || 0;
      t.despejes += Number(e.despejes) || 0;
      t.duelosGanados += Number(e.duelosGanados) || 0;
      t.duelosTotales += Number(e.duelosTotales) || 0;
      t.atajadas += Number(e.atajadas) || 0;
      t.golesRecibidos += Number(e.golesRecibidos) || 0;
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
        fixed: 'left',
        render: (_, record) => {
          const u = record?.jugador?.usuario;
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Avatar size={40} icon={<UserOutlined />} style={{ backgroundColor: '#014898' }} />
              <div>
              <div style={{ fontWeight: 500 }}>
  {`${u?.nombre || 'Sin nombre'} ${u?.apellido || ''}`.trim()}
</div>
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
        fixed: 'left',
        render: (_, record) => {
          const s = record?.sesion;
          if (!s) return '—';
          const f = formatearFecha(s.fecha);
          const hi = formatearHora(s.horaInicio);
          const hf = s.horaFin ? formatearHora(s.horaFin) : '';
          return (
            <div>
              <strong>{s.nombre || s.tipoSesion || 'Sin nombre'}</strong><br />
              <small style={{ color: '#888' }}>{f} — {hi}{hf ? ` - ${hf}` : ''}</small>
            </div>
          );
        }
      });
    }

    // Estadísticas básicas (siempre visibles)
    const cellStyle = (v) => (
      <span style={{
        padding: '4px 12px',
        borderRadius: 4,
        fontSize: '14px',
        fontWeight: 600,
        border: '1px solid #B9BBBB',
        backgroundColor: '#f5f5f5'
      }}>{v ?? 0}</span>
    );

    base.push(
      { title: 'Goles', dataIndex: 'goles', key: 'goles', align: 'center', width: 90, render: cellStyle },
      { title: 'Asistencias', dataIndex: 'asistencias', key: 'asistencias', align: 'center', width: 110, render: cellStyle },
      { title: 'Minutos', dataIndex: 'minutosJugados', key: 'minutosJugados', align: 'center', width: 100, render: cellStyle },
      { title: 'T. Amarillas', dataIndex: 'tarjetasAmarillas', key: 'tarjetasAmarillas', align: 'center', width: 120, render: cellStyle },
      { title: 'T. Rojas', dataIndex: 'tarjetasRojas', key: 'tarjetasRojas', align: 'center', width: 100, render: cellStyle }
    );

    // Estadísticas extendidas (solo si mostrarTodo = true)
    if (mostrarTodo) {
      base.push(
        // Ofensivas
        { title: 'Tiros al Arco', dataIndex: 'tirosAlArco', key: 'tirosAlArco', align: 'center', width: 120, render: cellStyle },
        { title: 'Tiros Totales', dataIndex: 'tirosTotales', key: 'tirosTotales', align: 'center', width: 120, render: cellStyle },
        { title: 'Regates Exitosos', dataIndex: 'regatesExitosos', key: 'regatesExitosos', align: 'center', width: 140, render: cellStyle },
        { title: 'Regates Intentados', dataIndex: 'regatesIntentados', key: 'regatesIntentados', align: 'center', width: 160, render: cellStyle },
        { title: 'Pases Completados', dataIndex: 'pasesCompletados', key: 'pasesCompletados', align: 'center', width: 160, render: cellStyle },
        { title: 'Pases Intentados', dataIndex: 'pasesIntentados', key: 'pasesIntentados', align: 'center', width: 150, render: cellStyle },
        
        // Defensivas
        { title: 'Intercepciones', dataIndex: 'intercepciones', key: 'intercepciones', align: 'center', width: 130, render: cellStyle },
        { title: 'Recuperaciones', dataIndex: 'recuperaciones', key: 'recuperaciones', align: 'center', width: 140, render: cellStyle },
        { title: 'Despejes', dataIndex: 'despejes', key: 'despejes', align: 'center', width: 100, render: cellStyle },
        { title: 'Duelos Ganados', dataIndex: 'duelosGanados', key: 'duelosGanados', align: 'center', width: 140, render: cellStyle },
        { title: 'Duelos Totales', dataIndex: 'duelosTotales', key: 'duelosTotales', align: 'center', width: 130, render: cellStyle },
        
        // Portero
        { title: 'Atajadas', dataIndex: 'atajadas', key: 'atajadas', align: 'center', width: 100, render: cellStyle },
        { title: 'Goles Recibidos', dataIndex: 'golesRecibidos', key: 'golesRecibidos', align: 'center', width: 140, render: cellStyle },
        { title: 'Arcos Invictos', dataIndex: 'arcosInvictos', key: 'arcosInvictos', align: 'center', width: 130, render: cellStyle }
      );
    }

    if (userRole !== 'estudiante') {
      base.push({
        title: 'Acciones',
        key: 'acciones',
        align: 'center',
        width: 120,
        fixed: 'right',
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
  }, [tipo, onEdit, userRole, mostrarTodo]);

  const mostrarResumen = estadisticas.length > 0;

  // Calcular índices para el summary según columnas visibles
  const getSummaryCells = () => {
    const cells = [
      totales.goles,
      totales.asistencias,
      totales.minutosJugados,
      totales.tarjetasAmarillas,
      totales.tarjetasRojas,
    ];

    if (mostrarTodo) {
      cells.push(
        totales.tirosAlArco,
        totales.tirosTotales,
        totales.regatesExitosos,
        totales.regatesIntentados,
        totales.pasesCompletados,
        totales.pasesIntentados,
        totales.intercepciones,
        totales.recuperaciones,
        totales.despejes,
        totales.duelosGanados,
        totales.duelosTotales,
        totales.atajadas,
        totales.golesRecibidos,
        totales.arcosInvictos
      );
    }

    return cells;
  };

  return (
    <Card bodyStyle={{ paddingBottom: 0 }}>
      <ConfigProvider locale={locale}>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            icon={mostrarTodo ? <EyeInvisibleOutlined /> : <EyeOutlined />}
            onClick={() => setMostrarTodo(!mostrarTodo)}
          >
            {mostrarTodo ? 'Ocultar estadísticas detalladas' : 'Ver todas las estadísticas'}
          </Button>
        </div>

        <Table
          columns={columnas}
          dataSource={estadisticas}
          rowKey="id"
          loading={loading}
          pagination={false}
          scroll={{ x: mostrarTodo ? 2500 : 1000 }}
          summary={
            mostrarResumen
              ? () => (
                  <Table.Summary>
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0} style={{ background: '#eee', fontWeight: 700 }}>
                        Totales
                      </Table.Summary.Cell>

                      {getSummaryCells().map((val, i) => (
                        <Table.Summary.Cell
                          key={`sum-${i}`}
                          index={1 + i}
                          align="center"
                          style={{ background: '#eee', fontWeight: 700 }}
                        >
                          {val}
                        </Table.Summary.Cell>
                      ))}

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
          <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: 16, padding: '12px 0' }}>
            <Pagination
              current={paginacion.actual}
              pageSize={paginacion.tamanioPagina}
              total={paginacion.total}
              onChange={onPage}
              onShowSizeChange={onPage}
              showSizeChanger
              showTotal={(t) => `Total: ${t} estadísticas`}
              pageSizeOptions={['5', '10', '20', '50']}
            />
          </div>
        )}
      </ConfigProvider>
    </Card>
  );
};

export default ListaEstadisticas;