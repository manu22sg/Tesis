import React, { memo, useMemo } from 'react';
import { Table, Button, Space, Tag, Tooltip, Popconfirm } from 'antd';
import {
  EyeOutlined, DeleteOutlined, EditOutlined, TeamOutlined,
  FileTextOutlined, UserOutlined, KeyOutlined, LockOutlined, 
  UnlockOutlined, EnvironmentOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { formatearFecha, formatearHora } from '../utils/formatters';

const colorForTipo = (tipo) => {
  const t = (tipo || '').toLowerCase();
  return { 
    tecnica: 'blue', 
    táctica: 'green', 
    tactica: 'green', 
    fisica: 'orange', 
    mixta: 'purple',
    entrenamiento: 'volcano',
    partido: 'red'
  }[t] || 'default';
};

const SesionesTable = memo(({ 
  sesiones, 
  loading, 
  verDetalle, 
  handleEliminar, 
  setTokenModal, 
  setSesionToken 
}) => {
  const navigate = useNavigate();

  const columns = useMemo(() => [
    {
      title: 'Fecha',
      dataIndex: 'fecha',
      render: (f) => formatearFecha(f),
      width: 120,
    },
    {
      title: 'Horario',
      render: (_, r) => `${formatearHora(r.horaInicio)} - ${formatearHora(r.horaFin)}`,
      width: 130,
    },
    {
      title: 'Lugar',
      render: (_, r) => {
        if (r.ubicacionExterna) {
          return (
              <Space size={4}>
                <span>{r.ubicacionExterna}</span>
              </Space>
          );
        }
        return r.cancha?.nombre || '—';
      },
      width: 180,
    },
    {
      title: 'Grupo',
      dataIndex: ['grupo', 'nombre'],
      render: (nombre) => nombre || '—',
      width: 150,
    },
    {
      title: 'Tipo',
      dataIndex: 'tipoSesion',
      render: (t) => <Tag color={colorForTipo(t)}>{t || '—'}</Tag>,
      width: 100,
    },
    {
      title: 'Token',
      render: (_, r) => {
        // Si tokenVigente existe en el backend, usarlo; sino, fallback a tokenActivo
        const vigente = r.tokenVigente !== undefined ? r.tokenVigente : r.tokenActivo;
        
        if (vigente) {
          return <Tag color="green" icon={<UnlockOutlined />}>Activo</Tag>;
        }
        
        // Si tokenActivo es true pero tokenVigente es false, significa que expiró
        if (r.tokenActivo && r.tokenVigente === false) {
          return <Tag color="orange" icon={<LockOutlined />}>Expirado</Tag>;
        }
        
        return <Tag icon={<LockOutlined />}>Inactivo</Tag>;
      },
      width: 100,
    },
    {
      title: 'Acciones',
      render: (_, r) => (
        <Space>
          <Tooltip title="Alineación">
            <Button 
              icon={<TeamOutlined />} 
              onClick={() => navigate(`/sesiones/${r.id}/alineacion`)} 
            />
          </Tooltip>
          <Tooltip title="Entrenamientos">
            <Button 
              icon={<FileTextOutlined />} 
              onClick={() => navigate(`/sesiones/${r.id}/entrenamientos`)} 
            />
          </Tooltip>
          <Tooltip title="Asistencias">
            <Button 
              icon={<UserOutlined />} 
              onClick={() => navigate(`/sesiones/${r.id}/asistencias`)} 
            />
          </Tooltip>
          <Tooltip title="Token">
            <Button
              icon={<KeyOutlined />}
              onClick={() => { setSesionToken(r); setTokenModal(true); }}
              style={{ 
                color: r.tokenVigente ? '#52c41a' : (r.tokenActivo && !r.tokenVigente ? '#faad14' : '#8c8c8c')
              }}
            />
          </Tooltip>
          <Tooltip title="Detalle">
            <Button 
              icon={<EyeOutlined />} 
              onClick={() => verDetalle(r.id)} 
            />
          </Tooltip>
          <Tooltip title="Editar">
            <Button 
              icon={<EditOutlined />} 
              onClick={() => navigate(`/sesiones/editar/${r.id}`)} 
            />
          </Tooltip>
          <Popconfirm 
            title="¿Eliminar sesión?" 
            okText="Eliminar" 
            onConfirm={() => handleEliminar(r.id)} 
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="Eliminar">
              <Button icon={<DeleteOutlined />} danger />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
      width: 320,
    },
  ], [navigate, verDetalle, handleEliminar, setTokenModal, setSesionToken]);

  return (
    <Table
      columns={columns}
      dataSource={sesiones}
      rowKey="id"
      loading={loading}
      pagination={false}
    />
  );
});

export default SesionesTable;