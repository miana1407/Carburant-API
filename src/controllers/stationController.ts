import { Request, Response } from "express";
import { AppDataSource } from "../config/database";
import { Station } from "../entities/Station";
import { City } from "../entities/City";
import { FuelPrice } from "../entities/FuelPrice";

export const getNearbyStations = async (req: Request, res: Response) => {
  try {
    const { lat, lon, city, radius = "10" } = req.query;
    const radiusKm = Number(radius);
    let latitude: number, longitude: number;

    if (city) {
      const cityRepo = AppDataSource.getRepository(City);
      const found = await cityRepo.findOne({
        where: { nom_sans_accent: city as string },
      });
      if (!found) {
        // Fallback : recherche partielle
        const results = await cityRepo
          .createQueryBuilder("c")
          .where("LOWER(c.nom_sans_accent) LIKE LOWER(:name)", {
            name: `%${city}%`,
          })
          .limit(1)
          .getOne();
        if (!results)
          return res.status(404).json({ error: "Ville non trouvée" });
        latitude = results.latitude;
        longitude = results.longitude;
      } else {
        latitude = found.latitude;
        longitude = found.longitude;
      }
    } else if (lat && lon) {
      latitude = Number(lat);
      longitude = Number(lon);
    } else {
      return res.status(400).json({
        error: "Paramètres requis : (lat + lon) ou city",
      });
    }

    // Formule Haversine en SQL
    const stations = await AppDataSource.getRepository(Station)
      .createQueryBuilder("s")
      .addSelect(
        `(6371 * acos(LEAST(1, cos(radians(:lat)) * cos(radians(s.latitude)) * ` +
          `cos(radians(s.longitude) - radians(:lon)) + ` +
          `sin(radians(:lat)) * sin(radians(s.latitude)))))`,
        "distance_km"
      )
      .leftJoinAndSelect("s.services", "services")
      .where(
        `(6371 * acos(LEAST(1, cos(radians(:lat)) * cos(radians(s.latitude)) * ` +
          `cos(radians(s.longitude) - radians(:lon)) + ` +
          `sin(radians(:lat)) * sin(radians(s.latitude))))) <= :radius`,
        { lat: latitude, lon: longitude, radius: radiusKm }
      )
      .orderBy("distance_km", "ASC")
      .setParameters({ lat: latitude, lon: longitude })
      .getMany();

    res.json({ count: stations.length, stations });
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur", details: String(err) });
  }
};

export const getStationById = async (req: Request, res: Response) => {
  try {
    const station = await AppDataSource.getRepository(Station).findOne({
      where: { id: req.params.id },
      relations: ["services", "fuelPrices", "fuelPrices.fuelType", "closures", "breakages"],
    });
    if (!station) return res.status(404).json({ error: "Station non trouvée" });

    // Prix actuels (dernier prix connu par carburant)
    const latestPrices = await AppDataSource.getRepository(FuelPrice)
      .createQueryBuilder("fp")
      .innerJoinAndSelect("fp.fuelType", "ft")
      .where("fp.station_id = :id", { id: req.params.id })
      .andWhere(
        `fp.maj = (SELECT MAX(fp2.maj) FROM fuel_prices fp2 
          WHERE fp2.station_id = fp.station_id AND fp2.fuel_type_id = fp.fuel_type_id)`
      )
      .getMany();

    res.json({ ...station, latestPrices });
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
};

export const getStationPriceHistory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { dateDebPeriode: from, dateFinPeriode: to, fuelType } = req.query;

    const qb = AppDataSource.getRepository(FuelPrice)
      .createQueryBuilder("fp")
      .innerJoinAndSelect("fp.fuelType", "ft")
      .where("fp.station_id = :id", { id })
      .orderBy("fp.maj", "ASC");

    if (from) qb.andWhere("fp.maj >= :from", { from: new Date(from as string) });
    if (to) qb.andWhere("fp.maj <= :to", { to: new Date(to as string) });
    if (fuelType) qb.andWhere("ft.nom = :fuelType", { fuelType });

    const prices = await qb.getMany();

    // Calcul des fluctuations par type de carburant
    const fluctuations: Record<string, any> = {};
    for (const p of prices) {
      const name = p.fuelType.nom;
      if (!fluctuations[name]) {
        fluctuations[name] = { prices: [], min: Infinity, max: -Infinity, avg: 0 };
      }
      const val = Number(p.valeur);
      fluctuations[name].prices.push({ date: p.maj, valeur: val });
      fluctuations[name].min = Math.min(fluctuations[name].min, val);
      fluctuations[name].max = Math.max(fluctuations[name].max, val);
    }
    for (const ft of Object.values(fluctuations) as any[]) {
      ft.avg = ft.prices.reduce((s: number, p: any) => s + p.valeur, 0) / ft.prices.length;
      ft.avg = Math.round(ft.avg * 1000) / 1000;
    }

    res.json({ stationId: id, from, to, fluctuations });
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
};