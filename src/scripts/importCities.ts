import "reflect-metadata";
import axios from "axios";
import { parse } from "csv-parse";
import { AppDataSource } from "../config/database";
import { City } from "../entities/City";
import dotenv from "dotenv";

dotenv.config();

// Récupère dynamiquement l'URL du CSV via l'API data.gouv.fr
async function getCsvUrl(): Promise<string> {
  const apiUrl =
    "https://www.data.gouv.fr/api/1/datasets/" +
    "communes-et-villes-de-france-en-csv-excel-json-parquet-et-feather/";
  const { data } = await axios.get(apiUrl);
  const csvResource = data.resources.find(
    (r: any) =>
      r.format === "csv" &&
      r.title?.toLowerCase().includes("communes") &&
      !r.title?.toLowerCase().includes("geo")
  );
  if (!csvResource) throw new Error("Ressource CSV non trouvée sur data.gouv.fr");
  return csvResource.url;
}

async function importCities() {
  await AppDataSource.initialize();
  const repo = AppDataSource.getRepository(City);
  console.log("Récupération de l'URL du CSV des communes...");

  const csvUrl = process.env.CITIES_CSV_URL || (await getCsvUrl());
  console.log(`Téléchargement : ${csvUrl}`);

  const response = await axios.get(csvUrl, { responseType: "stream" });
  const cities: Partial<City>[] = [];

  await new Promise<void>((resolve, reject) => {
    const parser = parse({ columns: true, delimiter: ",", skip_empty_lines: true });

    parser.on("readable", () => {
      let record;
      while ((record = parser.read()) !== null) {
        cities.push({
          code_insee: record.code_insee,
          nom_standard: record.nom_standard,
          nom_sans_accent: record.nom_sans_accent,
          dep_code: record.dep_code,
          dep_nom: record.dep_nom,
          reg_code: record.reg_code,
          reg_nom: record.reg_nom,
          code_postal: record.code_postal,
          latitude: parseFloat(record.latitude_centre) || undefined,
          longitude: parseFloat(record.longitude_centre) || undefined,
          population: parseInt(record.population) || undefined,
          superficie_km2: parseFloat(record.superficie_km2) || undefined,
        });
      }
    });

    parser.on("error", reject);
    parser.on("end", resolve);
    response.data.pipe(parser);
  });

  // Upsert par lot de 500
  const BATCH = 500;
  let inserted = 0;
  for (let i = 0; i < cities.length; i += BATCH) {
    const batch = cities.slice(i, i + BATCH);
    await repo
      .createQueryBuilder()
      .insert()
      .into(City)
      .values(batch)
      .orUpdate(
        ["nom_standard", "nom_sans_accent", "dep_code", "dep_nom",
         "reg_code", "reg_nom", "code_postal", "latitude", "longitude",
         "population", "superficie_km2"],
        ["code_insee"]
      )
      .execute();
    inserted += batch.length;
    process.stdout.write(`\r   ${inserted}/${cities.length} communes importées`);
  }
  console.log(`\n Import terminé : ${cities.length} communes.`);
  await AppDataSource.destroy();
}

importCities().catch((err) => {
  console.error("Erreur import villes:", err.message);
  process.exit(1);
});