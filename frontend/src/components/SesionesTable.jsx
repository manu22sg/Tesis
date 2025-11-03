import React, { memo, useMemo } from 'react';
import { Table, Button, Space, Tag, Tooltip, Popconfirm } from 'antd';
import {
  EyeOutlined, DeleteOutlined, EditOutlined, TeamOutlined,
  FileTextOutlined, UserOutlined, KeyOutlined, LockOutlined, UnlockOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';

const colorForTipo = (tipo) => {
  const t = (tipo || '').toLowerCase();
  return { tecnica: 'blue', táctica: 'green', tactica: 'green', fisica: 'orange', mixta: 'purple' }[t] || 'default';
};

const SesionesTable = memo(({ sesiones, loading, verDetalle, handleEliminar, setTokenModal, setSesionToken }) => {
  const navigate = useNavigate();

  const columns = useMemo(() => [
    {
      title: 'Fecha',
      dataIndex: 'fecha',
      render: (f) => dayjs(f).format('DD/MM/YYYY'),
      width: 120,
    },
    {
      title: 'Horario',
      render: (_, r) => `${r.horaInicio} - ${r.horaFin}`,
      width: 120,
    },
    {
      title: 'Cancha',
      dataIndex: ['cancha', 'nombre'],
      width: 150,
    },
    {
      title: 'Grupo',
      dataIndex: ['grupo', 'nombre'],
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
      render: (_, r) => (
        r.tokenActivo
          ? <Tag color="green" icon={<UnlockOutlined />}>Activo</Tag>
          : <Tag icon={<LockOutlined />}>Inactivo</Tag>
      ),
      width: 100,
    },
    {
      title: 'Acciones',
      render: (_, r) => (
        <Space>
          <Tooltip title="Alineación">
            <Button icon={<TeamOutlined />} onClick={() => navigate(`/sesiones/${r.id}/alineacion`)} />
          </Tooltip>
          <Tooltip title="Entrenamientos">
            <Button icon={<FileTextOutlined />} onClick={() => navigate(`/sesiones/${r.id}/entrenamientos`)} />
          </Tooltip>
          <Tooltip title="Asistencias">
            <Button icon={<UserOutlined />} onClick={() => navigate(`/sesiones/${r.id}/asistencias`)} />
          </Tooltip>
          <Tooltip title="Token">
            <Button
              icon={<KeyOutlined />}
              onClick={() => { setSesionToken(r); setTokenModal(true); }}
              style={{ color: r.tokenActivo ? '#52c41a' : '#8c8c8c' }}
            />
          </Tooltip>
          <Tooltip title="Detalle">
            <Button icon={<EyeOutlined />} onClick={() => verDetalle(r.id)} />
          </Tooltip>
          <Tooltip title="Editar">
            <Button icon={<EditOutlined />} onClick={() => navigate(`/sesiones/editar/${r.id}`)} />
          </Tooltip>
          <Popconfirm title="¿Eliminar sesión?" onConfirm={() => handleEliminar(r.id)} okButtonProps={{ danger: true }}>
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
      scroll={{ y: 400 }}
      virtual
    />
  );
});

export default SesionesTable;
