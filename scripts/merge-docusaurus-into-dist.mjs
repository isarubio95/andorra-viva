/**
 * Copia la salida de `documentation/build` a `dist/docs` para servir Docusaurus
 * bajo la misma URL que la app Vite (p. ej. Vercel → /docs/*).
 */
import { cpSync, existsSync, rmSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const dist = resolve(root, 'dist');
const docBuild = resolve(root, 'documentation', 'build');
const target = resolve(dist, 'docs');

if (!existsSync(dist)) {
  console.error('[merge-docusaurus] Falta dist/. Ejecuta vite build antes.');
  process.exit(1);
}
if (!existsSync(docBuild)) {
  console.error('[merge-docusaurus] Falta documentation/build/. Ejecuta el build de Docusaurus antes.');
  process.exit(1);
}

if (existsSync(target)) {
  rmSync(target, { recursive: true });
}
mkdirSync(target, { recursive: true });
cpSync(docBuild, target, { recursive: true });
console.log('[merge-docusaurus] Copiado documentation/build → dist/docs');
