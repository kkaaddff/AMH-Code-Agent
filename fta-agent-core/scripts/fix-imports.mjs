#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST_DIR = join(__dirname, '..', 'dist');

async function getAllJsFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        return getAllJsFiles(fullPath);
      } else if (entry.name.endsWith('.js')) {
        return fullPath;
      }
      return [];
    })
  );
  return files.flat();
}

function fixImportsInFile(filePath) {
  let content = readFileSync(filePath, 'utf-8');
  let modified = false;

  // 匹配 from './xxx' 或 from "./xxx"，不包含已有 .js 的
  content = content.replace(/(from\s+['"])(\.[^'"]+?)(['"])/g, (match, prefix, path, suffix) => {
    // 跳过已经有扩展名的
    if (path.endsWith('.js') || path.endsWith('.json')) {
      return match;
    }
    modified = true;
    return `${prefix}${path}.js${suffix}`;
  });

  if (modified) {
    writeFileSync(filePath, content, 'utf-8');
    return true;
  }
  return false;
}

async function main() {
  console.log('> Fixing import statements in compiled JS files...');

  const jsFiles = await getAllJsFiles(DIST_DIR);
  let fixedCount = 0;

  for (const file of jsFiles) {
    if (fixImportsInFile(file)) {
      fixedCount++;
    }
  }

  console.log(`✅ Fixed imports in ${fixedCount} of ${jsFiles.length} files`);
}

main().catch((error) => {
  console.error('Error fixing imports:', error);
  process.exit(1);
});
