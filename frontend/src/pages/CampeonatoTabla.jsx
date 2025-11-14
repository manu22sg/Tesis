import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Breadcrumb,
  Button,
  Space,
  message,
  Spin,
  Table,
  Avatar,
  Empty
} from 'antd';
import {
  ArrowLeftOutlined,
  BarChartOutlined,
  TrophyOutlined
} from '@ant-design/icons';
import MainLayout, { useCampeonatoActivo } from '../components/MainLayout';
import { campeonatoService } from '../services/campeonato.services';

function CampeonatoTablaContent() {
  const { id } = useParams();
  const navigate = useNavigate();
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
      setCampeonatoActivo({ id: data.id, nombre: data.nombre });
    } catch (error) {
      message.error('Error al cargar información del campeonato');
      navigate('/campeonatos');
    } finally {
      setLoading(false);
    }
  };

  const tablaCalculada = useMemo(() => {
    if (!campeonato?.equipos || !campeonato?.partidos) return [];

    const partidosFinalizados = campeonato.partidos.filter(p => p.estado === 'finalizado');

    const estadisticas = campeonato.equipos.map(equipo => {
      const stats = {
        id: equipo.id,
        nombre: equipo.nombre,
        carrera: equipo.carrera?.nombre || null,
        tipo: equipo.tipo,
        jugados: 0,
        ganados: 0,
        empatados: 0,
        perdidos: 0,
        golesFavor: 0,
        golesContra: 0,
        diferencia: 0,
        puntos: 0
      };

      partidosFinalizados.forEach(partido => {
        const esEquipoA = partido.equipoAId === equipo.id;
        const esEquipoB = partido.equipoBId === equipo.id;

        if (!esEquipoA && !esEquipoB) return;

        stats.jugados++;

        const golesPropios = esEquipoA ? partido.golesA : partido.golesB;
        const golesRival = esEquipoA ? partido.golesB : partido.golesA;

        stats.golesFavor += golesPropios;
        stats.golesContra += golesRival;

        if (golesPropios > golesRival) {
          stats.ganados++;
          stats.puntos += 3;
        } else if (golesPropios === golesRival) {
          stats.empatados++;
          stats.puntos += 1;
        } else {
          stats.perdidos++;
        }
      });

      stats.diferencia = stats.golesFavor - stats.golesContra;

      return stats;
    });

    return estadisticas.sort((a, b) => {
      if (b.puntos !== a.puntos) return b.puntos - a.puntos;
      if (b.diferencia !== a.diferencia) return b.diferencia - a.diferencia;
      return b.golesFavor - a.golesFavor;
    });
  }, [campeonato]);

  const columns = [
    {
      title: '#',
      key: 'posicion',
      width: 60,
      align: 'center',
      render: (_, __, index) => (
        <Avatar
          size={40}
          style={{
            backgroundColor: '#e0e0e0',
            color: '#000',
            fontWeight: 'bold',
            fontSize: 18
          }}
        >
          {index + 1}
        </Avatar>
      )
    },
    {
  title: 'Equipo',
  dataIndex: 'nombre',
  key: 'nombre',
  fixed: 'left',
  width: 250,
  render: (nombre, record) => (
    <Space direction="vertical" size={0}>
      <strong style={{ fontSize: 16 }}>{nombre}</strong>
      <span style={{ fontSize: 12, color: '#666' }}>
        {record.carrera || 'Sin carrera'}
      </span>
    </Space>
  )
},
    {
      title: 'PJ',
      dataIndex: 'jugados',
      key: 'jugados',
      width: 70,
      align: 'center'
    },
    {
      title: 'PG',
      dataIndex: 'ganados',
      key: 'ganados',
      width: 70,
      align: 'center'
    },
    {
      title: 'PE',
      dataIndex: 'empatados',
      key: 'empatados',
      width: 70,
      align: 'center'
    },
    {
      title: 'PP',
      dataIndex: 'perdidos',
      key: 'perdidos',
      width: 70,
      align: 'center'
    },
    {
      title: 'GF',
      dataIndex: 'golesFavor',
      key: 'golesFavor',
      width: 70,
      align: 'center'
    },
    {
      title: 'GC',
      dataIndex: 'golesContra',
      key: 'golesContra',
      width: 70,
      align: 'center'
    },
    {
      title: 'DIF',
      dataIndex: 'diferencia',
      key: 'diferencia',
      width: 80,
      align: 'center'
    },
    {
      title: 'PTS',
      dataIndex: 'puntos',
      key: 'puntos',
      width: 90,
      align: 'center'
    }
  ];

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
            <BarChartOutlined style={{ fontSize: 24 }} />
            <div>
              <h2 style={{ margin: 0 }}>Tabla de Posiciones - {campeonato.nombre}</h2>
              <span style={{ color: '#666' }}>Clasificación actualizada del campeonato</span>
            </div>
          </Space>
        </Space>
      </Card>

      <Card
        title={
          <Space>
            <TrophyOutlined style={{ fontSize: 20 }} />
            <span style={{ fontSize: 18 }}>Tabla de Posiciones</span>
          </Space>
        }
      >
        {tablaCalculada.length > 0 ? (
          <>
            <Table
              columns={columns}
              dataSource={tablaCalculada}
              loading={loading}
              rowKey="id"
              pagination={false}
              scroll={{ x: 1000 }}
              size="middle"
            />

            <div style={{ marginTop: 24, padding: 16, backgroundColor: '#fafafa', borderRadius: 8 }}>
              <h4>Leyenda:</h4>
              <Space direction="vertical" size="small">
                <span><strong>PJ:</strong> Partidos Jugados</span>
                <span><strong>PG:</strong> Partidos Ganados</span>
                <span><strong>PE:</strong> Partidos Empatados</span>
                <span><strong>PP:</strong> Partidos Perdidos</span>
                <span><strong>GF:</strong> Goles a Favor</span>
                <span><strong>GC:</strong> Goles en Contra</span>
                <span><strong>DIF:</strong> Diferencia de Goles</span>
                <span><strong>PTS:</strong> Puntos (Victoria = 3, Empate = 1, Derrota = 0)</span>
              </Space>
            </div>
          </>
        ) : (
          <Empty
            description="No hay datos disponibles"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            {campeonato.estado === 'creado' && (
              <p style={{ color: '#666' }}>
                La tabla se actualizará cuando se jueguen partidos
              </p>
            )}
          </Empty>
        )}
      </Card>
    </>
  );
}

export default function CampeonatoTabla() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [campeonato, setCampeonato] = useState(null);

  useEffect(() => {
    const cargarNombre = async () => {
      try {
        const data = await campeonatoService.obtener(id);
        setCampeonato(data);
      } catch (error) {}
    };
    cargarNombre();
  }, [id]);

  const breadcrumb = (
    <Breadcrumb
      items={[
        { title: <a onClick={() => navigate('/campeonatos')}>Campeonatos</a> },
        { title: <a onClick={() => navigate(`/campeonatos/${id}/info`)}>{campeonato?.nombre || 'Cargando...'}</a> },
        { title: 'Tabla de Posiciones' }
      ]}
    />
  );

  return (
    <MainLayout breadcrumb={breadcrumb}>
      <CampeonatoTablaContent />
    </MainLayout>
  );
}
