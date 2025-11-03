import api from "./root.services.js";

export async function loginRequest(credentials) {
  try {
    const { data } = await api.post("/auth/login", credentials);
    
    return data.data?.user || null;
  } catch (error) {
    console.error(' Error en loginRequest:', error.response?.data || error.message);
    throw error;
  }
}

export async function verifyToken() {
  try {
    const { data } = await api.get("/auth/verify");
    return data?.data?.user || null;
  } catch (error) {
    // Silenciosamente retornar null si no hay sesión
    if (error.response?.status === 401) {
    } else {
      console.error(" Error verificando token:", error.response?.status);
    }
    return null;
  }
}

export async function logoutRequest() {
  try {
    await api.post("/auth/logout");
  } catch (error) {
    // Ignorar error 401 en logout (cookie ya eliminada)
    if (error.response?.status === 401) {
      return;
    }
    console.error(" Error en logout:", error);
    throw error;
  }
}

export async function buscarUsuariosPorRuts(ruts) {
  try {
    const { data } = await api.post("/auth/buscar-usuarios", { ruts });
    return data.data || {};
  } catch (error) {
    console.error("Error buscando usuarios:", error);
    return {};
  }
}

export async function buscarUsuarios(termino, opciones = {}) {
  try {
    


    const params = { termino };
    
    // Agregar roles si se especifican
    if (opciones.roles && opciones.roles.length > 0) {
      params.roles = JSON.stringify(opciones.roles);
    }
    
    // 🔥 Agregar excluirJugadores si es true
    if (opciones.excluirJugadores === true) {
      params.excluirJugadores = 'true';
    }
    
    const { data } = await api.get("/auth/buscar-usuarios", { params });
    return data.data || [];
  } catch (error) {
    console.error("❌ Error buscando usuarios:", error);
    return [];
  }
}