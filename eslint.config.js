const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettierConfig = require('eslint-config-prettier/flat');

const { MODULES } = require('./tooling/modules');

const sourceFiles = '**/*.{ts,tsx,js,jsx}';

const boundaryPattern = (name) => ({
  group: MODULES.filter((other) => other !== name).flatMap((other) => [
    `**/${other}/*`,
    `**/${other}/*/**`,
  ]),
  message:
    'Module boundary violation: import another module only through its index.ts.',
});

const domainPurityPattern = {
  group: [
    'react',
    'react/*',
    'react-native',
    'react-native/*',
    'expo',
    'expo/*',
    'expo-*',
    '@supabase/*',
  ],
  message:
    'Domain layer must stay plain TypeScript: no React, React Native, Expo or Supabase imports.',
};

// For each module, restrict deep imports (alias or relative) into every other module.
// `@/modules/<other>` (the index.ts) stays allowed.
const moduleBoundaries = MODULES.map((name) => ({
  files: [`src/modules/${name}/${sourceFiles}`],
  rules: {
    'no-restricted-imports': ['error', { patterns: [boundaryPattern(name)] }],
  },
}));

// no-restricted-imports options are replaced, not merged, so each domain override
// repeats the boundary pattern next to the purity pattern.
const domainPurity = MODULES.map((name) => ({
  files: [`src/modules/${name}/domain/${sourceFiles}`],
  rules: {
    'no-restricted-imports': [
      'error',
      { patterns: [boundaryPattern(name), domainPurityPattern] },
    ],
  },
}));

// Hex color string literals (#RGB, #RGBA, #RRGGBB, #RRGGBBAA) belong in src/core/theme only.
const hexColorBan = [
  {
    files: [`src/${sourceFiles}`],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector:
            'Literal[value=/^#([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/]',
          message:
            'Hex color literal outside src/core/theme: use a semantic color role from useTheme().',
        },
      ],
    },
  },
  {
    files: [`src/core/theme/${sourceFiles}`],
    rules: { 'no-restricted-syntax': 'off' },
  },
];

module.exports = defineConfig([
  expoConfig,
  prettierConfig,
  ...moduleBoundaries,
  ...domainPurity,
  ...hexColorBan,
  {
    ignores: ['dist/*', '.expo/*', 'node_modules/*', 'coverage/*'],
  },
]);
