import express from 'express';
import dotenv from 'dotenv';
import cors from "cors";
import indexRoutes from "./routes/indexRoutes.js"
import cookieParser from "cookie-parser"
import {connectDB} from "./config/config.db.js"
import { createUsers } from './config/initialSetup.js';
import { actualizarEstadosReservas } from './utils/reserva.job.js';
import {enviarRecordatoriosSesiones} from './utils/recordatorioSesiones.js'
import {enviarRecordatoriosReservas} from './utils/recordatorioReservas.js'


import cron from 'node-cron';

dotenv.config();

const app = express();
const PORT = 3000;

await connectDB();
  await createUsers();
  console.log("Configuración inicial completada");

  
app.use(cors({
  origin: "http://localhost:5173", // especifica el origen exacto
  credentials: true,               // permite envío de cookies
}));
app.use(cookieParser()); 
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

cron.schedule('*/30 * * * *', async () => {
  await actualizarEstadosReservas();
  await enviarRecordatoriosSesiones();
  await enviarRecordatoriosReservas();
});

   


app.get('/', (req, res) => {
  console.log('¡Alguien visitó la página!');
  res.send('Hola mundo');
});

app.use("/api", indexRoutes);


app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});