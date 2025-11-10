import React, { useState } from 'react';
import { Card, Button, ConfigProvider } from 'antd';
import locale from 'antd/locale/es_ES';
import { TrophyOutlined, ReloadOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext.jsx';
import ListaEstadisticas from '../components/EstadisticasList.jsx';
import MainLayout from '../components/MainLayout.jsx';
const MisEstadisticas = () => {
  const { usuario } = useAuth();
  
  // Clave para forzar recarga del componente
  const [claveRecarga, setClaveRecarga] = useState(0);

  const manejarActualizar = () => {
    setClaveRecarga((prev) => prev + 1);
  };

  return (
    <MainLayout>
      <ConfigProvider locale={locale}>
        <div style={{ padding: '24px' }}>
          <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <TrophyOutlined style={{ marginRight: 8, fontSize: 20 }} />
                Mis Estadísticas
              </div>
            }
            extra={
              <Button
                icon={<ReloadOutlined />}
                onClick={manejarActualizar}
              >
                Actualizar
              </Button>
            }
          >
            <ListaEstadisticas 
              tipo="mias" 
              userRole="estudiante"
              reloadKey={claveRecarga}
            />
          </Card>
        </div>
      </ConfigProvider>
    </MainLayout>
  );
};

export default MisEstadisticas;