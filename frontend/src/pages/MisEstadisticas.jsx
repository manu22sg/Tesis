import React, { useState } from 'react';
import { Card, Button, ConfigProvider } from 'antd';
import locale from 'antd/locale/es_ES';
import { TrophyOutlined, ReloadOutlined } from '@ant-design/icons';

import { useAuth } from '../context/AuthContext.jsx';
import ListaEstadisticas from '../components/EstadisticasList.jsx';
import MainLayout from '../components/MainLayout.jsx';

export default function MisEstadisticas() {
  const { usuario } = useAuth();
  const [reloadKey, setReloadKey] = useState(0);

  const actualizar = () => setReloadKey((k) => k + 1);

  return (
    <MainLayout>
      <ConfigProvider locale={locale}>
        <div style={{ padding: 24 }}>
          <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <TrophyOutlined style={{ marginRight: 8, fontSize: 20 }} />
                Mis Estadísticas
              </div>
            }
            extra={
              <Button icon={<ReloadOutlined />} onClick={actualizar}>
                Actualizar
              </Button>
            }
          >
            <ListaEstadisticas 
              tipo="mias"
              userRole="estudiante"
              reloadKey={reloadKey}
            />
          </Card>
        </div>
      </ConfigProvider>
    </MainLayout>
  );
}
