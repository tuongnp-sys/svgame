import { createWriteStream } from 'fs';
import { mkdir, readdir, stat } from 'fs/promises';
import path from 'path';
import archiver from 'archiver';

const target = process.argv[2] || 'gamepix';
const distDir = path.resolve('dist');
const outDir = path.resolve('packages');
const outPath = path.resolve(`${outDir}/suvietgame-${target}.zip`);

await mkdir(outDir, { recursive: true });

async function addDir(archive, dir, base = '') {
  const entries = await readdir(dir);
  for (const name of entries) {
    const full = path.join(dir, name);
    const rel = path.join(base, name);
    const s = await stat(full);
    if (s.isDirectory()) {
      await addDir(archive, full, rel);
    } else {
      archive.file(full, { name: rel.replace(/\\/g, '/') });
    }
  }
}

const archive = archiver('zip', { zlib: { level: 9 } });
const out = createWriteStream(outPath);
archive.pipe(out);
await addDir(archive, distDir);
await archive.finalize();

await new Promise((resolve, reject) => {
  out.on('close', resolve);
  out.on('error', reject);
});

console.log(`[package] ${outPath} (${archive.pointer()} bytes)`);
