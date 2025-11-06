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

 //  Genera la PRIMERA ronda del campeonato
export const sortearPrimeraRonda = async ({ campeonatoId }) => {
  const ds = AppDataSource;
  return await ds.transaction(async (trx) => {
    const eqRepo = trx.getRepository("EquipoCampeonato");
    const partRepo = trx.getRepository("PartidoCampeonato");
    const campRepo = trx.getRepository("Campeonato");

    // Validar que el campeonato existe
    const camp = await campRepo.findOne({ where: { id: Number(campeonatoId) } });
    if (!camp) throw new Error("Campeonato no existe");

    // Validar estado del campeonato
    if (camp.estado !== "creado") {
      throw new Error("El campeonato no está en estado creado");
    }

    // ✅ VALIDACIÓN NUEVA: Verificar que no existan partidos ya sorteados
    const partidosExistentes = await partRepo.count({ 
      where: { campeonatoId: Number(campeonatoId) } 
    });
    
    if (partidosExistentes > 0) {
      throw new Error(
        `Ya se sorteó la primera ronda de este campeonato. ` +
        `Existen ${partidosExistentes} partido(s) registrado(s).`
      );
    }

    // Validar equipos mínimos
    const equipos = await eqRepo.find({ where: { campeonatoId: Number(campeonatoId) } });
    if (equipos.length < 2) {
      throw new Error("Se requieren al menos 2 equipos para sortear la primera ronda");
    }

    // Barajar equipos
    const shuffled = shuffle(equipos.map(e => e.id));
    const n = shuffled.length;
    const target = nextPow2(n);
    const byes = target - n;
    const avanzan = shuffled.slice(0, byes);
    const aSortear = shuffled.slice(byes);

    const rondaNombre = nombreRondaPorCantidad(target);
    let orden = 1;
    const partidos = [];

    // Crear partidos de la primera ronda
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
      mensaje: `Primera ronda sorteada exitosamente. El campeonato ahora está en juego.`
    };
  });
};


 //  Genera la siguiente ronda a partir de los ganadores
export const postGenerarSiguienteRonda = async (req, res) => {
  try {
    const { rondaAnterior } = req.body;
    const resultado = await generarSiguienteRonda({ 
      campeonatoId: req.params.id, 
      rondaAnterior 
    });
    res.json(resultado);
  } catch (e) { 
    res.status(400).json({ error: e.message }); 
  }
};

export const generarSiguienteRonda = async ({ campeonatoId, rondaAnterior }) => {
  const ds = AppDataSource;
  return await ds.transaction(async (trx) => {
    const partRepo = trx.getRepository("PartidoCampeonato");
    const campRepo = trx.getRepository("Campeonato");
    const equipoRepo = trx.getRepository("EquipoCampeonato");
    const campId = Number(campeonatoId);

    //  Obtener partidos de la ronda anterior
    const todosPartidos = await partRepo.find({
      where: { campeonatoId: campId, ronda: rondaAnterior },
      order: { ordenLlave: "ASC" },
    });
    if (!todosPartidos.length) throw new Error("No existe la ronda anterior especificada");

    // Validar que todos estén finalizados
    const finalizados = todosPartidos.filter(p => p.estado === "finalizado");
    if (finalizados.length !== todosPartidos.length)
      throw new Error(` ${finalizados.length} de ${todosPartidos.length} partidos están finalizados en ${rondaAnterior}`);

    //  Obtener ganadores válidos
    const ganadores = finalizados
      .map(p => Number(p.ganadorId))
      .filter(id => !isNaN(id) && id > 0);

    if (ganadores.length !== finalizados.length)
      throw new Error("Uno o más partidos finalizados no tienen ganador asignado");

    //  Caso: un solo ganador → campeonato finalizado
    if (ganadores.length === 1) {
      const equipoGanador = await equipoRepo.findOne({ where: { id: ganadores[0] } });
      if (!equipoGanador)
        throw new Error("No se encontró el equipo ganador del campeonato");

      // marcar campeonato como finalizado
      await campRepo.update({ id: campId }, { estado: "finalizado" });

      return {
        ronda: null,
        partidosCreados: [],
        fin: true,
        mensaje: ` El campeonato ha finalizado. El equipo campeón es: ${equipoGanador.nombre}`,
        ganadorId: equipoGanador.id,
        nombreGanador: equipoGanador.nombre,
      };
    }

    //  Si hay menos de 2 ganadores → no se puede continuar
    if (ganadores.length < 2) {
      return {
        ronda: null,
        partidosCreados: [],
        fin: true,
        mensaje: "No hay suficientes ganadores para continuar",
      };
    }

    //  Validar número par de ganadores
    if (ganadores.length % 2 !== 0)
      throw new Error(`Número impar de ganadores (${ganadores.length}). Revisa los partidos de ${rondaAnterior}`);

    //  Crear la siguiente ronda
    const nombreSiguiente = nombreRondaPorCantidad(ganadores.length).toLowerCase();

    const existente = await partRepo.findOne({
      where: { campeonatoId: campId, ronda: nombreSiguiente },
    });
    if (existente)
      throw new Error(`La ronda "${nombreSiguiente}" ya fue generada`);

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
      rondaAnterior,
      ronda: nombreSiguiente,
      totalGanadores: ganadores.length,
      partidosCreados: creados.length,
      partidos: creados,
      fin: nombreSiguiente === "final",
    };
  });
};


