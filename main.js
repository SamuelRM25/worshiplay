const { app, BrowserWindow, ipcMain, screen, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');
const { convertBiToJson } = require('./src/modules/bible-parser');
const { loadSongs, addSong, updateSong, deleteSong } = require('./src/modules/song-parser');
const { scanBackgrounds } = require('./src/modules/background-manager');

let controlWindow = null;
let projectionWindow = null;
let projectionData = { type: 'blank', content: null, background: null };
let projectionVisible = true;
let isFirstProjection = true;

function createControlWindow() {
  controlWindow = new BrowserWindow({
    width: 1280, height: 800, minWidth: 960, minHeight: 600,
    title: 'WorshiPlay - Control',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, nodeIntegration: false
    },
    backgroundColor: '#0a0a12'
  });
  controlWindow.loadFile(path.join(__dirname, 'src', 'index.html'));
  controlWindow.on('closed', () => { controlWindow = null; });
}

function createProjectionWindow() {
  const displays = screen.getAllDisplays();
  const target = displays.length > 1 ? displays[1] : displays[0];
  const { x, y, width, height } = target.bounds;

  projectionWindow = new BrowserWindow({
    x, y, width, height,
    fullscreen: true, frame: false, alwaysOnTop: true, show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, nodeIntegration: false
    },
    backgroundColor: '#000000'
  });
  projectionWindow.loadFile(path.join(__dirname, 'src', 'projection.html'));
  projectionWindow.once('ready-to-show', () => {
    projectionVisible = true;
    if (projectionWindow && !projectionWindow.isDestroyed()) {
      projectionWindow.webContents.session.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');
      projectionWindow.show();
      projectionWindow.webContents.send('project', projectionData);
    }
  });

  const filter = { urls: ['https://www.youtube.com/*', 'https://www.youtube-nocookie.com/*'] };
  projectionWindow.webContents.session.webRequest.onBeforeSendHeaders(filter, (details, callback) => {
    details.requestHeaders['Origin'] = 'https://www.youtube-nocookie.com';
    details.requestHeaders['Referer'] = 'https://www.youtube-nocookie.com/';
    callback({ requestHeaders: details.requestHeaders });
  });
  projectionWindow.on('closed', () => { projectionWindow = null; });
}

function moveProjectionToDisplay(displayIndex) {
  if (!projectionWindow) return;
  const displays = screen.getAllDisplays();
  if (displayIndex < 0 || displayIndex >= displays.length) return;
  const target = displays[displayIndex];
  const { x, y, width, height } = target.bounds;
  projectionWindow.setBounds({ x, y, width, height });
  projectionWindow.setFullScreen(true);
}

app.whenReady().then(() => {
  createControlWindow();
  createProjectionWindow();
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => {
  if (!controlWindow) createControlWindow();
  if (!projectionWindow) createProjectionWindow();
});

ipcMain.handle('get-songs', async () => {
  try {
    return loadSongs(__dirname);
  } catch { return []; }
});

ipcMain.handle('get-bible', async () => {
  const biblesDir = path.join(__dirname, 'biblias');
  const currentFile = path.join(biblesDir, 'current.txt');
  let bibleFile = 'rv1960.json';
  try {
    if (fs.existsSync(currentFile)) {
      bibleFile = fs.readFileSync(currentFile, 'utf-8').trim();
    }
  } catch {}
  const biblePath = path.join(biblesDir, bibleFile);
  try {
    if (fs.existsSync(biblePath)) {
      return JSON.parse(fs.readFileSync(biblePath, 'utf-8'));
    }
    const fallback = path.join(biblesDir, 'rv1960.json');
    if (fs.existsSync(fallback)) {
      return JSON.parse(fs.readFileSync(fallback, 'utf-8'));
    }
    return null;
  } catch { return null; }
});

ipcMain.handle('convert-bible', async () => {
  const biPath = path.join(__dirname, 'biblias', 'Reina Valera 1960 - RV1960.bi');
  const outputPath = path.join(__dirname, 'biblias', 'rv1960.json');
  try {
    const bible = convertBiToJson(biPath);
    fs.writeFileSync(outputPath, JSON.stringify(bible, null, 2), 'utf-8');
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('get-backgrounds', async () => {
  try {
    return scanBackgrounds(path.join(__dirname, 'fondos'));
  } catch { return []; }
});

ipcMain.handle('open-file-dialog', async () => {
  const result = await dialog.showOpenDialog(controlWindow, {
    properties: ['openFile'],
    filters: [{ name: 'Videos', extensions: ['mp4', 'webm', 'mov', 'avi', 'mkv'] }]
  });
  return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle('open-bi-file-dialog', async () => {
  const result = await dialog.showOpenDialog(controlWindow, {
    properties: ['openFile'],
    filters: [{ name: 'Biblia .bi', extensions: ['bi'] }]
  });
  return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle('project', async (event, data) => {
  projectionData = data;
  if (!projectionWindow || projectionWindow.isDestroyed()) {
    createProjectionWindow();
  }
  projectionWindow.webContents.send('project', data);
  return true;
});

ipcMain.handle('get-projection-data', async () => projectionData);

ipcMain.handle('is-first-projection', async () => {
  const val = isFirstProjection;
  isFirstProjection = false;
  return val;
});

ipcMain.handle('get-local-video', async (event, relativePath) => {
  const fullPath = path.join(__dirname, relativePath);
  return fs.existsSync(fullPath) ? fullPath : relativePath;
});

ipcMain.handle('get-displays', async () => {
  const displays = screen.getAllDisplays();
  return displays.map((d, i) => ({
    index: i,
    name: `Pantalla ${i + 1}`,
    bounds: d.bounds,
    isPrimary: i === 0,
    size: `${d.bounds.width}x${d.bounds.height}`
  }));
});

ipcMain.handle('set-projection-display', async (event, displayIndex) => {
  moveProjectionToDisplay(displayIndex);
  return true;
});

ipcMain.handle('toggle-projection', async () => {
  if (!projectionWindow) return false;
  projectionVisible = !projectionVisible;
  if (projectionVisible) {
    projectionWindow.show();
  } else {
    projectionWindow.hide();
  }
  return projectionVisible;
});

ipcMain.handle('get-projection-visible', async () => projectionVisible);

ipcMain.handle('ping', async () => {
  if (!projectionWindow || projectionWindow.isDestroyed()) {
    return { alive: false };
  }
  return { alive: true };
});

ipcMain.handle('save-settings', async (event, settings) => {
  try {
    const settingsPath = path.join(__dirname, 'settings.json');
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf-8');
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('load-settings', async () => {
  try {
    const settingsPath = path.join(__dirname, 'settings.json');
    if (fs.existsSync(settingsPath)) {
      return JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
    }
  } catch {}
  return null;
});

ipcMain.handle('reload-projection', async () => {
  if (projectionWindow && !projectionWindow.isDestroyed()) {
    projectionWindow.focus();
    return true;
  }
  createProjectionWindow();
  return true;
});

async function fetchUrl(url, redirects = 5) {
  const client = url.startsWith('https') ? https : http;
  return new Promise((resolve, reject) => {
    const req = client.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8'
      }
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location && redirects > 0) {
        const redirectUrl = new URL(res.headers.location, url).href;
        resolve(fetchUrl(redirectUrl, redirects - 1));
        return;
      }
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => resolve(body));
    });
    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

function parseDuration(text) {
  if (!text) return 0;
  const parts = text.split(':').map(Number);
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return 0;
}

ipcMain.handle('search-letras', async (event, query) => {
  try {
    const json = await fetchUrl('https://genius.com/api/search/song?q=' + encodeURIComponent(query));
    const data = JSON.parse(json);
    const hits = data.response?.sections?.[0]?.hits || [];
    const results = hits.map(h => ({
      title: h.result.title,
      url: 'https://genius.com' + h.result.path,
      artist: h.result.primary_artist?.name || ''
    }));
    return { success: true, results: results.slice(0, 12) };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('search-youtube', async (event, query) => {
  try {
    const html = await fetchUrl('https://www.youtube.com/results?search_query=' + encodeURIComponent(query));
    const match = html.match(/ytInitialData\s*=\s*({.+?});\s*<\/script>/);
    if (!match) return { success: false, error: 'No se pudieron obtener resultados de YouTube' };

    const data = JSON.parse(match[1]);
    const contents = data?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents || [];
    const results = [];
    for (const section of contents) {
      const items = section?.itemSectionRenderer?.contents || [];
      for (const item of items) {
        const v = item?.videoRenderer;
        if (v) {
          results.push({
            title: v.title?.runs?.[0]?.text || '',
            videoId: v.videoId || '',
            author: v.ownerText?.runs?.[0]?.text || '',
            lengthSeconds: parseDuration(v.lengthText?.simpleText || ''),
          });
        }
      }
    }
    return { success: true, results: results.slice(0, 15) };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('save-new-song', async (event, songData) => {
  try {
    const { title, artist, tone, lyrics } = songData;
    if (!title) return { success: false, error: 'Título requerido' };
    addSong(__dirname, { title, artist, tone, lyrics });
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('update-song', async (event, songData) => {
  try {
    updateSong(__dirname, songData);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('delete-song', async (event, id) => {
  try {
    deleteSong(__dirname, id);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('search-word-meaning', async (event, word) => {
  var results = [];
  var isHebrew = /[\u0590-\u05FF]/.test(word);
  var isGreek = /[\u0370-\u03FF\u1F00-\u1FFF]/.test(word);
  var hasStrong = /^H\d+|^G\d+/.test(word.toUpperCase());
  var q = word.trim();

  // Strong's Concordance lookup via BibleHub
  try {
    var lang = isGreek ? 'greek' : 'hebrew';
    if (hasStrong) {
      var prefix = q.toUpperCase().startsWith('H') ? 'hebrew' : 'greek';
      var strongNum = q.replace(/^[HG]/i, '');
      var html = await fetchUrl('https://biblehub.com/' + prefix + '/' + strongNum + '.htm');
      var m = html.match(/<div class="lex">([\s\S]*?)<\/div>/);
      if (m) {
        var text = m[1].replace(/<[^>]+>/g, '').trim().slice(0, 500);
        if (text.length > 20) results.push('Strong\'s ' + q.toUpperCase() + ': ' + text);
      }
      // Also get transliteration and definition
      var m2 = html.match(/<span class="def">([\s\S]*?)<\/span>/);
      if (m2) results.push(m2[1].replace(/<[^>]+>/g, '').trim().slice(0, 300));
    } else if (isHebrew || isGreek) {
      var html = await fetchUrl('https://biblehub.com/' + lang + '/' + encodeURIComponent(q) + '.htm');
      var m = html.match(/<div class="lex">([\s\S]*?)<\/div>/);
      if (m) {
        var text = m[1].replace(/<[^>]+>/g, '').trim().slice(0, 500);
        if (text.length > 20) results.push(text);
      }
    }
  } catch(e) {}

  // Blue Letter Bible as fallback for original languages
  if (!results.length && (isHebrew || isGreek || hasStrong)) {
    try {
      var url = 'https://www.blueletterbible.org/lexicon/' + encodeURIComponent(q.replace(/^[HG]/i, '')) + '/';
      var html = await fetchUrl(url);
      var m = html.match(/<div class="lex-result-text">([\s\S]*?)<\/div>/);
      if (m) {
        var text = m[1].replace(/<[^>]+>/g, '').trim().slice(0, 500);
        if (text.length > 20) results.push(text);
      }
    } catch(e) {}
  }

  // Latin / general word lookup via Wiktionary
  if (!results.length) {
    try {
      var html = await fetchUrl('https://en.wiktionary.org/wiki/' + encodeURIComponent(q));
      var m = html.match(/<span class="mw-headline"[^>]*>([\s\S]*?)<\/span>[\s\S]*?<ol>([\s\S]*?)<\/ol>/);
      if (m) {
        var def = m[2].replace(/<[^>]+>/g, '').trim().slice(0, 400);
        if (def.length > 20) results.push(m[1].trim() + ': ' + def);
      }
    } catch(e) {}
  }

  // Try dictionary API
  if (!results.length) {
    try {
      var json = await fetchUrl('https://api.dictionaryapi.dev/api/v2/entries/en/' + encodeURIComponent(q));
      var data = JSON.parse(json);
      if (data && data[0] && data[0].meanings) {
        for (var m of data[0].meanings) {
          var pos = m.partOfSpeech || '';
          for (var def of m.definitions) {
            var text = pos + ': ' + (def.definition || '');
            if (def.example) text += ' (Ej: ' + def.example + ')';
            if (results.length < 5) results.push(text);
          }
        }
      }
    } catch(e) {}
  }

  // Try DuckDuckGo as last fallback
  if (!results.length) {
    try {
      var ddgJson = await fetchUrl('https://api.duckduckgo.com/?q=' + encodeURIComponent(q + ' definition') + '&format=json&skip_disambig=1');
      var ddg = JSON.parse(ddgJson);
      if (ddg.AbstractText) results.push(ddg.AbstractText);
      if (ddg.Definition && ddg.Definition !== '') results.push(ddg.Definition);
      if (ddg.Answer && ddg.Answer !== '') results.push(ddg.Answer);
    } catch(e) {}
  }

  if (results.length) {
    return { success: true, results: results.filter(function(r) { return r && r.length > 5; }).slice(0, 6) };
  }
  return { success: false, error: 'No se encontró significado para "' + word + '". Prueba con otro término o lengua.' };
});

ipcMain.handle('search-exegesis', async (event, query) => {
  var results = [];
  // Try DuckDuckGo for exegesis/theology
  try {
    var ddgJson = await fetchUrl('https://api.duckduckgo.com/?q=' + encodeURIComponent(query + ' exegesis bible') + '&format=json&skip_disambig=1');
    var ddg = JSON.parse(ddgJson);
    if (ddg.AbstractText) results.push(ddg.AbstractText);
    if (ddg.Definition && ddg.Definition !== '') results.push(ddg.Definition);
    if (ddg.Answer && ddg.Answer !== '') results.push(ddg.Answer);

    // Also get related topics
    if (ddg.RelatedTopics && ddg.RelatedTopics.length) {
      for (var i = 0; i < Math.min(3, ddg.RelatedTopics.length); i++) {
        var topic = ddg.RelatedTopics[i];
        if (topic.Text) results.push(topic.Text);
      }
    }
  } catch(e) {}

  // Try fetching from a Bible commentary API or site as extra fallback
  if (!results.length) {
    try {
      var html = await fetchUrl('https://biblehub.com/commentary/' + encodeURIComponent(query.replace(/\s+/g, '-')) + '/');
      var m = html.match(/<div class="commentary-text">([\s\S]*?)<\/div>/);
      if (m) {
        var text = m[1].replace(/<[^>]+>/g, '').trim();
        if (text.length > 50) results.push(text.slice(0, 500));
      }
    } catch(e) {}
  }

  if (results.length) {
    return { success: true, results: results.filter(Boolean) };
  }
  return { success: false, error: 'No se encontró exégesis para "' + query + '". Prueba con otro término.' };
});

ipcMain.handle('fetch-letras', async (event, data) => {
  try {
    const artist = data.artist || '';
    const title = data.title || '';
    const url = data.url || '';
    if (!artist || !title) return { success: false, error: 'Falta artista o título' };

    // Try lyrics.ovh first
    try {
      const json = await fetchUrl('https://api.lyrics.ovh/v1/' + encodeURIComponent(artist) + '/' + encodeURIComponent(title));
      const result = JSON.parse(json);
      if (result.lyrics && result.lyrics.length > 100) {
        return { success: true, title, artist, lyrics: result.lyrics };
      }
    } catch(e) {}

    // Fallback: try alternative API (lyrist)
    try {
      const json2 = await fetchUrl('https://lyrist.vercel.app/api/' + encodeURIComponent(title) + '/' + encodeURIComponent(artist));
      const result2 = JSON.parse(json2);
      if (result2 && result2.lyrics && result2.lyrics.length > 100) {
        return { success: true, title, artist, lyrics: result2.lyrics };
      }
    } catch(e) {}

    // Fallback: scrape Genius with strict validation
    if (url) {
      try {
        const html = await fetchUrl(url);
        var lyrics = null;

        // Pattern: __INITIAL_STATE__ JSON (contains lyrics in songPage)
        var m3 = html.match(/__INITIAL_STATE__\s*=\s*({.+?});\s*</);
        if (m3) {
          try {
            var state = JSON.parse(m3[1]);
            var lyricData = state?.songPage?.song?.lyrics?.items;
            if (lyricData && Array.isArray(lyricData)) {
              lyrics = lyricData.map(function(item) { return item.value; }).join('\n');
            }
          } catch(e) {}
        }

        // Pattern: lyrics in JSON-LD
        if (!lyrics) {
          var m2 = html.match(/"text":"([\s\S]+?)","description"/);
          if (m2) {
            var t2 = m2[1].replace(/\\n/g, '\n').replace(/\\u[0-9a-fA-F]{4}/g, function(c) {
              return String.fromCharCode(parseInt(c.slice(2), 16));
            });
            if (t2.length > 150 && t2.includes('\n')) lyrics = t2;
          }
        }

        // Pattern: plain lyrics in script data (strict)
        if (!lyrics) {
          var m1 = html.match(/"plain":"((?:[^"\\]|\\.)+)","comments"/);
          if (m1) {
            var t1 = m1[1].replace(/\\n/g, '\n');
            if (t1.length > 150 && t1.includes('\n') && !t1.includes('Contributor')) lyrics = t1;
          }
        }

        if (lyrics) {
          lyrics = lyrics.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#039;/g, "'");
          return { success: true, title, artist, lyrics };
        }
      } catch(e) {}
    }

    // Last fallback: try lyrics.ovh with different encoding
    try {
      var json3 = await fetchUrl('https://api.lyrics.ovh/v1/' + encodeURIComponent(artist.replace(/&/g, 'and')) + '/' + encodeURIComponent(title.replace(/&/g, 'and')));
      var result3 = JSON.parse(json3);
      if (result3.lyrics && result3.lyrics.length > 50) {
        return { success: true, title, artist, lyrics: result3.lyrics };
      }
    } catch(e) {}

    return { success: false, error: 'No se encontró la letra' };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

const BIBLE_VERSIONS = [
  { name: 'Reina Valera 1960', code: 'rv1960', lang: 'Español', desc: 'Versión clásica española' },
  { name: 'Nueva Versión Internacional', code: 'nvi', lang: 'Español', desc: 'Versión contemporánea' },
  { name: 'La Biblia de las Américas', code: 'lbbla', lang: 'Español', desc: 'Traducción literal del hebreo y griego' },
  { name: 'Dios Habla Hoy', code: 'dhh', lang: 'Español', desc: 'Versión en lenguaje actual' },
  { name: 'Biblia del Jubileo', code: 'jub', lang: 'Español', desc: 'Versión 2000' },
  { name: 'Palabra de Dios para Todos', code: 'pdt', lang: 'Español', desc: 'Traducción dinámica' },
  { name: 'King James Version', code: 'kjv', lang: 'English', desc: 'Classic English translation (1611)' },
  { name: 'New King James Version', code: 'nkjv', lang: 'English', desc: 'Modernized KJV' },
  { name: 'English Standard Version', code: 'esv', lang: 'English', desc: 'Word-for-word accuracy' },
  { name: 'New International Version', code: 'niv', lang: 'English', desc: 'Balance of accuracy and readability' },
  { name: 'New American Standard Bible', code: 'nasb', lang: 'English', desc: 'Most literal English translation' },
  { name: 'American Standard Version', code: 'asv', lang: 'English', desc: 'Classic American translation (1901)' },
  { name: 'Berean Study Bible', code: 'bsb', lang: 'English', desc: 'Modern literal translation' },
  { name: 'World English Bible', code: 'web', lang: 'English', desc: 'Public domain English translation' },
  { name: 'Bíblia King James 1611', code: 'kjf', lang: 'Português', desc: 'Tradução clássica portuguesa' },
  { name: 'Bíblia Almeida Revista', code: 'arc', lang: 'Português', desc: 'Versão revisada portuguesa' },
  { name: 'Louis Segond', code: 'lsg', lang: 'Français', desc: 'Traduction classique française' },
  { name: 'Luther Bibel', code: 'lut', lang: 'Deutsch', desc: 'Lutherbibel klassisch' },
  { name: 'La Sacra Bibbia', code: 'riv', lang: 'Italiano', desc: 'Versione riveduta italiana' },
  { name: 'Het Boek', code: 'htb', lang: 'Nederlands', desc: 'Moderne Nederlandse vertaling' },
  { name: 'Biblia Tysiąclecia', code: 'bt', lang: 'Polski', desc: 'Polskie tłumaczenie' },
  { name: 'Синодальный перевод', code: 'syn', lang: 'Русский', desc: 'Русский синодальный перевод' },
  { name: 'Westminster Leningrad Codex', code: 'wlc', lang: 'עברית', desc: 'Hebrew Old Testament (BHS)' },
  { name: 'Greek Septuagint', code: 'lxx', lang: 'Ελληνικά', desc: 'Greek OT (LXX) with diacritics' },
  { name: 'Greek NT (NA28)', code: 'na28', lang: 'Ελληνικά', desc: 'Nestle-Aland 28th edition Greek NT' },
  { name: 'Greek NT (TR)', code: 'tr', lang: 'Ελληνικά', desc: 'Textus Receptus Greek NT' },
  { name: 'Vulgata Latina', code: 'vul', lang: 'Latina', desc: 'Biblia Sacra Vulgata Latina' },
];

ipcMain.handle('get-available-bibles', async () => {
  const biblesDir = path.join(__dirname, 'biblias');
  const biFiles = fs.existsSync(biblesDir) ? fs.readdirSync(biblesDir).filter(f => f.endsWith('.bi')) : [];
  const jsonFiles = fs.existsSync(biblesDir) ? fs.readdirSync(biblesDir).filter(f => f.endsWith('.json')) : [];

  return BIBLE_VERSIONS.map(v => {
    const hasBi = biFiles.some(f => f.toLowerCase().includes(v.code));
    const hasJson = jsonFiles.some(f => f.toLowerCase().includes(v.code));
    return {
      ...v,
      downloaded: hasJson,
      hasLocalBi: hasBi,
      url: ''
    };
  });
});

ipcMain.handle('download-bible', async (event, url, name) => {
  try {
    const biblesDir = path.join(__dirname, 'biblias');
    if (!fs.existsSync(biblesDir)) fs.mkdirSync(biblesDir, { recursive: true });

    let buffer;

    if (url && url.startsWith('http')) {
      const response = await new Promise((resolve, reject) => {
        const client = url.startsWith('https') ? https : http;
        const req = client.get(url, (res) => {
          if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            client.get(res.headers.location, (res2) => resolve(res2)).on('error', reject);
            return;
          }
          if (res.statusCode !== 200) {
            reject(new Error(`HTTP ${res.statusCode}`));
            return;
          }
          resolve(res);
        });
        req.on('error', reject);
        req.end();
      });

      const chunks = [];
      for await (const chunk of response) {
        chunks.push(chunk);
      }
      buffer = Buffer.concat(chunks);
    } else if (url && fs.existsSync(url)) {
      // url is a file path from open dialog
      buffer = fs.readFileSync(url);
    } else {
      const localPath = path.join(biblesDir, `${name}.bi`);
      const existing = fs.readdirSync(biblesDir).find(f =>
        f.toLowerCase().includes(name.toLowerCase().replace(/[^a-z0-9]/g, '')) && f.endsWith('.bi')
      );
      if (existing) {
        buffer = fs.readFileSync(path.join(biblesDir, existing));
      } else if (fs.existsSync(localPath)) {
        buffer = fs.readFileSync(localPath);
      } else {
        return { success: false, error: 'No se encontró el archivo .bi. Coloca el archivo .bi en la carpeta "biblias/" o selecciona uno manualmente.' };
      }
    }

    const safeName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const biPath = path.join(biblesDir, `${safeName}.bi`);
    fs.writeFileSync(biPath, buffer);

    const bible = convertBiToJson(biPath);
    const jsonPath = path.join(biblesDir, `${safeName}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(bible, null, 2), 'utf-8');

    const currentBiblePath = path.join(biblesDir, 'current.txt');
    fs.writeFileSync(currentBiblePath, path.basename(jsonPath), 'utf-8');

    return { success: true, name: safeName };
  } catch (err) {
    return { success: false, error: err.message };
  }
});
