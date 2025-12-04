import * as fs from 'fs';
import * as path from 'path';
import { minifyDSL } from './index';

const dslPath = path.resolve(__dirname, '../../../../fta-layout-design/src/pages/EditorPage/components/dsl.json');

try {
  const rawData = fs.readFileSync(dslPath, 'utf-8');
  const dsl = JSON.parse(rawData);

  console.log('Original Size:', rawData.length);

  const minified = minifyDSL(dsl);
  const minifiedJson = JSON.stringify(minified, null, 2);

  console.log('Minified Size:', minifiedJson.length);
  console.log('Reduction:', (((rawData.length - minifiedJson.length) / rawData.length) * 100).toFixed(2) + '%');

  // Write output for inspection
  fs.writeFileSync(path.resolve(__dirname, 'minified-dsl.json'), minifiedJson);
  console.log('Minified DSL written to minified-dsl.json');
} catch (error) {
  console.error('Error running test:', error);
}
