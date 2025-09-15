import express from 'express';
import dotenv from 'dotenv';
import cors from "cors";
import cookieParser from "cookie-parser"
import {connectDB} from "./config/config.db.js"
dotenv.config();

const app = express();
const PORT = 3000;

await connectDB();

app.use(express.json());
app.use(cookieParser());    

app.get('/', (req, res) => {
  console.log('¡Alguien visitó la página!');
  res.send('Hola mundo');
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});