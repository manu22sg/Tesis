import React, { memo, useMemo } from 'react';
import { Table, Button, Space, Tooltip, Popconfirm } from 'antd';
import {
  EyeOutlined, DeleteOutlined, EditOutlined, TeamOutlined,
  FileTextOutlined, UserOutlined, KeyOutlined, LockOutlined, 
  UnlockOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { formatearFecha, formatearHora } from '../utils/formatters';

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
      render: (t) => (
        <span style={{
          padding: '2px 8px',
          borderRadius: 4,
          fontSize: '12px',
          fontWeight: 500,
          border: '1px solid #B9BBBB',
          backgroundColor: '#f5f5f5',
          display: 'inline-block',
          marginRight: '4px'
        }}>
          {t || '—'}
        </span>
      ),
      width: 180,
    },

    // ========================================================
    // TOKEN — CORREGIDO COMPLETO (texto + icono + color)
    // ========================================================
    {
      title: 'Token',
      render: (_, r) => {
        const vigente = r.tokenVigente;   // true / false / undefined
        const activo  = r.tokenActivo;    // true / false

        // Color único (la clave de tu problema)
        const color =
          vigente === true
            ? '#00ADD6'              // celeste (ACTIVO)
            : vigente === false && activo
              ? '#faad14'            // naranjo (EXPIRADO)
              : '#8c8c8c';           // gris (INACTIVO o undef)

        return (
          <span style={{
            padding: '2px 8px',
            borderRadius: 4,
            fontSize: '12px',
            fontWeight: 500,
            border: '1px solid #B9BBBB',
            backgroundColor: '#f5f5f5',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            color
          }}>

            {vigente === true ? (
              <UnlockOutlined />
            ) : vigente === false && activo ? (
              <LockOutlined />
            ) : (
              <LockOutlined />
            )}

            {vigente === true 
              ? 'Activo'
              : vigente === false && activo
                ? 'Expirado'
                : 'Inactivo'
            }
          </span>
        );
      },
      width: 120,
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

          {/* Botón token — también corregido */}
          <Tooltip title="Token">
            <Button
              icon={<KeyOutlined />}
              onClick={() => { setSesionToken(r); setTokenModal(true); }}
              style={{
                color:
                  r.tokenVigente === true
                    ? '#00ADD6'
                    : r.tokenVigente === false && r.tokenActivo
                      ? '#faad14'
                      : '#8c8c8c'
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
    }

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
