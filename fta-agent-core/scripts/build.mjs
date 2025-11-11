#!/usr/bin/env node
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { access, cp, mkdir, rm } from 'node:fs/promises';
import { constants as fsConstants } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const ASSET_DIRS = ['mock-specs'];

async function main() {
  console.log('> Cleaning dist folder');
  await rm(DIST_DIR, { recursive: true, force: true });

  console.log('> Compiling TypeScript sources');
  await runTsc();

  console.log('> Copying static assets');
  for (const dir of ASSET_DIRS) {
    await copyAssetDir(dir);
  }

  console.log('> Build complete');
}

async function runTsc() {
  const require = createRequire(import.meta.url);
  const tscBin = require.resolve('typescript/lib/tsc.js');
  await runCommand(process.execPath, [tscBin, '-p', path.join(ROOT_DIR, 'tsconfig.json')]);
}

async function copyAssetDir(dirName) {
  const source = path.join(ROOT_DIR, dirName);
  if (!(await pathExists(source))) return;
  const target = path.join(DIST_DIR, dirName);
  await mkdir(path.dirname(target), { recursive: true });
  await cp(source, target, { recursive: true, force: true });
}

async function pathExists(targetPath) {
  try {
    await access(targetPath, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit', cwd: ROOT_DIR });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed (${code}): ${command} ${args.join(' ')}`));
      }
    });
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
