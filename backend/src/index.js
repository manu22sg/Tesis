import express from 'express';
import dotenv from 'dotenv';
import cors from "cors";
import indexRoutes from "./routes/indexRoutes.js"
import cookieParser from "cookie-parser"
import {connectDB} from "./config/config.db.js"
import { createUsers } from './config/initialSetup.js';
import {createCarreras} from "./config/carrerasSetup.js"
import { iniciarCronJobs } from './utils/jobCron.js';
//import { createEstadisticas } from "./config/seedEstadisticas.js";

dotenv.config();

const app = express();
const PORT = 3000; //80
app.use((req, res, next) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.charset = "utf-8";
  next();
});
await connectDB();
await createUsers();
await createCarreras();
//await createEstadisticas();
console.log("Configuración inicial completada");

// 🔥 Forzar JSON a UTF-8 siempre
app.set('json escape', false);
app.set('json replacer', (key, value) => value);

// 🔥 Forzar charset UTF-8 en todas las respuestas HTTP
app.use((req, res, next) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.charset = "utf-8";
  next();
});

app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
}));

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

iniciarCronJobs();



app.get('/', (req, res) => {
  console.log('¡Alguien visitó la página!');
  res.send('Hola mundo');
});

app.use("/api", indexRoutes);

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
