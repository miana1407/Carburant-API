import { AppDataSource } from '../config/database';
import { FuelPrice } from '../entities/FuelPrice';

export const getNationalStats = async (
  fuelType?: string,
  from?: string,
  to?: string
) => {
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
  if (from)     qb.andWhere('fp.maj >= :from', { from: new Date(from) });
  if (to)       qb.andWhere('fp.maj <= :to',   { to: new Date(to) });

  return await qb.getRawMany();
};

export const getDepartementStats = async (
  depCode: string,
  fuelType?: string,
  from?: string,
  to?: string
) => {
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
  if (from)     qb.andWhere('fp.maj >= :from', { from: new Date(from) });
  if (to)       qb.andWhere('fp.maj <= :to',   { to: new Date(to) });

  return await qb.getRawMany();
};