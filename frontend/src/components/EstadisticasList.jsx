import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Space, Modal, message, Tag, Pagination, ConfigProvider } from 'antd';
import locale from 'antd/locale/es_ES';
import { EditOutlined, DeleteOutlined, TrophyOutlined } from '@ant-design/icons';
import {
  obtenerEstadisticasPorJugador,
  obtenerEstadisticasPorSesion,
  obtenerMisEstadisticas,
  eliminarEstadistica,
} from '../services/estadistica.services.js';
import dayjs from 'dayjs';
import 'dayjs/locale/es';

dayjs.locale('es');

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

  // Hook moderno de Modal
  const [modal, contextHolder] = Modal.useModal();

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
        total: datos.total || datos.estadisticas?.length || 0,
      });
    } catch (error) {
      console.error('❌ Error al cargar estadísticas:', error);
      message.error(error.message || 'Error al cargar las estadísticas');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarEstadisticas(paginacion.actual, paginacion.tamanioPagina);
  }, [tipo, id, reloadKey]);

  const manejarCambioTabla = (pagina, tamanioPagina) => {
    cargarEstadisticas(pagina, tamanioPagina);
  };

  const manejarEliminar = (estadisticaId) => {
    modal.confirm({
      title: '¿Estás seguro de eliminar esta estadística?',
      content: 'Esta acción no se puede deshacer',
      okText: 'Sí, eliminar',
      okType: 'danger',
      cancelText: 'Cancelar',
      onOk: async () => {
        try {
          await eliminarEstadistica(estadisticaId);
          message.success('Estadística eliminada correctamente');
          setEstadisticas((prev) => prev.filter((e) => e.id !== estadisticaId));
          setPaginacion((prev) => ({ ...prev, total: prev.total - 1 }));
        } catch (error) {
          console.error('❌ Error al eliminar estadística:', error);
          message.error(error.message || 'Error al eliminar la estadística');
        }
      },
    });
  };

  const columnas = [
    ...(tipo === 'sesion'
      ? [
          {
            title: 'Jugador',
            dataIndex: ['jugador', 'usuario'],
            key: 'jugador',
            render: (usuario) =>
              usuario ? `${usuario.nombre} ${usuario.rut}` : 'N/A',
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
              const fecha = record.sesion?.fecha
                ? dayjs(record.sesion.fecha).format('DD/MM/YYYY')
                : 'Sin fecha';
              const hora = record.sesion?.horaInicio
                ? dayjs(`1970-01-01T${record.sesion.horaInicio}`).format('HH:mm')
                : 'Sin hora';
              return (
                <div>
                  <strong>{nombre || 'Sin nombre'}</strong>
                  <br />
                  <small style={{ color: '#888' }}>
                    {fecha} — {hora}
                  </small>
                </div>
              );
            },
          },
        ]
      : []),
    {
      title: 'Goles',
      dataIndex: 'goles',
      key: 'goles',
      align: 'center',
      render: (goles) => (
        <Tag color={goles > 0 ? 'green' : 'default'}>
          <TrophyOutlined /> {goles}
        </Tag>
      ),
    },
    {
      title: 'Asistencias',
      dataIndex: 'asistencias',
      key: 'asistencias',
      align: 'center',
      render: (asistencias) => (
        <Tag color={asistencias > 0 ? 'blue' : 'default'}>{asistencias}</Tag>
      ),
    },
    {
      title: 'Minutos',
      dataIndex: 'minutosJugados',
      key: 'minutosJugados',
      align: 'center',
    },
    {
      title: 'T. Amarillas',
      dataIndex: 'tarjetasAmarillas',
      key: 'tarjetasAmarillas',
      align: 'center',
      render: (tarjetas) => (
        <Tag color={tarjetas > 0 ? 'gold' : 'default'}>{tarjetas}</Tag>
      ),
    },
    {
      title: 'T. Rojas',
      dataIndex: 'tarjetasRojas',
      key: 'tarjetasRojas',
      align: 'center',
      render: (tarjetas) => (
        <Tag color={tarjetas > 0 ? 'red' : 'default'}>{tarjetas}</Tag>
      ),
    },
    {
      title: 'Arcos Invictos',
      dataIndex: 'arcosInvictos',
      key: 'arcosInvictos',
      align: 'center',
      render: (arcos) => (
        <Tag color={arcos > 0 ? 'cyan' : 'default'}>{arcos}</Tag>
      ),
    },
    ...(userRole !== 'estudiante'
      ? [
          {
            title: 'Acciones',
            key: 'acciones',
            align: 'center',
            render: (_, record) => (
              <Space>
                {onEdit && (
                  <Button
                    type="link"
                    icon={<EditOutlined />}
                    onClick={() => onEdit(record)}
                  >
                    Editar
                  </Button>
                )}
                <Button
                  type="link"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => manejarEliminar(record.id)}
                >
                  Eliminar
                </Button>
              </Space>
            ),
          },
        ]
      : []),
  ];

  return (
    <Card>
      {contextHolder}
      <Table
        columns={columnas}
        dataSource={estadisticas}
        rowKey="id"
        loading={cargando}
        pagination={false}
        scroll={{ x: 'max-content' }}
      />
      {estadisticas.length > 0 && (
        <div style={{ textAlign: 'center', marginTop: 24 }}>
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
    </Card>
  );
};

export default ListaEstadisticas;