import React, { useState, useEffect } from 'react';
import { Modal, Table, Button, Space, Typography, App } from 'antd';
import { SortAscendingOutlined, OrderedListOutlined, FileTextOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { reordenarEntrenamientos } from '../services/entrenamientoSesion.services.js';

const { Text } = Typography;

// Fila arrastrable
function SortableRow({ id, children, ...props }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    ...props.style,
    transform: CSS.Transform.toString(transform),
    transition,
    cursor: 'grab',
    touchAction: 'none',
    ...(isDragging ? { background: '#e6f7ff', opacity: 0.6 } : {}),
  };

  return (
    <tr ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </tr>
  );
}

// Función auxiliar para renderizar texto con enlaces
const renderizarTextoConEnlaces = (texto) => {
  if (!texto) return null;
  
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = texto.split(urlRegex);
  
  return parts.map((part, index) => {
    if (part.match(urlRegex)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#1890ff', textDecoration: 'underline' }}
        >
          {part}
        </a>
      );
    }
    return part;
  });
};

export default function ModalReordenar({ visible, onClose, entrenamientos, sesionId, onSuccess }) {
  const { message } = App.useApp();
  const [entrenamientosTemp, setEntrenamientosTemp] = useState([]);
  const [loading, setLoading] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor));

  useEffect(() => {
    if (visible && entrenamientos) {
      setEntrenamientosTemp([...entrenamientos]);
    }
  }, [visible, entrenamientos]);

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setEntrenamientosTemp((items) => {
      const oldIndex = items.findIndex((i) => i.id === active.id);
      const newIndex = items.findIndex((i) => i.id === over.id);
      return arrayMove(items, oldIndex, newIndex);
    });
  };

  const handleGuardar = async () => {
    try {
      setLoading(true);
      const nuevosOrdenes = entrenamientosTemp.map((e, index) => ({
        id: e.id,
        orden: index + 1,
      }));
      await reordenarEntrenamientos(parseInt(sesionId), nuevosOrdenes);
      message.success('Entrenamientos reordenados correctamente');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error reordenando:', error);
      message.error('Error al reordenar los entrenamientos');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEntrenamientosTemp([...entrenamientos]);
    onClose();
  };

  const columns = [
    {
      title: 'Nuevo Orden',
      key: 'nuevoOrden',
      render: (_, __, index) => (
        <span style={{
          padding: '2px 8px',
          borderRadius: 4,
          fontSize: '12px',
          fontWeight: 500,
          border: '1px solid #B9BBBB',
          backgroundColor: '#f5f5f5',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          <OrderedListOutlined />
          {index + 1}
        </span>
      ),
      width: 120,
      align: 'center',
    },
    {
      title: 'Título',
      dataIndex: 'titulo',
      key: 'titulo',
      render: (titulo) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <FileTextOutlined/>
          <Text strong>{titulo}</Text>
        </div>
      ),
    },
    {
      title: 'Descripción',
      dataIndex: 'descripcion',
      key: 'descripcion',
      render: (desc) => {
        if (!desc) return <Text type="secondary">—</Text>;
        
        return (
          <div style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>
            <Text type="secondary">
              {renderizarTextoConEnlaces(desc)}
            </Text>
          </div>
        );
      },
    },
    {
      title: 'Duración',
      dataIndex: 'duracionMin',
      key: 'duracionMin',
      render: (duracion) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <ClockCircleOutlined style={{ color: '#006B5B' }} />
          <span>{duracion ? `${duracion} min` : '—'}</span>
        </div>
      ),
      width: 120,
      align: 'center',
    },
  ];

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <SortAscendingOutlined />
          <span>Reordenar Entrenamientos</span>
        </div>
      }
      open={visible}
      onCancel={handleClose}
      footer={[
        <Button key="cancel" onClick={handleClose}>
          Cancelar
        </Button>,
        <Button
          key="save"
          type="primary"
          loading={loading}
          onClick={handleGuardar}
        >
          Guardar Orden
        </Button>,
      ]}
      width={900}
      style={{ top: 20 }}
    >
      <div style={{ marginBottom: 16, padding: 12, background: '#e6f7ff', borderRadius: 8, border: '1px solid #91d5ff' }}>
        <Text strong>💡 Instrucciones: </Text>
        <Text>Arrastre las filas para cambiar el orden de los entrenamientos</Text>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={entrenamientosTemp.map((e) => e.id)} strategy={verticalListSortingStrategy}>
          <Table
            columns={columns}
            dataSource={entrenamientosTemp}
            rowKey="id"
            pagination={false}
            components={{ body: { row: SortableRow } }}
            onRow={(record) => ({ id: record.id })}
          />
        </SortableContext>
      </DndContext>
    </Modal>
  );
}