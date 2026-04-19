import fs from "fs";
import path from "path";
import { execSync } from "child_process";

import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..");

// Get branch from CLI argument (default to master-ng)
const branch = globalThis.process.argv[2] || "master-ng";

// Path to the MOOSE framework root
const MOOSE_ROOT =
  globalThis.process.env.MOOSE_ROOT ||
  path.resolve(PROJECT_ROOT, `../moose-${branch}/Moose Development/Moose`);

// Path to the output manifest file
const OUTPUT_PATH =
  globalThis.process.env.MANIFEST_OUTPUT_PATH ||
  path.join(PROJECT_ROOT, `public/manifests/moose-${branch}.json`);

// Ensure output directory exists
if (!fs.existsSync(path.dirname(OUTPUT_PATH))) {
  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
}

/**
 * Extracts the framework version from the git repository or falls back to branch name.
 */
function getFrameworkVersion(mooseRoot, branchName) {
  try {
    const gitDir = path.resolve(mooseRoot, "../../.git");
    if (fs.existsSync(gitDir)) {
      const version = execSync(
        `git -C "${path.dirname(gitDir)}" describe --tags --always`,
        { encoding: "utf-8" },
      ).trim();
      return version;
    }
  } catch {
    console.warn(
      `[Librarian] Could not detect git version for ${branchName}, falling back.`,
    );
  }
  return branchName;
}

async function generateManifest() {
  const version = getFrameworkVersion(MOOSE_ROOT, branch);
  const modulesLuaPath = path.join(MOOSE_ROOT, "Modules.lua");
  if (!fs.existsSync(modulesLuaPath)) {
    console.error(`Modules.lua not found at ${modulesLuaPath}`);
    return;
  }

  const content = fs.readFileSync(modulesLuaPath, "utf-8");
  // Match any include pattern: __Moose.Include( ... '/path.lua' )
  const includeLines =
    content.match(/__Moose\.Include\(.*?'(.*?)'.*?\)/g) || [];

  console.log(`[Librarian] Found ${includeLines.length} potential modules.`);

  const manifest = {
    version,
    framework: "MOOSE",
    branch,
    classes: {},
    enums: {},
  };

  for (const line of includeLines) {
    const pathMatch = line.match(/'(.*?)'/);
    if (!pathMatch) continue;

    const relativePath = pathMatch[1].replace(/^\//, ""); // Remove leading slash
    const fullPath = path.join(MOOSE_ROOT, "..", relativePath); // MOOSE_ROOT is .../Moose, we need to go up one level to match the /Moose/ path in the file

    if (!fs.existsSync(fullPath)) {
      // Try without the /Moose/ prefix if it's already in MOOSE_ROOT
      // Actually, the include says '/Moose/Utilities/...'
      // MOOSE_ROOT is already .../Moose.
      // So we need to be careful.
    }

    if (fs.existsSync(fullPath)) {
      const fileContent = fs.readFileSync(fullPath, "utf-8");

      // Find all classes in this file (usually just one, but let's be safe)
      // Matches both CLASS = { and CLASS = BASE:Inherit
      const classRegex = /^\s*([A-Z_0-9]+)\s*=\s*(?:\{|BASE:Inherit)/gm;
      let classMatch;

      while ((classMatch = classRegex.exec(fileContent)) !== null) {
        const className = classMatch[1];

        // Find Inheritance
        const ldocMatch = fileContent.match(
          new RegExp(`--\\s*@extends\\s+.*?#([A-Z_0-9]+)`, "i"),
        );
        const inheritMatch = fileContent.match(
          new RegExp(
            `BASE:Inherit\\s*\\(\\s*self\\s*,\\s*([A-Z_0-9]+):New`,
            "i",
          ),
        );
        const parentName = ldocMatch
          ? ldocMatch[1]
          : inheritMatch
            ? inheritMatch[1]
            : null;

        // Extract Description for this specific class
        let description = `MOOSE ${className} Class`;
        const descMatch1 = fileContent.match(
          new RegExp(`--- \\*\\*${className}\\*\\* ([^*]+)`, "i"),
        );
        const descMatch2 = fileContent.match(
          new RegExp(`--- \\*\\*(?:[^*]+)\\*\\* - ${className} ([^*]+)`, "i"),
        );

        if (descMatch1 && descMatch1[1]) {
          description = descMatch1[1].trim();
        } else if (descMatch2 && descMatch2[1]) {
          description = descMatch2[1].trim();
        }

        // Extract Methods for this class
        // Pattern: function CLASS:Method(args)
        const methods = {};
        const methodRegex = new RegExp(
          `function\\s+${className}[:\\.]([A-Za-z0-9_]+)\\s*\\(([^)]*)\\)`,
          "g",
        );
        let methodDef;
        while ((methodDef = methodRegex.exec(fileContent)) !== null) {
          const methodName = methodDef[1];
          const params = methodDef[2]
            .split(",")
            .map((p) => p.trim())
            .filter((p) => p && p !== "self");

          // Heuristic: Extract leading comment for the method
          let methodDescription = "";
          const methodPos = methodDef.index;
          const searchWindow = fileContent.substring(
            Math.max(0, methodPos - 1000),
            methodPos,
          );
          const lines = searchWindow.split("\n").map((l) => l.trim());

          // Search backwards for the FIRST '---' line that begins a documentation block
          for (let i = lines.length - 1; i >= 0; i--) {
            const line = lines[i];
            if (line.startsWith("---")) {
              methodDescription = line
                .replace(/^---/, "")
                .replace(/\*\*/g, "")
                .trim();
              break;
            }
            // If we hit a line that doesn't look like a comment and isn't empty, stop searching
            if (line && !line.startsWith("--")) break;
          }

          methods[methodName] = {
            params,
            description: methodDescription,
          };
        }

        manifest.classes[className] = {
          path: `Moose/${relativePath}`,
          parent:
            parentName === "nil" || parentName === className
              ? null
              : parentName,
          description,
          methods,
        };
      }
    } else {
      console.warn(`[Librarian] File not found: ${fullPath}`);
    }
  }

  // Parse DCS.lua for Enums
  const dcsLuaPath = path.join(MOOSE_ROOT, "DCS.lua");
  if (fs.existsSync(dcsLuaPath)) {
    console.log(`[Librarian] Parsing DCS.lua for Enums...`);
    const dcsContent = fs.readFileSync(dcsLuaPath, "utf-8");
    const lines = dcsContent.split("\n");
    let currentEnum = null;
    let currentDesc = "";

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (line.startsWith("---")) {
        currentDesc = line.replace(/^---\s*/, "").trim();
        // Remove markdown links to just keep text
        currentDesc = currentDesc.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
        continue;
      }

      const typeMatch = line.match(/^--\s*@type\s+([A-Za-z0-9_.]+)/);
      if (typeMatch) {
        currentEnum = typeMatch[1];
        if (!manifest.enums) manifest.enums = {};
        if (!manifest.enums[currentEnum]) {
          manifest.enums[currentEnum] = {
            description: currentDesc,
            fields: [],
          };
        }
        currentDesc = "";
        continue;
      }

      if (currentEnum && line.startsWith("--")) {
        const fieldMatch = line.match(
          /^--\s*@field\s+([^ \t\n=]+)(?:\s+(.*))?/,
        );
        if (fieldMatch) {
          let name = fieldMatch[1];
          let remainder = fieldMatch[2] || "";

          // If name is a type hint like #number, the real name is next
          if (name.startsWith("#") && remainder) {
            const parts = remainder.split(/\s+/);
            name = parts.shift();
            remainder = parts.join(" ");
          }

          // Clean up `= value` from the remainder descriptor
          let cleanDesc = remainder.replace(/^=\s*[^ ]+\s*/, "").trim();

          // Prevent pushing duplicate fields if they are somehow duplicated
          if (
            name &&
            !manifest.enums[currentEnum].fields.find((f) => f.name === name)
          ) {
            manifest.enums[currentEnum].fields.push({
              name: name,
              description: cleanDesc,
            });
          }
        }
      } else if (line !== "" && !line.startsWith("--")) {
        // End of the enum doc block
        currentEnum = null;
      }
    }
  } else {
    console.warn(`[Librarian] DCS.lua not found at ${dcsLuaPath}`);
  }

  // Cleanup enums with no fields
  for (const enumName in manifest.enums) {
    if (manifest.enums[enumName].fields.length === 0) {
      delete manifest.enums[enumName];
    }
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(manifest, null, 2));
  console.log(
    `✅ Manifest generated: ${OUTPUT_PATH} (${Object.keys(manifest.classes).length} classes found)`,
  );
}

generateManifest();
