import "reflect-metadata";
import axios from "axios";
import AdmZip from "adm-zip";
import { XMLParser } from "fast-xml-parser";
import { AppDataSource } from "../config/database";
import { Station } from "../entities/Station";
import { FuelType } from "../entities/FuelType";
import { FuelPrice } from "../entities/FuelPrice";
import { StockBreakage } from "../entities/StockBreakage";
import { StationClosure } from "../entities/StationClosure";
import { StationService } from "../entities/StationService";
import dotenv from "dotenv";

dotenv.config();

const FUEL_NAMES = ["Gazole", "SP95", "SP98", "GPLc", "E10", "E85"];
const PRICES_URL = process.env.FUEL_PRICES_URL || "https://donnees.roulez-eco.fr/opendata/jour";

async function getFuelTypeMap(): Promise<Map<string, FuelType>> {
  const repo = AppDataSource.getRepository(FuelType);
  const map = new Map<string, FuelType>();
  for (const nom of FUEL_NAMES) {
    let ft = await repo.findOneBy({ nom });
    if (!ft) {
      ft = repo.create({ nom });
      ft = await repo.save(ft);
    }
    map.set(nom, ft);
  }
  return map;
}

function parseDate(val: string): Date | null {
  if (!val) return null;
  try {
    return new Date(val.replace(" ", "T"));
  } catch {
    return null;
  }
}

async function importDailyPrices(dateStr?: string) {
  await AppDataSource.initialize();
  const url = dateStr ? `${PRICES_URL}/${dateStr}` : PRICES_URL;
  console.log(`Téléchargement flux carburants : ${url}`);

  const response = await axios.get(url, { responseType: "arraybuffer" });
  const zip = new AdmZip(Buffer.from(response.data));
  const xmlEntry = zip.getEntries().find((e) => e.name.endsWith(".xml"));
  if (!xmlEntry) throw new Error("Fichier XML non trouvé dans l'archive");

  const xmlContent = xmlEntry.getData().toString("utf-8");
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    isArray: (name) => ["pdv", "prix", "service", "rupture", "jour"].includes(name),
  });
  const result = parser.parse(xmlContent);
  const stations: any[] = result?.pdv_liste?.pdv || [];

  console.log(`${stations.length} stations à traiter...`);

  const fuelTypeMap = await getFuelTypeMap();
  const stationRepo = AppDataSource.getRepository(Station);
  const priceRepo = AppDataSource.getRepository(FuelPrice);
  const breakageRepo = AppDataSource.getRepository(StockBreakage);
  const closureRepo = AppDataSource.getRepository(StationClosure);
  const serviceRepo = AppDataSource.getRepository(StationService);

  let processed = 0;

  for (const pdv of stations) {
    const stationId = String(pdv["@_id"]);

    // Upsert station
    let station = await stationRepo.findOneBy({ id: stationId });
    if (!station) station = stationRepo.create({ id: stationId });

    station.latitude = Number(pdv["@_latitude"]) / 100000;
    station.longitude = Number(pdv["@_longitude"]) / 100000;
    station.cp = pdv["@_cp"] || "";
    station.pop = pdv["@_pop"] || "";
    station.adresse = pdv.adresse || "";
    station.ville = pdv.ville || "";
    station.automate_24_24 = pdv.horaires?.["@_automate-24-24"] === "1";

    await stationRepo.save(station);

    // Prix
    const prix: any[] = Array.isArray(pdv.prix) ? pdv.prix : pdv.prix ? [pdv.prix] : [];
    for (const p of prix) {
      const nom = p["@_nom"];
      const ft = fuelTypeMap.get(nom);
      if (!ft || !p["@_valeur"]) continue;

      const rawVal = Number(p["@_valeur"]);
      const valeur = rawVal > 100 ? rawVal / 1000 : rawVal; 

      const price = priceRepo.create({
        station,
        fuelType: ft,
        valeur,
        maj: parseDate(p["@_maj"]) || new Date(),
      });
      await priceRepo.save(price);
    }

    // Services (suppression + réinsertion)
    await serviceRepo.delete({ station: { id: stationId } });
    const services: any[] = Array.isArray(pdv.services?.service)
      ? pdv.services.service
      : pdv.services?.service
      ? [pdv.services.service]
      : [];
    for (const svc of services) {
      const nom = typeof svc === "string" ? svc : svc["#text"] || svc;
      if (nom) await serviceRepo.save(serviceRepo.create({ station, nom }));
    }

    // Ruptures
    const ruptures: any[] = Array.isArray(pdv.rupture) ? pdv.rupture : pdv.rupture ? [pdv.rupture] : [];
    for (const r of ruptures) {
      const ft = fuelTypeMap.get(r["@_fuel"] || r["@_nom"]);
      if (!ft) continue;
      await breakageRepo.save(
        breakageRepo.create({
          station,
          fuelType: ft,
          debut: parseDate(r["@_debut"]) || new Date(),
          fin: parseDate(r["@_fin"]) || null!,
          type: r["@_type"] || "temporaire",
        })
      );
    }

    // Fermeture
    if (pdv.fermeture) {
      await closureRepo.save(
        closureRepo.create({
          station,
          type: pdv.fermeture["@_type"] || "temporaire",
          debut: parseDate(pdv.fermeture["@_debut"]) || new Date(),
          fin: parseDate(pdv.fermeture["@_fin"]) || null!,
        })
      );
    }

    processed++;
    if (processed % 500 === 0) {
      process.stdout.write(`\r  ${processed}/${stations.length} stations`);
    }
  }

  console.log(`\n Import terminé : ${processed} stations mises à jour.`);
  await AppDataSource.destroy();
}

const dateArg = process.argv[2]; // ex: npm run import:prices -- 20250317
importDailyPrices(dateArg).catch((err) => {
  console.error("Erreur import prix:", err.message);
  process.exit(1);
});