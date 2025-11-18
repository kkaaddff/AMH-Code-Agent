import path from 'pathe';
import { fileURLToPath } from 'node:url';

function getImportMetaUrl(): string | undefined {
  try {
    return (0, eval)('import.meta.url') as string;
  } catch {
    return undefined;
  }
}

export function getModuleFilename(): string {
  if (typeof __filename !== 'undefined') {
    return __filename;
  }
  const metaUrl = getImportMetaUrl();
  if (metaUrl) {
    return fileURLToPath(metaUrl);
  }
  return path.join(process.cwd(), 'index.js');
}

export function getModuleDirname(): string {
  if (typeof __dirname !== 'undefined') {
    return __dirname;
  }
  const metaUrl = getImportMetaUrl();
  if (metaUrl) {
    return path.dirname(fileURLToPath(metaUrl));
  }
  return process.cwd();
}
