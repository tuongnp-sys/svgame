/** Thay fontFamily system-ui bằng FONT_VI trong toàn bộ src JS */
import fs from 'fs';
import path from 'path';
import { globSync } from 'glob';

const SRC = path.resolve('src');
const FONTS_FILE = path.join(SRC, 'core', 'fonts.js');

const PATTERNS = [
  /fontFamily: 'system-ui, sans-serif'/g,
  /fontFamily: 'system-ui, Georgia, serif'/g,
];

for (const rel of globSync('**/*.js', { cwd: SRC })) {
  if (rel.replace(/\\/g, '/') === 'core/fonts.js') continue;

  const filePath = path.join(SRC, rel);
  let content = fs.readFileSync(filePath, 'utf8');
  const before = content;

  for (const re of PATTERNS) {
    content = content.replace(re, 'fontFamily: FONT_VI');
  }

  if (content === before) continue;

  if (!content.includes('FONT_VI } from')) {
    let importPath = path.relative(path.dirname(filePath), FONTS_FILE).replace(/\\/g, '/');
    if (!importPath.startsWith('.')) importPath = `./${importPath}`;
    importPath = importPath.replace(/\.js$/, '');
    const importLine = `import { FONT_VI } from '${importPath}.js';`;

    const lines = content.split('\n');
    let lastImport = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('import ')) lastImport = i;
      else if (lastImport >= 0 && lines[i].trim() !== '') break;
    }
    if (lastImport >= 0) lines.splice(lastImport + 1, 0, importLine);
    else lines.unshift(importLine);
    content = lines.join('\n');
  }

  fs.writeFileSync(filePath, content);
  console.log('updated', rel);
}
