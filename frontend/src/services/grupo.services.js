import api from './root.services.js';

// Obtener todos los grupos
export const obtenerGrupos = async (filtros = {}) => {
  try {
    const params = new URLSearchParams();
    if (filtros.nombre) params.append('nombre', filtros.nombre);
    if (filtros.page) params.append('page', filtros.page);
    if (filtros.limit) params.append('limit', filtros.limit);

    const response = await api.get(`/grupos?${params.toString()}`);
    return response.data;
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message || 'Error al obtener grupos';
    console.error('Error en obtenerGrupos:', error.response?.data || error);
    throw errorMsg;
  }
};


// Crear grupo
export async function crearGrupo(datos) {
  const res = await api.post('/grupos', datos);
  return res.data.data;
}

// Obtener grupo por ID
export async function obtenerGrupoPorId(id) {
  const res = await api.get(`/grupos/${id}`);
  return res.data.data;
}

// Actualizar grupo
export async function actualizarGrupo(id, datos) {
  const res = await api.patch(`/grupos/${id}`, datos);
  return res.data.data;
}

// Eliminar grupo
export async function eliminarGrupo(id) {
  const res = await api.delete(`/grupos/${id}`);
  return res.data.data;
}

// Obtener miembros de un grupo
export async function obtenerMiembrosGrupo(grupoId, params = {}) {
  const res = await api.get(`/grupos/${grupoId}/miembros`, { params });
  return res.data.data;
}