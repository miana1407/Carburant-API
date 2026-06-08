import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import {
  getUserVehicles, createVehicle, findOwnedVehicle,
  updateVehicle, deleteVehicle, addFuelLog,
  getVehicleLogs, getVehicleStats
} from '../services/vehicleService';

export const getUserVehiclesHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  const vehicles = await getUserVehicles(req.user!.id);
  res.json(vehicles);
};

export const createVehicleHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { nom, marque, modele, annee, fuelTypeNom } = req.body;
    if (!nom) { res.status(400).json({ error: 'Le nom du véhicule est requis' }); return; }
    const saved = await createVehicle(req.user!.id, nom, marque, modele, annee, fuelTypeNom);
    res.status(201).json(saved);
  } catch { res.status(500).json({ error: 'Erreur serveur' }); }
};

export const getVehicleByIdHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  const vehicle = await findOwnedVehicle(Number(req.params.id), req.user!.id);
  if (!vehicle) { res.status(404).json({ error: 'Véhicule non trouvé' }); return; }
  res.json(vehicle);
};

export const updateVehicleHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const updated = await updateVehicle(Number(req.params.id), req.user!.id, req.body);
    res.json(updated);
  } catch (err: any) {
    if (err.message === 'Véhicule non trouvé') { res.status(404).json({ error: err.message }); return; }
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const deleteVehicleHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await deleteVehicle(Number(req.params.id), req.user!.id);
    res.json({ message: 'Véhicule supprimé' });
  } catch (err: any) {
    if (err.message === 'Véhicule non trouvé') { res.status(404).json({ error: err.message }); return; }
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const addFuelLogHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { date, kilometres, litres, prix_litre, station_id } = req.body;
    if (!date || !kilometres || !litres || !prix_litre) {
      res.status(400).json({ error: 'date, kilometres, litres et prix_litre sont requis' }); return;
    }
    const saved = await addFuelLog(Number(req.params.id), req.user!.id,
      { date, kilometres, litres, prix_litre, station_id });
    res.status(201).json(saved);
  } catch (err: any) {
    if (err.message === 'Véhicule non trouvé') { res.status(404).json({ error: err.message }); return; }
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const getVehicleLogsHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { dateDebPeriode: from, dateFinPeriode: to } = req.query;
    const logs = await getVehicleLogs(Number(req.params.id), req.user!.id, from as string, to as string);
    res.json(logs);
  } catch (err: any) {
    if (err.message === 'Véhicule non trouvé') { res.status(404).json({ error: err.message }); return; }
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const getVehicleStatsHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { dateDebPeriode: from, dateFinPeriode: to } = req.query;
    const stats = await getVehicleStats(Number(req.params.id), req.user!.id, from as string, to as string);
    res.json(stats);
  } catch (err: any) {
    if (err.message === 'Véhicule non trouvé') { res.status(404).json({ error: err.message }); return; }
    if (err.message.includes('Pas assez')) { res.json({ message: err.message }); return; }
    res.status(500).json({ error: 'Erreur serveur' });
  }
};