import React, { useState, useEffect, useCallback, useMemo, Suspense, lazy } from 'react';
import {
  Card, Button, Space, message, Pagination, ConfigProvider, Dropdown
} from 'antd';
import { CalendarOutlined, PlusOutlined, ReloadOutlined, DownloadOutlined,FilePdfOutlined,FileExcelOutlined} from '@ant-design/icons';
import locale from 'antd/locale/es_ES';
import dayjs from 'dayjs';
import 'dayjs/locale/es';

import MainLayout from '../components/MainLayout.jsx';
import SesionesFilterBar from '../components/SesionesFilterBar.jsx';
import SesionesTable from '../components/SesionesTable.jsx';
import {
  obtenerSesiones,
  obtenerSesionPorId,
  eliminarSesion,
  activarTokenSesion,
  desactivarTokenSesion,
  exportarSesionesExcel,
  exportarSesionesPDF

} from '../services/sesion.services.js';

const DetalleSesionModal = lazy(() => import('../components/DetalleSesionModal.jsx'));
const TokenSesionModal = lazy(() => import('../components/TokenSesionModal.jsx'));

message.config({ maxCount: 1 });
dayjs.locale('es');

export default function Sesiones() {
  const [sesiones, setSesiones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
     const [exportando, setExportando] = useState(false);


  const [filtros, setFiltros] = useState({
    q: '',
    fecha: null,
    horario: null,
    canchaId: null, 
    grupoId: null,
    tipoSesion: null,   
  });

  const [detalleModal, setDetalleModal] = useState(false);
  const [sesionDetalle, setSesionDetalle] = useState(null);
  const [tokenModal, setTokenModal] = useState(false);
  const [sesionToken, setSesionToken] = useState(null);
  const [ttlMin, setTtlMin] = useState(30);
  const [tokenLength, setTokenLength] = useState(6);
  const [loadingToken, setLoadingToken] = useState(false);
  const [loadingDetalle, setLoadingDetalle] = useState(false);

    const cargarSesiones = useCallback(async (page = 1, size = 10) => {
    setLoading(true);
    try {
     
      const params = {
        q: filtros.q,
        page,
        limit: size,
        ...(filtros.fecha && { fecha: filtros.fecha.format('YYYY-MM-DD') }),
        ...(filtros.horario && filtros.horario[0] && filtros.horario[1]
          ? {
              horaInicio: filtros.horario[0].format('HH:mm'),
              horaFin: filtros.horario[1].format('HH:mm'),
            }
          : {}),
        ...(filtros.canchaId && { canchaId: filtros.canchaId }), 
        ...(filtros.grupoId && { grupoId: filtros.grupoId }),   
        ...(filtros.tipoSesion && { tipoSesion: filtros.tipoSesion }),
      };
      const { sesiones: data, pagination: p } = await obtenerSesiones(params);
      setSesiones(data);
      setPagination({ current: p.currentPage, pageSize: p.itemsPerPage, total: p.totalItems });
    } catch {
      message.error('Error al cargar las sesiones');
    } finally {
      setLoading(false);
    }
  }, [filtros]); 

  useEffect(() => {
    
    cargarSesiones(1, pagination.pageSize);
  }, [cargarSesiones]); 

  const verDetalle = useCallback(async (id) => {
    try {
      setLoadingDetalle(true);
      setDetalleModal(true);
      const detalle = await obtenerSesionPorId(id);
      console.log(detalle)
      setSesionDetalle(detalle);
    } catch {
      message.error('Error al cargar detalle');
    } finally {
      setLoadingDetalle(false);
    }
  }, []);

  const handleEliminar = useCallback(async (id) => {
    try {
      await eliminarSesion(id);
      message.success('Sesión eliminada correctamente');
      cargarSesiones(pagination.current, pagination.pageSize);
    } catch {
      message.error('Error al eliminar sesión');
    }
  }, [pagination, cargarSesiones]);

  const handleActivarToken = useCallback(async (extra = {}) => {
    if (!sesionToken?.id) return;
    try {
      setLoadingToken(true);
      const payload = { ttlMin, tokenLength, ...extra };
      const sesionActualizada = await activarTokenSesion(sesionToken.id, payload);
      setSesiones(prev => {
        const idx = prev.findIndex(s => s.id === sesionToken.id);
        if (idx === -1) return prev;
        const newArr = [...prev];
        newArr[idx] = sesionActualizada;
        return newArr;
      });
      setSesionToken(sesionActualizada);
      message.success('Token generado correctamente');
    } catch {
      message.error('Error al generar token');
    } finally {
      setLoadingToken(false);
    }
  }, [sesionToken, ttlMin, tokenLength]);

  const handleDesactivarToken = useCallback(async () => {
    if (!sesionToken?.id) return;
    try {
      setLoadingToken(true);
      const sesionActualizada = await desactivarTokenSesion(sesionToken.id);
      setSesiones(prev => {
        const idx = prev.findIndex(s => s.id === sesionToken.id);
        if (idx === -1) return prev;
        const newArr = [...prev];
        newArr[idx] = sesionActualizada;
        return newArr;
      });
      message.success('Token desactivado');
      setTokenModal(false);
    } catch {
      message.error('Error al desactivar token');
    } finally {
      setLoadingToken(false);
    }
  }, [sesionToken]);

  const handlePageChange = useCallback((p, s) => cargarSesiones(p, s), [cargarSesiones]);

  const tableMemo = useMemo(() => ({
    sesiones,
    loading,
    verDetalle,
    handleEliminar,
    setTokenModal,
    setSesionToken,
    cargarSesiones,
    pagination,
    handlePageChange,
  }), [sesiones, loading, verDetalle, handleEliminar, pagination, handlePageChange, cargarSesiones]);

  const descargarArchivo = (blob, nombre) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  a.click();
  window.URL.revokeObjectURL(url);
};

const handleExportExcel = async () => {
  try {
    const query = {};

    if (filtros.q) query.q = filtros.q;
    if (filtros.fecha) query.fecha = filtros.fecha.format("YYYY-MM-DD");
    if (filtros.horario && filtros.horario[0] && filtros.horario[1]) {
      query.horaInicio = filtros.horario[0].format("HH:mm");
      query.horaFin = filtros.horario[1].format("HH:mm");
    }
    if (filtros.canchaId) query.canchaId = filtros.canchaId;
    if (filtros.grupoId) query.grupoId = filtros.grupoId;
    if (filtros.tipoSesion) query.tipoSesion = filtros.tipoSesion;  // ✅ AGREGAR ESTO

    const blob = await exportarSesionesExcel(query);
    descargarArchivo(blob, `sesiones_${Date.now()}.xlsx`);

  } catch (err) {
    message.error("Error exportando Excel");
  }
};


const handleExportPDF = async () => {
  try {
    const query = {};

    if (filtros.q) query.q = filtros.q;
    if (filtros.fecha) query.fecha = filtros.fecha.format("YYYY-MM-DD");
    if (filtros.horario && filtros.horario[0] && filtros.horario[1]) {
      query.horaInicio = filtros.horario[0].format("HH:mm");
      query.horaFin = filtros.horario[1].format("HH:mm");
    }
    if (filtros.canchaId) query.canchaId = filtros.canchaId;
    if (filtros.grupoId) query.grupoId = filtros.grupoId;
    if (filtros.tipoSesion) query.tipoSesion = filtros.tipoSesion;  // ✅ AGREGAR ESTO

    const blob = await exportarSesionesPDF(query);
    descargarArchivo(blob, `sesiones_${Date.now()}.pdf`);

  } catch {
    message.error("Error exportando PDF");
  }
};

const menuExportar = {
  items: [
    {
      key: 'excel',
      label: 'Exportar a Excel',
      icon: <FileExcelOutlined />,
      onClick: handleExportExcel,
    },
    {
      key: 'pdf',
      label: 'Exportar a PDF',
      icon: <FilePdfOutlined />,
      onClick: handleExportPDF,
    },
  ],
};



  return (
    <MainLayout>
      <ConfigProvider locale={locale}>
        <div style={{ padding: 24, backgroundColor: '#f0f2f5', minHeight: '100vh' }}>
        <Card
  title={<><CalendarOutlined /> Sesiones</>}
  extra={
    <Space style={{ width: '100%' }}>
      
      {/* Botones de la izquierda */}
      <Space>
        <Dropdown menu={menuExportar} trigger={['hover']}>
        <Button
          icon={<DownloadOutlined />}
          loading={exportando}
        >
          Exportar
        </Button>
      </Dropdown>
        <Button icon={<ReloadOutlined />} onClick={() => cargarSesiones(pagination.current, pagination.pageSize)}>
          Actualizar
        </Button>
         
      </Space>

      {/* Esto empuja el botón de Nueva Sesión hacia la derecha */}
      <span style={{ marginLeft: 'auto' }} />

      {/* Botón Nueva Sesión */}
      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={() => window.location.href = '/sesiones/nueva'}
      >
        Nueva Sesión
      </Button>

    </Space>
  }
>
            {/* Esto ya funciona con los nuevos filtros */}
            <SesionesFilterBar filtros={filtros} setFiltros={setFiltros} />
            
            <SesionesTable {...tableMemo} />
            
            {sesiones.length > 0 && (
              <div style={{ textAlign: 'center', marginTop: 16 }}>
                <Pagination
                  {...pagination}
                  onChange={handlePageChange}
                  showSizeChanger
                  showTotal={t => `Total: ${t} sesiones`}
                  pageSizeOptions={['5', '10', '20', '50']}
                />
              </div>
            )}
          </Card>

          {/* Suspensea los modales (sin cambios) */}
          <Suspense fallback={null}>
            {detalleModal && (
              <DetalleSesionModal
                open={detalleModal}
                loading={loadingDetalle}
                sesion={sesionDetalle}
                onClose={() => setDetalleModal(false)}
              />
            )}
          </Suspense>

          <Suspense fallback={null}>
            {tokenModal && (
              <TokenSesionModal
                open={tokenModal}
                sesion={sesionToken}
                ttlMin={ttlMin}
                setTtlMin={setTtlMin}
                tokenLength={tokenLength}
                setTokenLength={setTokenLength}
                loadingToken={loadingToken}
                onClose={() => setTokenModal(false)}
                onActivar={handleActivarToken}
                onDesactivar={handleDesactivarToken}
              />
            )}
          </Suspense>
        </div>
      </ConfigProvider>
    </MainLayout>
  );
}