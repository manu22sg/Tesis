import { AppDataSource } from "../config/config.db.js";

const EquipoRepo = () => AppDataSource.getRepository("EquipoCampeonato");
const PartidoRepo = () => AppDataSource.getRepository("PartidoCampeonato");
const CampeonatoRepo = () => AppDataSource.getRepository("Campeonato");

const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// Potencia de 2 más cercana
const nextPow2 = (n) => 1 << (32 - Math.clz32(n - 1));

/**
 * Corrige el nombre de la ronda según cantidad de equipos restantes
 */
const nombreRondaPorCantidad = (cantidadEquipos) => {
  switch (cantidadEquipos) {
    case 2: return "final";
    case 4: return "semifinal";
    case 8: return "cuartos";
    case 16: return "octavos";
    default:
      if (cantidadEquipos === 1) return "final";
      return `ronda_${cantidadEquipos}`;
  }
};

/**
 * Detecta automáticamente la última ronda jugada
 */
const detectarUltimaRonda = async (partRepo, campId) => {
  // Buscar todas las rondas del campeonato
  const todasLasRondas = await partRepo
    .createQueryBuilder("partido")
    .select("partido.ronda")
    .where("partido.campeonatoId = :campId", { campId })
    .groupBy("partido.ronda")
    .getRawMany();
  
  if (!todasLasRondas.length) {
    throw new Error("No hay rondas previas en este campeonato");
  }

  // Ordenar rondas por jerarquía (de más reciente a más antigua)
  const orden = ["octavos", "cuartos", "semifinal", "final"];
  const rondasDisponibles = todasLasRondas.map(r => r.partido_ronda);
  
  const rondasOrdenadas = rondasDisponibles.sort((a, b) => {
    const idxA = orden.indexOf(a);
    const idxB = orden.indexOf(b);
    
    // Si ambas están en el orden estándar
    if (idxA !== -1 && idxB !== -1) {
      return idxB - idxA; // Mayor índice = ronda más reciente
    }
    
    // Si solo una está en el orden
    if (idxA === -1 && idxB !== -1) return 1;
    if (idxA !== -1 && idxB === -1) return -1;
    
    // Si ninguna está en el orden (rondas personalizadas)
    return b.localeCompare(a);
  });

  return rondasOrdenadas[0]; // La ronda más reciente
};

/**
 * Genera la PRIMERA ronda del campeonato
 */
export const sortearPrimeraRonda = async ({ campeonatoId }) => {
  const ds = AppDataSource;
  return await ds.transaction(async (trx) => {
    const eqRepo = trx.getRepository("EquipoCampeonato");
    const partRepo = trx.getRepository("PartidoCampeonato");
    const campRepo = trx.getRepository("Campeonato");
    const jugRepo = trx.getRepository("JugadorCampeonato");

    // 1) Validar que el campeonato existe
    const camp = await campRepo.findOne({ where: { id: Number(campeonatoId) } });
    if (!camp) throw new Error("Campeonato no existe");

    // 2) Validar estado del campeonato
    if (camp.estado !== "creado") {
      throw new Error("El campeonato no está en estado 'creado'");
    }

    // 3) Verificar que no existan partidos ya sorteados
    const partidosExistentes = await partRepo.count({ 
      where: { campeonatoId: Number(campeonatoId) } 
    });
    if (partidosExistentes > 0) {
      throw new Error(
        `Ya se sorteó la primera ronda de este campeonato. ` +
        `Existen ${partidosExistentes} partido(s) registrado(s).`
      );
    }

    // 4) Traer equipos con su carrera
    const equipos = await eqRepo.find({ 
      where: { campeonatoId: Number(campeonatoId) },
      relations: ["carrera"],
    });

    if (equipos.length < 2) {
      throw new Error("Se requieren al menos 2 equipos para sortear la primera ronda");
    }

    // 5) Calcular mínimo de jugadores por equipo según formato
    const minPorEquipo =
      camp.formato === "11v11" ? 11 :
      camp.formato === "7v7" ? 7 : 5;

    // 6) Validar cada equipo: mínimo de jugadores + carrera correcta
    for (const equipo of equipos) {
      if (!equipo.carreraId || !equipo.carrera) {
        throw new Error(`El equipo "${equipo.nombre}" no tiene una carrera asociada`);
      }

      const jugadores = await jugRepo.find({
        where: {
          campeonatoId: Number(campeonatoId),
          equipoId: equipo.id,
        },
        relations: ["usuario", "usuario.carrera"],
      });

      // 6.1) Mínimo de jugadores
      if (jugadores.length < minPorEquipo) {
        throw new Error(
          `El equipo "${equipo.nombre}" tiene solo ${jugadores.length} jugadores. ` +
          `Debe tener al menos ${minPorEquipo} para sortear la primera ronda.`
        );
      }

      // 6.2) Todos los jugadores deben ser de la misma carrera
      for (const j of jugadores) {
        if (!j.usuario?.carrera || !j.usuario.carreraId) {
          throw new Error(
            `El jugador ${j.usuario?.nombre || j.id} del equipo "${equipo.nombre}" ` +
            `no tiene carrera configurada en el sistema`
          );
        }

        if (j.usuario.carreraId !== equipo.carreraId) {
          throw new Error(
            `El jugador ${j.usuario.nombre} pertenece a "${j.usuario.carrera.nombre}" ` +
            `y no puede jugar en el equipo de "${equipo.carrera.nombre}"`
          );
        }
      }
    }

    // 7) Si todo ok → barajar equipos y crear partidos

    const shuffled = shuffle(equipos.map(e => e.id));
    const n = shuffled.length;
    const target = nextPow2(n);
    const byes = target - n;
    const avanzan = shuffled.slice(0, byes);
    const aSortear = shuffled.slice(byes);

    const rondaNombre = nombreRondaPorCantidad(target);
    let orden = 1;
    const partidos = [];

    for (let i = 0; i < aSortear.length; i += 2) {
      const equipoAId = aSortear[i];
      const equipoBId = aSortear[i + 1];
      const A = Math.min(equipoAId, equipoBId);
      const B = Math.max(equipoAId, equipoBId);

      const p = partRepo.create({
        campeonatoId: Number(campeonatoId),
        canchaId: null,
        equipoAId: A,
        equipoBId: B,
        ronda: rondaNombre,
        golesA: null,
        golesB: null,
        ganadorId: null,
        estado: "pendiente",
        ordenLlave: orden++,
      });
      partidos.push(p);
    }

    const creados = await partRepo.save(partidos);

    // 8) Cambiar estado del campeonato a "en_juego"
    await campRepo.update(
      { id: Number(campeonatoId) },
      { estado: "en_juego" }
    );

    return {
      ronda: rondaNombre,
      partidosCreados: creados,
      byes: avanzan,
      totalEquipos: n,
      objetivoPotencia2: target,
      mensaje: `Primera ronda sorteada exitosamente. El campeonato ahora está en juego.`,
    };
  });
};
/**
 * Endpoint para generar la siguiente ronda (con detección automática)
 */
export const postGenerarSiguienteRonda = async (req, res) => {
  try {
    const { rondaAnterior } = req.body; // Ahora es opcional
    const resultado = await generarSiguienteRonda({ 
      campeonatoId: req.params.id, 
      rondaAnterior // Puede ser undefined
    });
    res.json(resultado);
  } catch (e) { 
    res.status(400).json({ error: e.message }); 
  }
};

/**
 * Genera la siguiente ronda a partir de los ganadores
 * Si no se especifica rondaAnterior, la detecta automáticamente
 */
export const generarSiguienteRonda = async ({ campeonatoId, rondaAnterior }) => {
  const ds = AppDataSource;
  return await ds.transaction(async (trx) => {
    const partRepo = trx.getRepository("PartidoCampeonato");
    const campRepo = trx.getRepository("Campeonato");
    const equipoRepo = trx.getRepository("EquipoCampeonato");
    const campId = Number(campeonatoId);

    //  Si no se especifica rondaAnterior, detectarla automáticamente
    let rondaAUsar = rondaAnterior;
    
    if (!rondaAUsar) {
      rondaAUsar = await detectarUltimaRonda(partRepo, campId);
    }

    // Obtener partidos de la ronda anterior
    const todosPartidos = await partRepo.find({
      where: { campeonatoId: campId, ronda: rondaAUsar },
      order: { ordenLlave: "ASC" },
    });
    
    if (!todosPartidos.length) {
      throw new Error(`No existe la ronda "${rondaAUsar}"`);
    }

    // Validar que todos estén finalizados
    const finalizados = todosPartidos.filter(p => p.estado === "finalizado");
    if (finalizados.length !== todosPartidos.length) {
      throw new Error(
        `Solo ${finalizados.length} de ${todosPartidos.length} partidos están finalizados en "${rondaAUsar}". ` +
        `Completa todos los partidos antes de generar la siguiente ronda.`
      );
    }

    // Obtener ganadores válidos
    const ganadores = finalizados
      .map(p => Number(p.ganadorId))
      .filter(id => !isNaN(id) && id > 0);

    if (ganadores.length !== finalizados.length) {
      throw new Error("Uno o más partidos finalizados no tienen ganador asignado");
    }

    // Caso: un solo ganador → campeonato finalizado
    if (ganadores.length === 1) {
      const equipoGanador = await equipoRepo.findOne({ where: { id: ganadores[0] } });
      if (!equipoGanador) {
        throw new Error("No se encontró el equipo ganador del campeonato");
      }

      // Marcar campeonato como finalizado
      await campRepo.update({ id: campId }, { estado: "finalizado" });

      return {
        ronda: null,
        partidosCreados: 0,
        fin: true,
        mensaje: `¡El campeonato ha finalizado!`,
        ganadorId: equipoGanador.id,
        nombreGanador: equipoGanador.nombre,
        rondaAnterior: rondaAUsar,
      };
    }

    // Si hay menos de 2 ganadores → no se puede continuar
    if (ganadores.length < 2) {
      return {
        ronda: null,
        partidosCreados: 0,
        fin: true,
        mensaje: "No hay suficientes ganadores para continuar",
      };
    }

    // Validar número par de ganadores
    if (ganadores.length % 2 !== 0) {
      throw new Error(
        `Número impar de ganadores (${ganadores.length}) en "${rondaAUsar}". ` +
        `Revisa los partidos de esa ronda.`
      );
    }

    // Crear la siguiente ronda
    const nombreSiguiente = nombreRondaPorCantidad(ganadores.length).toLowerCase();

    const existente = await partRepo.findOne({
      where: { campeonatoId: campId, ronda: nombreSiguiente },
    });
    
    if (existente) {
      throw new Error(`La ronda "${nombreSiguiente}" ya fue generada previamente`);
    }

    const nuevas = [];
    for (let i = 0; i < ganadores.length; i += 2) {
      nuevas.push(partRepo.create({
        campeonatoId: campId,
        canchaId: null,
        equipoAId: ganadores[i],
        equipoBId: ganadores[i + 1],
        ronda: nombreSiguiente,
        golesA: null,
        golesB: null,
        ganadorId: null,
        estado: "pendiente",
        ordenLlave: Math.floor(i / 2) + 1,
      }));
    }

    const creados = await partRepo.save(nuevas);

    return {
      rondaAnterior: rondaAUsar,
      ronda: nombreSiguiente,
      totalGanadores: ganadores.length,
      partidosCreados: creados.length,
      partidos: creados,
      fin: nombreSiguiente === "final",
    };
  });
};