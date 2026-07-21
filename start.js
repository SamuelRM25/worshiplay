const { convertBiToJson } = require('./src/modules/bible-parser');
const fs = require('fs');
const path = require('path');

const bibleJsonPath = path.join(__dirname, 'biblias', 'rv1960.json');
const bibleBiPath = path.join(__dirname, 'biblias', 'Reina Valera 1960 - RV1960.bi');

if (!fs.existsSync(bibleJsonPath) && fs.existsSync(bibleBiPath)) {
  console.log('Convirtiendo Biblia por primera vez...');
  try {
    const bible = convertBiToJson(bibleBiPath);
    fs.writeFileSync(bibleJsonPath, JSON.stringify(bible, null, 2), 'utf-8');
    console.log('Biblia convertida exitosamente');
  } catch (err) {
    console.error('Error al convertir Biblia:', err.message);
  }
}

console.log('Iniciando WorshiPlay...');
require('./main.js');
