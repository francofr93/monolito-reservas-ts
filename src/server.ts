import 'dotenv/config';
import { Pool } from 'pg';
import { createApp } from './app';

const pool = new Pool({
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  database: process.env.DB_NAME ?? 'arquitectura',
  user: process.env.DB_USER ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
});

const port = Number(process.env.PORT ?? 3000);
const app = createApp(pool);
const server = app.listen(port, () => {
  console.log(`API disponible en http://localhost:${port}`);
});

async function shutdown(signal: string) {
  console.log(`Señal ${signal} recibida; cerrando servidor y conexiones.`);
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
