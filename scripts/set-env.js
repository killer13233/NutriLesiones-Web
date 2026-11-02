// Genera src/environments/environment.prod.ts a partir de la variable de entorno API_URL.
// Se ejecuta antes de "ng build" (ver package.json). No hay URLs fijas en el código.
const fs = require('node:fs');
const path = require('node:path');

const apiUrl = (process.env.API_URL || '').trim().replace(/\/+$/, '');
const enProduccion = process.env.VERCEL === '1' || process.env.CI === 'true' || process.env.NODE_ENV === 'production' || process.env.REQUIRE_API_URL === '1';

if (!apiUrl) {
  if (enProduccion) {
    console.error('\n[set-env] ERROR: falta la variable de entorno API_URL.');
    console.error('          Defínela con la dirección HTTPS de tu backend, por ejemplo:');
    console.error('          API_URL=https://nutrilesiones-api.onrender.com\n');
    process.exit(1);
  }
  console.warn('[set-env] API_URL no está definida; se usará http://localhost:5099 (solo para pruebas locales).');
}

const url = apiUrl || 'http://localhost:5099';

if (enProduccion && !/^https:\/\//i.test(url)) {
  console.error(`\n[set-env] ERROR: API_URL debe empezar con https:// en producción (valor recibido: ${url}).\n`);
  process.exit(1);
}

const contenido = `// Archivo generado por scripts/set-env.js. No lo edites a mano.
export const environment = {
  production: true,
  apiUrl: '${url.replace(/'/g, '')}',
};
`;

const destino = path.join(__dirname, '..', 'src', 'environments', 'environment.prod.ts');
fs.mkdirSync(path.dirname(destino), { recursive: true });
fs.writeFileSync(destino, contenido, 'utf8');
console.log(`[set-env] environment.prod.ts generado con apiUrl = ${url}`);
