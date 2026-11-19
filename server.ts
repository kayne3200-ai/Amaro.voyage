import http from 'http';
import dotenv from 'dotenv';
import express from 'express';
import type { Express, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { register as registerTsx } from 'tsx/esm/api';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = Number(process.env.PORT || 3000);

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

async function initAmaroExpress(): Promise<Express> {
  registerTsx();
  const { createAmaroApp } = await import('./src/server/createAmaroApp');
  const { projectId, firestoreDatabaseId } = loadFirebaseAppletConfig();
  const app = createAmaroApp({
    projectId,
    databaseId: firestoreDatabaseId,
    rootDir: __dirname,
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, allowedHosts: true },
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

  return app;
}

function startServer() {
  let activeApp: Express | null = null;
  let initError: unknown = null;

  const readyPromise = initAmaroExpress()
    .then((app) => {
      activeApp = app;
      return app;
    })
    .catch((err) => {
      initError = err;
      console.error('Server initialization error:', err);
      return null;
    });

  const server = http.createServer((req, res) => {
    if (activeApp) {
      activeApp(req, res);
      return;
    }
    void readyPromise.then((app) => {
      if (app) {
        app(req, res);
        return;
      }
      res.statusCode = 500;
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.end(
        initError instanceof Error
          ? `Erreur de démarrage serveur: ${initError.message}`
          : 'Erreur de démarrage serveur.'
      );
    });
  });

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`AMARO.VOYAGE server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
