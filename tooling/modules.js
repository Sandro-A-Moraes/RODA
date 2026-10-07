const fs = require('node:fs');
const path = require('node:path');

// Single list of feature modules. Adding a directory under src/modules/
// without listing it here fails the guard test in tooling/__tests__.
const MODULES = ['auth', 'circles', 'pacts', 'stories', 'meetups'];

function findUnlistedModules(root) {
  const dir = path.join(root, 'src', 'modules');
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !MODULES.includes(entry.name))
    .map((entry) => entry.name);
}

module.exports = { MODULES, findUnlistedModules };
