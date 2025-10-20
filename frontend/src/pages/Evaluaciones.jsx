import { useEffect, useState, useContext } from 'react';
import { Table, Button, Space, message, Modal, Popconfirm, Tag, Card, Pagination, Input, Select } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons';
import { obtenerEvaluaciones, eliminarEvaluacion } from '../services/evaluacion.services.js';
import EvaluacionForm from '../components/EvaluacionForm.jsx';
import { useAuth } from '../context/AuthContext';
import MainLayout from '../components/MainLayout.jsx';

const { Search } = Input;

export default function Evaluaciones() {
  const { usuario } = useAuth();
  const [evaluaciones, setEvaluaciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [pagina, setPagina] = useState(1);
  const [total, setTotal] = useState(0);
  const [busqueda, setBusqueda] = useState('');
  const [sesionFiltro, setSesionFiltro] = useState(null);

  const esEstudiante = usuario?.rol === 'estudiante';

  const fetchData = async (page = 1) => {
    setLoading(true);
    try {
      const params = { pagina: page };
      if (busqueda) params.busqueda = busqueda;
      if (sesionFiltro) params.sesionId = sesionFiltro;
      const res = await obtenerEvaluaciones(params);
      setEvaluaciones(res.evaluaciones);
      setTotal(res.total);
      setPagina(res.pagina);
    } catch (err) {
      message.error('Error cargando evaluaciones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [busqueda, sesionFiltro]);

  const handleDelete = async (id) => {
    try {
      await eliminarEvaluacion(id);
      message.success('Evaluación eliminada');
      fetchData(pagina);
    } catch {
      message.error('Error al eliminar');
    }
  };

  const columns = [
    {
  title: 'Jugador',
  render: (_, record) =>
    record.jugador
      ? `${record.jugador.usuarioId}` 
      : '—',
},
   {
  title: 'Sesión',
  render: (_, record) =>
    record.sesion
      ? `${record.sesion.fecha} (${record.sesion.horaInicio})`
      : '—',
},
    { title: 'Técnica', dataIndex: 'tecnica', key: 'tecnica', align: 'center' },
    { title: 'Táctica', dataIndex: 'tactica', key: 'tactica', align: 'center' },
    { title: 'Actitudinal', dataIndex: 'actitudinal', key: 'actitudinal', align: 'center' },
    { title: 'Física', dataIndex: 'fisica', key: 'fisica', align: 'center' },
    { title: 'Fecha', dataIndex: 'fechaRegistro', key: 'fechaRegistro' },
    {
      title: 'Acciones',
      render: (_, record) => (
        <Space>
          {!esEstudiante && (
            <>
              <Button icon={<EditOutlined />} onClick={() => { setEditing(record); setModalOpen(true); }}>Editar</Button>
              <Popconfirm
                title="¿Eliminar evaluación?"
                onConfirm={() => handleDelete(record.id)}
              >
                <Button danger icon={<DeleteOutlined />} />
              </Popconfirm>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <MainLayout>
    <Card
      title="Evaluaciones"
      extra={
        <Space>
          <Search
            placeholder="Buscar por jugador o sesión"
            allowClear
            onSearch={setBusqueda}
            style={{ width: 220 }}
          />
          {!esEstudiante && (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
              Nueva
            </Button>
          )}
          <Button icon={<ReloadOutlined />} onClick={() => fetchData(pagina)}>Refrescar</Button>
        </Space>
      }
    >
      <Table
        dataSource={evaluaciones}
        columns={columns}
        loading={loading}
        pagination={false}
        rowKey="id"
      />
      <Pagination
        style={{ marginTop: 16, textAlign: 'center' }}
        current={pagina}
        total={total}
        pageSize={10}
        onChange={fetchData}
      />
      <Modal
        open={modalOpen}
        onCancel={() => { setModalOpen(false); setEditing(null); }}
        footer={null}
        destroyOnClose
        title={editing ? 'Editar Evaluación' : 'Nueva Evaluación'}
      >
        <EvaluacionForm
          initialValues={editing}
          onSuccess={() => { setModalOpen(false); fetchData(pagina); }}
        />
      </Modal>
    </Card>
    </MainLayout>
  );
}
