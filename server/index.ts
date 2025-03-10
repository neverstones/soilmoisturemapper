import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

// Debug environment variables for Earth Engine
function debugEarthEngineEnvVars() {
  const clientEmail = process.env.GOOGLE_EARTH_ENGINE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_EARTH_ENGINE_PRIVATE_KEY;

  console.log(clientEmail, "email");
  console.log(privateKey, "privateKey");
  
  console.log('Debug Earth Engine environment variables:');
  console.log(`- Client Email exists: ${!!clientEmail}`);
  if (clientEmail) {
    console.log(`- Client Email format: ${clientEmail.substring(0, 5)}...${clientEmail.substring(clientEmail.length - 5)}`);
  }
  
  console.log(`- Private Key exists: ${!!privateKey}`);
  if (privateKey) {
    console.log(`- Private Key length: ${privateKey.length}`);
    console.log(`- Private Key starts with: ${privateKey.substring(0, 30)}...`);
    console.log(`- Private Key contains '\\n': ${privateKey.includes('\\n')}`);
    console.log(`- Private Key contains newlines: ${privateKey.includes('\n')}`);
    console.log(`- Private Key contains BEGIN header: ${privateKey.includes('-----BEGIN PRIVATE KEY-----')}`);
    console.log(`- Private Key contains END footer: ${privateKey.includes('-----END PRIVATE KEY-----')}`);
  }
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Debug Earth Engine environment variables before initializing routes
  debugEarthEngineEnvVars();
  
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
