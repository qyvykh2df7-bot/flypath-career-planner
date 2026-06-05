/**
 * Exporta public/premium-report-real-preview.png desde la 1ª página del PDF premium real.
 * Uso: npx tsx scripts/export-premium-real-preview.ts
 */
import { spawnSync } from "child_process";
import path from "path";

const script = path.join(__dirname, "export-premium-page-preview.ts");
const result = spawnSync("npx", ["tsx", script, "1", "premium-report-real-preview.png"], {
  stdio: "inherit",
  cwd: path.join(__dirname, ".."),
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}
