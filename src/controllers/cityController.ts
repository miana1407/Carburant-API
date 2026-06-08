import { Request, Response } from 'express';
import { searchCities, getCityByInsee } from '../services/cityService';

export const searchCitiesHandler = async (req: Request, res: Response) => {
  try {
    const { name, dep, reg, limit = '20' } = req.query;
    const cities = await searchCities(name as string, dep as string, reg as string, Number(limit));
    res.json(cities);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur', details: String(err) });
  }
};

export const getCityByInseeHandler = async (req: Request, res: Response) => {
  try {
    const city = await getCityByInsee(req.params.codeInsee);
    if (!city) return res.status(404).json({ error: 'Ville non trouvée' });
    res.json(city);
  } catch {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};