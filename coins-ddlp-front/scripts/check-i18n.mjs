// Comprueba que todos los diccionarios de public/i18n tienen exactamente las mismas claves que es.json.
// Se ejecuta antes de cada build (`prebuild`): si falta o sobra una clave, la build falla.
import { readdirSync, readFileSync } from 'node:fs';

const dir = new URL('../public/i18n/', import.meta.url);
const keys = (obj, prefix = '') =>
  Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === 'object' ? keys(v, `${prefix}${k}.`) : [`${prefix}${k}`],
  );
const load = (file) => new Set(keys(JSON.parse(readFileSync(new URL(file, dir), 'utf8'))));

const reference = load('es.json');
let failed = false;
for (const file of readdirSync(dir).filter((f) => f.endsWith('.json') && f !== 'es.json')) {
  const current = load(file);
  const missing = [...reference].filter((k) => !current.has(k));
  const extra = [...current].filter((k) => !reference.has(k));
  if (missing.length || extra.length) {
    failed = true;
    if (missing.length)
      console.error(`✖ ${file}: faltan ${missing.length} claves:\n  ${missing.join('\n  ')}`);
    if (extra.length)
      console.error(`✖ ${file}: sobran ${extra.length} claves:\n  ${extra.join('\n  ')}`);
  } else {
    console.log(`✔ ${file}: ${current.size} claves, igual que es.json`);
  }
}
process.exit(failed ? 1 : 0);
