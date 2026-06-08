import { AppDataSource } from '../config/database';
import { Vehicle } from '../entities/Vehicle';
import { FuelLog } from '../entities/FuelLog';
import { FuelType } from '../entities/FuelType';

export const findOwnedVehicle = async (vehicleId: number, userId: number) => {
  return AppDataSource.getRepository(Vehicle)
    .createQueryBuilder('v')
    .leftJoinAndSelect('v.fuelType', 'fuelType')
    .where('v.id = :vehicleId AND v.user_id = :userId', { vehicleId, userId })
    .getOne();
};

export const getUserVehicles = async (userId: number) => {
  return AppDataSource.getRepository(Vehicle)
    .createQueryBuilder('v')
    .leftJoinAndSelect('v.fuelType', 'fuelType')
    .where('v.user_id = :userId', { userId })
    .getMany();
};

export const createVehicle = async (
  userId: number,
  nom: string,
  marque?: string,
  modele?: string,
  annee?: number,
  fuelTypeNom?: string
) => {
  const vehicle = new Vehicle();
  vehicle.nom = nom;
  vehicle.marque = marque!;
  vehicle.modele = modele!;
  vehicle.annee = annee!;
  vehicle.user = { id: userId } as any;

  if (fuelTypeNom) {
    const ft = await AppDataSource.getRepository(FuelType).findOneBy({ nom: fuelTypeNom });
    if (ft) vehicle.fuelType = ft;
  }

  return await AppDataSource.getRepository(Vehicle).save(vehicle);
};

export const updateVehicle = async (
  vehicleId: number,
  userId: number,
  data: { nom?: string; marque?: string; modele?: string; annee?: number; fuelTypeNom?: string }
) => {
  const vehicle = await findOwnedVehicle(vehicleId, userId);
  if (!vehicle) throw new Error('Véhicule non trouvé');

  if (data.nom)    vehicle.nom    = data.nom;
  if (data.marque) vehicle.marque = data.marque;
  if (data.modele) vehicle.modele = data.modele;
  if (data.annee)  vehicle.annee  = data.annee;

  if (data.fuelTypeNom) {
    const ft = await AppDataSource.getRepository(FuelType).findOneBy({ nom: data.fuelTypeNom });
    if (ft) vehicle.fuelType = ft;
  }

  return await AppDataSource.getRepository(Vehicle).save(vehicle);
};

export const deleteVehicle = async (vehicleId: number, userId: number) => {
  const vehicle = await findOwnedVehicle(vehicleId, userId);
  if (!vehicle) throw new Error('Véhicule non trouvé');
  await AppDataSource.getRepository(Vehicle).remove(vehicle);
};

export const addFuelLog = async (
  vehicleId: number,
  userId: number,
  data: { date: string; kilometres: number; litres: number; prix_litre: number; station_id?: string }
) => {
  const vehicle = await findOwnedVehicle(vehicleId, userId);
  if (!vehicle) throw new Error('Véhicule non trouvé');

  const log = new FuelLog();
  log.vehicle    = vehicle;
  log.date       = new Date(data.date);
  log.kilometres = data.kilometres;
  log.litres     = data.litres;
  log.prix_litre = data.prix_litre;
  log.total_cost = Math.round(data.litres * data.prix_litre * 100) / 100;
  if (data.station_id) (log as any).station = { id: data.station_id };

  return await AppDataSource.getRepository(FuelLog).save(log);
};

export const getVehicleLogs = async (
  vehicleId: number,
  userId: number,
  from?: string,
  to?: string
) => {
  const vehicle = await findOwnedVehicle(vehicleId, userId);
  if (!vehicle) throw new Error('Véhicule non trouvé');

  const qb = AppDataSource.getRepository(FuelLog)
    .createQueryBuilder('fl')
    .where('fl.vehicle_id = :id', { id: vehicle.id })
    .leftJoinAndSelect('fl.station', 'station')
    .orderBy('fl.date', 'ASC');

  if (from) qb.andWhere('fl.date >= :from', { from });
  if (to)   qb.andWhere('fl.date <= :to',   { to });

  return await qb.getMany();
};

export const getVehicleStats = async (
  vehicleId: number,
  userId: number,
  from?: string,
  to?: string
) => {
  const vehicle = await findOwnedVehicle(vehicleId, userId);
  if (!vehicle) throw new Error('Véhicule non trouvé');

  const qb = AppDataSource.getRepository(FuelLog)
    .createQueryBuilder('fl')
    .where('fl.vehicle_id = :id', { id: vehicle.id })
    .orderBy('fl.kilometres', 'ASC');

  if (from) qb.andWhere('fl.date >= :from', { from });
  if (to)   qb.andWhere('fl.date <= :to',   { to });

  const logs = await qb.getMany();
  if (logs.length < 2) throw new Error('Pas assez de données (minimum 2 pleins)');

  const totalLitres = logs.reduce((s, l) => s + Number(l.litres), 0);
  const totalCost   = logs.reduce((s, l) => s + Number(l.total_cost), 0);
  const kmTotal     = logs[logs.length - 1].kilometres - logs[0].kilometres;
  const prixMoyen   = logs.reduce((s, l) => s + Number(l.prix_litre), 0) / logs.length;

  return {
    vehicleId: vehicle.id,
    vehicleNom: vehicle.nom,
    nbPleins: logs.length,
    kilometrageTotal: Math.round(kmTotal),
    totalLitres: Math.round(totalLitres * 100) / 100,
    totalDepense: Math.round(totalCost * 100) / 100,
    consommationMoyenne_L100km: Math.round((totalLitres / kmTotal) * 100 * 100) / 100,
    coutParKm: Math.round((totalCost / kmTotal) * 1000) / 1000,
    prix: {
      moyen: Math.round(prixMoyen * 1000) / 1000,
      min: Math.min(...logs.map((l) => Number(l.prix_litre))),
      max: Math.max(...logs.map((l) => Number(l.prix_litre))),
    },
  };
};