import { Response } from "express";
import { AppDataSource } from "../config/database";
import { Vehicle } from "../entities/Vehicle";
import { FuelLog } from "../entities/FuelLog";
import { FuelType } from "../entities/FuelType";
import { AuthRequest } from "../middleware/auth";


// Petit helper pour éviter de répéter la vérification de propriété partout
const findOwnedVehicle = async (vehicleId: number, userId: number) => {
  return AppDataSource.getRepository(Vehicle)
    .createQueryBuilder("v")
    .leftJoinAndSelect("v.fuelType", "fuelType")
    .where("v.id = :vehicleId AND v.user_id = :userId", { vehicleId, userId })
    .getOne();
};

// GET /api/vehicles
// Retourne uniquement les véhicules de l'utilisateur connecté
export const getUserVehicles = async (req: AuthRequest, res: Response): Promise<void> => {
  const vehicles = await AppDataSource.getRepository(Vehicle)
    .createQueryBuilder("v")
    .leftJoinAndSelect("v.fuelType", "fuelType")
    .where("v.user_id = :userId", { userId: req.user!.id })
    .getMany();
  res.json(vehicles);
};
// POST /api/vehicles
export const createVehicle = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { nom, marque, modele, annee, fuelTypeNom } = req.body;
    if (!nom) { res.status(400).json({ error: "Le nom du véhicule est requis" }); return; }

    const vehicle = new Vehicle();
    vehicle.nom = nom;
    vehicle.marque = marque;
    vehicle.modele = modele;
    vehicle.annee = annee;
    vehicle.user = { id: req.user!.id } as any; // on lie le véhicule à l'utilisateur connecté

    if (fuelTypeNom) {
      const ft = await AppDataSource.getRepository(FuelType).findOneBy({ nom: fuelTypeNom });
      if (ft) vehicle.fuelType = ft;
    }

    const saved = await AppDataSource.getRepository(Vehicle).save(vehicle);
    res.status(201).json(saved);
  } catch {
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// GET /api/vehicles/:id
export const getVehicleById = async (req: AuthRequest, res: Response): Promise<void> => {
  const vehicle = await findOwnedVehicle(Number(req.params.id), req.user!.id);
  if (!vehicle) { res.status(404).json({ error: "Véhicule non trouvé" }); return; }
  res.json(vehicle);
};

// PUT /api/vehicles/:id
export const updateVehicle = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const vehicle = await findOwnedVehicle(Number(req.params.id), req.user!.id);
    if (!vehicle) { res.status(404).json({ error: "Véhicule non trouvé" }); return; }

    const { nom, marque, modele, annee, fuelTypeNom } = req.body;
    if (nom) vehicle.nom = nom;
    if (marque) vehicle.marque = marque;
    if (modele) vehicle.modele = modele;
    if (annee) vehicle.annee = annee;

    if (fuelTypeNom) {
      const ft = await AppDataSource.getRepository(FuelType).findOneBy({ nom: fuelTypeNom });
      if (ft) vehicle.fuelType = ft;
    }

    const updated = await AppDataSource.getRepository(Vehicle).save(vehicle);
    res.json(updated);
  } catch {
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// DELETE /api/vehicles/:id
export const deleteVehicle = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const vehicle = await findOwnedVehicle(Number(req.params.id), req.user!.id);
    if (!vehicle) { res.status(404).json({ error: "Véhicule non trouvé" }); return; }

    await AppDataSource.getRepository(Vehicle).remove(vehicle);
    res.json({ message: "Véhicule supprimé" });
  } catch {
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// POST /api/vehicles/:id/logs
export const addFuelLog = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const vehicle = await findOwnedVehicle(Number(req.params.id), req.user!.id);
    if (!vehicle) { res.status(404).json({ error: "Véhicule non trouvé" }); return; }

    const { date, kilometres, litres, prix_litre, station_id } = req.body;
    if (!date || !kilometres || !litres || !prix_litre) {
      res.status(400).json({ error: "date, kilometres, litres et prix_litre sont requis" });
      return;
    }

    const log = new FuelLog();
    log.vehicle = vehicle;
    log.date = new Date(date);
    log.kilometres = kilometres;
    log.litres = litres;
    log.prix_litre = prix_litre;
    log.total_cost = Math.round(litres * prix_litre * 100) / 100;
    if (station_id) (log as any).station = { id: station_id };

    const saved = await AppDataSource.getRepository(FuelLog).save(log);
    res.status(201).json(saved);
  } catch {
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// GET /api/vehicles/:id/logs
export const getVehicleLogs = async (req: AuthRequest, res: Response): Promise<void> => {
  const vehicle = await findOwnedVehicle(Number(req.params.id), req.user!.id);
  if (!vehicle) { res.status(404).json({ error: "Véhicule non trouvé" }); return; }

  const { dateDebPeriode, dateFinPeriode } = req.query;

  const qb = AppDataSource.getRepository(FuelLog)
    .createQueryBuilder("fl")
    .where("fl.vehicle_id = :id", { id: vehicle.id })
    .leftJoinAndSelect("fl.station", "station")
    .orderBy("fl.date", "ASC");

  if (dateDebPeriode) qb.andWhere("fl.date >= :from", { from: dateDebPeriode });
  if (dateFinPeriode) qb.andWhere("fl.date <= :to", { to: dateFinPeriode });

  const logs = await qb.getMany();
  res.json(logs);
};

// GET /api/vehicles/:id/stats
export const getVehicleStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const vehicle = await findOwnedVehicle(Number(req.params.id), req.user!.id);
    if (!vehicle) { res.status(404).json({ error: "Véhicule non trouvé" }); return; }

    const { dateDebPeriode, dateFinPeriode } = req.query;

    const qb = AppDataSource.getRepository(FuelLog)
      .createQueryBuilder("fl")
      .where("fl.vehicle_id = :id", { id: vehicle.id })
      .orderBy("fl.kilometres", "ASC");

    if (dateDebPeriode) qb.andWhere("fl.date >= :from", { from: dateDebPeriode });
    if (dateFinPeriode) qb.andWhere("fl.date <= :to", { to: dateFinPeriode });

    const logs = await qb.getMany();

    if (logs.length < 2) {
      res.json({ message: "Pas assez de données (minimum 2 pleins)" });
      return;
    }

    const totalLitres = logs.reduce((s, l) => s + Number(l.litres), 0);
    const totalCost = logs.reduce((s, l) => s + Number(l.total_cost), 0);
    const kmTotal = logs[logs.length - 1].kilometres - logs[0].kilometres;
    const consommationMoyenne = (totalLitres / kmTotal) * 100;
    const coutKm = totalCost / kmTotal;
    const prixMoyen = logs.reduce((s, l) => s + Number(l.prix_litre), 0) / logs.length;

    res.json({
      vehicleId: vehicle.id,
      vehicleNom: vehicle.nom,
      nbPleins: logs.length,
      kilometrageTotal: Math.round(kmTotal),
      totalLitres: Math.round(totalLitres * 100) / 100,
      totalDepense: Math.round(totalCost * 100) / 100,
      consommationMoyenne_L100km: Math.round(consommationMoyenne * 100) / 100,
      coutParKm: Math.round(coutKm * 1000) / 1000,
      prix: {
        moyen: Math.round(prixMoyen * 1000) / 1000,
        min: Math.min(...logs.map((l) => Number(l.prix_litre))),
        max: Math.max(...logs.map((l) => Number(l.prix_litre))),
      },
    });
  } catch {
    res.status(500).json({ error: "Erreur serveur" });
  }
};