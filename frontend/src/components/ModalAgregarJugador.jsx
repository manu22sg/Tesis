import { useState, useEffect } from 'react';
import { Modal, Button, Select, Spin, Typography, Space, Divider } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { obtenerJugadores } from '../services/jugador.services.js';

const { Text } = Typography;

export default function ModalAgregarJugador({
  visible,
  onClose,
  onConfirm,
  grupo,
  miembros = [],
  loading = false
}) {
  const [jugadorSeleccionado, setJugadorSeleccionado] = useState(null);
  const [busquedaJugador, setBusquedaJugador] = useState('');
  const [busquedaJugadorDebounced, setBusquedaJugadorDebounced] = useState('');
  const [jugadoresDisponibles, setJugadoresDisponibles] = useState([]);
  const [buscandoJugadores, setBuscandoJugadores] = useState(false);

  // Debounce para búsqueda
  useEffect(() => {
    const timeout = setTimeout(() => {
      setBusquedaJugadorDebounced(busquedaJugador);
    }, 500);
    return () => clearTimeout(timeout);
  }, [busquedaJugador]);

  // Búsqueda de jugadores
  useEffect(() => {
    const buscarJugadores = async () => {
      const termino = busquedaJugadorDebounced.trim();
      
      if (!termino || termino.length < 2) {
        setJugadoresDisponibles([]);
        return;
      }

      try {
        setBuscandoJugadores(true);
        
        const resultado = await obtenerJugadores({
          q: termino,
          limit: 50,
          page: 1
        });
        
        const lista = resultado.jugadores || resultado?.data?.jugadores || [];
        const idsGrupo = new Set(miembros.map(m => m.id));
        const disponibles = lista.filter(j => !idsGrupo.has(j.id));
        
        setJugadoresDisponibles(disponibles);
      } catch (error) {
        console.error('Error buscando jugadores:', error);
      } finally {
        setBuscandoJugadores(false);
      }
    };

    buscarJugadores();
  }, [busquedaJugadorDebounced, miembros]);

  const limpiarFormulario = () => {
    setJugadorSeleccionado(null);
    setBusquedaJugador('');
    setBusquedaJugadorDebounced('');
    setJugadoresDisponibles([]);
  };

  const handleCancelar = () => {
    limpiarFormulario();
    onClose();
  };

  const handleAgregarYCerrar = async () => {
    if (!jugadorSeleccionado) return;
    const success = await onConfirm(jugadorSeleccionado);
    if (success) {
      limpiarFormulario();
      onClose();
    }
  };

  const handleAgregarYContinuar = async () => {
    if (!jugadorSeleccionado) return;
    const success = await onConfirm(jugadorSeleccionado);
    if (success) {
      limpiarFormulario();
    }
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <UserOutlined />
          <span>Agregar Jugador al Grupo</span>
        </div>
      }
      open={visible}
      onCancel={handleCancelar}
      footer={[
        <Button key="cancel" onClick={handleCancelar}>
          Cancelar
        </Button>,
        <Button
          key="continue"
          type="default"
          loading={loading}
          onClick={handleAgregarYContinuar}
          disabled={!jugadorSeleccionado}
        >
          Agregar y Continuar
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={loading}
          onClick={handleAgregarYCerrar}
          disabled={!jugadorSeleccionado}
        >
          Agregar y Cerrar
        </Button>,
      ]}
      width={600}
    >
      <div style={{ marginBottom: 16 }}>
        <Text strong>Grupo: </Text>
        <Text>{grupo?.nombre}</Text>
      </div>

      <Divider style={{ margin: '16px 0' }} />

      <div>
        <Text strong>Seleccione un jugador:</Text>
        <Select
          value={jugadorSeleccionado}
          onChange={setJugadorSeleccionado}
          placeholder="Escriba para buscar por nombre o RUT..."
          style={{ width: '100%', marginTop: 8 }}
          showSearch
          searchValue={busquedaJugador}
          onSearch={setBusquedaJugador}
          loading={buscandoJugadores}
          filterOption={false}
          notFoundContent={
            buscandoJugadores || (busquedaJugador.length >= 2 && busquedaJugador !== busquedaJugadorDebounced) ? (
              <div style={{ textAlign: 'center', padding: 16 }}>
                <Spin size="small" />
                <div style={{ marginTop: 8 }}>Buscando...</div>
              </div>
            ) : busquedaJugador.length < 2 ? (
              <div style={{ textAlign: 'center', padding: 16, color: '#999' }}>
                Escriba al menos 2 caracteres para buscar
              </div>
            ) : jugadoresDisponibles.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 16, color: '#999' }}>
                No se encontraron jugadores disponibles
              </div>
            ) : null
          }
          options={(jugadoresDisponibles || []).map(j => ({
            value: j.id,
            label: `${j.usuario?.nombre || 'Sin nombre'} ${j.usuario?.apellido || ''} - ${j.usuario?.rut || 'Sin RUT'} - ${j.usuario?.carrera?.nombre || 'Sin carrera'}`.trim(),
          }))}
        />
      </div>
    </Modal>
  );
}