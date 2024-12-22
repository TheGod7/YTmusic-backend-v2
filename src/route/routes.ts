import { Router } from "express";
import { readdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

function convertToFileUrl(path: string) {
  let normalizedPath = path.replace(/\\/g, "/");

  let encodedPath = encodeURI(normalizedPath);

  return `file:///${encodedPath}`;
}

for await (const routeFolder of readdirSync(
  path.join(__dirname, "..", "route")
)) {
  if (routeFolder.includes("routes")) continue;

  for (const route of readdirSync(
    path.join(__dirname, "..", "route", routeFolder)
  )) {
    const routePath = path.join(__dirname, "..", "route", routeFolder, route);

    const routeModule = await import(convertToFileUrl(routePath));
    router.use(`/${routeFolder}`, routeModule.default);
  }
}

export default router;
