import React, { useEffect, useMemo, useState, useRef } from 'react';
import {
  Card, Table, Space, Tooltip, Popconfirm, Avatar, Typography, Pagination, ConfigProvider, message, Button
} from 'antd';
import locale from 'antd/locale/es_ES';
import { EditOutlined, DeleteOutlined, UserOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import 'dayjs/locale/es';

import {
  obtenerEvaluaciones,
  eliminarEvaluacion,
} from '../services/evaluacion.services.js';
import { formatearHora, formatearFecha } from '../utils/formatters.js';

dayjs.locale('es');
const { Text } = Typography;

const ListaEvaluaciones = ({
  tipo = 'sesion',
  id = null,
  filtroJugadorId,
  filtroSesionId,
  userRole = 'entrenador',
  onEdit = null,
  reloadKey = 0,
}) => {
  const [evaluaciones, setEvaluaciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [paginacion, setPaginacion] = useState({
    actual: 1,
    tamanioPagina: 10,
    total: 0,
  });

  // ✅ Control de requests
  const requestIdRef = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // ✅ Función de carga
  const cargarDatos = async (page = 1, limit = 10) => {
    if (!id) {
      setEvaluaciones([]);
      setPaginacion({ actual: 1, tamanioPagina: limit, total: 0 });
      return;
    }

    const reqId = ++requestIdRef.current;
    setLoading(true);
    
    try {
      const params = { page, limit };
      
      // Determinar qué filtro aplicar según el tipo
      if (tipo === 'sesion') {
        params.sesionId = id;
        if (filtroJugadorId) params.jugadorId = filtroJugadorId;
      } else if (tipo === 'jugador') {
        params.jugadorId = id;
        if (filtroSesionId) params.sesionId = filtroSesionId;
      }

      const respuesta = await obtenerEvaluaciones(params);

      // Ignorar respuestas viejas
      if (reqId !== requestIdRef.current) return;

      const datos = respuesta?.data || respuesta || {};
      const lista = datos.evaluaciones || respuesta?.evaluaciones || [];
      const paginationData = datos.pagination || respuesta?.pagination || {};
      const total = paginationData.totalItems || lista.length;

      setEvaluaciones(lista);
      setPaginacion({
        actual: paginationData.currentPage || page,
        tamanioPagina: limit,
        total: total,
      });
    } catch (err) {
      if (!mountedRef.current) return;
      console.error('Error al cargar evaluaciones:', err);
      message.error('Error al cargar las evaluaciones');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  // ✅ Effect único: solo carga cuando cambian filtros o reloadKey
  useEffect(() => {
    cargarDatos(1, paginacion.tamanioPagina);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipo, id, filtroJugadorId, filtroSesionId, reloadKey, paginacion.tamanioPagina]);

  const onPage = (page, size) => {
    setPaginacion({ ...paginacion, actual: page, tamanioPagina: size });
    cargarDatos(page, size);
  };

  const onDelete = async (evaluacionId) => {
    try {
      await eliminarEvaluacion(evaluacionId);
      message.success('Evaluación eliminada');
      cargarDatos(paginacion.actual, paginacion.tamanioPagina);
    } catch (e) {
      console.error('Error eliminando evaluación:', e);
      message.error('No se pudo eliminar la evaluación');
    }
  };

  // Promedios
  const promedios = useMemo(() => {
    if (evaluaciones.length === 0) return { tecnica: 0, tactica: 0, actitudinal: 0, fisica: 0 };
    
    const suma = { tecnica: 0, tactica: 0, actitudinal: 0, fisica: 0 };
    let count = 0;
    
    for (const e of evaluaciones) {
      suma.tecnica += Number(e.tecnica) || 0;
      suma.tactica += Number(e.tactica) || 0;
      suma.actitudinal += Number(e.actitudinal) || 0;
      suma.fisica += Number(e.fisica) || 0;
      count++;
    }
    
    return {
      tecnica: count > 0 ? (suma.tecnica / count).toFixed(1) : 0,
      tactica: count > 0 ? (suma.tactica / count).toFixed(1) : 0,
      actitudinal: count > 0 ? (suma.actitudinal / count).toFixed(1) : 0,
      fisica: count > 0 ? (suma.fisica / count).toFixed(1) : 0,
    };
  }, [evaluaciones]);

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

    if (tipo === 'jugador') {
      base.push({
        title: 'Sesión',
        key: 'sesion',
        width: 260,
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

    base.push(
      { 
        title: 'Técnica', 
        dataIndex: 'tecnica', 
        key: 'tecnica', 
        align: 'center', 
        width: 100,
        render: (v) => (
          <span style={{
            padding: '4px 12px',
            borderRadius: 4,
            fontSize: '14px',
            fontWeight: 600,
            border: '1px solid #B9BBBB',
            backgroundColor: '#f5f5f5'
          }}>
            {v ?? '—'}
          </span>
        )
      },
      { 
        title: 'Táctica', 
        dataIndex: 'tactica', 
        key: 'tactica', 
        align: 'center', 
        width: 100,
        render: (v) => (
          <span style={{
            padding: '4px 12px',
            borderRadius: 4,
            fontSize: '14px',
            fontWeight: 600,
            border: '1px solid #B9BBBB',
            backgroundColor: '#f5f5f5'
          }}>
            {v ?? '—'}
          </span>
        )
      },
      { 
        title: 'Actitudinal', 
        dataIndex: 'actitudinal', 
        key: 'actitudinal', 
        align: 'center', 
        width: 120,
        render: (v) => (
          <span style={{
            padding: '4px 12px',
            borderRadius: 4,
            fontSize: '14px',
            fontWeight: 600,
            border: '1px solid #B9BBBB',
            backgroundColor: '#f5f5f5'
          }}>
            {v ?? '—'}
          </span>
        )
      },
      { 
        title: 'Física', 
        dataIndex: 'fisica', 
        key: 'fisica', 
        align: 'center', 
        width: 100,
        render: (v) => (
          <span style={{
            padding: '4px 12px',
            borderRadius: 4,
            fontSize: '14px',
            fontWeight: 600,
            border: '1px solid #B9BBBB',
            backgroundColor: '#f5f5f5'
          }}>
            {v ?? '—'}
          </span>
        )
      },
      { 
        title: 'Fecha Registro', 
        dataIndex: 'fechaRegistro', 
        key: 'fechaRegistro', 
        width: 130,
        render: (fecha) => fecha ? formatearFecha(fecha) : '—'
      }
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
              title="¿Eliminar evaluación?"
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

  const mostrarResumen = evaluaciones.length > 0;

  return (
    <Card bodyStyle={{ paddingBottom: 0 }}>
      <ConfigProvider locale={locale}>
        <Table
          columns={columnas}
          dataSource={evaluaciones}
          rowKey="id"
          loading={loading}
          pagination={false}
          scroll={{ x: 1000 }}
          summary={
            mostrarResumen
              ? () => (
                  <Table.Summary>
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0} style={{ background: '#eee', fontWeight: 700 }}>
                        Promedios
                      </Table.Summary.Cell>

                      {(() => {
                        const cells = [
                          promedios.tecnica,
                          promedios.tactica,
                          promedios.actitudinal,
                          promedios.fisica,
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

                      <Table.Summary.Cell index={98} style={{ background: '#eee' }} />

                      {userRole !== 'estudiante' && (
                        <Table.Summary.Cell index={99} style={{ background: '#eee' }} />
                      )}
                    </Table.Summary.Row>
                  </Table.Summary>
                )
              : undefined
          }
        />

        {evaluaciones.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: 16, padding: '12px 0' }}>
            <Pagination
              current={paginacion.actual}
              pageSize={paginacion.tamanioPagina}
              total={paginacion.total}
              onChange={onPage}
              onShowSizeChange={onPage}
              showSizeChanger
              showTotal={(t) => `Total: ${t} evaluaciones`}
              pageSizeOptions={['5', '10', '20', '50']}
            />
          </div>
        )}
      </ConfigProvider>
    </Card>
  );
};

export default ListaEvaluaciones;