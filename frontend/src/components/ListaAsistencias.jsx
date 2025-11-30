import React, { useEffect, useState, useRef } from 'react';
import {
  Card, Table, Space, Tooltip, Avatar, Typography, Pagination, ConfigProvider, message, Button
} from 'antd';
import locale from 'antd/locale/es_ES';
import { 
  UserOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  QuestionCircleOutlined,
  EnvironmentOutlined,EditOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import 'dayjs/locale/es';

import {
  listarAsistenciasDeSesion,
  obtenerAsistenciasPorJugador,
} from '../services/asistencia.services.js';
import { formatearHora, formatearFecha } from '../utils/formatters.js';

dayjs.locale('es');
const { Text } = Typography;

const ESTADOS = {
  presente: { label: 'Presente', color: 'success', icon: <CheckCircleOutlined /> },
  ausente: { label: 'Ausente', color: 'error', icon: <CloseCircleOutlined /> },
  justificado: { label: 'Justificado', color: 'warning', icon: <QuestionCircleOutlined /> },
};

const ListaAsistencias = ({
  tipo = 'sesion',
  id = null,
  filtroJugadorId,
  filtroSesionId,
  reloadKey = 0,
  onEdit = null,
  onDelete = null,
}) => {
  const [asistencias, setAsistencias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [paginacion, setPaginacion] = useState({
    actual: 1,
    tamanioPagina: 10,
    total: 0,
  });

  const requestIdRef = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const cargarDatos = async (page = 1, limit = 10) => {
    if (!id) {
      setAsistencias([]);
      setPaginacion({ actual: 1, tamanioPagina: limit, total: 0 });
      return;
    }

    const reqId = ++requestIdRef.current;
    setLoading(true);
    
    try {
      let respuesta;
      const params = {  page,limit };

      if (tipo === 'sesion') {
        // ✅ Agregar el filtro de jugador a los params
        if (filtroJugadorId) params.jugadorId = filtroJugadorId;
        
        console.log('📤 Llamando listarAsistenciasDeSesion con:', {
          sesionId: id,
          params
        });
        
        respuesta = await listarAsistenciasDeSesion(id, params);
      } else if (tipo === 'jugador') {
        // ✅ Agregar el filtro de sesión a los params
        if (filtroSesionId) params.sesionId = filtroSesionId;
        
        console.log('📤 Llamando obtenerAsistenciasPorJugador con:', {
          jugadorId: id,
          params
        });
        
        respuesta = await obtenerAsistenciasPorJugador(id, params);
      }

      if (reqId !== requestIdRef.current) return;

      console.log('📥 Respuesta recibida:', respuesta);

      const lista = respuesta?.asistencias || [];
      const total = respuesta?.total || lista.length;

      setAsistencias(lista);
      setPaginacion({
        actual: respuesta?.page || page,
        tamanioPagina: limit,
        total: total,
      });
    } catch (err) {
      if (!mountedRef.current) return;
      console.error('❌ Error al cargar asistencias:', err);
      message.error('Error al cargar las asistencias');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos(1, paginacion.tamanioPagina);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipo, id, filtroJugadorId, filtroSesionId, reloadKey, paginacion.tamanioPagina]);

  const onPage = (page, size) => {
    setPaginacion({ ...paginacion, actual: page, tamanioPagina: size });
    cargarDatos(page, size);
  };

  const columnas = React.useMemo(() => {
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
        width: 280,
        render: (_, record) => {
          const s = record?.sesion;
          if (!s) return '—';
          const f = formatearFecha(s.fecha);
          const hi = formatearHora(s.horaInicio);
          const hf = s.horaFin ? formatearHora(s.horaFin) : '';
          return (
            <div>
              <strong>{s.tipoSesion || 'Sin nombre'}</strong><br />
              <small style={{ color: '#888' }}>
                {f} — {hi}{hf ? ` - ${hf}` : ''}
              </small>
              {s.cancha && (
                <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>
                  📍 {s.cancha.nombre}
                </div>
              )}
            </div>
          );
        }
      });
    }

    base.push(
      {
  title: 'Material',
  dataIndex: 'entregoMaterial',
  key: 'entregoMaterial',
  align: 'center',
  width: 100,
  render: (value) => {
    if (value === true) {
      return (
        <span style={{
          padding: '4px 10px',
          borderRadius: 4,
          fontSize: '12px',
          fontWeight: 500,
          color: '#389e0d',
          border: '1px solid #389e0d',
          background: '#f6ffed'
        }}>
          Sí
        </span>
      );
    }
    if (value === false) {
      return (
        <span style={{
          padding: '4px 10px',
          borderRadius: 4,
          fontSize: '12px',
          fontWeight: 500,
          color: '#cf1322',
          border: '1px solid #cf1322',
          background: '#fff1f0'
        }}>
          No
        </span>
      );
    }
    return (
      <span style={{
        padding: '4px 10px',
        borderRadius: 4,
        fontSize: '12px',
        fontWeight: 500,
        color: '#8c8c8c',
        border: '1px solid #d9d9d9',
        background: '#fafafa'
      }}>
        —
      </span>
    );
  }
},
      {
        title: 'Estado',
        dataIndex: 'estado',
        key: 'estado',
        align: 'center',
        width: 130,
        render: (estado) => {
          const config = ESTADOS[estado] || ESTADOS.presente;
          return (
            <span style={{
              padding: '4px 12px',
              borderRadius: 4,
              fontSize: '12px',
              fontWeight: 500,
              border: '1px solid #B9BBBB',
              backgroundColor: '#f5f5f5',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              {config.icon}
              {config.label}
            </span>
          );
        },
      },
      {
        title: 'Origen',
        dataIndex: 'origen',
        key: 'origen',
        align: 'center',
        width: 120,
        render: (origen) => (
          <span style={{
            padding: '2px 8px',
            borderRadius: 4,
            fontSize: '12px',
            fontWeight: 500,
            border: '1px solid #B9BBBB',
            backgroundColor: '#f5f5f5'
          }}>
            {origen === 'jugador' ? 'Jugador' : 'Entrenador'}
          </span>
        ),
      },
      {
        title: 'Ubicación',
        key: 'ubicacion',
        align: 'center',
        width: 100,
        render: (_, record) => (
          record.latitud && record.longitud ? (
            <Tooltip title={`Lat: ${record.latitud}, Lng: ${record.longitud}`}>
              <EnvironmentOutlined style={{ color: '#006B5B', fontSize: 18 }} />
            </Tooltip>
          ) : (
            <Text type="secondary">—</Text>
          )
        ),
      },
      {
        title: 'Fecha Registro',
        dataIndex: 'fechaRegistro',
        key: 'fechaRegistro',
        width: 150,
        render: (fecha) => {
          if (!fecha) return <Text type="secondary">—</Text>;
          return dayjs(fecha).format('DD/MM/YYYY HH:mm');
        },
      }
    );

    if (onEdit || onDelete) {
      base.push({
        title: 'Acciones',
        key: 'acciones',
        align: 'center',
        width: 120,
        render: (_, record) => (
          <Space size="small">
            {onEdit && (
              <Tooltip title="Editar">
                <Button type="primary" size="middle" onClick={() => onEdit(record)}>
                {<EditOutlined />}
                </Button>
              </Tooltip>
            )}
            {onDelete && (
              <Tooltip title="Eliminar">
                <Button danger size="middle" onClick={() => onDelete(record)}>
                  Eliminar
                </Button>
              </Tooltip>
            )}
          </Space>
        ),
      });
    }

    return base;
  }, [tipo, onEdit, onDelete]);

  // Estadísticas
  const estadisticas = React.useMemo(() => {
    return {
      presente: asistencias.filter(a => a.estado === 'presente').length,
      ausente: asistencias.filter(a => a.estado === 'ausente').length,
      justificado: asistencias.filter(a => a.estado === 'justificado').length,
    };
  }, [asistencias]);

  const mostrarResumen = asistencias.length > 0;

  return (
    <Card bodyStyle={{ paddingBottom: 0 }}>
      <ConfigProvider locale={locale}>
        {mostrarResumen && (
          <div style={{ 
            marginBottom: 24,
            padding: '16px 0',
            borderTop: '1px solid #e8e8e8',
            borderBottom: '1px solid #e8e8e8'
          }}>
            <div style={{ 
              display: 'flex',
              justifyContent: 'space-around',
              alignItems: 'center',
              gap: 16
            }}>
              <div style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ 
                  fontSize: 32, 
                  fontWeight: 600, 
                  color: '#262626',
                  lineHeight: 1
                }}>
                  {estadisticas.presente}
                </div>
                <Text type="secondary" style={{ fontSize: 13, marginTop: 4 }}>
                  Presentes
                </Text>
              </div>
              
              <div style={{ width: 1, height: 40, background: '#d9d9d9' }} />
              
              <div style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ 
                  fontSize: 32, 
                  fontWeight: 600, 
                  color: '#262626',
                  lineHeight: 1
                }}>
                  {estadisticas.ausente}
                </div>
                <Text type="secondary" style={{ fontSize: 13, marginTop: 4 }}>
                  Ausentes
                </Text>
              </div>
              
              <div style={{ width: 1, height: 40, background: '#d9d9d9' }} />
              
              <div style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ 
                  fontSize: 32, 
                  fontWeight: 600, 
                  color: '#262626',
                  lineHeight: 1
                }}>
                  {estadisticas.justificado}
                </div>
                <Text type="secondary" style={{ fontSize: 13, marginTop: 4 }}>
                  Justificados
                </Text>
              </div>
              
              <div style={{ width: 1, height: 40, background: '#d9d9d9' }} />
              
              <div style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ 
                  fontSize: 32, 
                  fontWeight: 600, 
                  color: '#014898',
                  lineHeight: 1
                }}>
                  {paginacion.total}
                </div>
                <Text type="secondary" style={{ fontSize: 13, marginTop: 4 }}>
                  Total
                </Text>
              </div>
            </div>
          </div>
        )}

        <Table
          columns={columnas}
          dataSource={asistencias}
          rowKey="id"
          loading={loading}
          pagination={false}
          scroll={{ x: 1000 }}
        />

        {asistencias.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: 16, padding: '12px 0' }}>
            <Pagination
              current={paginacion.actual}
              pageSize={paginacion.tamanioPagina}
              total={paginacion.total}
              onChange={onPage}
              onShowSizeChange={onPage}
              showSizeChanger
              showTotal={(t) => `Total: ${t} asistencias`}
              pageSizeOptions={['5', '10', '20', '50']}
            />
          </div>
        )}
      </ConfigProvider>
    </Card>
  );
};

export default ListaAsistencias;