const fs = require('fs');
const path = require('path');

function getSongsPath(appDir) {
  return path.join(appDir, 'songs.json');
}

function loadSongs(appDir) {
  const filePath = getSongsPath(appDir);
  if (!fs.existsSync(filePath)) {
    migrateOldSongbooks(appDir);
  }
  try {
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function saveSongs(appDir, songs) {
  const filePath = getSongsPath(appDir);
  fs.writeFileSync(filePath, JSON.stringify(songs, null, 2), 'utf-8');
}

function migrateOldSongbooks(appDir) {
  const songbooksDir = path.join(appDir, 'cancioneros');
  if (!fs.existsSync(songbooksDir)) {
    saveSongs(appDir, []);
    return;
  }
  const files = fs.readdirSync(songbooksDir).filter(f => f.endsWith('.js'));
  const allSongs = [];
  let nextId = 1;
  for (const file of files) {
    try {
      const content = fs.readFileSync(path.join(songbooksDir, file), 'utf-8');
      const match = content.match(/var\s+jscanciones\s*=\s*(\[[\s\S]*?\]);?\s*$/);
      if (match) {
        const songs = JSON.parse(match[1]);
        for (const s of songs) {
          allSongs.push({
            ti: s.ti || 'Sin título',
            le: s.le || '',
            tono: s.tono || '',
            id: nextId++
          });
        }
      }
    } catch {}
  }
  saveSongs(appDir, allSongs);
}

function addSong(appDir, songData) {
  const songs = loadSongs(appDir);
  const maxId = songs.reduce((max, s) => Math.max(max, s.id || 0), 0);
  const newSong = {
    ti: songData.title || 'Sin título',
    le: songData.lyrics || '',
    tono: songData.tone || '',
    id: maxId + 1
  };
  songs.push(newSong);
  saveSongs(appDir, songs);
  return newSong;
}

function updateSong(appDir, songData) {
  const songs = loadSongs(appDir);
  const idx = songs.findIndex(s => s.id === songData.id);
  if (idx === -1) return false;
  songs[idx] = {
    ti: songData.title || songs[idx].ti,
    le: songData.lyrics || songs[idx].le,
    tono: songData.tone || songs[idx].tono,
    id: songData.id
  };
  saveSongs(appDir, songs);
  return true;
}

function deleteSong(appDir, id) {
  const songs = loadSongs(appDir);
  const filtered = songs.filter(s => s.id !== id);
  if (filtered.length === songs.length) return false;
  saveSongs(appDir, filtered);
  return true;
}

module.exports = { loadSongs, saveSongs, addSong, updateSong, deleteSong };
