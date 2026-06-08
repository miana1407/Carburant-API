import { Router } from "express";
import {
  getUserVehiclesHandler,
  createVehicleHandler,
  getVehicleByIdHandler,
  updateVehicleHandler,
  deleteVehicleHandler,
  addFuelLogHandler,
  getVehicleLogsHandler,
  getVehicleStatsHandler,
} from "../controllers/vehicleController";
import { authenticate } from "../middleware/auth";

const router = Router();

// Toutes les routes véhicules nécessitent d'être connecté
router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Véhicules
 *   description: Gestion de vos véhicules et suivi de consommation
 */

/**
 * @swagger
 * /api/vehicles:
 *   get:
 *     summary: Liste de vos véhicules
 *     tags: [Véhicules]
 *     responses:
 *       200:
 *         description: Liste des véhicules de l'utilisateur connecté
 *       401:
 *         description: Non authentifié
 */
router.get("/", getUserVehiclesHandler);

/**
 * @swagger
 * /api/vehicles:
 *   post:
 *     summary: Ajouter un véhicule
 *     tags: [Véhicules]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nom]
 *             properties:
 *               nom:
 *                 type: string
 *                 example: Ma Peugeot
 *               marque:
 *                 type: string
 *                 example: Peugeot
 *               modele:
 *                 type: string
 *                 example: 308
 *               annee:
 *                 type: integer
 *                 example: 2022
 *               fuelTypeNom:
 *                 type: string
 *                 example: SP95
 *     responses:
 *       201:
 *         description: Véhicule créé
 *       401:
 *         description: Non authentifié
 */
router.post("/", createVehicleHandler);

/**
 * @swagger
 * /api/vehicles/{id}:
 *   get:
 *     summary: Détail d'un véhicule
 *     tags: [Véhicules]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Données du véhicule
 *       403:
 *         description: Ce véhicule ne vous appartient pas
 *       404:
 *         description: Véhicule non trouvé
 */
router.get("/:id", getVehicleByIdHandler);

/**
 * @swagger
 * /api/vehicles/{id}:
 *   put:
 *     summary: Modifier un véhicule
 *     tags: [Véhicules]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nom:
 *                 type: string
 *               marque:
 *                 type: string
 *               modele:
 *                 type: string
 *               annee:
 *                 type: integer
 *               fuelTypeNom:
 *                 type: string
 *     responses:
 *       200:
 *         description: Véhicule mis à jour
 *       404:
 *         description: Véhicule non trouvé
 */
router.put("/:id", updateVehicleHandler);

/**
 * @swagger
 * /api/vehicles/{id}:
 *   delete:
 *     summary: Supprimer un véhicule
 *     tags: [Véhicules]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Véhicule supprimé
 *       404:
 *         description: Véhicule non trouvé
 */
router.delete("/:id", deleteVehicleHandler);

/**
 * @swagger
 * /api/vehicles/{id}/logs:
 *   get:
 *     summary: Historique des pleins d'un véhicule
 *     tags: [Véhicules]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
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
 *         description: Liste des pleins
 */
router.get("/:id/logs", getVehicleLogsHandler);

/**
 * @swagger
 * /api/vehicles/{id}/logs:
 *   post:
 *     summary: Enregistrer un plein
 *     tags: [Véhicules]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [date, kilometres, litres, prix_litre]
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *                 example: "2026-04-09"
 *               kilometres:
 *                 type: number
 *                 example: 45230
 *               litres:
 *                 type: number
 *                 example: 42.5
 *               prix_litre:
 *                 type: number
 *                 example: 1.789
 *               station_id:
 *                 type: string
 *                 example: "33063001"
 *     responses:
 *       201:
 *         description: Plein enregistré
 */
router.post("/:id/logs", addFuelLogHandler);

/**
 * @swagger
 * /api/vehicles/{id}/stats:
 *   get:
 *     summary: Statistiques de consommation et coût d'un véhicule
 *     tags: [Véhicules]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: dateDebPeriode
 *         schema:
 *           type: string
 *           format: date
 *         description: Optionnel - début de période
 *       - in: query
 *         name: dateFinPeriode
 *         schema:
 *           type: string
 *           format: date
 *         description: Optionnel - fin de période
 *     responses:
 *       200:
 *         description: Consommation moyenne (L/100km), coût par km, total dépensé
 */
router.get("/:id/stats", getVehicleStatsHandler);

export default router;