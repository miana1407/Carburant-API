import cron from "node-cron";


export function startCronJobs() {
  const schedule = process.env.CRON_SCHEDULE || "0 6 * * *"; // Tous les jours à 6h

  cron.schedule(schedule, async () => {
    console.log(`[CRON] ${new Date().toISOString()} — Import quotidien des prix...`);
    try {
      // Appel dynamique du script d'import
      const { execSync } = require("child_process");
      execSync("ts-node src/scripts/importDailyPrices.ts", { stdio: "inherit" });
      console.log("[CRON] Import quotidien terminé.");
    } catch (err) {
      console.error("[CRON] Erreur import:", err);
    }
  });

  console.log(`Cron planifié : "${schedule}"`);
}