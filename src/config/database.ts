import "reflect-metadata";
import { DataSource } from "typeorm";
import { City } from "../entities/City";
import { Station } from "../entities/Station";
import { FuelType } from "../entities/FuelType";
import { FuelPrice } from "../entities/FuelPrice";
import { StockBreakage } from "../entities/StockBreakage";
import { StationClosure } from "../entities/StationClosure";
import { StationService } from "../entities/StationService";
import { Vehicle } from "../entities/Vehicle";
import { FuelLog } from "../entities/FuelLog";
import { User } from "../entities/User";
import dotenv from "dotenv";

dotenv.config();

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || "postgres",
  password: process.env.DB_PASSWORD || "password",
  database: process.env.DB_NAME || "carburant_db",
  synchronize: true, // false in production
  logging: process.env.NODE_ENV === "development",
  entities: [
    User,
    City, Station, FuelType, FuelPrice,
    StockBreakage, StationClosure, StationService,
    Vehicle, FuelLog
  ],
});