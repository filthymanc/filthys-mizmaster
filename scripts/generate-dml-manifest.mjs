import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

const DML_ROOT = globalThis.process.env.DML_ROOT || path.resolve(PROJECT_ROOT, '../DML');
const MODULES_DIR = path.join(DML_ROOT, 'modules');
const OUTPUT_PATH = globalThis.process.env.MANIFEST_OUTPUT_PATH || path.join(PROJECT_ROOT, 'public/manifests/dml-main.json');

/**
 * Extracts the framework version from the git repository.
 */
function getFrameworkVersion(dmlRoot) {
  try {
    const gitDir = path.resolve(dmlRoot, '.git');
    if (fs.existsSync(gitDir)) {
      return execSync(`git -C "${dmlRoot}" describe --tags --always`, { encoding: 'utf-8' }).trim();
    }
  } catch {
    console.warn('[Librarian] Could not detect DML git version, falling back.');
  }
  return 'master';
}

async function generateDmlManifest() {
  if (!fs.existsSync(MODULES_DIR)) {
    console.error(`DML modules directory not found at ${MODULES_DIR}`);
    return;
  }

  const version = getFrameworkVersion(DML_ROOT);
  const manifest = {
    version,
    framework: 'DML',
    branch: 'main',
    modules: {},
    classes: {}, // Map DML modules to classes for Librarian compatibility
    enums: {} // Map static constants for Librarian auto-suggest
  };

  const files = fs.readdirSync(MODULES_DIR).filter(f => f.endsWith('.lua') && !f.includes('template'));
  console.log(`[Librarian] Scanning ${files.length} DML modules...`);

  for (const file of files) {
    const filePath = path.join(MODULES_DIR, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    // 1. Identify Module Name (usually first table definition: name = {})
    let moduleName = path.basename(file, '.lua');
    const tableDefMatch = content.match(/^(\w+)\s*=\s*\{\}/m);
    if (tableDefMatch) {
      moduleName = tableDefMatch[1];
    }

    // 2. Extract Version
    let moduleVersion = '0.0.0';
    const versionMatch = content.match(new RegExp(`${moduleName}\\.version\\s*=\\s*["']([^"']+)["']`));
    if (versionMatch) {
      moduleVersion = versionMatch[1];
    }

    // 3. Extract Description (Header comments)
    let description = '';
    const headerLines = [];
    for (const line of lines) {
      const match = line.match(/^--\s*(.*)$/);
      if (match) {
        if (line.includes('====')) continue;
        headerLines.push(match[1].trim());
      } else if (line.trim().length > 0) {
        break;
      }
    }
    description = headerLines.filter(l => l).slice(0, 3).join(' ');

    const moduleInfo = {
      name: moduleName,
      version: moduleVersion,
      description: description || `DML Module: ${moduleName}`,
      path: `DML/modules/${file}`,
      methods: {},
      attributes: {} // NEW: Track DML Attributes (Zone Properties)
    };

    // 4. Extract Functions (Classic: function name.func(), OOP: function name:func())
    const funcRegex = new RegExp(`function\\s+(${moduleName})[.:](\\w+)\\s*\\(([^)]*)\\)`, 'g');
    let match;
    while ((match = funcRegex.exec(content)) !== null) {
      const funcName = match[2];
      const params = match[3].split(',').map(p => p.trim()).filter(p => p);
      
      moduleInfo.methods[funcName] = {
        name: funcName,
        params,
        description: '' 
      };
    }

    // 5. Extract Attributes (Heuristic: Look for ZoneProperty calls)
    // Pattern: get(Bool|String|Number|PositiveRange)FromZoneProperty(theZone, "attr", default)
    const attrRegex = /get(?:Bool|String|Number|PositiveRange)FromZoneProperty\s*\([^,]+,\s*["']([^"']+)["']/g;
    const noise = ['<none>', 'none', 'change', 'inc', 'vivid', 'tactical', '<o>-<uid>', 'ok', 'no', 'yes'];
    
    let attrMatch;
    while ((attrMatch = attrRegex.exec(content)) !== null) {
      const attrName = attrMatch[1];
      if (!noise.includes(attrName.toLowerCase()) && !moduleInfo.attributes[attrName]) {
        moduleInfo.attributes[attrName] = {
          name: attrName,
          type: attrName.endsWith('!') ? 'trigger' : (attrName.endsWith('?') ? 'condition' : 'property')
        };
      }
    }

    // Capture explicit .hasProperty("attr") calls
    const hasPropRegex = /hasProperty\s*\(\s*["']([^"']+)["']/g;
    while ((attrMatch = hasPropRegex.exec(content)) !== null) {
      const attrName = attrMatch[1];
      if (!noise.includes(attrName.toLowerCase()) && !moduleInfo.attributes[attrName]) {
        moduleInfo.attributes[attrName] = {
          name: attrName,
          type: attrName.endsWith('!') ? 'trigger' : (attrName.endsWith('?') ? 'condition' : 'property')
        };
      }
    }

    // 6. Extract Constants (Top-level table assignments)
    // Matches: cfxZones.verbose = true, moduleName.CONSTANT = 1
    const constRegex = new RegExp(`^${moduleName}\\.([A-Za-z0-9_]+)\\s*=\\s*(.+)`, 'gm');
    let constMatch;
    while ((constMatch = constRegex.exec(content)) !== null) {
      const constName = constMatch[1];
      const constValue = constMatch[2].split('--')[0].trim(); // Remove inline comments
      
      // Filter out boilerplate
      const ignoreList = ['version', 'name', 'requiredLibs'];
      if (!ignoreList.includes(constName) && !constValue.startsWith('function') && !constValue.startsWith('{')) {
          if (!manifest.enums[moduleName]) {
             manifest.enums[moduleName] = { description: `Constants for ${moduleName}`, fields: [] };
          }
          if (!manifest.enums[moduleName].fields.find(f => f.name === constName)) {
              manifest.enums[moduleName].fields.push({
                 name: constName,
                 description: `Value: ${constValue.replace(/,$/, '')}` 
              });
          }
      }
    }

    // Map to 'classes' for Librarian compatibility
    manifest.classes[moduleName] = moduleInfo;
  }

  // Ensure output directory exists
  if (!fs.existsSync(path.dirname(OUTPUT_PATH))) {
    fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(manifest, null, 2));
  console.log(`✅ DML Manifest generated: ${OUTPUT_PATH} (${Object.keys(manifest.classes).length} modules found)`);
}

generateDmlManifest();
