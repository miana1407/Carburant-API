import { Request, Response } from "express";
import { getNationalStats, getDepartementStats } from "../services/priceService";

export const getNationalStatsHandler = async (req: Request, res: Response) => {
  try {
    const { fuelType, dateDebPeriode: from, dateFinPeriode: to } = req.query;

    const stats = await getNationalStats(
      fuelType as string,
      from as string,
      to as string
    );

    res.json({ scope: "national", from, to, stats });
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
};

export const getDepartementStatsHandler = async (req: Request, res: Response) => {
  try {
    const { depCode } = req.params;
    const { fuelType, from, to } = req.query;

    const stats = await getDepartementStats(
      depCode,
      fuelType as string,
      from as string,
      to as string
    );

    res.json({ scope: "departement", depCode, from, to, stats });
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
};