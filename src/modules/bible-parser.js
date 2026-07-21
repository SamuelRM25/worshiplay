const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const BOOK_NAMES = [
  'Génesis','Éxodo','Levítico','Números','Deuteronomio','Josué','Jueces','Rut',
  '1 Samuel','2 Samuel','1 Reyes','2 Reyes','1 Crónicas','2 Crónicas','Esdras','Nehemías',
  'Ester','Job','Salmos','Proverbios','Eclesiastés','Cantares','Isaías','Jeremías',
  'Lamentaciones','Ezequiel','Daniel','Oseas','Joel','Amós','Abdías','Jonás','Miqueas',
  'Nahúm','Habacuc','Sofonías','Hageo','Zacarías','Malaquías',
  'Mateo','Marcos','Lucas','Juan','Hechos','Romanos','1 Corintios','2 Corintios',
  'Gálatas','Efesios','Filipenses','Colosenses','1 Tesalonicenses','2 Tesalonicenses',
  '1 Timoteo','2 Timoteo','Tito','Filemón','Hebreos','Santiago','1 Pedro','2 Pedro',
  '1 Juan','2 Juan','3 Juan','Judas','Apocalipsis'
];

function extractZipText(buffer) {
  function findEOCD(buf) {
    for (let i = buf.length - 22; i >= 0; i--) {
      if (buf.readUInt32LE(i) === 0x06054b50) return i;
    }
    return -1;
  }

  const eocdOffset = findEOCD(buffer);
  if (eocdOffset === -1) return null;

  const cdOffset = buffer.readUInt32LE(eocdOffset + 16);
  const cdEntries = buffer.readUInt16LE(eocdOffset + 10);

  let offset = cdOffset;
  for (let i = 0; i < cdEntries; i++) {
    if (buffer.readUInt32LE(offset) !== 0x02014b50) break;
    const compression = buffer.readUInt16LE(offset + 10);
    const nameLen = buffer.readUInt16LE(offset + 28);
    const extraLen = buffer.readUInt16LE(offset + 30);
    const commentLen = buffer.readUInt16LE(offset + 32);
    const localOffset = buffer.readUInt32LE(offset + 42);
    const compSize = buffer.readUInt32LE(offset + 20);

    const localNameLen = buffer.readUInt16LE(localOffset + 26);
    const localExtraLen = buffer.readUInt16LE(localOffset + 28);
    const dataStart = localOffset + 30 + localNameLen + localExtraLen;
    const slice = buffer.slice(dataStart, dataStart + compSize);

    if (compression === 0) {
      const text = slice.toString('utf-8');
      if (text.includes('|')) return text;
    } else if (compression === 8) {
      try {
        const text = zlib.inflateRawSync(slice).toString('utf-8');
        if (text.includes('|')) return text;
      } catch (e) {
        try {
          const text = zlib.inflateSync(slice).toString('utf-8');
          if (text.includes('|')) return text;
        } catch (e2) {}
      }
    }
    offset += 46 + nameLen + extraLen + commentLen;
  }
  return null;
}

function parseBibleText(text) {
  const books = new Map();
  const lines = text.split('\n').filter(l => l.trim());

  for (const line of lines) {
    const parts = line.split('|');
    if (parts.length < 4) continue;
    const bookId = parseInt(parts[0]);
    const chapter = parseInt(parts[1]);
    const verse = parseInt(parts[2]);
    const verseText = parts.slice(3).join('|').trim();

    if (!books.has(bookId)) {
      books.set(bookId, new Map());
    }
    const chapters = books.get(bookId);
    if (!chapters.has(chapter)) {
      chapters.set(chapter, []);
    }
    chapters.get(chapter).push({ verse, text: verseText });
  }

  const result = [];
  for (const [bookId, chapters] of books) {
    const chArr = [];
    for (const [chNum, verses] of chapters) {
      verses.sort((a, b) => a.verse - b.verse);
      chArr.push({ chapter: chNum, verses });
    }
    chArr.sort((a, b) => a.chapter - b.chapter);
    result.push({
      id: bookId,
      name: BOOK_NAMES[bookId - 1] || `Libro ${bookId}`,
      chapters: chArr
    });
  }
  result.sort((a, b) => a.id - b.id);
  return result;
}

function convertBiToJson(biPath) {
  const buffer = fs.readFileSync(biPath);
  const text = extractZipText(buffer);
  if (!text) throw new Error('No se pudo extraer el texto del archivo .bi');
  const books = parseBibleText(text);
  return { version: 'Reina Valera 1960', language: 'es', books };
}

module.exports = { convertBiToJson };
