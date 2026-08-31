import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const version = process.argv[2];

if (!version) {
  console.error("Usage: npm run version:set -- <version>");
  process.exit(1);
}

if (!/^\d+\.\d+\.\d+([-.][0-9A-Za-z.-]+)?$/.test(version)) {
  console.error(`Invalid version: ${version}`);
  process.exit(1);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const frontendDir = path.resolve(__dirname, "..");
const projectRoot = path.resolve(frontendDir, "..");
const backendDir = path.join(projectRoot, "backend");

const packageJsonPath = path.join(frontendDir, "package.json");

const tauriConfigPath = path.join(projectRoot, "src-tauri", "tauri.conf.json");

const pyprojectPath = path.join(backendDir, "pyproject.toml");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function updatePackageJson() {
  const packageJson = readJson(packageJsonPath);

  packageJson.version = version;

  writeJson(packageJsonPath, packageJson);

  console.log(`✓ frontend/package.json → ${version}`);
}

function updateTauriConfig() {
  const tauriConfig = readJson(tauriConfigPath);

  tauriConfig.version = version;

  writeJson(tauriConfigPath, tauriConfig);

  console.log(`✓ src-tauri/tauri.conf.json → ${version}`);
}

function updatePyproject() {
  const content = fs.readFileSync(pyprojectPath, "utf8");

  const updatedContent = content.replace(/^version\s*=\s*"[^"]+"/m, `version = "${version}"`);

  if (content === updatedContent) {
    throw new Error("Could not find version in backend/pyproject.toml");
  }

  fs.writeFileSync(pyprojectPath, updatedContent, "utf8");

  console.log(`✓ backend/pyproject.toml → ${version}`);
}

function runCommand(command, args, cwd) {
  console.log("");

  console.log(`Running: ${command} ${args.join(" ")}`);

  execFileSync(command, args, {
    cwd,
    stdio: "inherit"
  });
}

try {
  console.log("");
  console.log(`Updating Vector Watcher version to ${version}`);
  console.log("");

  updatePackageJson();
  updateTauriConfig();
  updatePyproject();

  console.log("");
  console.log("Synchronizing package-lock.json...");

  runCommand("npm", ["install", "--package-lock-only"], frontendDir);

  console.log("");
  console.log("Synchronizing poetry.lock...");

  runCommand("poetry", ["lock"], backendDir);

  console.log("");
  console.log("========================================");
  console.log(" Version update completed successfully");
  console.log("========================================");
  console.log("");
  console.log(`Version: ${version}`);
} catch (error) {
  console.error("");
  console.error("Version update failed.");

  if (error instanceof Error) {
    console.error(error.message);
  }

  process.exit(1);
}
