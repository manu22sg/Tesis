// src/pages/DetalleCampeonatoPublico.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card, Tabs, Table, Space, Empty, Spin,
  Avatar, Badge, Button, Breadcrumb, ConfigProvider,
  Row, Col, Statistic, Select
} from 'antd';
import locale from 'antd/locale/es_ES';

import {
  ArrowLeftOutlined,
  TrophyOutlined,
  TeamOutlined,
  CalendarOutlined,
  BarChartOutlined,
  FireOutlined,
  UserOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';

import { campeonatoService } from '../services/campeonato.services.js';
import { equipoService } from '../services/equipo.services.js';
import * as estadisticaService from '../services/estadisticaCampeonato.services.js';
import MainLayout from '../components/MainLayout.jsx';
import { formatearFecha, formatearRangoHoras } from '../utils/formatters.js';


// =====================================================
// COMPONENTE: Estadísticas públicas
// =====================================================
const EstadisticasPublicas = ({ campeonato, jugadores, estadisticas }) => {

  const [filtroEquipo, setFiltroEquipo] = useState(null);
  const [busqueda, setBusqueda] = useState("");

  // mapa: partidoId → “Equipo A vs Equipo B – ronda”
  const partidosMap = useMemo(() => {
    const map = {};
    campeonato.partidos?.forEach(p => {
      const eqA = campeonato.equipos.find(e => e.id === p.equipoAId)?.nombre || "Equipo A";
      const eqB = campeonato.equipos.find(e => e.id === p.equipoBId)?.nombre || "Equipo B";
      const ronda =
        p.ronda
          ? ` — ${p.ronda.charAt(0).toUpperCase() + p.ronda.slice(1)}`
          : "";
      map[p.id] = `${eqA} vs ${eqB}${ronda}`;
    });
    return map;
  }, [campeonato]);

  // unir estadísticas con jugadores
  const datos = useMemo(() => {
    return estadisticas.map(est => {
      const jugador = jugadores.find(j => j.id === est.jugadorCampeonatoId);

      return {
        ...est,
        jugadorNombre: jugador
          ? `${jugador.usuario?.nombre || ""} ${jugador.usuario?.apellido || ""}`.trim()
          : "Desconocido",

        equipoNombre: jugador?.equipo?.nombre  || "Sin equipo" ,

        partidoTexto: partidosMap[est.partidoId] || "Partido no encontrado",
      };
    });
  }, [estadisticas, jugadores, partidosMap]);

  // filtrado final
  const filtradas = useMemo(() => {
    return datos.filter(est => {
      const okEquipo = filtroEquipo ? est.equipoNombre === filtroEquipo : true;
      const okBusqueda = busqueda
        ? est.jugadorNombre.toLowerCase().includes(busqueda.toLowerCase())
        : true;

      return okEquipo && okBusqueda;
    });
  }, [datos, filtroEquipo, busqueda]);

  // columnas tabla
  const columnas = [
    {
      title: "Jugador",
      dataIndex: "jugadorNombre",
      render: (text, record) => (
        <Space direction="vertical" size={0}>
          <strong>{text}</strong>
          <span style={{ fontSize: 12, color: "#666" }}>{record.equipoNombre}</span>
        </Space>
      )
    },
    { title: "Partido", dataIndex: "partidoTexto", width: 240 },
    { title: "Goles", dataIndex: "goles", align: "center", render: v => <>⚽ {v}</> },
    { title: "Asistencias", dataIndex: "asistencias", align: "center", render: v => <>🎯 {v}</> },
    { title: "Amarillas", dataIndex: "tarjetasAmarillas", align: "center", render: v => <>🟨 {v}</> },
    { title: "Rojas", dataIndex: "tarjetasRojas", align: "center", render: v => <>🟥 {v}</> },
    { title: "Minutos", dataIndex: "minutosJugados", align: "center", render: v => <>⏱️ {v}</> },
  ];

  return (
    <Card>
      <Space style={{ marginBottom: 16 }} wrap>
        <Select
          placeholder="Filtrar por equipo"
          style={{ width: 200 }}
          allowClear
          value={filtroEquipo}
          onChange={setFiltroEquipo}
        >
          {campeonato.equipos?.map(e => (
            <Select.Option key={e.id} value={e.nombre}>{e.nombre}</Select.Option>
          ))}
        </Select>

        <input
          placeholder="Buscar jugador..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          style={{
            padding: "6px 12px",
            borderRadius: 6,
            border: "1px solid #B9BBBB",
            width: 200
          }}
        />
      </Space>

      <Table
        columns={columnas}
        dataSource={filtradas}
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />
    </Card>
  );
};



// =====================================================
// VISTA PRINCIPAL DEL CAMPEONATO
// =====================================================
export default function DetalleCampeonatoPublico() {

  const { id } = useParams();
  const navigate = useNavigate();

  const [campeonato, setCampeonato] = useState(null);
  const [loading, setLoading] = useState(true);
  const [jugadores, setJugadores] = useState([]);
  const [estadisticas, setEstadisticas] = useState([]);

  useEffect(() => {
    cargarCampeonato();
  }, [id]);

  useEffect(() => {
    if (campeonato) cargarJugadoresYEstadisticas();
  }, [campeonato]);


  const cargarCampeonato = async () => {
    try {
      setLoading(true);
      const data = await campeonatoService.obtener(id);
      setCampeonato(data);
    } finally {
      setLoading(false);
    }
  };


  // ==================================================
  // CARGAR JUGADORES + FILTRAR ESTADÍSTICAS POR CAMPEONATO
  // ==================================================
  const cargarJugadoresYEstadisticas = async () => {
    try {
      // --- cargar jugadores
      const equipos = await equipoService.listarPorCampeonato(id);
      const jugadoresFinal = [];

      for (const eq of equipos) {
        const js = await equipoService.listarJugadores(eq.id);
        (js || []).forEach(j =>
          jugadoresFinal.push({
            id: j.id,
            usuario: { nombre: j.nombre ??  j.usuario?.nombre ?? "" },
            equipo: { id: eq.id, nombre: eq.nombre }
          })
        );
      }

      setJugadores(jugadoresFinal);

      // --- cargar estadísticas
      const stats = await estadisticaService.listarEstadisticas({});
      const items = Array.isArray(stats?.items) ? stats.items : stats;

      // FILTRAR SOLO ESTADÍSTICAS QUE PERTENECEN A ESTE CAMPEONATO
      const partidosIds = campeonato.partidos.map(p => p.id);

      const filtradas = (items || []).filter(est =>
        partidosIds.includes(est.partidoId)
      );

      setEstadisticas(filtradas);

    } catch (error) {
      console.error("Error cargando datos:", error);
    }
  };



  // ==================================================
  // TABLA DE POSICIONES
  // ==================================================
  const tablaCalculada = useMemo(() => {
    if (!campeonato?.equipos || !campeonato?.partidos) return [];

    const finalizados = campeonato.partidos.filter(p => p.estado === "finalizado");

    const tabla = campeonato.equipos.map(eq => {
      const stat = {
        id: eq.id,
        nombre: eq.nombre,
        carrera: eq.carrera?.nombre,
        jugados: 0, ganados: 0, empatados: 0, perdidos: 0,
        golesFavor: 0, golesContra: 0, diferencia: 0,
        puntos: 0
      };

      finalizados.forEach(p => {
        const esA = p.equipoAId === eq.id;
        const esB = p.equipoBId === eq.id;
        if (!esA && !esB) return;

        stat.jugados++;

        const gf = esA ? p.golesA : p.golesB;
        const gc = esA ? p.golesB : p.golesA;

        stat.golesFavor += gf;
        stat.golesContra += gc;

        if (gf > gc) stat.ganados++, stat.puntos += 3;
        else if (gf === gc) stat.empatados++, stat.puntos += 1;
        else stat.perdidos++;
      });

      stat.diferencia = stat.golesFavor - stat.golesContra;
      return stat;
    });

    return tabla.sort((a, b) =>
      b.puntos - a.puntos ||
      b.diferencia - a.diferencia ||
      b.golesFavor - a.golesFavor
    );
  }, [campeonato]);



  // ==================================================
  // FIXTURE
  // ==================================================
  const partidosPorRonda = useMemo(() => {
    if (!campeonato?.partidos) return {};

    const group = {};
    campeonato.partidos.forEach(p => {
      const r = p.ronda?.toLowerCase() || "otros";
      if (!group[r]) group[r] = [];
      group[r].push(p);
    });

    return group;
  }, [campeonato]);


  const ordenRondas = {
    final: 1,
    semifinal: 2,
    cuartos: 3,
    octavos: 4,
    dieciseisavos: 5
  };

  const rondasOrdenadas = Object.keys(partidosPorRonda).sort(
    (a, b) => (ordenRondas[a] || 99) - (ordenRondas[b] || 99)
  );


  const columnasFixture = [
    {
      title: "Equipo A",
      render: (_, p) => {
        const e = campeonato.equipos.find(x => x.id === p.equipoAId);
        return <><TeamOutlined /> {e?.nombre}</>;
      }
    },
    {
      title: "Resultado",
      align: "center",
      render: (_, p) => (
        <div>
          <strong>{p.golesA ?? "-"} - {p.golesB ?? "-"}</strong>

          {p.definidoPorPenales && (
            <div style={{ fontSize: 12, color: "#faad14" }}>
              Penales: {p.penalesA} - {p.penalesB}
            </div>
          )}
        </div>
      )
    },
    {
      title: "Equipo B",
      render: (_, p) => {
        const e = campeonato.equipos.find(x => x.id === p.equipoBId);
        return <><TeamOutlined /> {e?.nombre}</>;
      }
    },
    {
      title: "Fecha / Hora",
      width: 160,
      render: (_, p) => (
        <Space direction="vertical" size={0}>
          {p.fecha ? formatearFecha(p.fecha) : (
  <span style={{
    padding: '2px 8px',
    borderRadius: 4,
    fontSize: '12px',
    fontWeight: 500,
    border: '1px solid #B9BBBB',
    backgroundColor: '#f5f5f5'
  }}>
    Por programar
  </span>
)}
          {p.horaInicio &&
            <span style={{ fontSize: 12, color: "#999" }}>
              {formatearRangoHoras(p.horaInicio, p.horaFin)}
            </span>}
        </Space>
      )
    },
    {
      title: "Estado",
      dataIndex: "estado",
      width: 120,
      align: "center",
      render: estado => {
  const textos = {
    pendiente: "Pendiente",
    programado: "Programado",
    en_juego: "En Juego",
    en_curso: "En Curso",
    finalizado: "Finalizado",
    cancelado: "Cancelado",
  };
  return (
    <span style={{
      padding: '2px 8px',
      borderRadius: 4,
      fontSize: '12px',
      fontWeight: 500,
      border: '1px solid #B9BBBB',
      backgroundColor: '#f5f5f5'
    }}>
      {textos[estado]}
    </span>
  );
}
    }
  ];



  // ==================================================
  // LOADING
  // ==================================================
  if (loading || !campeonato) {
    return (
      <MainLayout>
        <Card>
          <div style={{ textAlign: "center", padding: 60 }}>
            <Spin size="large" tip="Cargando..." />
          </div>
        </Card>
      </MainLayout>
    );
  }



  // ==================================================
  // TABS
  // ==================================================
  const tabItems = [
    {
      key: "tabla",
      label: <><BarChartOutlined /> Tabla de Posiciones</>,
      children: (
        <Card>
          <Table
            columns={[
              {
                title: "#",
                render: (_, __, idx) => (
                  <Avatar
                    size={40}
                    style={{
                      backgroundColor: idx < 3 ? "#faad14" : "#B9BBBB",
                      color: idx < 3 ? "#fff" : "#000",
                      fontWeight: "bold"
                    }}
                  >
                    {idx + 1}
                  </Avatar>
                )
              },
              {
                title: "Equipo",
                dataIndex: "nombre",
                render: (text, r) => (
                  <Space direction="vertical" size={0}>
                    <strong>{text}</strong>
                    <span style={{ fontSize: 12, color: "#666" }}>{r.carrera}</span>
                  </Space>
                )
              },
              { title: "PJ", dataIndex: "jugados", align: "center" },
              { title: "PG", dataIndex: "ganados", align: "center" },
              { title: "PE", dataIndex: "empatados", align: "center" },
              { title: "PP", dataIndex: "perdidos", align: "center" },
              { title: "GF", dataIndex: "golesFavor", align: "center" },
              { title: "GC", dataIndex: "golesContra", align: "center" },
              {
                title: "DIF",
                dataIndex: "diferencia",
                align: "center",
                render: v => (
                  <span style={{ color: v > 0 ? "green" : v < 0 ? "red" : "#555" }}>
                    {v > 0 ? `+${v}` : v}
                  </span>
                )
              },
              {
                title: "PTS",
                dataIndex: "puntos",
                align: "center",
                render: v => <strong style={{ fontSize: 16 }}>{v}</strong>
              },
            ]}
            dataSource={tablaCalculada}
            rowKey="id"
            pagination={false}
          />
        </Card>
      )
    },
    {
      key: "fixture",
      label: <><CalendarOutlined /> Fixture</>,
      children: (
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          {rondasOrdenadas.length ? (
            rondasOrdenadas.map(ronda => (
              <Card
                key={ronda}
                title={
                  <Space>
                    <FireOutlined style={{ color: "#ff4d4f" }} />
                    {ronda.toUpperCase()}
                    <span style={{
  padding: '2px 8px',
  borderRadius: 4,
  fontSize: '12px',
  fontWeight: 500,
  border: '1px solid #B9BBBB',
  backgroundColor: '#f5f5f5'
}}>
  {partidosPorRonda[ronda].length} partidos
</span>
                  </Space>
                }
              >
                <Table
                  columns={columnasFixture}
                  dataSource={partidosPorRonda[ronda]}
                  rowKey="id"
                  pagination={false}
                />
              </Card>
            ))
          ) : (
            <Card><Empty description="No hay partidos programados" /></Card>
          )}
        </Space>
      )
    },
    {
      key: "estadisticas",
      label: <><ThunderboltOutlined /> Estadísticas</>,
      children: (
        <EstadisticasPublicas
          campeonato={campeonato}
          jugadores={jugadores}
          estadisticas={estadisticas}
        />
      )
    },
    {
      key: "equipos",
      label: <><TeamOutlined /> Equipos</>,
      children: (
        <Row gutter={[16, 16]}>
          {campeonato.equipos?.map(e => (
            <Col xs={24} md={8} key={e.id}>
              <Card hoverable>
                <Space direction="vertical">
                  <Space>
                    <Avatar size={48} icon={<TeamOutlined />} />
                    <div>
                      <h4>{e.nombre}</h4>
                      <span style={{ fontSize: 12, color: "#999" }}>{e.carrera?.nombre}</span>
                    </div>
                  </Space>

                <span style={{
  padding: '2px 8px',
  borderRadius: 4,
  fontSize: '12px',
  fontWeight: 500,
  border: '1px solid #B9BBBB',
  backgroundColor: '#f5f5f5'
}}>
  {(e.tipo || "").charAt(0).toUpperCase() + (e.tipo || "").slice(1)}
</span>

                  {e.jugadores && (
                    <div>
                      <Badge count={e.jugadores.length} style={{ background: "#52c41a" }}>
                        <UserOutlined style={{ fontSize: 20 }} />
                      </Badge>
                    </div>
                  )}
                </Space>
              </Card>
            </Col>
          ))}
        </Row>
      )
    }
  ];



  // ==================================================
  // RENDER PRINCIPAL
  // ==================================================
  return (
    <MainLayout
      breadcrumb={
        <Breadcrumb
          items={[
            { title: <a onClick={() => navigate("/campeonatos/publico")}>Campeonatos</a> },
            { title: campeonato.nombre }
          ]}
        />
      }
    >
      <ConfigProvider locale={locale}>
        <div style={{ padding: 24 }}>

          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate("/campeonatos/publico")}
            style={{ marginBottom: 16 }}
          >
            Volver
          </Button>

          {/* HEADER */}
          <Card style={{ marginBottom: 24 }}>
            <Row gutter={[24, 24]} align="middle">
              <Col flex="auto">
                <Space size="large">
                  <Avatar size={64} icon={<TrophyOutlined />} style={{ background: "#faad14" }} />
                  <div>
                    <h2 style={{ margin: 0 }}>{campeonato.nombre}</h2>

                    <Space style={{ marginTop: 8 }}>
                     <span style={{
  padding: '2px 8px',
  borderRadius: 4,
  fontSize: '12px',
  fontWeight: 500,
  border: '1px solid #B9BBBB',
  backgroundColor: '#f5f5f5'
}}>
  {campeonato.formato}
</span>

                      <span style={{
  padding: '2px 8px',
  borderRadius: 4,
  fontSize: '12px',
  fontWeight: 500,
  border: '1px solid #B9BBBB',
  backgroundColor: '#f5f5f5'
}}>
  {(campeonato.genero || "").charAt(0).toUpperCase() + (campeonato.genero || "").slice(1)}
</span>

                    <span style={{
  padding: '2px 8px',
  borderRadius: 4,
  fontSize: '12px',
  fontWeight: 500,
  border: '1px solid #B9BBBB',
  backgroundColor: '#f5f5f5'
}}>
  {campeonato.estado === "en_juego" ? "En Curso" :
   campeonato.estado === "finalizado" ? "Finalizado" :
   "Próximamente"}
</span>
                    </Space>
                  </div>
                </Space>
              </Col>

              <Col>
                <Space size="large">
                  <Statistic title="Equipos" value={campeonato.equipos.length} prefix={<TeamOutlined />} />
                  <Statistic title="Partidos" value={campeonato.partidos.length} prefix={<CalendarOutlined />} />
                </Space>
              </Col>
            </Row>
          </Card>

          {/* TABS */}
          <Card>
            <Tabs items={tabItems} defaultActiveKey="tabla" />
          </Card>
        </div>
      </ConfigProvider>
    </MainLayout>
  );
}
