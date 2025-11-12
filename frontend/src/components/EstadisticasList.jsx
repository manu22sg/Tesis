import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
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

// Hook simple de debounce para efectos controlados
function useDebouncedEffect(effect, deps, delay = 250) {
  const cleanupRef = useRef();
  useEffect(() => {
    const handler = setTimeout(() => {
      cleanupRef.current = effect();
    }, delay);
    return () => {
      clearTimeout(handler);
      if (typeof cleanupRef.current === 'function') cleanupRef.current();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, delay]);
}

/**
 * Props:
 * - tipo: 'sesion' | 'jugador' | 'mias'
 * - id: number (sesionId o jugadorId según tipo)
 * - filtroJugadorId?: number (cuando tipo='sesion', para filtrar por un jugador específico)
 * - filtroSesionId?: number (cuando tipo='jugador', para filtrar por una sesión específica)
 * - userRole?: 'entrenador' | 'estudiante'
 * - onEdit?: (row) => void
 * - reloadKey?: number
 */
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

  const cargar = useCallback(async (page = 1, limit = 10) => {
    if (!id && tipo !== 'mias') {
      setEstadisticas([]);
      setPaginacion({ actual: 1, tamanioPagina: limit, total: 0 });
      return;
    }
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

      // Normalización
      const datos = respuesta?.data || respuesta || {};
      const lista = datos.estadisticas || [];
      const total = datos.total ?? lista.length;

      // Filtros secundarios cliente (cruzados)
      const listFiltrada = lista.filter((e) => {
        const okJugador = filtroJugadorId ? Number(e?.jugador?.id) === Number(filtroJugadorId) : true;
        const okSesion  = filtroSesionId ? Number(e?.sesion?.id)  === Number(filtroSesionId)  : true;
        return okJugador && okSesion;
      });

      setEstadisticas(listFiltrada);
      setPaginacion({
        actual: datos.pagina || page,
        tamanioPagina: limit,
        // si hay filtro cliente, ajustamos total para la UI; si no, respetamos el back
        total: (filtroJugadorId || filtroSesionId) ? listFiltrada.length : total,
      });
    } catch (err) {
      console.error('Error al cargar estadísticas:', err);
      message.error('Error al cargar las estadísticas');
    } finally {
      setLoading(false);
    }
  }, [tipo, id, filtroJugadorId, filtroSesionId]);

  // Debounce para evitar ráfagas cuando cambian filtros / reload / paginación
  useDebouncedEffect(
    () => {
      cargar(paginacion.actual, paginacion.tamanioPagina);
    },
    [cargar, reloadKey, paginacion.actual, paginacion.tamanioPagina],
    250
  );

  // Si cambia id/tipo/filtros, re-colocar la paginación en 1 con debounce
  useDebouncedEffect(
    () => {
      setPaginacion(prev => ({ ...prev, actual: 1 }));
    },
    [tipo, id, filtroJugadorId, filtroSesionId],
    150
  );

  const onPage = (page, size) => {
    setPaginacion((prev) => ({ ...prev, actual: page, tamanioPagina: size }));
  };

  const onDelete = async (estadisticaId) => {
    try {
      await eliminarEstadistica(estadisticaId);
      message.success('Estadística eliminada');
      // refrescamos la página actual
      cargar(paginacion.actual, paginacion.tamanioPagina);
    } catch (e) {
      console.error('Error eliminando estadística:', e);
      message.error('No se pudo eliminar la estadística');
    }
  };

  // Totales (goles, asistencias, minutos, etc.)
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

  // Columnas dinámicas
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
              <strong>{s?.nombre || 'Sin nombre'}</strong><br />
              <small style={{ color: '#888' }}>{f} — {hi}{hf ? ` - ${hf}` : ''}</small>
            </div>
          );
        }
      });
    }

    base.push(
      { title: 'Goles', dataIndex: 'goles', key: 'goles', align: 'center', width: 90,
        render: (v) => <Tag color={v > 0 ? 'green' : 'default'}>{v ?? 0}</Tag> },
      { title: 'Asistencias', dataIndex: 'asistencias', key: 'asistencias', align: 'center', width: 110,
        render: (v) => <Tag color={v > 0 ? 'blue' : 'default'}>{v ?? 0}</Tag> },
      { title: 'Minutos', dataIndex: 'minutosJugados', key: 'minutosJugados', align: 'center', width: 100,
        render: (v) => v ?? 0 },
      { title: 'T. Amarillas', dataIndex: 'tarjetasAmarillas', key: 'tarjetasAmarillas', align: 'center', width: 120,
        render: (v) => <Tag color={v > 0 ? 'gold' : 'default'}>{v ?? 0}</Tag> },
      { title: 'T. Rojas', dataIndex: 'tarjetasRojas', key: 'tarjetasRojas', align: 'center', width: 100,
        render: (v) => <Tag color={v > 0 ? 'red' : 'default'}>{v ?? 0}</Tag> },
      { title: 'Arcos Invictos', dataIndex: 'arcosInvictos', key: 'arcosInvictos', align: 'center', width: 130,
        render: (v) => <Tag color={v > 0 ? 'cyan' : 'default'}>{v ?? 0}</Tag> },
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

                      {/* Índices de resumen ajustados: después de la col descriptiva */}
                      {(() => {
                        const cells = [
                          totales.goles,
                          totales.asistencias,
                          totales.minutosJugados,
                          totales.tarjetasAmarillas,
                          totales.tarjetasRojas,
                          totales.arcosInvictos,
                        ];
                        // primera col numérica siempre es el índice 1 (tenemos 1 col descriptiva al inicio)
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
