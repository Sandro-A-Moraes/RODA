/**
 * @jest-environment node
 */
import fs from 'node:fs';
import path from 'node:path';

import jestConfig from '../../jest.config';

const root = path.resolve(__dirname, '../..');
const tsconfig = JSON.parse(
  fs.readFileSync(path.join(root, 'tsconfig.json'), 'utf8'),
) as { compilerOptions: { paths: Record<string, string[]> } };
const tsPaths = tsconfig.compilerOptions.paths;
const mapper = (jestConfig.moduleNameMapper ?? {}) as Record<string, string>;

describe('import aliases', () => {
  it('defines exactly the three aliases in tsconfig', () => {
    expect(Object.keys(tsPaths).sort()).toEqual(['@/core/*', '@/modules/*', '@/shared/*']);
  });

  it.each(Object.entries(tsPaths))(
    'maps %s to an equivalent moduleNameMapper entry in Jest',
    (alias, targets) => {
      const key = '^' + alias.replace('*', '(.*)') + '$';
      const target = targets[0].replace(/^\.\//, '<rootDir>/').replace('*', '$1');
      expect(mapper[key]).toBe(target);
    },
  );
});
