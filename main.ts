import { build, emptyDir } from "@deno/dnt";
import { join } from "node:path";

// 1. Get the directory where the user is running the command
const cwd = Deno.cwd();
const configPath = join(cwd, "deno.json");
const outDir = join(cwd, "npm");

// 2. Read the local deno.json dynamically
let denoConfig;
try {
  const configText = await Deno.readTextFile(configPath);
  denoConfig = JSON.parse(configText);
  console.log(`📦 Building npm package for ${denoConfig.name}...`);
} catch (_error) {
  console.error(
    "❌ Error: Could not find or parse deno.json in the current directory.",
  );
  Deno.exit(1);
}

await emptyDir(outDir);

const entryPoints = [];

// 3. Dynamically map JSR exports to dnt entry points
if (typeof denoConfig.exports === "string") {
  entryPoints.push(denoConfig.exports);
} else if (typeof denoConfig.exports === "object") {
  for (const [key, value] of Object.entries(denoConfig.exports)) {
    if (key === ".") {
      entryPoints.push(value as string);
    } else {
      entryPoints.push({ name: key, path: value as string });
    }
  }
}

// 4. Dynamically map Deno bins to dnt executable entry points
if (denoConfig.bin) {
  if (typeof denoConfig.bin === "string") {
    const cliName = denoConfig.name.split("/").pop() || "cli";
    entryPoints.push({
      kind: "bin" as const,
      name: cliName,
      path: denoConfig.bin,
    });
  } else if (typeof denoConfig.bin === "object") {
    for (const [key, value] of Object.entries(denoConfig.bin)) {
      entryPoints.push({
        kind: "bin" as const,
        name: key,
        path: value as string,
      });
    }
  }
}

// 5. Build using the config
await build({
  entryPoints: entryPoints,
  outDir: outDir,
  shims: {},
  typeCheck: false,
  test: false, // We disabled tests to avoid @std/assert modern JS issues
  package: {
    name: denoConfig.name,
    version: denoConfig.version,
    publishConfig: {
      access: "public",
    },
    // deno-lint-ignore no-explicit-any
    description: (denoConfig as any).description,
    license: denoConfig.license,
    repository: {
      type: "git",
      // deno-lint-ignore no-explicit-any
      url: (denoConfig as any).repository,
    },
  },
  postBuild() {
    // Wrap these in try/catch just in case a repo doesn't have a LICENSE or README
    try {
      Deno.copyFileSync(join(cwd, "LICENSE"), join(outDir, "LICENSE"));
      Deno.copyFileSync(join(cwd, "README.md"), join(outDir, "README.md"));
    } catch (_e) {
      console.warn(
        "⚠️  Note: Could not copy LICENSE or README.md. Are they in the root?",
      );
    }
  },
});

console.log("✅ Build complete! You can now `cd npm` and run `npm publish`.");
