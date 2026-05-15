/**
 * Descarga 12 imágenes temáticas a scripts/seed-assets/ (ejecutar una vez o antes del seed).
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = resolve(dirname(fileURLToPath(import.meta.url)), 'seed-assets');

/** id Unsplash verificado (sin hash extra) → nombre de archivo */
const FILES = {
  'borda-de-l-avi.jpg': 'photo-1517248135467-4c7edcad34c4',
  'restaurant-platin.jpg': 'photo-1414235077428-338989a2e8c0',
  'hotel-plaza.jpg': 'photo-1566073771259-6a8506099945',
  'hotel-hermitage.jpg': 'photo-1571896349842-33c89424de2d',
  'palau-de-gel.jpg': 'photo-1578662996442-48f60103fc96',
  'micropolis.jpg': 'photo-1558618666-fcd25c85cd64',
  'naturlandia.jpg': 'photo-1501854140801-50d01698950b',
  'grandvalira.jpg': 'photo-1520250497591-112f2f40a3f4',
  'pyrenees.jpg': 'photo-1445205170230-053b83016050',
  'illa-carlemany.jpg': 'photo-1560472354-b33ff0c44a43',
  'caldea.jpg': 'photo-1540555700478-4be289fbecef',
};

const PICSUM = {
  'inuu.jpg': 'inuu-spa-massage',
};

await mkdir(OUT, { recursive: true });

for (const [file, id] of Object.entries(FILES)) {
  const url = `https://images.unsplash.com/${id}?auto=format&fit=crop&w=960&h=720&q=85`;
  const res = await fetch(url, { headers: { 'User-Agent': 'andorra-viva-seed/1.0' } });
  if (!res.ok) {
    console.error(`FAIL ${file}: HTTP ${res.status}`);
    process.exitCode = 1;
    continue;
  }
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(resolve(OUT, file), buf);
  console.log(`OK ${file} (${buf.length} bytes)`);
}

for (const [file, seed] of Object.entries(PICSUM)) {
  const url = `https://picsum.photos/seed/${encodeURIComponent(seed)}/960/720`;
  const res = await fetch(url, { headers: { 'User-Agent': 'andorra-viva-seed/1.0' }, redirect: 'follow' });
  if (!res.ok) {
    console.error(`FAIL ${file}: HTTP ${res.status}`);
    process.exitCode = 1;
    continue;
  }
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(resolve(OUT, file), buf);
  console.log(`OK ${file} (${buf.length} bytes, picsum)`);
}
