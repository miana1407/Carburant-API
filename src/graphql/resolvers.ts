import { AppDataSource } from '../config/database';
import { City } from '../entities/City';
import { Station } from '../entities/Station';
import { FuelPrice } from '../entities/FuelPrice';
import { FuelType } from '../entities/FuelType';
import { Vehicle } from '../entities/Vehicle';
import { FuelLog } from '../entities/FuelLog';
import { ILike } from 'typeorm';

// ─── Cities ───────────────────────────────────────────────────────────────────

export const resolvers = {

  cities: async ({ name, dep, reg, limit = 20 }: { name?: string; dep?: string; reg?: string; limit?: number }) => {
    const where: any = {};
    if (name) where.nom_sans_accent = ILike(`%${name}%`);
    if (dep)  where.dep_code = dep;
    if (reg)  where.reg_code = reg;

    return await AppDataSource.getRepository(City).find({
      where,
      take: Math.min(limit, 100),
      select: ['id', 'code_insee', 'nom_standard', 'nom_sans_accent',
               'dep_code', 'dep_nom', 'reg_nom', 'code_postal',
               'latitude', 'longitude', 'population'],
    });
  },

  cityByInsee: async ({ codeInsee }: { codeInsee: string }) => {
    return await AppDataSource.getRepository(City).findOne({
      where: { code_insee: codeInsee },
    });
  },

  // ─── Stations ───────────────────────────────────────────────────────────────

  nearbyStations: async ({ lat, lon, city, radius = 10 }: {
    lat?: number; lon?: number; city?: string; radius?: number;
  }) => {
    let latitude: number, longitude: number;

    if (city) {
      const cityRepo = AppDataSource.getRepository(City);
      let found = await cityRepo.findOne({ where: { nom_sans_accent: city } });
      if (!found) {
        found = await cityRepo
          .createQueryBuilder('c')
          .where('LOWER(c.nom_sans_accent) LIKE LOWER(:name)', { name: `%${city}%` })
          .limit(1)
          .getOne();
      }
      if (!found) throw new Error('Ville non trouvée');
      latitude  = found.latitude;
      longitude = found.longitude;
    } else if (lat !== undefined && lon !== undefined) {
      latitude  = lat;
      longitude = lon;
    } else {
      throw new Error('Paramètres requis : (lat + lon) ou city');
    }

    return await AppDataSource.getRepository(Station)
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.services', 'services')
      .where(
        `(6371 * acos(LEAST(1, cos(radians(:lat)) * cos(radians(s.latitude)) *
        cos(radians(s.longitude) - radians(:lon)) +
        sin(radians(:lat)) * sin(radians(s.latitude))))) <= :radius`,
        { lat: latitude, lon: longitude, radius }
      )
      .orderBy(
        `(6371 * acos(LEAST(1, cos(radians(${latitude})) * cos(radians(s.latitude)) *
        cos(radians(s.longitude) - radians(${longitude})) +
        sin(radians(${latitude})) * sin(radians(s.latitude)))))`,
        'ASC'
      )
      .getMany();
  },

  station: async ({ id }: { id: string }) => {
    return await AppDataSource.getRepository(Station).findOne({
      where: { id },
      relations: ['services', 'fuelPrices', 'fuelPrices.fuelType', 'closures', 'breakages'],
    });
  },

  stationPriceHistory: async ({ id, fuelType, from, to }: {
    id: string; fuelType?: string; from?: string; to?: string;
  }) => {
    const qb = AppDataSource.getRepository(FuelPrice)
      .createQueryBuilder('fp')
      .innerJoinAndSelect('fp.fuelType', 'ft')
      .where('fp.station_id = :id', { id })
      .orderBy('fp.maj', 'ASC');

    if (from)      qb.andWhere('fp.maj >= :from', { from: new Date(from) });
    if (to)        qb.andWhere('fp.maj <= :to',   { to: new Date(to) });
    if (fuelType)  qb.andWhere('ft.nom = :fuelType', { fuelType });

    return await qb.getMany();
  },

  // ─── Stats prix ─────────────────────────────────────────────────────────────

  nationalStats: async ({ fuelType, from, to }: {
    fuelType?: string; from?: string; to?: string;
  }) => {
    let qb = AppDataSource.getRepository(FuelPrice)
      .createQueryBuilder('fp')
      .innerJoin('fp.fuelType', 'ft')
      .select('ft.nom', 'carburant')
      .addSelect('ROUND(AVG(fp.valeur)::numeric, 3)', 'moyenne')
      .addSelect('ROUND(MIN(fp.valeur)::numeric, 3)', 'min')
      .addSelect('ROUND(MAX(fp.valeur)::numeric, 3)', 'max')
      .addSelect('ROUND(STDDEV(fp.valeur)::numeric, 3)', 'ecart_type')
      .addSelect('COUNT(DISTINCT fp.station_id)', 'nb_stations')
      .groupBy('ft.nom');

    if (fuelType) qb.andWhere('ft.nom = :fuelType', { fuelType });
    if (from)     qb.andWhere('fp.maj >= :from',    { from: new Date(from) });
    if (to)       qb.andWhere('fp.maj <= :to',      { to: new Date(to) });

    const stats = await qb.getRawMany();
    return { scope: 'national', stats };
  },

  departementStats: async ({ depCode, fuelType, from, to }: {
    depCode: string; fuelType?: string; from?: string; to?: string;
  }) => {
    let qb = AppDataSource.getRepository(FuelPrice)
      .createQueryBuilder('fp')
      .innerJoin('fp.fuelType', 'ft')
      .innerJoin('fp.station', 's')
      .select('ft.nom', 'carburant')
      .addSelect('ROUND(AVG(fp.valeur)::numeric, 3)', 'moyenne')
      .addSelect('ROUND(MIN(fp.valeur)::numeric, 3)', 'min')
      .addSelect('ROUND(MAX(fp.valeur)::numeric, 3)', 'max')
      .addSelect('ROUND(STDDEV(fp.valeur)::numeric, 3)', 'ecart_type')
      .addSelect('COUNT(DISTINCT fp.station_id)', 'nb_stations')
      .where('s.cp LIKE :dep', { dep: `${depCode}%` })
      .groupBy('ft.nom');

    if (fuelType) qb.andWhere('ft.nom = :fuelType', { fuelType });
    if (from)     qb.andWhere('fp.maj >= :from',    { from: new Date(from) });
    if (to)       qb.andWhere('fp.maj <= :to',      { to: new Date(to) });

    const stats = await qb.getRawMany();
    return { scope: 'departement', depCode, stats };
  },

  // ─── Véhicules ──────────────────────────────────────────────────────────────

  vehicles: async ({ userId }: { userId: number }) => {
    return await AppDataSource.getRepository(Vehicle)
      .createQueryBuilder('v')
      .leftJoinAndSelect('v.fuelType', 'fuelType')
      .where('v.user_id = :userId', { userId })
      .getMany();
  },

  vehicle: async ({ id, userId }: { id: number; userId: number }) => {
    return await AppDataSource.getRepository(Vehicle)
      .createQueryBuilder('v')
      .leftJoinAndSelect('v.fuelType', 'fuelType')
      .where('v.id = :id AND v.user_id = :userId', { id, userId })
      .getOne();
  },

  vehicleLogs: async ({ vehicleId, userId, from, to }: {
    vehicleId: number; userId: number; from?: string; to?: string;
  }) => {
    // Vérifie que le véhicule appartient bien à l'utilisateur
    const vehicle = await AppDataSource.getRepository(Vehicle)
      .createQueryBuilder('v')
      .where('v.id = :vehicleId AND v.user_id = :userId', { vehicleId, userId })
      .getOne();
    if (!vehicle) throw new Error('Véhicule non trouvé');

    const qb = AppDataSource.getRepository(FuelLog)
      .createQueryBuilder('fl')
      .where('fl.vehicle_id = :id', { id: vehicleId })
      .leftJoinAndSelect('fl.station', 'station')
      .orderBy('fl.date', 'ASC');

    if (from) qb.andWhere('fl.date >= :from', { from });
    if (to)   qb.andWhere('fl.date <= :to',   { to });

    return await qb.getMany();
  },

  vehicleStats: async ({ vehicleId, userId, from, to }: {
    vehicleId: number; userId: number; from?: string; to?: string;
  }) => {
    const vehicle = await AppDataSource.getRepository(Vehicle)
      .createQueryBuilder('v')
      .where('v.id = :vehicleId AND v.user_id = :userId', { vehicleId, userId })
      .getOne();
    if (!vehicle) throw new Error('Véhicule non trouvé');

    const qb = AppDataSource.getRepository(FuelLog)
      .createQueryBuilder('fl')
      .where('fl.vehicle_id = :id', { id: vehicleId })
      .orderBy('fl.kilometres', 'ASC');

    if (from) qb.andWhere('fl.date >= :from', { from });
    if (to)   qb.andWhere('fl.date <= :to',   { to });

    const logs = await qb.getMany();
    if (logs.length < 2) throw new Error('Pas assez de données (minimum 2 pleins)');

    const totalLitres = logs.reduce((s, l) => s + Number(l.litres), 0);
    const totalCost   = logs.reduce((s, l) => s + Number(l.total_cost), 0);
    const kmTotal     = logs[logs.length - 1].kilometres - logs[0].kilometres;

    return {
      vehicleId: vehicle.id,
      vehicleNom: vehicle.nom,
      nbPleins: logs.length,
      kilometrageTotal: Math.round(kmTotal),
      totalLitres: Math.round(totalLitres * 100) / 100,
      totalDepense: Math.round(totalCost * 100) / 100,
      consommationMoyenne_L100km: Math.round((totalLitres / kmTotal) * 100 * 100) / 100,
      coutParKm: Math.round((totalCost / kmTotal) * 1000) / 1000,
    };
  },
};