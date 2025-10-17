import api from "./root.services.js";

export async function loginRequest(credentials) {
  try {
    console.log(' Enviando login con:', { email: credentials.email });
    const { data } = await api.post("/auth/login", credentials);
  //  console.log(' Respuesta de login:', data);
    
    return data.data?.user || null;
  } catch (error) {
    console.error(' Error en loginRequest:', error.response?.data || error.message);
    throw error;
  }
}

export async function verifyToken() {
  try {
    const { data } = await api.get("/auth/verify");
    //console.log(" Token verificado:", data);
    return data?.data?.user || null;
  } catch (error) {
    // Silenciosamente retornar null si no hay sesión
    if (error.response?.status === 401) {
      //console.log(" No hay sesión activa");
    } else {
      console.error(" Error verificando token:", error.response?.status);
    }
    return null;
  }
}

export async function logoutRequest() {
  try {
    //console.log("Ejecutando logout");
    await api.post("/auth/logout");
   // console.log(" Logout exitoso");
  } catch (error) {
    // Ignorar error 401 en logout (cookie ya eliminada)
    if (error.response?.status === 401) {
      console.log("Sesión ya cerrada");
      return;
    }
    console.log(error)
    console.error(" Error en logout:", error);
    throw error;
  }
}

export async function buscarUsuariosPorRuts(ruts) {
  try {
    const { data } = await api.post("/auth/buscar-usuarios", { ruts });
   // console.log("Respuesta del servidor:", data);
    return data.data || {};
  } catch (error) {
    console.error("Error buscando usuarios:", error);
    return {};
  }
}

export async function buscarUsuarios(termino) {
  try {
    if (!termino || termino.length < 2) return [];
    
   // console.log(" Buscando usuarios con término:", termino);
    const { data } = await api.get("/auth/buscar-usuarios", {
      params: { termino }
    });
    return data.data || [];
  } catch (error) {
    console.error(" Error buscando usuarios:", error);
    return [];
  }
}
