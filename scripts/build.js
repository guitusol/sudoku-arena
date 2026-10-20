const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const outDir = path.resolve(rootDir, 'www');

// Crear/limpiar carpeta www
if (fs.existsSync(outDir)) {
  fs.rmSync(outDir, { recursive: true, force: true });
}
fs.mkdirSync(outDir, { recursive: true });

// Ficheros y carpetas necesarios para la app web en Capacitor
const assetsToCopy = [
  'index.html',
  'manual.html',
  'privacidad.html',
  'manifest.json',
  'css',
  'icons',
  'js'
];

for (const asset of assetsToCopy) {
  const src = path.join(rootDir, asset);
  const dest = path.join(outDir, asset);
  if (fs.existsSync(src)) {
    fs.cpSync(src, dest, { recursive: true });
    console.log(`✓ Copiado a www: ${asset}`);
  }
}

console.log('⚡ Build completado con éxito en la carpeta /www');
