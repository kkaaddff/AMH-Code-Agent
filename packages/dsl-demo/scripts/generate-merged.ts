import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { CleanerConfig, DesignData } from '@fta/shared';
import { DSLCleaner } from '@fta/shared';
import annotation from '../src/data/rootAnnotation.json';
import dslRawData from '../src/data/dsl.json';
import { mergeDslWithAnnotation } from '../src/utils/mergeDslAnnotation.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const dslData: DesignData = {
    dsl: {
      styles: dslRawData.styles,
      nodes: dslRawData.nodes as any,
    },
  };

  const cleanerConfig: CleanerConfig = {
    removeEmptyNodes: true,
    removeMaskLayers: true,
    removeOutOfBounds: true,
    removeInvisibleNodes: true,
    detectIcons: true,
    mergeIconLayers: true,
    iconMergeMaxSize: 40,
    iconMinLayers: 2,
    iconProximityThreshold: 10,
    buildZIndex: true,
    checkOverlapping: true,
    removeCompletelyHidden: true,
    flattenSingleChild: true,
    optimizeDepth: true,
    preserveSemantics: true,
    verbose: false,
    dryRun: false,
  };

  const cleaner = new DSLCleaner(cleanerConfig);
  const result = cleaner.clean(dslData.dsl.nodes[0]);
  const cleanedDsl: DesignData = {
    dsl: {
      styles: dslData.dsl.styles,
      nodes: [result.root],
    },
  };

  const { merged } = mergeDslWithAnnotation(cleanedDsl, annotation as any);
  const outputPath = path.resolve(__dirname, '../src/data/merged.json');
  await fs.writeFile(outputPath, JSON.stringify(merged, null, 2), 'utf-8');
  console.log(`Merged JSON written to ${outputPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
