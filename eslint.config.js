const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettierConfig = require('eslint-config-prettier/flat');

const { MODULES } = require('./tooling/modules');

const sourceFiles = '**/*.{ts,tsx,js,jsx}';

// For each module, restrict deep imports (alias or relative) into every other module.
// `@/modules/<other>` (the index.ts) stays allowed.
const moduleBoundaries = MODULES.map((name) => {
  const others = MODULES.filter((other) => other !== name);
  return {
    files: [`src/modules/${name}/${sourceFiles}`],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: others.flatMap((other) => [
                `**/${other}/*`,
                `**/${other}/*/**`,
              ]),
              message:
                'Module boundary violation: import another module only through its index.ts.',
            },
          ],
        },
      ],
    },
  };
});

module.exports = defineConfig([
  expoConfig,
  prettierConfig,
  ...moduleBoundaries,
  {
    ignores: ['dist/*', '.expo/*', 'node_modules/*', 'coverage/*'],
  },
]);
