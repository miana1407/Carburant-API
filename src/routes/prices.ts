import { Router } from "express";
import {
  getNationalStatsHandler,
  getDepartementStatsHandler,
} from "../controllers/priceController";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Prix
 *   description: Statistiques des prix des carburants
 */

/**
 * @swagger
 * /api/prices/national:
 *   get:
 *     summary: Moyennes et fluctuations nationales des prix par carburant
 *     tags: [Prix]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: fuelType
 *         schema:
 *           type: string
 *           enum: [Gazole, SP95, SP98, E10, E85, GPLc]
 *         description: Filtrer par type de carburant (tous si absent)
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
 *     responses:
 *       200:
 *         description: Statistiques nationales (moyenne, min, max, écart-type)
 */
router.get("/national", getNationalStatsHandler);

/**
 * @swagger
 * /api/prices/departement/{depCode}:
 *   get:
 *     summary: Moyennes et fluctuations départementales des prix par carburant
 *     tags: [Prix]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: depCode
 *         required: true
 *         schema:
 *           type: string
 *         description: Code du département (ex 33 pour Gironde)
 *         example: "33"
 *       - in: query
 *         name: fuelType
 *         schema:
 *           type: string
 *           enum: [Gazole, SP95, SP98, E10, E85, GPLc]
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
 *     responses:
 *       200:
 *         description: Statistiques du département
 *       404:
 *         description: Département non trouvé
 */
router.get("/departement/:depCode", getDepartementStatsHandler);

export default router;