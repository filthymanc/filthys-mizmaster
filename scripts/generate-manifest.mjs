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
  path.resolve(PROJECT_ROOT, `../MOOSE/${branch}/Moose Development/Moose`);

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

/**
 * Parses @field annotations from a @type block for the given className.
 * Returns a map of fieldName -> { type, description }.
 */
function parseFieldsForClass(fileContent, className) {
  const fields = {};
  const lines = fileContent.split("\n");
  let inTypeBlock = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // Detect start of the @type block for this exact class (not sub-types like SPAWN.Takeoff)
    // Handles both -- and --- prefix styles used inconsistently across MOOSE source files
    if (trimmed.match(new RegExp(`^-{2,3}\\s*@type\\s+${className}\\s*$`, "i"))) {
      inTypeBlock = true;
      continue;
    }

    if (inTypeBlock) {
      // A new @type line starts a different block — stop
      if (trimmed.match(/^-{2,3}\s*@type\s+/i)) {
        inTypeBlock = false;
        continue;
      }
      // Non-comment, non-empty line ends the block
      if (trimmed && !trimmed.startsWith("--")) {
        inTypeBlock = false;
        continue;
      }

      const fieldMatch = trimmed.match(/^-{2,3}\s*@field\s+(.+)$/);
      if (fieldMatch) {
        const parts = fieldMatch[1].trim().split(/\s+/);
        let fType = "unknown";
        let fName = "";
        let fDesc = "";

        if (parts[0].startsWith("#") || parts[0].includes("#")) {
          // Pattern: @field #type fieldName description
          fType = parts[0];
          fName = parts[1] || "";
          fDesc = parts.slice(2).join(" ");
        } else {
          // Pattern: @field fieldName description (no type prefix)
          fName = parts[0];
          fDesc = parts.slice(1).join(" ");
        }

        // Skip: self-reference, private fields (_prefix), bare class names
        if (
          fName &&
          fName !== className &&
          !fName.startsWith("@") &&
          !fName.startsWith("_") &&
          fName !== "ClassName"
        ) {
          fields[fName] = { type: fType, description: fDesc.trim() || undefined };
        }
      }
    }
  }

  return fields;
}

/**
 * Parses inner @type blocks (e.g. SPAWN.Takeoff) from a file and adds them
 * to the manifest as sub-type entries.
 */
function parseInnerTypes(fileContent, relativePath, manifest) {
  const lines = fileContent.split("\n");
  let currentInnerType = null;
  let outerClass = null;
  const innerFields = {};

  for (const line of lines) {
    const trimmed = line.trim();

    // Match inner @type like "-- @type SPAWN.Takeoff" (handles -- and --- prefix)
    const innerTypeMatch = trimmed.match(
      /^-{2,3}\s*@type\s+(([A-Z_0-9]+)\.([A-Za-z_0-9]+))\s*$/,
    );
    if (innerTypeMatch) {
      // Save previous inner type if any
      if (currentInnerType && manifest.classes[outerClass]) {
        manifest.classes[currentInnerType] = {
          path: `Moose/${relativePath}`,
          parent: outerClass,
          description: `${currentInnerType.split(".")[1]} sub-type of ${outerClass}`,
          methods: {},
          fields:
            Object.keys(innerFields[currentInnerType] || {}).length > 0
              ? innerFields[currentInnerType]
              : undefined,
        };
      }

      currentInnerType = innerTypeMatch[1]; // "SPAWN.Takeoff"
      outerClass = innerTypeMatch[2];       // "SPAWN"
      innerFields[currentInnerType] = {};
      continue;
    }

    if (currentInnerType) {
      // New @type (any) or non-comment non-empty ends the block
      if (trimmed.match(/^-{2,3}\s*@type\s+/i)) {
        // Check if it's another inner type — handled by the match above on next iteration
        currentInnerType = null;
        outerClass = null;
        continue;
      }
      if (trimmed && !trimmed.startsWith("--")) {
        currentInnerType = null;
        outerClass = null;
        continue;
      }

      const fieldMatch = trimmed.match(/^-{2,3}\s*@field\s+(.+)$/);
      if (fieldMatch) {
        const parts = fieldMatch[1].trim().split(/\s+/);
        let fType = "unknown";
        let fName = "";
        let fDesc = "";

        if (parts[0].startsWith("#") || parts[0].includes("#")) {
          fType = parts[0];
          fName = parts[1] || "";
          fDesc = parts.slice(2).join(" ");
        } else {
          fName = parts[0];
          fDesc = parts.slice(1).join(" ");
        }

        if (fName && !fName.startsWith("@") && !fName.startsWith("_")) {
          innerFields[currentInnerType][fName] = {
            type: fType,
            description: fDesc.trim() || undefined,
          };
        }
      }
    }
  }

  // Flush the last inner type
  if (currentInnerType && manifest.classes[outerClass]) {
    manifest.classes[currentInnerType] = {
      path: `Moose/${relativePath}`,
      parent: outerClass,
      description: `${currentInnerType.split(".")[1]} sub-type of ${outerClass}`,
      methods: {},
      fields:
        Object.keys(innerFields[currentInnerType] || {}).length > 0
          ? innerFields[currentInnerType]
          : undefined,
    };
  }
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

    const relativePath = pathMatch[1].replace(/^\//, "");
    const fullPath = path.join(MOOSE_ROOT, "..", relativePath);

    if (fs.existsSync(fullPath)) {
      const fileContent = fs.readFileSync(fullPath, "utf-8");

      // Find all top-level classes in this file
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

        // Extract Description — three MOOSE header patterns, in priority order.
        // Filter out LDoc structural annotations like "class, extends Core.Base#BASE"
        // that match the regex but aren't human-readable descriptions.
        let description = `MOOSE ${className} Class`;
        const looksStructural = (s) =>
          /^(class|type|extends|[A-Z_0-9]+ class)\b/i.test(s.trim()) ||
          /,\s*extends\b/i.test(s.trim());

        // Pattern A: "--- **CLASSNAME — description**" (e.g. TARS, OPSGROUP — class in bolded title)
        const matchA = fileContent.match(
          new RegExp(
            `---\\s+\\*\\*${className}\\s*[—–-]+\\s*([^\\n*]+?)\\*\\*`,
            "i",
          ),
        );
        // Pattern B: "--- **MODULE** - CLASSNAME description" (e.g. SPAWN — module-prefixed)
        const matchB = fileContent.match(
          new RegExp(
            `---\\s+\\*\\*[^*\\n]+\\*\\*\\s*[-—–]+\\s*${className}\\s+([^\\n*]+)`,
            "i",
          ),
        );
        // Pattern C: "--- **CLASSNAME** description" (legacy LDoc — often structural, filtered)
        const matchC = fileContent.match(
          new RegExp(`---\\s+\\*\\*${className}\\*\\*\\s+([^\\n*]+)`, "i"),
        );

        const pickDesc = (m) =>
          m && m[1] && !looksStructural(m[1]) ? m[1].trim() : null;

        description =
          pickDesc(matchA) ||
          pickDesc(matchB) ||
          pickDesc(matchC) ||
          description;

        // Extract Methods
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

          let methodDescription = "";
          const methodPos = methodDef.index;
          const searchWindow = fileContent.substring(
            Math.max(0, methodPos - 1000),
            methodPos,
          );
          const searchLines = searchWindow.split("\n").map((l) => l.trim());

          for (let i = searchLines.length - 1; i >= 0; i--) {
            const l = searchLines[i];
            if (l.startsWith("---")) {
              methodDescription = l
                .replace(/^---/, "")
                .replace(/\*\*/g, "")
                .trim();
              break;
            }
            if (l && !l.startsWith("--")) break;
          }

          methods[methodName] = { params, description: methodDescription };
        }

        // Extract @field annotations from the @type block for this class
        const fields = parseFieldsForClass(fileContent, className);

        manifest.classes[className] = {
          path: `Moose/${relativePath}`,
          parent:
            parentName === "nil" || parentName === className
              ? null
              : parentName,
          description,
          methods,
          fields: Object.keys(fields).length > 0 ? fields : undefined,
        };
      }

      // Parse inner @type blocks (e.g. SPAWN.Takeoff, AIRBOSS.Recovery)
      parseInnerTypes(fileContent, relativePath, manifest);

    } else {
      console.warn(`[Librarian] File not found: ${fullPath}`);
    }
  }

  // Parse DCS.lua for Enums
  const dcsLuaPath = path.join(MOOSE_ROOT, "DCS.lua");
  if (fs.existsSync(dcsLuaPath)) {
    console.log(`[Librarian] Parsing DCS.lua for Enums...`);
    const dcsContent = fs.readFileSync(dcsLuaPath, "utf-8");
    const dcsLines = dcsContent.split("\n");
    let currentEnum = null;
    let currentDesc = "";

    for (let i = 0; i < dcsLines.length; i++) {
      const dcsLine = dcsLines[i].trim();

      if (dcsLine.startsWith("---")) {
        currentDesc = dcsLine.replace(/^---\s*/, "").trim();
        currentDesc = currentDesc.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
        continue;
      }

      const typeMatch = dcsLine.match(/^--\s*@type\s+([A-Za-z0-9_.]+)/);
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

      if (currentEnum && dcsLine.startsWith("--")) {
        const fieldMatch = dcsLine.match(
          /^--\s*@field\s+([^ \t\n=]+)(?:\s+(.*))?/,
        );
        if (fieldMatch) {
          let name = fieldMatch[1];
          let remainder = fieldMatch[2] || "";

          if (name.startsWith("#") && remainder) {
            const parts = remainder.split(/\s+/);
            name = parts.shift();
            remainder = parts.join(" ");
          }

          let cleanDesc = remainder.replace(/^=\s*[^ ]+\s*/, "").trim();

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
      } else if (dcsLine !== "" && !dcsLine.startsWith("--")) {
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

  const classCount = Object.keys(manifest.classes).length;
  const fieldCount = Object.values(manifest.classes).reduce(
    (acc, c) => acc + Object.keys(c.fields || {}).length,
    0,
  );
  const innerTypeCount = Object.keys(manifest.classes).filter((k) =>
    k.includes("."),
  ).length;

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(manifest, null, 2));
  console.log(
    `✅ Manifest generated: ${OUTPUT_PATH}\n` +
    `   Classes: ${classCount} (${innerTypeCount} inner types)\n` +
    `   Fields:  ${fieldCount}\n` +
    `   Enums:   ${Object.keys(manifest.enums).length}`,
  );
}

generateManifest();