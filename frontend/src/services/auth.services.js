import api from "./root.services.js";

//LOGIN
export async function loginRequest(credentials) {
  try {
    const { data } = await api.post("/auth/login", credentials);
    
    // Devuelve { user, token }
    return data.data || null;

  } catch (error) {
    //console.log(error)
    throw error.response?.data?.message || error;
  }
}



//REGISTRO
export async function registerRequest(userData) {
  try {
    const { data } = await api.post("/auth/register", userData);
    return data;
  } catch (error) {
    console.error("Error en registerRequest:", error.response?.data || error.message);
    throw error.response?.data || error;
  }
}

// VERIFICAR EMAIL
export async function verificarEmailRequest(token) {
  try {
    const { data } = await api.get(`/auth/verificar/${token}`);
    return data;
  } catch (error) {
    console.error("Error verificando email:", error.response?.data || error.message);
    throw error.response?.data || error;
  }
}

// REENVIAR VERIFICACIÓN
export async function reenviarVerificacionRequest(email) {
  try {
    const { data } = await api.post("/auth/reenviar-verificacion", { email });
    return data;
  } catch (error) {
    console.log(  "error proveninente de servicio front", error)
    console.error("Error reenviando verificación:", error.response?.data || error.message);
    throw error.response?.data || error;
  }
}

// VERIFICAR TOKEN (perfil rápido)
export async function verifyToken() {
  try {
    const response = await api.get("/auth/verify");
    return response.data; 
  } catch (error) {
    if (error.response?.status === 401) return null;
    console.error("Error verificando token:", error);
    return null;
  }
}


// LOGOUT
export async function logoutRequest() {
  try {
    await api.post("/auth/logout");
  } catch (error) {
    if (error.response?.status === 401) return;
    console.error("Error en logout:", error.response?.data || error.message);
    throw error;
  }
}

// BUSCAR USUARIOS POR RUTS
export async function buscarUsuariosPorRuts(ruts) {
  try {
    const { data } = await api.post("/auth/buscar-usuarios-rut", { ruts });
    return data.data || {};
  } catch (error) {
    console.error("Error buscando usuarios:", error.response?.data || error.message);
    return {};
  }
}


export async function solicitarRestablecimientoRequest(email) {
  try {
    const { data } = await api.post("/auth/solicitar-restablecimiento", { email });
    return data;
  } catch (error) {
    console.error("Error solicitando restablecimiento:", error.response?.data || error.message);
    throw error.response?.data || error;
  }
}


export async function restablecerPasswordRequest(token, password) {
  try {
    const { data } = await api.post(`/auth/restablecer-password/${token}`, { password });
    return data;
  } catch (error) {
    console.error("Error restableciendo contraseña:", error.response?.data || error.message);
    throw error.response?.data || error;
  }
}

// AUTOCOMPLETE DE USUARIOS
export async function buscarUsuarios(termino, opciones = {}) {
  try {
    const params = { termino };

    if (opciones.roles?.length > 0) {
      params.roles = JSON.stringify(opciones.roles);
    }
    if (opciones.sexo) {
      params.sexo = opciones.sexo;
    }


    if (opciones.excluirJugadores === true) {
      params.excluirJugadores = "true";
    }

    if (opciones.carreraId) {
      params.carreraId = opciones.carreraId;
    }

    const { data } = await api.get("/auth/buscar-usuarios", { params });
    return data.data || [];

  } catch (error) {
    console.error("Error buscando usuarios:", error.response?.data || error.message);
    return [];
  }
}
