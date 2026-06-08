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

// ── GraphiQL (avant helmet pour bypasser la CSP) ─────────────
app.get('/graphiql', (_req, res) => {
  res.setHeader('Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; " +
    "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; " +
    "img-src * data:; " +
    "connect-src *;"
  );
  res.type('html');
  res.send(`<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <title>GraphiQL</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/graphiql@3/graphiql.min.css" />
  <style>
    html, body, #graphiql { height: 100%; margin: 0; overflow: hidden; }
  </style>
</head>
<body>
  <div id="graphiql"></div>
  <script src="https://cdn.jsdelivr.net/npm/react@18/umd/react.production.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/graphiql@3/graphiql.min.js"></script>
  <script>
    const root = ReactDOM.createRoot(document.getElementById('graphiql'));
    root.render(
      React.createElement(GraphiQL, {
        fetcher: GraphiQL.createFetcher({ url: '/graphql' }),
        defaultQuery: '{ fuelTypes { id nom } }'
      })
    );
  </script>
</body>
</html>`);
});

// ── Middlewares globaux ───────────────
app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

// ── Routes REST ───────────────
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
      console.log(`GraphiQL   → http://localhost:${PORT}/graphiql`);
      console.log(`GraphQL    → http://localhost:${PORT}/graphql`);
    });
  })
  .catch((err) => {
    console.error("Erreur de connexion DB:", err);
    process.exit(1);
  });

export default app;