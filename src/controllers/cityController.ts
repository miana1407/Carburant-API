import { Request, Response } from "express";
import { AppDataSource } from "../config/database";
import { City } from "../entities/City";
import { ILike } from "typeorm";

const cityRepo = () => AppDataSource.getRepository(City);

export const searchCities = async (req: Request, res: Response) => {
  try {
    const { name, dep, reg, limit = "20" } = req.query;
    const where: any = {};
    if (name) where.nom_sans_accent = ILike(`%${name}%`);
    if (dep) where.dep_code = dep;
    if (reg) where.reg_code = reg;

    const cities = await cityRepo().find({
      where,
      take: Math.min(Number(limit), 100),
      select: ["id", "code_insee", "nom_standard", "dep_code", "dep_nom",
               "reg_nom", "code_postal", "latitude", "longitude", "population"],
    });
    res.json(cities);
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur", details: String(err) });
  }
};

export const getCityByInsee = async (req: Request, res: Response) => {
  try {
    const city = await cityRepo().findOne({
      where: { code_insee: req.params.codeInsee },
    });
    if (!city) return res.status(404).json({ error: "Ville non trouvée" });
    res.json(city);
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
};