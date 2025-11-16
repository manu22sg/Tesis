import { AppDataSource } from '../config/config.db.js';
import ReservaCanchaSchema from '../entity/ReservaCancha.js';
import HistorialReservaSchema from '../entity/HistorialReserva.js';

export async function actualizarEstadosReservas() {
  return AppDataSource.transaction(async (manager) => {
    const historialRepo = manager.getRepository(HistorialReservaSchema);

    // 1. Expirar reservas pendientes
    const exp = await manager
      .createQueryBuilder()
      .update(ReservaCanchaSchema)
      .set({ estado: 'expirada' })
      .where('estado = :estadoPend', { estadoPend: 'pendiente' })
      .andWhere(`("fechaReserva" < CURRENT_DATE OR 
                 ("fechaReserva" = CURRENT_DATE AND "horaFin" <= CURRENT_TIME))`)
      .returning(['id'])
      .execute();

    if (exp.raw.length) {
      const historialesExp = exp.raw.map((r) =>
        historialRepo.create({
          reservaId: r.id,
          accion: 'expirada',
          observacion: 'Reserva expirada automáticamente por falta de aprobación',
          usuarioId: null,
        })
      );
      await historialRepo.save(historialesExp);
    }

    // 2. Completar reservas aprobadas
    const comp = await manager
      .createQueryBuilder()
      .update(ReservaCanchaSchema)
      .set({ estado: 'completada' })
      .where('estado = :estadoApr', { estadoApr: 'aprobada' })
      .andWhere(`("fechaReserva" < CURRENT_DATE OR 
                 ("fechaReserva" = CURRENT_DATE AND "horaFin" <= CURRENT_TIME))`)
      .returning(['id'])
      .execute();

    if (comp.raw.length) {
      const historialesComp = comp.raw.map((r) =>
        historialRepo.create({
          reservaId: r.id,
          accion: 'completada',
          observacion: 'Reserva completada automáticamente',
          usuarioId: null,
        })
      );
      await historialRepo.save(historialesComp);
    }

    const resumen = {
      expiradas: exp.raw.length,
      completadas: comp.raw.length,
    };

  
    return resumen;
  });
}