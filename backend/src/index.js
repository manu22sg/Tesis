import express from 'express';
import dotenv from 'dotenv';
import cors from "cors";
import indexRoutes from "./routes/indexRoutes.js"
import cookieParser from "cookie-parser"
import {connectDB} from "./config/config.db.js"
import { createUsers } from './config/initialSetup.js';
import {createCarreras} from "./config/carrerasSetup.js"
import { iniciarCronJobs } from './utils/jobCron.js';



dotenv.config();

const app = express();
const PORT = 3000;

await connectDB();
await createUsers();
await createCarreras();
  console.log("Configuración inicial completada");

  
app.use(cors({
  origin: "http://localhost:5173", 
  credentials: true,               
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