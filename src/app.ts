import "reflect-metadata";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger";
import { AppDataSource } from "./config/database";
import authRouter from "./routes/auth";  
import citiesRouter from "./routes/cities";
import stationsRouter from "./routes/stations";
import pricesRouter from "./routes/prices";
import vehiclesRouter from "./routes/vehicles";
import { startCronJobs } from "./scheduler/cron";
import { graphqlHandler } from './graphql';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

// ── Routes ───────────────
app.use("/api/auth",     authRouter);      
app.use("/api/cities",   citiesRouter);
app.use("/api/stations", stationsRouter);
app.use("/api/prices",   pricesRouter);
app.use("/api/vehicles", vehiclesRouter);

// ── GraphQL ─────────────
app.all('/graphql', graphqlHandler);

// ── Swagger ───────────────
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ── Health check ──────────
app.get("/api/health", (_, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── Démarrage ──────────────
AppDataSource.initialize()
  .then(() => {
    console.log("Base de données connectée");
    startCronJobs();
    app.listen(PORT, () => {
      console.log(`API démarrée sur http://localhost:${PORT}`);
      console.log(`Swagger    → http://localhost:${PORT}/api/docs`);
    });
  })
  .catch((err) => {
    console.error("Erreur de connexion DB:", err);
    process.exit(1);
  });

export default app;