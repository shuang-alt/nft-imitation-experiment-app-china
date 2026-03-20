import { copyFile, cp, mkdir, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDirectory, "..");
const outputDirectory = resolve(projectRoot, ".next");
const edgeFunctionsSource = resolve(projectRoot, "edge-functions");
const edgeFunctionsDestination = resolve(outputDirectory, "edge-functions");

await mkdir(outputDirectory, { recursive: true });
await rm(edgeFunctionsDestination, { recursive: true, force: true });
await cp(edgeFunctionsSource, edgeFunctionsDestination, { recursive: true });
await copyFile(
  resolve(projectRoot, "package.json"),
  resolve(outputDirectory, "package.json"),
);

console.info(
  "Prepared .next output for EdgeOne deployment with edge-functions and package.json.",
);
