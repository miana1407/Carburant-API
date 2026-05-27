import { Router } from "express";
import { searchCities, getCityByInsee } from "../controllers/cityController";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Villes
 *   description: Communes françaises
 */

/**
 * @swagger
 * /api/cities:
 *   get:
 *     summary: Rechercher des villes
 *     tags: [Villes]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         example: Bordeaux
 *     responses:
 *       200:
 *         description: Liste des villes
 */
router.get("/", searchCities);

/**
 * @swagger
 * /api/cities/{codeInsee}:
 *   get:
 *     summary: Détail d'une commune
 *     tags: [Villes]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: codeInsee
 *         required: true
 *         schema:
 *           type: string
 *         example: "33063"
 *     responses:
 *       200:
 *         description: Données de la commune
 *       404:
 *         description: Ville non trouvée
 */
router.get("/:codeInsee", getCityByInsee);

export default router;