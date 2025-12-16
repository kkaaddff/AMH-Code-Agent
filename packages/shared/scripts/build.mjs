#!/usr/bin/env node
import { cp, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const SRC_DATA_DIR = path.join(ROOT_DIR, 'src', 'data');
const DIST_DATA_DIR = path.join(DIST_DIR, 'data');

async function main() {
  console.log('> Cleaning dist folder');
  await rm(DIST_DIR, { recursive: true, force: true });

  console.log('> Compiling TypeScript sources');
  await runTsc();

  console.log('> Copying JSON data files');
  await copyDataFiles();

  console.log('> Build complete');
}

function runTsc() {
  return new Promise((resolve, reject) => {
    const tsc = spawn('tsc', ['-p', path.join(ROOT_DIR, 'tsconfig.json')], {
      stdio: 'inherit',
      shell: true,
    });

    tsc.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`TypeScript compilation failed with code ${code}`));
      }
    });

    tsc.on('error', (err) => {
      reject(err);
    });
  });
}

async function copyDataFiles() {
  try {
    await mkdir(DIST_DATA_DIR, { recursive: true });
    await cp(SRC_DATA_DIR, DIST_DATA_DIR, { recursive: true, force: true });
    console.log(`  Copied data files from ${SRC_DATA_DIR} to ${DIST_DATA_DIR}`);
  } catch (err) {
    if (err.code !== 'ENOENT') {
      throw err;
    }
    console.log('  No data directory found, skipping');
  }
}

main().catch((err) => {
  console.error('Build failed:', err);
  process.exit(1);
});
