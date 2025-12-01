import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Breadcrumb, Button, Space, Spin, Tabs, ConfigProvider,App } from 'antd';
import { ArrowLeftOutlined, CalendarOutlined, FireOutlined } from '@ant-design/icons';
import MainLayout, { useCampeonatoActivo } from '../components/MainLayout';
import FixtureManager from '../components/FixtureManager';
import { campeonatoService } from '../services/campeonato.services';
import { obtenerCanchas } from '../services/cancha.services';
import esES from 'antd/locale/es_ES';

// Componente interno que usa el hook
function CampeonatoFixtureContent() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { setCampeonatoActivo } = useCampeonatoActivo();
  const { message } = App.useApp(); 
  const [campeonato, setCampeonato] = useState(null);
  const [canchas, setCanchas] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, [id]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [dataCampeonato, responseCanchas] = await Promise.all([
        campeonatoService.obtener(id),
        obtenerCanchas()
      ]);
      
      setCampeonato(dataCampeonato);
      // obtenerCanchas devuelve { canchas, pagination }
      setCanchas(responseCanchas.canchas || []);
      
      // Actualizar el campeonato activo en el sidebar
      setCampeonatoActivo({
        id: dataCampeonato.id,
        nombre: dataCampeonato.nombre
      });
    } catch (error) {
      message.error('Error al cargar información');
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
    <ConfigProvider locale={esES}>
      <Card style={{ marginBottom: 16 }}>
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Space>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate(`/campeonatos/${id}/info`)}
            >
              Volver
            </Button>
            <CalendarOutlined style={{ fontSize: 24, color: '#006B5B' }} />
            <div>
              <h2 style={{ margin: 0 }}>Fixture - {campeonato.nombre}</h2>
              <span style={{ color: '#666' }}>Gestiona el fixture y programa los partidos</span>
            </div>
          </Space>
        </Space>
      </Card>

      <Tabs 
        defaultActiveKey="fixture" 
        size="large"
        items={[
          {
            key: 'fixture',
            label: (
              <Space>
                <FireOutlined />
                <span>Gestión de Rondas</span>
              </Space>
            ),
            children: <FixtureManager campeonatoId={id} onUpdate={cargarDatos} />
          },
          
        ]}
      />
    </ConfigProvider>
  );
}

// Componente wrapper con MainLayout
export default function CampeonatoFixture() {
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
          title: 'Fixture'
        }
      ]}
    />
  );

  return (
    <MainLayout breadcrumb={breadcrumb}>
      <CampeonatoFixtureContent />
    </MainLayout>
  );
}