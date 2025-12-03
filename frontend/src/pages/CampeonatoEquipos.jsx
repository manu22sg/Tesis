import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Breadcrumb, Button, Space, Spin,App } from 'antd';
import { ArrowLeftOutlined, TeamOutlined } from '@ant-design/icons';
import MainLayout, { useCampeonatoActivo } from '../components/MainLayout';
import EquipoManager from '../components/EquipoManager';
import { campeonatoService } from '../services/campeonato.services';

// Componente interno que usa el hook
function CampeonatoEquiposContent() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { message } = App.useApp(); 
  const { setCampeonatoActivo } = useCampeonatoActivo();
  
  const [campeonato, setCampeonato] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    cargarCampeonato();
  }, [id]);

  const cargarCampeonato = async () => {
    setLoading(true);
    try {
      const data = await campeonatoService.obtener(id);
      setCampeonato(data);
      
      // Actualizar el campeonato activo en el sidebar
      setCampeonatoActivo({
        id: data.id,
        nombre: data.nombre
      });
    } catch (error) {
      message.error('Error al cargar información del campeonato');
      navigate('/campeonatos');
    } finally {
      setLoading(false);
    }
  };

  if (!campeonato) {
    return (
      <Card>
        <Spin tip="Cargando..." />
      </Card>
    );
  }

  return (
    <>
      <Card style={{ marginBottom: 16 }}>
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Space>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate(`/campeonatos/${id}/info`)}
            >
              Volver
            </Button>
            <TeamOutlined style={{ fontSize: 24, color: '#014898' }} />
            <div>
              <h2 style={{ margin: 0 }}>Equipos - {campeonato.nombre}</h2>
              <span style={{ color: '#666' }}>Gestione los equipos del campeonato</span>
            </div>
          </Space>
        </Space>
      </Card>

      <EquipoManager
        campeonatoId={id}
        campeonatoInfo={campeonato}
        onUpdate={cargarCampeonato}
      />
    </>
  );
}

// Componente wrapper con MainLayout
export default function CampeonatoEquipos() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [campeonato, setCampeonato] = useState(null);

  useEffect(() => {
    const cargarNombre = async () => {
      try {
        const data = await campeonatoService.obtener(id);
        setCampeonato(data);
      } catch (error) {
        // Silencioso
      }
    };
    cargarNombre();
  }, [id]);

  const breadcrumb = (
    <Breadcrumb
      items={[
        {
          title: <a onClick={() => navigate('/campeonatos')}>Campeonatos</a>
        },
        {
          title: <a onClick={() => navigate(`/campeonatos/${id}/info`)}>{campeonato?.nombre || 'Cargando...'}</a>
        },
        {
          title: 'Equipos'
        }
      ]}
    />
  );

  return (
    <MainLayout breadcrumb={breadcrumb}>
      <CampeonatoEquiposContent />
    </MainLayout>
  );
}