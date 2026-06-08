import { AppDataSource } from '../config/database';
import { Station } from '../entities/Station';
import { City } from '../entities/City';
import { FuelPrice } from '../entities/FuelPrice';

export const getNearbyStations = async (
  lat?: number,
  lon?: number,
  cityName?: string,
  radius: number = 10
) => {
  let latitude: number, longitude: number;

  if (cityName) {
    const cityRepo = AppDataSource.getRepository(City);
    let found = await cityRepo.findOne({ where: { nom_sans_accent: cityName } });
    if (!found) {
      found = await cityRepo
        .createQueryBuilder('c')
        .where('LOWER(c.nom_sans_accent) LIKE LOWER(:name)', { name: `%${cityName}%` })
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

  const stations = await AppDataSource.getRepository(Station)
    .createQueryBuilder('s')
    .addSelect(
      `(6371 * acos(LEAST(1, cos(radians(:lat)) * cos(radians(s.latitude)) * ` +
      `cos(radians(s.longitude) - radians(:lon)) + ` +
      `sin(radians(:lat)) * sin(radians(s.latitude)))))`,
      'distance_km'
    )
    .leftJoinAndSelect('s.services', 'services')
    .where(
      `(6371 * acos(LEAST(1, cos(radians(:lat)) * cos(radians(s.latitude)) * ` +
      `cos(radians(s.longitude) - radians(:lon)) + ` +
      `sin(radians(:lat)) * sin(radians(s.latitude))))) <= :radius`,
      { lat: latitude, lon: longitude, radius }
    )
    .orderBy('distance_km', 'ASC')
    .setParameters({ lat: latitude, lon: longitude })
    .getMany();

  return { count: stations.length, stations };
};

export const getStationById = async (id: string) => {
  const station = await AppDataSource.getRepository(Station).findOne({
    where: { id },
    relations: ['services', 'fuelPrices', 'fuelPrices.fuelType', 'closures', 'breakages'],
  });
  if (!station) throw new Error('Station non trouvée');

  const latestPrices = await AppDataSource.getRepository(FuelPrice)
    .createQueryBuilder('fp')
    .innerJoinAndSelect('fp.fuelType', 'ft')
    .where('fp.station_id = :id', { id })
    .andWhere(
      `fp.maj = (SELECT MAX(fp2.maj) FROM fuel_prices fp2
        WHERE fp2.station_id = fp.station_id AND fp2.fuel_type_id = fp.fuel_type_id)`
    )
    .getMany();

  return { ...station, latestPrices };
};

export const getStationPriceHistory = async (
  id: string,
  from?: string,
  to?: string,
  fuelType?: string
) => {
  const qb = AppDataSource.getRepository(FuelPrice)
    .createQueryBuilder('fp')
    .innerJoinAndSelect('fp.fuelType', 'ft')
    .where('fp.station_id = :id', { id })
    .orderBy('fp.maj', 'ASC');

  if (from)     qb.andWhere('fp.maj >= :from', { from: new Date(from) });
  if (to)       qb.andWhere('fp.maj <= :to',   { to: new Date(to) });
  if (fuelType) qb.andWhere('ft.nom = :fuelType', { fuelType });

  const prices = await qb.getMany();

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

  return { stationId: id, from, to, fluctuations };
};