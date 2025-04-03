import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { connectToDatabase, isMongoConnected } from "./db/mongodb";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import path from "path";

// Load environment variables from the root directory
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Debug environment variables
console.log('Server environment variables:', {
  nodeEnv: process.env.NODE_ENV,
  port: process.env.PORT,
  hasMongoUri: !!process.env.MONGODB_URI,
  mongoUriLength: process.env.MONGODB_URI?.length
});

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

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
  // Initialize storage with improved connection handling
  try {
    // First try to connect to MongoDB
    await connectToDatabase();
    
    // Use the improved storage manager to select the appropriate storage
    const { useMongoDBWithFallback } = await import('./storage-manager');
    await useMongoDBWithFallback();
    
    // Log MongoDB connection diagnostics 
    console.log(`MongoDB connection status: ${isMongoConnected() ? 'Connected' : 'Not connected'}`);
  } catch (error) {
    console.error('Failed during MongoDB initialization:', error);
    console.log('Continuing with in-memory storage');
  }
  
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
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
