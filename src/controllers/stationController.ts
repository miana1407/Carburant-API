import { Request, Response } from 'express';
import { getNearbyStations, getStationById, getStationPriceHistory } from '../services/stationService';

export const getNearbyStationsHandler = async (req: Request, res: Response) => {
  try {
    const { lat, lon, city, radius = '10' } = req.query;
    const result = await getNearbyStations(
      lat ? Number(lat) : undefined,
      lon ? Number(lon) : undefined,
      city as string,
      Number(radius)
    );
    res.json(result);
  } catch (err: any) {
    const status = err.message === 'Ville non trouvée' ? 404 : err.message.includes('requis') ? 400 : 500;
    res.status(status).json({ error: err.message });
  }
};

export const getStationByIdHandler = async (req: Request, res: Response) => {
  try {
    const result = await getStationById(req.params.id);
    res.json(result);
  } catch (err: any) {
    if (err.message === 'Station non trouvée') return res.status(404).json({ error: err.message });
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const getStationPriceHistoryHandler = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { dateDebPeriode: from, dateFinPeriode: to, fuelType } = req.query;
    const result = await getStationPriceHistory(id, from as string, to as string, fuelType as string);
    res.json(result);
  } catch {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};