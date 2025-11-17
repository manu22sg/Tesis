import api from './api';

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

//Exportar grupo excel
export async function exportarGruposExcel(filtros = {}) {
  try {
    const params = new URLSearchParams();
    if (filtros.nombre) params.append('nombre', filtros.nombre);
    if (filtros.q) params.append('q', filtros.q);

    const response = await api.get(`/grupos/export/excel?${params.toString()}`, {
      responseType: 'blob', // Importante para descargar archivos
    });

    // Crear un enlace temporal para descargar el archivo
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    
    // Nombre dinámico con fecha
    const fecha = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `grupos_${fecha}.xlsx`);
    
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    return { success: true };
  } catch (error) {
    console.error('Error exportando grupos a Excel:', error);
    throw error.response?.data?.message || 'Error al exportar grupos a Excel';
  }
}
// Exportar grupos a PDF
export async function exportarGruposPDF(filtros = {}) {
  try {
    const params = new URLSearchParams();
    if (filtros.nombre) params.append('nombre', filtros.nombre);
    if (filtros.q) params.append('q', filtros.q);

    const response = await api.get(`/grupos/export/pdf?${params.toString()}`, {
      responseType: 'blob', // Importante para descargar archivos
    });

    // Crear un enlace temporal para descargar el archivo
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'grupos.pdf');
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    return { success: true };
  } catch (error) {
    console.error('Error exportando grupos a PDF:', error);
    throw error.response?.data?.message || 'Error al exportar grupos a PDF';
  }
}

