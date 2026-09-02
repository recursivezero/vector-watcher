import { rm } from "node:fs/promises";
import { resolve } from "node:path";

const frontendRoot = resolve(
  import.meta.dirname,
  "..",
);

const projectRoot = resolve(
  frontendRoot,
  "..",
);

const paths = [
  resolve(frontendRoot, "dist"),
  resolve(projectRoot, "src-tauri/target"),
];

console.log("Cleaning application build artifacts...");

for (const target of paths) {
  console.log(`Deleting: ${target}`);

  await rm(target, {
    recursive: true,
    force: true,
  });

  console.log(`Deleted: ${target}`);
}

console.log("Clean completed.");