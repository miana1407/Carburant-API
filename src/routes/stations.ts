import { Router } from "express";
import {
  getNearbyStationsHandler,
  getStationByIdHandler,
  getStationPriceHistoryHandler,
} from "../controllers/stationController";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Stations
 *   description: Stations-service françaises
 */

/**
 * @swagger
 * /api/stations/nearby:
 *   get:
 *     summary: Stations à proximité d'une ville (dans un rayon en km)
 *     tags: [Stations]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *         description: Nom de la ville
 *         example: Bordeaux
 *       - in: query
 *         name: lat
 *         schema:
 *           type: number
 *         description: Latitude (alternative à city)
 *         example: 44.8378
 *       - in: query
 *         name: lon
 *         schema:
 *           type: number
 *         description: Longitude (alternative à city)
 *         example: -0.5792
 *       - in: query
 *         name: radius
 *         schema:
 *           type: number
 *           default: 10
 *         description: Rayon de recherche en km
 *     responses:
 *       200:
 *         description: Liste des stations dans le rayon
 *       400:
 *         description: Paramètres manquants (city ou lat+lon requis)
 *       404:
 *         description: Ville non trouvée
 */
router.get("/nearby", getNearbyStationsHandler);

/**
 * @swagger
 * /api/stations/{id}:
 *   get:
 *     summary: Détail d'une station et fluctuation des prix sur une période
 *     tags: [Stations]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Identifiant de la station
 *         example: "33063001"
 *       - in: query
 *         name: dateDebPeriode
 *         schema:
 *           type: string
 *           format: date
 *         example: "2026-01-01"
 *       - in: query
 *         name: dateFinPeriode
 *         schema:
 *           type: string
 *           format: date
 *         example: "2026-04-09"
 *       - in: query
 *         name: fuelType
 *         schema:
 *           type: string
 *           enum: [Gazole, SP95, SP98, E10, E85, GPLc]
 *     responses:
 *       200:
 *         description: Informations détaillées de la station + historique des prix
 *       404:
 *         description: Station non trouvée
 */
router.get("/:id", getStationByIdHandler);

/**
 * @swagger
 * /api/stations/{id}/prices:
 *   get:
 *     summary: Historique des prix d'une station sur une période
 *     tags: [Stations]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "33063001"
 *       - in: query
 *         name: dateDebPeriode
 *         schema:
 *           type: string
 *           format: date
 *         example: "2026-01-01"
 *       - in: query
 *         name: dateFinPeriode
 *         schema:
 *           type: string
 *           format: date
 *         example: "2026-04-09"
 *       - in: query
 *         name: fuelType
 *         schema:
 *           type: string
 *           enum: [Gazole, SP95, SP98, E10, E85, GPLc]
 *     responses:
 *       200:
 *         description: Fluctuation des prix par carburant
 *       404:
 *         description: Station non trouvée
 */
router.get("/:id/prices", getStationPriceHistoryHandler);

export default router;