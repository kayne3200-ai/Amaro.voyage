import dotenv from 'dotenv';
import express, { type Request, type Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createAmaroApp } from './src/server/createAmaroApp';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = 3000;

function loadFirebaseAppletConfig(): { projectId: string; firestoreDatabaseId: string } {
  const configPath = path.join(__dirname, 'firebase-applet-config.json');
  const raw = fs.readFileSync(configPath, 'utf8');
  const parsed = JSON.parse(raw);
  if (!parsed?.projectId || !parsed?.firestoreDatabaseId) {
    throw new Error('Configuration firebase-applet-config.json incomplète.');
  }
  return {
    projectId: String(parsed.projectId),
    firestoreDatabaseId: String(parsed.firestoreDatabaseId),
  };
}

async function startServer() {
  const { projectId, firestoreDatabaseId } = loadFirebaseAppletConfig();
  const app = createAmaroApp({
    projectId,
    databaseId: firestoreDatabaseId,
    rootDir: __dirname,
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AMARO.VOYAGE server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
