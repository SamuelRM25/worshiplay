const { convertBiToJson } = require('./src/modules/bible-parser');
const fs = require('fs');
const path = require('path');

const biPath = path.join(__dirname, 'biblias', 'Reina Valera 1960 - RV1960.bi');
const outputPath = path.join(__dirname, 'biblias', 'rv1960.json');

console.log('WorshiPlay - Conversor de Biblia');
console.log('================================\n');

if (!fs.existsSync(biPath)) {
  console.error('ERROR: No se encuentra el archivo:', biPath);
  process.exit(1);
}

try {
  console.log('Leyendo archivo .bi...');
  console.log('Extrayendo y parseando versículos...');
  const bible = convertBiToJson(biPath);

  console.log('Escribiendo JSON...');
  fs.writeFileSync(outputPath, JSON.stringify(bible, null, 2), 'utf-8');

  let totalVerses = 0;
  bible.books.forEach(b => b.chapters.forEach(c => totalVerses += c.verses.length));

  console.log('\n¡Conversión completada!');
  console.log(`  Libros: ${bible.books.length}`);
  console.log(`  Capítulos: ${bible.books.reduce((a, b) => a + b.chapters.length, 0)}`);
  console.log(`  Versículos: ${totalVerses}`);
  console.log(`  Versión: ${bible.version}`);
  console.log(`\nArchivo generado: ${outputPath}`);
} catch (err) {
  console.error('ERROR:', err.message);
  process.exit(1);
}
