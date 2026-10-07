/**
 * @jest-environment node
 */
import fs from 'node:fs';
import path from 'node:path';

import { Linter } from 'eslint';

import eslintConfig from '../../eslint.config';
import { findUnlistedModules } from '../modules';

// SPEC_DEVIATION: design.md names the ESLint class, but ESLint 9.39 loads the config
// through a dynamic import that fails under Jest ("without --experimental-vm-modules").
// Reason: use the documented fallback, the Linter class with the repo's flat config array.
const config = eslintConfig as unknown as Linter.Config[];
const root = path.resolve(__dirname, '../..');
const linter = new Linter({ cwd: root, configType: 'flat' });

function violations(filePath: string, code: string, ruleId: string) {
  const messages = linter.verify(code, config, { filename: filePath });
  const fatal = messages.find((message) => message.fatal);
  if (fatal) throw new Error(`Parse failure in ${filePath}: ${fatal.message}`);
  return messages.filter((message) => message.ruleId === ruleId);
}

describe('module boundary rule (no-restricted-imports)', () => {
  const rule = 'no-restricted-imports';

  it('reports an alias deep import of another module', () => {
    const found = violations(
      'src/modules/circles/presentation/x.ts',
      "import { User } from '@/modules/auth/domain/user';\nexport { User };\n",
      rule,
    );
    expect(found).toHaveLength(1);
  });

  it('reports a relative deep import of another module', () => {
    const found = violations(
      'src/modules/circles/presentation/x.ts',
      "import { User } from '../../auth/domain/user';\nexport { User };\n",
      rule,
    );
    expect(found).toHaveLength(1);
  });

  it('does not report the public entry point of another module', () => {
    const found = violations(
      'src/modules/circles/presentation/x.ts',
      "import { User } from '@/modules/auth';\nexport { User };\n",
      rule,
    );
    expect(found).toHaveLength(0);
  });

  it('does not report a module importing its own internals', () => {
    const found = violations(
      'src/modules/auth/presentation/x.ts',
      "import { User } from '../domain/user';\nexport { User };\n",
      rule,
    );
    expect(found).toHaveLength(0);
  });
});

describe('MODULES guard', () => {
  it('has no directory in src/modules missing from MODULES', () => {
    expect(findUnlistedModules(root)).toEqual([]);
  });

  it('reports a directory in src/modules that is absent from MODULES', () => {
    const name = 'zz-unlisted-guard-test';
    const dir = path.join(root, 'src', 'modules', name);
    fs.mkdirSync(dir, { recursive: true });
    try {
      expect(findUnlistedModules(root)).toEqual([name]);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});
