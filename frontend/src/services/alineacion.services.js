import api from './root.services.js';


export const crearAlineacion = async (datos) => {
  const response = await api.post('/alineaciones', datos);
  return response.data;
};


export const obtenerAlineacionPorSesion = async (sesionId) => {
  const response = await api.get(`/alineaciones/sesion/${sesionId}`);
  return response.data;
};


export const agregarJugadorAlineacion = async (datos) => {
  const response = await api.post('/alineaciones/jugador', datos);
  return response.data;
};


export const actualizarJugadorAlineacion = async (datos) => {
  const response = await api.patch('/alineaciones/jugador', datos);
  return response.data;
};

export const quitarJugadorAlineacion = async (alineacionId, jugadorId) => {
  const response = await api.delete(`/alineaciones/jugador/${alineacionId}/${jugadorId}`);
  return response.data;
};


export const eliminarAlineacion = async (id) => {
  const response = await api.delete(`/alineaciones/${id}`);
  return response.data;
};