import { Request, Response } from "express";
import { AppDataSource } from "../config/database";
import { FuelPrice } from "../entities/FuelPrice";

const buildStatsQuery = (qb: any, fuelType?: string, from?: string, to?: string) => {
  if (fuelType) qb.andWhere("ft.nom = :fuelType", { fuelType });
  if (from) qb.andWhere("fp.maj >= :from", { from: new Date(from) });
  if (to) qb.andWhere("fp.maj <= :to", { to: new Date(to) });
  return qb;
};

export const getNationalStats = async (req: Request, res: Response) => {
  try {
    const { fuelType, dateDebPeriode: from, dateFinPeriode: to } = req.query;

    let qb = AppDataSource.getRepository(FuelPrice)
      .createQueryBuilder("fp")
      .innerJoin("fp.fuelType", "ft")
      .select("ft.nom", "carburant")
      .addSelect("ROUND(AVG(fp.valeur)::numeric, 3)", "moyenne")
      .addSelect("ROUND(MIN(fp.valeur)::numeric, 3)", "min")
      .addSelect("ROUND(MAX(fp.valeur)::numeric, 3)", "max")
      .addSelect("ROUND(STDDEV(fp.valeur)::numeric, 3)", "ecart_type")
      .addSelect("COUNT(DISTINCT fp.station_id)", "nb_stations")
      .groupBy("ft.nom");

    qb = buildStatsQuery(qb, fuelType as string, from as string, to as string);
    const stats = await qb.getRawMany();
    res.json({ scope: "national", from, to, stats });
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
};

export const getDepartementStats = async (req: Request, res: Response) => {
  try {
    const { depCode } = req.params;
    const { fuelType, from, to } = req.query;

    let qb = AppDataSource.getRepository(FuelPrice)
      .createQueryBuilder("fp")
      .innerJoin("fp.fuelType", "ft")
      .innerJoin("fp.station", "s")
      .select("ft.nom", "carburant")
      .addSelect("ROUND(AVG(fp.valeur)::numeric, 3)", "moyenne")
      .addSelect("ROUND(MIN(fp.valeur)::numeric, 3)", "min")
      .addSelect("ROUND(MAX(fp.valeur)::numeric, 3)", "max")
      .addSelect("ROUND(STDDEV(fp.valeur)::numeric, 3)", "ecart_type")
      .addSelect("COUNT(DISTINCT fp.station_id)", "nb_stations")
      .where("s.cp LIKE :dep", { dep: `${depCode}%` })
      .groupBy("ft.nom");

    qb = buildStatsQuery(qb, fuelType as string, from as string, to as string);
    const stats = await qb.getRawMany();
    res.json({ scope: "departement", depCode, from, to, stats });
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
};