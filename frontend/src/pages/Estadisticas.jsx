import React, { useState, useEffect } from 'react';
import { Card, Button, Modal, Tabs, Select, message, Row, Col, ConfigProvider } from 'antd';
import locale from 'antd/locale/es_ES';
import { PlusOutlined, TrophyOutlined, ReloadOutlined } from '@ant-design/icons';
import EstadisticaForm from '../components/EstadisticaForm';
import ListaEstadisticas from '../components/EstadisticasList';
import MainLayout from '../components/MainLayout';
import { obtenerJugadores } from '../services/jugador.services.js';
import { obtenerSesiones } from '../services/sesion.services.js';
import dayjs from 'dayjs';
import 'dayjs/locale/es';

dayjs.locale('es');

const { TabPane } = Tabs;
const { Option } = Select;

const Estadisticas = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [estadisticaEditar, setEstadisticaEditar] = useState(null);
  const [jugadores, setJugadores] = useState([]);
  const [sesiones, setSesiones] = useState([]);
  const [filtroJugador, setFiltroJugador] = useState(null);
  const [filtroSesion, setFiltroSesion] = useState(null);
  const [tabActiva, setTabActiva] = useState('sesion');
  const [cargando, setCargando] = useState(false);

  // 🔁 Fuerza la recarga de las listas
  const [claveRecarga, setClaveRecarga] = useState(0);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const jugadoresRes = await obtenerJugadores();
      setJugadores(Array.isArray(jugadoresRes.jugadores) ? jugadoresRes.jugadores : []);

      const sesionesRes = await obtenerSesiones({ limit: 50 });
      setSesiones(Array.isArray(sesionesRes.sesiones) ? sesionesRes.sesiones : []);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      message.error('Error al cargar jugadores o sesiones');
    } finally {
      setCargando(false);
    }
  };

  const manejarCrear = () => {
    setEstadisticaEditar(null);
    setModalVisible(true);
  };

  const manejarEditar = (estadistica) => {
    setEstadisticaEditar(estadistica);
    setModalVisible(true);
  };

  const manejarExito = () => {
    setModalVisible(false);
    setEstadisticaEditar(null);
    message.success('Estadística guardada correctamente');
    // 🔁 Fuerza recarga de la lista
    setClaveRecarga((prev) => prev + 1);
  };

  const manejarCancelar = () => {
    setModalVisible(false);
    setEstadisticaEditar(null);
  };

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
                Gestión de Estadísticas
              </div>
            }
            extra={
              <div style={{ display: 'flex', gap: 8 }}>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={manejarActualizar}
                >
                  Actualizar
                </Button>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={manejarCrear}
                >
                  Nueva Estadística
                </Button>
              </div>
            }
          >
           <Tabs
  activeKey={tabActiva}
  onChange={setTabActiva}
  items={[
    {
      key: 'sesion',
      label: 'Por Sesión',
      children: (
        <>
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={12}>
              <Select
                placeholder="Filtrar por sesión"
                style={{ width: '100%' }}
                value={filtroSesion}
                onChange={setFiltroSesion}
                allowClear
                loading={cargando}
                showSearch
                filterOption={(input, option) =>
                  String(option?.children ?? '')
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
              >
                {sesiones.map((sesion) => {
                  const fecha = sesion.fecha
                    ? dayjs(sesion.fecha).format('DD/MM/YYYY')
                    : 'Sin fecha';
                  const hora = sesion.horaInicio
                    ? dayjs(`1970-01-01T${sesion.horaInicio}`).format('HH:mm')
                    : 'Sin hora';
                  return (
                    <Option key={sesion.id} value={sesion.id}>
                      {sesion.nombre} {fecha} — {hora}
                    </Option>
                  );
                })}
              </Select>
            </Col>
          </Row>

          {filtroSesion ? (
            <ListaEstadisticas
              tipo="sesion"
              id={filtroSesion}
              onEdit={manejarEditar}
              reloadKey={claveRecarga}
            />
          ) : (
            <div
              style={{
                textAlign: 'center',
                padding: '40px',
                color: '#999',
              }}
            >
              Selecciona una sesión para ver las estadísticas
            </div>
          )}
        </>
      ),
    },
    {
      key: 'jugador',
      label: 'Por Jugador',
      children: (
        <>
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={12}>
              <Select
                placeholder="Filtrar por jugador"
                style={{ width: '100%' }}
                value={filtroJugador}
                onChange={setFiltroJugador}
                allowClear
                showSearch
                loading={cargando}
                filterOption={(input, option) =>
                  String(option?.children ?? '')
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
              >
                {jugadores.map((jugador) => (
                  <Option key={jugador.id} value={jugador.id}>
                    {jugador.usuario?.nombre} {jugador.usuario?.apellido} —{' '}
                    {jugador.usuario?.rut || 'Sin RUT'}
                  </Option>
                ))}
              </Select>
            </Col>
          </Row>

          {filtroJugador ? (
            <ListaEstadisticas
              tipo="jugador"
              id={filtroJugador}
              onEdit={manejarEditar}
              reloadKey={claveRecarga}
            />
          ) : (
            <div
              style={{
                textAlign: 'center',
                padding: '40px',
                color: '#999',
              }}
            >
              Selecciona un jugador para ver las estadísticas
            </div>
          )}
        </>
      ),
    },
  ]}
/>
          </Card>

          {/*  MODAL FORMULARIO */}
          <Modal
            title={estadisticaEditar ? 'Editar Estadística' : 'Nueva Estadística'}
            open={modalVisible}
            onCancel={manejarCancelar}
            footer={null}
            width={800}
          >
            <EstadisticaForm
              estadistica={estadisticaEditar}
              jugadores={jugadores}
              onSuccess={manejarExito}
              onCancel={manejarCancelar}
            />
          </Modal>
        </div>
      </ConfigProvider>
    </MainLayout>
  );
};

export default Estadisticas;