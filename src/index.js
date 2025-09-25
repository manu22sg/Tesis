import express from 'express';
import dotenv from 'dotenv';
import cors from "cors";
import indexRoutes from "./routes/indexRoutes.js"
import cookieParser from "cookie-parser"
import {connectDB} from "./config/config.db.js"
import { createUsers } from './config/initialSetup.js';

dotenv.config();

const app = express();
const PORT = 3000;

await connectDB();
  await createUsers();
  console.log("✅ Configuración inicial completada");
app.use(express.json());
app.use(cookieParser());    

app.get('/', (req, res) => {
  console.log('¡Alguien visitó la página!');
  res.send('Hola mundo');
});

app.use("/api", indexRoutes);


app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});