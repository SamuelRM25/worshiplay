let songs = [];
let currentSong = null;
let currentSongBlock = -1;
let bible = null;
let currentBibleVersion = { name: 'Reina Valera 1960', code: 'rv1960' };
let currentBook = null;
let currentChapter = null;
let bibleNavIndex = -1;
let backgrounds = { items: [] };
let currentBackground = null;
let currentBgFolder = '';
let currentVideoSrc = null;
let currentTransition = 'crossfade';
let currentLyricsStyle = 'glow';
let setlist = [];
let previousBackground = null;
let projectionSettings = {
  fontFamily: 'Inter',
  fontSize: '',
  textColor: '#f0e6d3',
  textAlign: 'center',
  verticalPos: 'center',
  lineSpacing: 1.8,
  showRef: true,
  showNums: true,
  textShadow: true,
  shadowIntensity: 0.8,
  lyricsStyle: 'glow',
  transition: 'crossfade',
  bgDim: 0.6,
  verseNumColor: '#b8860b',
  verseNumFont: '',
  verseNumSize: '',
  refColor: '#b8860b',
  refFont: '',
  refSize: '2rem'
};

document.addEventListener('DOMContentLoaded', async () => {
  try {
    initTabs();
    document.getElementById('song-search').addEventListener('input', filterSongs);
    document.getElementById('btn-project-video').addEventListener('click', projectVideo);
    document.getElementById('btn-freeze').addEventListener('click', toggleFreeze);
    document.getElementById('btn-blank').addEventListener('click', showBlank);
    document.getElementById('btn-logo').addEventListener('click', initProjection);
    document.getElementById('btn-clear-text').addEventListener('click', clearScreen);
    document.getElementById('btn-close-video').addEventListener('click', closeVideo);
    document.getElementById('btn-local-video').addEventListener('click', openLocalVideo);
    document.getElementById('btn-youtube-video').addEventListener('click', () => toggleVideoInput('youtube'));
    document.getElementById('btn-url-video').addEventListener('click', () => toggleVideoInput('url'));
    document.getElementById('btn-load-youtube').addEventListener('click', loadYoutube);
    document.getElementById('yt-search-btn').addEventListener('click', searchYouTube);
    document.getElementById('yt-search-query').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') searchYouTube();
    });
    document.getElementById('btn-load-url').addEventListener('click', loadUrlVideo);
    document.getElementById('btn-pip-add').addEventListener('click', addPIPVideo);
    document.getElementById('btn-pip-apply').addEventListener('click', applyPIPSettings);
    document.getElementById('btn-bwp-clear').addEventListener('click', clearBWP);
    document.getElementById('btn-bwp-search').addEventListener('click', searchWordOnline);
    document.getElementById('bwp-search').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') searchWordOnline();
    });
    document.getElementById('btn-bwp-search-exegesis').addEventListener('click', searchExegesisOnline);
    document.getElementById('bwp-exegesis-search').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') searchExegesisOnline();
    });
    document.getElementById('transition-select').addEventListener('change', (e) => { currentTransition = e.target.value; });
    document.getElementById('lyrics-style-select').addEventListener('change', (e) => { currentLyricsStyle = e.target.value; });
    document.getElementById('btn-new-song').addEventListener('click', openNewSongModal);
    document.getElementById('btn-setlist-up').addEventListener('click', () => moveSetlistItem(-1));
    document.getElementById('btn-setlist-down').addEventListener('click', () => moveSetlistItem(1));
    document.getElementById('btn-setlist-remove').addEventListener('click', removeSetlistItem);
    document.getElementById('btn-setlist-clear').addEventListener('click', clearSetlist);
    document.getElementById('btn-new-song-close').addEventListener('click', closeNewSongModal);
    document.getElementById('btn-ns-cancel').addEventListener('click', closeNewSongModal);
    document.getElementById('btn-ns-save').addEventListener('click', saveNewSong);
    document.getElementById('ns-search-btn').addEventListener('click', searchLetras);
    document.getElementById('ns-search-query').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') searchLetras();
    });
    document.getElementById('new-song-modal').addEventListener('click', (e) => {
      if (e.target === document.getElementById('new-song-modal')) closeNewSongModal();
    });

    document.getElementById('bible-search').addEventListener('input', searchBible);
    document.getElementById('bible-book-search').addEventListener('input', filterBooks);
    document.getElementById('btn-download-bible').addEventListener('click', showDownloadDialog);
    document.getElementById('btn-modal-close').addEventListener('click', closeDownloadDialog);
    document.getElementById('btn-download-cancel').addEventListener('click', closeDownloadDialog);
    document.getElementById('download-modal').addEventListener('click', (e) => {
      if (e.target === document.getElementById('download-modal')) closeDownloadDialog();
    });
    document.getElementById('btn-toggle-right-panel').addEventListener('click', openSettingsModal);
    document.getElementById('btn-apply-settings').addEventListener('click', applySettings);
    document.getElementById('btn-close-settings-modal').addEventListener('click', closeSettingsModal);
    document.getElementById('settings-modal').addEventListener('click', (e) => {
      if (e.target === document.getElementById('settings-modal')) closeSettingsModal();
    });

    document.querySelectorAll('.na-send').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var ann = this.dataset.ann;
        sendAnnouncement(ann);
      });
    });
    document.querySelectorAll('.na-send-note').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var note = this.dataset.note;
        sendNote(note);
      });
    });
    initSettings();
    initDisplays();
    document.querySelectorAll('.bg-cat-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.bg-cat-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderBgFolderView();
      });
    });
    document.addEventListener('keydown', handleKeyboard);

    await loadSongs();
    await loadBible();
    await loadBackgrounds();
    await loadSettings();
    startHealthCheck();
    initUpdates();
    showToast('WorshiPlay listo');
  } catch (e) {
    console.error('Error en inicio:', e);
    showToast('Error al iniciar: ' + e.message);
  }
});

function handleKeyboard(e) {
  const tag = document.activeElement.tagName;
  const isInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';

  if (e.ctrlKey && e.key === 'Enter') {
    const active = document.querySelector('.tab-content.active');
    if (active) {
      if (active.id === 'songs-tab') projectSong();
      else if (active.id === 'video-tab') projectVideo();
    }
    return;
  }
  if (e.key === 'Escape') {
    const settingsModal = document.getElementById('settings-modal');
    if (settingsModal && settingsModal.style.display !== 'none') { closeSettingsModal(); return; }
    showBlank();
    return;
  }
  if ((e.key === 'b' || e.key === 'B') && !isInput) { showBlank(); return; }
  if (e.key === ' ' && !isInput) { e.preventDefault(); toggleFreeze(); return; }

  const active = document.querySelector('.tab-content.active');
  if (!active) return;

  if ((e.key === 'ArrowUp' || e.key === 'ArrowDown') && !isInput) {
    e.preventDefault();
    if (active.id === 'bible-tab') {
      handleBibleNav(e.key === 'ArrowDown' ? 1 : -1);
    } else if (active.id === 'songs-tab') {
      handleSongNav(e.key === 'ArrowDown' ? 1 : -1);
    }
  }
}

function initTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(`${btn.dataset.tab}-tab`).classList.add('active');
    });
  });
}

async function loadSongs() {
  songs = await window.api.getSongs();
  renderSongList(songs);
}

function renderSongList(list) {
  const listEl = document.getElementById('song-list');
  listEl.innerHTML = list.map(s =>
    `<div class="song-item" data-id="${s.id || s.ti}">
      <div class="song-title">${escapeHTML(s.ti || 'Sin título')}</div>
      ${s.tono ? `<span class="song-tone">${escapeHTML(s.tono)}</span>` : ''}
      <div class="song-actions">
        <button class="btn-edit-song" data-id="${s.id}" title="Editar">✎</button>
        <button class="btn-delete-song" data-id="${s.id}" title="Eliminar">✕</button>
      </div>
    </div>`
  ).join('');
  document.getElementById('song-count').textContent = `(${list.length})`;
  listEl.querySelectorAll('.song-item').forEach(el => {
    el.addEventListener('click', (e) => {
      if (e.target.closest('.btn-edit-song') || e.target.closest('.btn-delete-song')) return;
      listEl.querySelectorAll('.song-item').forEach(e => e.classList.remove('active'));
      el.classList.add('active');
      const id = el.dataset.id;
      const song = list.find(s => String(s.id || s.ti) === id);
      if (song) {
        showSongPreview(song);
        hideIndicator('song-nav-indicator');
        document.querySelectorAll('.song-line-active').forEach(e => e.classList.remove('song-line-active'));
      }
    });
    el.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      const id = el.dataset.id;
      const song = list.find(s => String(s.id || s.ti) === id);
      if (song) addToSetlist(song);
    });
  });
  listEl.querySelectorAll('.btn-edit-song').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const song = list.find(s => s.id === parseInt(btn.dataset.id));
      if (song) openEditSongModal(song);
    });
  });
  listEl.querySelectorAll('.btn-delete-song').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const song = list.find(s => s.id === parseInt(btn.dataset.id));
      if (song && confirm('¿Eliminar "' + song.ti + '"?')) {
        await window.api.deleteSong(song.id);
        await loadSongs();
      }
    });
  });
}

function showSongPreview(song) {
  currentSong = song;
  currentSongBlock = 0;
  document.getElementById('song-preview-title').textContent = song.ti || 'Sin título';
  document.getElementById('song-preview-tone').textContent = song.tono ? `Tono: ${song.tono}` : '';
  const lyrics = (song.le || '').replace(/\\n/g, '\n').replace(/\\r/g, '');
  document.getElementById('song-preview-lyrics').innerHTML = formatLyricsPreview(lyrics);
  document.querySelectorAll('.song-block').forEach(el => {
    el.addEventListener('click', () => {
      const blockIdx = parseInt(el.dataset.block);
      if (!isNaN(blockIdx)) {
        currentSongBlock = blockIdx;
        document.querySelectorAll('.song-block').forEach(b => b.classList.remove('active'));
        el.classList.add('active');
        projectSong();
      }
    });
  });
}

function formatLyricsPreview(lyrics) {
  const blocks = lyrics.split(/\n\n+/).map(b => b.split('\n').map(l => l.trim()).filter(l => l)).filter(b => b.length);
  if (!blocks.length) return '';
  return blocks.map((block, idx) => {
    const lines = block.map(line => {
      if (line.startsWith('//')) return `<div class="section">${escapeHTML(line.replace(/\//g, ''))}</div>`;
      return escapeHTML(line);
    }).join('\n');
    const active = idx === currentSongBlock ? ' active' : '';
    return `<div class="song-block${active}" data-block="${idx}">
      <span class="song-block-num">${idx + 1}</span>
      <div class="song-block-lines">${lines}</div>
    </div>`;
  }).join('');
}

function filterSongs(e) {
  const q = e.target.value.toLowerCase();
  const filtered = q ? songs.filter(s => (s.ti || '').toLowerCase().includes(q)) : songs;
  renderSongList(filtered);
}

function escapeHTML(text) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return text.replace(/[&<>"']/g, c => map[c]);
}

function getLyricBlocks(lyrics) {
  return lyrics.split(/\n\n+/).map(b => b.split('\n').map(l => l.trim()).filter(l => l)).filter(b => b.length);
}

async function loadBible() {
  const bibleEl = document.getElementById('bible-content');
  const parsingEl = document.getElementById('bible-parsing');
  let data = null;
  try { data = await window.api.getBible(); } catch {}
  if (!data) {
    parsingEl.innerHTML = '<div class="spinner"></div><p>Convirtiendo Biblia a JSON (una sola vez)...</p>';
    try {
      const result = await window.api.convertBible();
      if (result && result.success) {
        data = await window.api.getBible();
      } else {
        parsingEl.innerHTML = `<p style="color:var(--danger)">Error al convertir la Biblia: ${(result && result.error) || 'desconocido'}</p>`;
        return;
      }
    } catch (err) {
      parsingEl.innerHTML = `<p style="color:var(--danger)">Error: ${err.message}</p>`;
      return;
    }
  }
  if (data) {
    bible = data;
    parsingEl.style.display = 'none';
    bibleEl.style.display = 'flex';
    bibleEl.style.flexDirection = 'column';
    populateBibleSidebar();
  }
}

function populateBibleSidebar() {
  if (!bible) return;
  const list = document.getElementById('bible-book-list');
  list.innerHTML = bible.books.map(b => {
    const chs = b.chapters.map(c =>
      `<span class="bible-chapter-link" data-ch="${c.chapter}" title="Capítulo ${c.chapter}">${c.chapter}</span>`
    ).join('');
    return `<div class="bible-book-item" data-book-id="${b.id}">
      <div class="bible-book-header" data-book-id="${b.id}">
        <span class="bible-book-expand">&#9654;</span>
        <span class="bible-book-name">${escapeHTML(b.name)} <small>${b.chapters.length} cap.</small></span>
      </div>
      <div class="bible-chapter-list">${chs}</div>
    </div>`;
  }).join('');

  list.querySelectorAll('.bible-book-header').forEach(el => {
    el.addEventListener('click', () => {
      const bookId = parseInt(el.dataset.bookId);
      const chapterList = el.nextElementSibling;
      const expandIcon = el.querySelector('.bible-book-expand');
      const isOpen = chapterList.classList.contains('open');

      document.querySelectorAll('.bible-chapter-list.open').forEach(cl => {
        if (cl !== chapterList) {
          cl.classList.remove('open');
          cl.previousElementSibling.querySelector('.bible-book-expand').classList.remove('expanded');
        }
      });

      if (isOpen) {
        chapterList.classList.remove('open');
        expandIcon.classList.remove('expanded');
      } else {
        chapterList.classList.add('open');
        expandIcon.classList.add('expanded');
        selectBook(bookId);
      }
    });
  });

  list.querySelectorAll('.bible-chapter-link').forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      const bookItem = el.closest('.bible-book-item');
      const bookId = parseInt(bookItem.dataset.bookId);
      const ch = parseInt(el.dataset.ch);
      const book = bible.books.find(b => b.id === bookId);
      if (book) {
        selectBook(bookId);
        selectChapter(ch);
      }
    });
  });

  if (bible.books.length > 0) {
    const first = bible.books[0];
    selectBook(first.id);
  }
}

function filterBooks() {
  const q = document.getElementById('bible-book-search').value.toLowerCase().trim();
  document.querySelectorAll('.bible-book-item').forEach(item => {
    const name = item.querySelector('.bible-book-name').textContent.toLowerCase();
    item.style.display = (!q || name.includes(q)) ? '' : 'none';
  });
}

function selectBook(bookId) {
  const book = bible.books.find(b => b.id === bookId);
  if (!book) return;
  currentBook = book;
  currentChapter = null;
  bibleNavIndex = -1;

  document.querySelectorAll('.bible-book-header').forEach(h => h.classList.remove('active'));
  const header = document.querySelector(`.bible-book-header[data-book-id="${bookId}"]`);
  if (header) header.classList.add('active');

  document.querySelectorAll('.bible-chapter-link').forEach(l => l.classList.remove('active', 'current'));
  document.querySelectorAll('.bible-chapter-link.current').forEach(l => l.classList.remove('current'));

  document.getElementById('bible-current-book-name').textContent = book.name;
  document.getElementById('bible-current-chapter-name').textContent = '';
  document.getElementById('bible-verse-grid').innerHTML = '';
}

function selectChapter(chapterNum) {
  if (!currentBook) return;
  const chapter = currentBook.chapters.find(c => c.chapter === chapterNum);
  if (!chapter) return;
  currentChapter = chapter;
  bibleNavIndex = -1;

  document.querySelectorAll('.bible-chapter-link').forEach(l => l.classList.remove('current'));
  const chLink = document.querySelector(`.bible-chapter-link[data-ch="${chapterNum}"]`);
  if (chLink) {
    chLink.classList.add('current');
    chLink.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  document.getElementById('bible-current-chapter-name').textContent = `Capítulo ${chapterNum} (${chapter.verses.length} versículos)`;
  showVerseGrid(currentBook, chapter);
}

function showVerseGrid(book, chapter) {
  const grid = document.getElementById('bible-verse-grid');
  const total = chapter.verses.length;
  grid.innerHTML = chapter.verses.map((v, i) =>
    `<div class="bible-verse-tile" data-index="${i}" data-verse="${v.verse}"
          style="background:${getVerseColor(i, total)};">
      <span class="bvt-text">${projectionSettings.showNums ? `<b>${v.verse}</b> ` : ''}${escapeHTML(v.text)}</span>
      <span class="bvt-num">${v.verse}</span>
    </div>`
  ).join('');

  grid.querySelectorAll('.bible-verse-tile').forEach(el => {
    el.addEventListener('click', () => {
      const index = parseInt(el.dataset.index);
      const verse = chapter.verses[index];
      if (verse) {
        bibleNavIndex = index;
        updateVerseHighlight();
        projectVerse(verse);
      }
    });
  });
}

function updateVerseHighlight() {
  document.querySelectorAll('.bible-verse-tile').forEach(t => t.classList.remove('active'));
  if (bibleNavIndex >= 0) {
    const tile = document.querySelector(`.bible-verse-tile[data-index="${bibleNavIndex}"]`);
    if (tile) {
      tile.classList.add('active');
      tile.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }
}

function getVerseColor(index, total) {
  const hue = 200 + (index / Math.max(total - 1, 1)) * 140;
  const sat = 45 + (index % 3) * 5;
  const lit = 20 + ((index * 7) % 5) * 2;
  return `hsl(${hue}, ${sat}%, ${lit}%)`;
}

function handleBibleNav(direction) {
  if (!currentChapter || !currentChapter.verses.length) return;

  const total = currentChapter.verses.length;
  if (bibleNavIndex === -1) {
    bibleNavIndex = direction > 0 ? 0 : total - 1;
  } else {
    bibleNavIndex += direction;
    if (bibleNavIndex >= total) bibleNavIndex = 0;
    if (bibleNavIndex < 0) bibleNavIndex = total - 1;
  }

  const verse = currentChapter.verses[bibleNavIndex];
  updateVerseHighlight();
  projectVerse(verse);
  showNavIndicator('bible-nav-indicator', `Versículo ${verse.verse} de ${total}`);
}

function handleSongNav(direction) {
  if (!currentSong) return;
  const lyrics = (currentSong.le || '').replace(/\\n/g, '\n');
  const blocks = getLyricBlocks(lyrics);
  if (!blocks.length) return;

  const total = blocks.length;
  if (currentSongBlock === -1) {
    currentSongBlock = direction > 0 ? 0 : total - 1;
  } else {
    currentSongBlock += direction;
    if (currentSongBlock >= total) currentSongBlock = 0;
    if (currentSongBlock < 0) currentSongBlock = total - 1;
  }

  // Highlight current block in preview
  document.querySelectorAll('.song-line-active').forEach(e => e.classList.remove('song-line-active'));
  const previewLines = document.getElementById('song-preview-lyrics').children;
  let blockIdx = -1;
  let inBlock = false;
  for (const el of previewLines) {
    if (el.tagName === 'DIV' && !el.classList.contains('section') && el.textContent.trim()) {
      if (!inBlock) { blockIdx++; inBlock = true; }
      if (blockIdx === currentSongBlock) {
        el.classList.add('song-line-active');
      }
    } else {
      inBlock = false;
    }
  }

  projectSong();
  showNavIndicator('song-nav-indicator', 'Bloque ' + (currentSongBlock + 1) + ' de ' + total);
}

function showNavIndicator(id, text) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = text;
  el.style.display = 'block';
  el.style.animation = 'none';
  void el.offsetHeight;
  el.style.animation = 'fadeInUp 0.3s ease-out';
  clearTimeout(el._hideTimeout);
  el._hideTimeout = setTimeout(() => { el.style.display = 'none'; }, 2000);
}

function hideIndicator(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = 'none';
}

function gatherSettings() {
  return {
    fontFamily: projectionSettings.fontFamily,
    fontSize: projectionSettings.fontSize,
    textColor: projectionSettings.textColor,
    textAlign: projectionSettings.textAlign,
    verticalPos: projectionSettings.verticalPos,
    lineSpacing: projectionSettings.lineSpacing,
    showRef: projectionSettings.showRef,
    showNums: projectionSettings.showNums,
    textShadow: projectionSettings.textShadow,
    shadowIntensity: projectionSettings.shadowIntensity,
    lyricsStyle: projectionSettings.lyricsStyle,
    transition: projectionSettings.transition,
    bgDim: projectionSettings.bgDim,
    verseNumColor: projectionSettings.verseNumColor,
    verseNumFont: projectionSettings.verseNumFont,
    verseNumSize: projectionSettings.verseNumSize,
    refColor: projectionSettings.refColor,
    refFont: projectionSettings.refFont,
    refSize: projectionSettings.refSize
  };
}

function projectVerse(verse) {
  if (!currentBook || !currentChapter) return;
  window.api.project({
    type: 'bible',
    content: {
      book: currentBook.name,
      chapter: currentChapter.chapter,
      verses: [verse]
    },
    ...gatherSettings(),
    transition: projectionSettings.transition
  });
  document.getElementById('current-item').textContent = `${currentBook.name} ${currentChapter.chapter}:${verse.verse}`;
  updatePreview();
  showToast(`Proyectando: ${currentBook.name} ${currentChapter.chapter}:${verse.verse}`);
  populateWordPanel(verse);
}

function populateWordPanel(verse) {
  var panel = document.getElementById('bible-word-panel');
  var textEl = document.getElementById('bwp-verse-text');
  if (!panel || !textEl) return;

  var words = verse.text.split(' ');

  textEl.innerHTML = words.map(function(w, i) {
    return '<span class="bwp-word" data-idx="' + i + '">' + escapeHTML(w) + '</span>';
  }).join(' ');
  textEl._verse = verse;
  textEl._selected = [];

  textEl.querySelectorAll('.bwp-word').forEach(function(el) {
    el.addEventListener('click', function(e) {
      var effect = document.getElementById('bwp-effect').value;
      var activeClass = 'active-' + effect;
      var isSelected = el.classList.contains(activeClass);

      if (e.shiftKey) {
        if (isSelected) {
          el.classList.remove(activeClass);
          textEl._selected = textEl._selected.filter(function(idx) { return idx !== parseInt(el.dataset.idx); });
        } else {
          el.classList.add(activeClass);
          if (textEl._selected.indexOf(parseInt(el.dataset.idx)) === -1) {
            textEl._selected.push(parseInt(el.dataset.idx));
          }
        }
      } else {
        textEl.querySelectorAll('.bwp-word').forEach(function(w) {
          if (effect === 'overlay') {
            w.classList.remove('active-overlay', 'active-highlight', 'active-underline', 'active-bold', 'active-color', 'active-circle');
          } else {
            w.classList.remove(activeClass);
          }
        });
        textEl._selected = [];
        if (!isSelected) {
          el.classList.add(activeClass);
          textEl._selected.push(parseInt(el.dataset.idx));
        }
      }

      if (textEl._selected.length) {
        sendWordHighlights(verse, textEl._selected, effect);
      } else {
        sendWordClear();
      }
    });
  });

  panel.style.display = 'flex';
}

function sendWordHighlights(verse, indices, effect) {
  var words = verse.text.split(' ');
  var selectedWords = indices.map(function(i) { return words[i]; }).filter(Boolean);
  if (!selectedWords.length) return;
  window.api.project({
    type: 'word-highlight',
    content: { words: selectedWords, effect: effect, verse: verse.verse }
  });
}

function sendWordClear() {
  window.api.project({ type: 'word-clear' });
}

async function searchWordOnline() {
  var q = document.getElementById('bwp-search').value.trim();
  var resultsEl = document.getElementById('bwp-search-results');
  if (!q || q.length < 2) { resultsEl.innerHTML = '<span style="color:var(--text-muted);font-size:0.7rem;">Escribe al menos 2 caracteres</span>'; return; }
  resultsEl.innerHTML = '<div style="padding:8px;text-align:center;"><div class="spinner" style="width:20px;height:20px;border-width:2px;margin:0 auto;"></div><span style="font-size:0.7rem;color:var(--text-muted);">Buscando significado...</span></div>';

  try {
    var result = await window.api.searchWordMeaning(q);
    if (result && result.success) {
      resultsEl.innerHTML = result.results.map(function(r) {
        return '<div class="bwp-result-item" data-text="' + r.replace(/"/g, '&quot;') + '">' +
          '<div class="bwp-ri-text">' + r + '</div></div>';
      }).join('');
      resultsEl.querySelectorAll('.bwp-result-item').forEach(function(el) {
        el.addEventListener('click', function() {
          var text = this.dataset.text;
          window.api.project({ type: 'note', content: { text: text } });
          showToast('Texto proyectado');
        });
      });
    } else {
      resultsEl.innerHTML = '<span style="color:var(--text-muted);font-size:0.7rem;">' + (result && result.error ? result.error : 'Sin resultados') + '</span>';
    }
  } catch (e) {
    resultsEl.innerHTML = '<span style="color:var(--danger);font-size:0.7rem;">Error: ' + e.message + '</span>';
  }
}

async function searchExegesisOnline() {
  var q = document.getElementById('bwp-exegesis-search').value.trim();
  var resultsEl = document.getElementById('bwp-exegesis-results');
  if (!q || q.length < 3) { resultsEl.innerHTML = '<span style="color:var(--text-muted);font-size:0.7rem;">Escribe al menos 3 caracteres</span>'; return; }
  resultsEl.innerHTML = '<div style="padding:8px;text-align:center;"><div class="spinner" style="width:20px;height:20px;border-width:2px;margin:0 auto;"></div><span style="font-size:0.7rem;color:var(--text-muted);">Buscando exégesis...</span></div>';

  try {
    var result = await window.api.searchExegesis(q);
    if (result && result.success) {
      resultsEl.innerHTML = result.results.map(function(r) {
        return '<div class="bwp-result-item" data-text="' + r.replace(/"/g, '&quot;') + '">' +
          '<div class="bwp-ri-text">' + r + '</div></div>';
      }).join('');
      resultsEl.querySelectorAll('.bwp-result-item').forEach(function(el) {
        el.addEventListener('click', function() {
          var text = this.dataset.text;
          window.api.project({ type: 'note', content: { text: text } });
          showToast('Texto proyectado');
        });
      });
    } else {
      resultsEl.innerHTML = '<span style="color:var(--text-muted);font-size:0.7rem;">' + (result && result.error ? result.error : 'Sin resultados') + '</span>';
    }
  } catch (e) {
    resultsEl.innerHTML = '<span style="color:var(--danger);font-size:0.7rem;">Error: ' + e.message + '</span>';
  }
}

function sendAnnouncement(num) {
  var text = document.getElementById('na-ann-' + num).value.trim();
  if (!text) { showToast('Escribe un anuncio primero'); return; }
  var repeat = parseInt(document.getElementById('na-ann-repeat-' + num).value) || 1;
  window.api.project({
    type: 'announcement',
    content: { text: text, repeat: repeat }
  });
  showToast('Anuncio enviado (' + repeat + 'x)');
}

function sendNote(num) {
  var text = document.getElementById('na-note-' + num).value.trim();
  if (!text) { showToast('Escribe una nota primero'); return; }
  window.api.project({
    type: 'note',
    content: { text: text },
    transition: projectionSettings.transition
  });
  showToast('Nota proyectada');
}

function clearBWP() {
  document.querySelectorAll('#bwp-verse-text .bwp-word').forEach(function(w) {
    w.className = 'bwp-word';
  });
  sendWordClear();
}

function searchBible(e) {
  const q = e.target.value.trim().toLowerCase();
  const resultsEl = document.getElementById('bible-search-results');
  if (!q || !bible) { resultsEl.style.display = 'none'; return; }
  const results = [];
  for (const book of bible.books) {
    for (const ch of book.chapters) {
      for (const v of ch.verses) {
        if (v.text.toLowerCase().includes(q)) {
          results.push({ book: book.name, bookId: book.id, chapter: ch.chapter, verse: v.verse, text: v.text });
          if (results.length >= 50) break;
        }
      }
      if (results.length >= 50) break;
    }
    if (results.length >= 50) break;
  }
  if (results.length) {
    resultsEl.innerHTML = results.map(r =>
      `<div class="bible-search-item" data-book="${r.bookId}" data-ch="${r.chapter}" data-v="${r.verse}">
        <span class="bsi-ref">${escapeHTML(r.book)} ${r.chapter}:${r.verse}</span>
        <span class="bsi-text">${escapeHTML(r.text.slice(0, 100))}...</span>
      </div>`
    ).join('');
    resultsEl.style.display = 'block';
    resultsEl.querySelectorAll('.bible-search-item').forEach(el => {
      el.addEventListener('click', () => {
        const bookId = parseInt(el.dataset.book);
        const ch = parseInt(el.dataset.ch);
        const verseNum = parseInt(el.dataset.v);
        const book = bible.books.find(b => b.id === bookId);
        if (book) {
          const chapter = book.chapters.find(c => c.chapter === ch);
          if (chapter) {
            const verse = chapter.verses.find(v => v.verse === verseNum);
            if (verse) {
              selectBook(bookId);
              selectChapter(ch);
              bibleNavIndex = chapter.verses.indexOf(verse);
              updateVerseHighlight();
              projectVerse(verse);
            }
          }
        }
        resultsEl.style.display = 'none';
        document.getElementById('bible-search').value = '';
      });
    });
  } else {
    resultsEl.style.display = 'none';
  }
}

async function loadBackgrounds() {
  document.getElementById('bg-loading').style.display = 'flex';
  try {
    const items = await window.api.getBackgrounds();
    backgrounds = { items };
  } catch { backgrounds = { items: [] }; }
  document.getElementById('bg-loading').style.display = 'none';
  document.getElementById('bg-content').style.display = 'block';
  currentBgFolder = '';
  renderBgFolderView();
}

function renderBgFolderView() {
  const grid = document.getElementById('bg-grid');
  const allItems = backgrounds.items || [];

  const subfolders = new Set();
  const filesHere = [];
  const prefix = currentBgFolder ? currentBgFolder + '/' : '';

  for (const item of allItems) {
    if (item.folder === currentBgFolder) {
      filesHere.push(item);
    } else if (item.folder.startsWith(prefix) && item.folder !== currentBgFolder) {
      const rest = item.folder.slice(prefix.length);
      const sub = rest.split('/')[0];
      if (sub) subfolders.add(sub);
    }
  }

  const cat = document.querySelector('.bg-cat-btn.active').dataset.cat;
  let filtered = filesHere;
  if (cat === 'videos') filtered = filtered.filter(i => i.type === 'video');
  else if (cat === 'images') filtered = filtered.filter(i => i.type === 'image');

  let html = '';

  if (currentBgFolder) {
    const parent = currentBgFolder.includes('/') ? currentBgFolder.slice(0, currentBgFolder.lastIndexOf('/')) : '';
    html = `<div class="bg-folder-btn" data-folder="${escapeHTML(parent)}">&#8592; ${parent || 'Raíz'}</div>`;
  }

  for (const sub of [...subfolders].sort()) {
    const fullPath = prefix + sub;
    html += `<div class="bg-folder-btn" data-folder="${escapeHTML(fullPath)}">&#128193; ${escapeHTML(sub)}</div>`;
  }

  if (!subfolders.size && !filtered.length) {
    html += '<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-muted)">Carpeta vacía</div>';
  }

  html += filtered.map(item =>
    `<div class="bg-item" data-path="${escapeHTML(item.path)}" data-type="${item.type}">
      ${item.type === 'video'
        ? `<video src="file:///${item.path.replace(/\\/g, '/')}" muted loop preload="metadata"></video>`
        : `<img src="file:///${item.path.replace(/\\/g, '/')}" loading="lazy">`
      }
      <div class="bg-label">${escapeHTML(item.name)}</div>
    </div>`
  ).join('');

  grid.innerHTML = html;

  grid.querySelectorAll('.bg-folder-btn').forEach(el => {
    el.addEventListener('click', () => {
      currentBgFolder = el.dataset.folder;
      renderBgFolderView();
    });
  });

  grid.querySelectorAll('.bg-item').forEach(el => {
    el.addEventListener('click', () => {
      grid.querySelectorAll('.bg-item').forEach(e => e.classList.remove('selected'));
      el.classList.add('selected');
      const bg = {
        path: el.dataset.path,
        type: el.dataset.type,
        name: el.querySelector('.bg-label').textContent
      };
      sendBackground(bg);
      showToast(`Fondo: ${bg.name}`);
    });
    const video = el.querySelector('video');
    if (video) {
      el.addEventListener('mouseenter', () => video.play().catch(() => {}));
      el.addEventListener('mouseleave', () => { video.pause(); video.currentTime = 0; });
    }
  });
}

async function projectSong() {
  if (!currentSong) return showToast('Selecciona una canción primero');
  const lyrics = (currentSong.le || '').replace(/\\n/g, '\n');
  const blocks = getLyricBlocks(lyrics);
  if (!blocks.length) return showToast('La canción no tiene letra');

  if (currentSongBlock < 0) currentSongBlock = 0;

  var songSettings = gatherSettings();

  window.api.project({
    type: 'song',
    content: currentSong,
    showBlock: currentSongBlock,
    lyricsStyle: projectionSettings.lyricsStyle,
    transition: projectionSettings.transition,
    ...songSettings
  });
  const label = currentSong.ti || 'Canción';
  const blockInfo = ' (bloque ' + (currentSongBlock + 1) + '/' + blocks.length + ')';
  document.getElementById('current-item').textContent = label + blockInfo;
  updatePreview();
  showToast('Proyectando: ' + label + blockInfo);
}

async function projectVideo() {
  if (!currentVideoSrc) return showToast('Selecciona o carga un video primero');
  await window.api.project({
    type: 'video',
    content: currentVideoSrc,
    transition: projectionSettings.transition,
    bgDim: projectionSettings.bgDim
  });
  document.getElementById('current-item').textContent = 'Video';
  updatePreview();
  showToast('Proyectando video');
}

async function openLocalVideo() {
  try {
    const filePath = await window.api.openFileDialog();
    if (filePath) {
      currentVideoSrc = { type: 'local', path: filePath };
      document.getElementById('local-video-preview').src = filePath;
      document.getElementById('local-video-preview').style.display = 'block';
      document.getElementById('youtube-preview').style.display = 'none';
      document.getElementById('video-path-display').textContent = `Archivo: ${filePath.split(/[/\\]/).pop()}`;
      document.getElementById('btn-project-video').disabled = false;
      document.getElementById('youtube-input').style.display = 'none';
      document.getElementById('url-input').style.display = 'none';
      projectVideo();
    }
  } catch {}
}

function toggleVideoInput(type) {
  document.getElementById('youtube-input').style.display = type === 'youtube' ? 'flex' : 'none';
  document.getElementById('url-input').style.display = type === 'url' ? 'flex' : 'none';
}

function loadYoutube() {
  const url = document.getElementById('youtube-url').value.trim();
  if (!url) return;
  currentVideoSrc = { type: 'youtube', url };
  document.getElementById('video-path-display').textContent = 'YouTube video cargado';
  document.getElementById('btn-project-video').disabled = false;
  document.getElementById('local-video-preview').style.display = 'none';
  projectVideo();
}

function loadUrlVideo() {
  const url = document.getElementById('video-url').value.trim();
  if (!url) return;
  currentVideoSrc = { type: 'url', url };
  document.getElementById('video-path-display').textContent = `URL: ${url}`;
  document.getElementById('btn-project-video').disabled = false;
  document.getElementById('local-video-preview').src = url;
  document.getElementById('local-video-preview').style.display = 'block';
  document.getElementById('youtube-preview').style.display = 'none';
  projectVideo();
}

let pipVideos = [];
async function addPIPVideo() {
  var filePath = await window.api.openFileDialog();
  if (!filePath) return;
  var position = document.getElementById('pip-position').value;
  var size = document.getElementById('pip-size').value;
  var id = Date.now();
  pipVideos.push({ id: id, path: filePath, position: position, size: size, type: 'video' });

  window.api.project({
    type: 'pip-add',
    content: { id: id, path: filePath, position: position, size: size, type: 'video', muted: false }
  });

  renderPIPList();
  showToast('Video PIP agregado');
}

function applyPIPSettings() {
  var position = document.getElementById('pip-position').value;
  var size = document.getElementById('pip-size').value;
  pipVideos.forEach(function(pip) {
    pip.position = position;
    pip.size = size;
    window.api.project({
      type: 'pip-update',
      content: { id: pip.id, position: position, size: size }
    });
  });
  showToast('Configuración PIP aplicada');
}

function renderPIPList() {
  var container = document.getElementById('pip-list');
  container.innerHTML = pipVideos.map(function(pip) {
    var label = pip.path.split(/[/\\]/).pop();
    return '<div class="pip-chip" data-id="' + pip.id + '">' +
      '<span>' + escapeHTML(label) + '</span>' +
      '<button class="pip-chip-remove" data-id="' + pip.id + '">&times;</button>' +
    '</div>';
  }).join('');
  container.querySelectorAll('.pip-chip-remove').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var id = parseInt(btn.dataset.id);
      pipVideos = pipVideos.filter(function(p) { return p.id !== id; });
      window.api.project({ type: 'pip-remove', content: id });
      renderPIPList();
    });
  });
}

async function toggleFreeze() {
  await window.api.project({ type: 'freeze' });
  showToast('Proyección congelada/descongelada');
}

async function showBlank() {
  await window.api.project({ type: 'blank', bgDim: projectionSettings.bgDim });
  document.getElementById('current-item').textContent = 'Pantalla en blanco';
  updatePreview();
}

async function initProjection() {
  await window.api.reloadProjection();

  if (currentBackground) {
    await window.api.project({ type: 'set-background', content: currentBackground });
  }

  // Restore last projected content
  const lastData = await window.api.getProjectionData();
  if (lastData && lastData.type !== 'blank' && lastData.type !== 'update-settings' && lastData.type !== 'set-background' && lastData.type !== 'welcome') {
    await window.api.project(lastData);
  }

  showToast('Ventana de proyección iniciada');
}

async function clearScreen() {
  await window.api.project({ type: 'clear-content' });
  document.getElementById('current-item').textContent = 'Solo fondo';
  updatePreview();
  showToast('Texto borrado de pantalla');
}

async function closeVideo() {
  if (currentBackground) {
    previousBackground = currentBackground;
  }
  await window.api.project({ type: 'stop-video' });
  if (previousBackground) {
    await window.api.project({ type: 'set-background', content: previousBackground });
  }
  currentVideoSrc = null;
  document.getElementById('current-item').textContent = 'Video cerrado';
  updatePreview();
  showToast('Video removido');
}

function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(el._timeout);
  el._timeout = setTimeout(() => el.classList.remove('show'), 3000);
}

function showDownloadDialog() {
  document.getElementById('download-modal').style.display = 'flex';
  const list = document.getElementById('bible-version-list');
  window.api.getAvailableBibles().then(versions => {
    const groups = {};
    for (const v of versions) {
      if (!groups[v.lang]) groups[v.lang] = [];
      groups[v.lang].push(v);
    }

    list.innerHTML = Object.entries(groups).map(([lang, vers]) =>
      `<div class="bvl-group">
        <div class="bvl-group-title">${escapeHTML(lang)}</div>
        ${vers.map(v => {
          if (v.downloaded) {
            return `<div class="bible-version-item">
              <div class="bvi-info">
                <div class="bvi-name">${escapeHTML(v.name)}</div>
                <div class="bvi-desc">${escapeHTML(v.desc)}</div>
              </div>
              <span class="bvi-downloaded">&#10003;</span>
            </div>`;
          }
          const hasLocal = v.hasLocalBi;
          return `<div class="bible-version-item">
            <div class="bvi-info">
              <div class="bvi-name">${escapeHTML(v.name)}</div>
              <div class="bvi-desc">${escapeHTML(v.desc)}</div>
            </div>
            <button class="bvi-btn" data-code="${escapeHTML(v.code)}" data-name="${escapeHTML(v.name)}">Descargar</button>
          </div>`;
        }).join('')}
      </div>`
    ).join('');

    list.querySelectorAll('.bvi-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const name = btn.dataset.name;
        btn.textContent = 'Buscando...';
        // Try download with empty URL first (auto-find in biblias dir)
        const result = await window.api.downloadBible('', name);
        if (result && result.success) {
          btn.textContent = '✓ Listo';
          btn.style.background = 'var(--success)';
          showToast(`Biblia "${name}" descargada correctamente`);
          setTimeout(() => { closeDownloadDialog(); }, 1000);
          const data = await window.api.getBible();
          if (data) { bible = data; populateBibleSidebar(); }
          return;
        }
        // If not found, open file dialog
        const filePath = await window.api.openBiFileDialog();
        if (filePath) {
          downloadBibleVersion(filePath, name, btn);
        } else {
          btn.textContent = 'Descargar';
          btn.disabled = false;
        }
      });
    });
  }).catch(() => {
    list.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:20px;">No se pudieron cargar las versiones disponibles.</p>';
  });

  document.getElementById('bvl-custom-btn').onclick = () => {
    const url = document.getElementById('bvl-custom-url').value.trim();
    const name = document.getElementById('bvl-custom-name').value.trim();
    if (!url || !name) { showToast('Ingresa URL y nombre'); return; }
    const btn = document.getElementById('bvl-custom-btn');
    downloadBibleVersion(url, name, btn);
  };
}

function closeDownloadDialog() {
  document.getElementById('download-modal').style.display = 'none';
}

function openSettingsModal() {
  document.getElementById('settings-modal').style.display = 'flex';
  updatePreview();
}

function closeSettingsModal() {
  document.getElementById('settings-modal').style.display = 'none';
}

function initSettings() {
  const bind = (id, key, transform) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('change', () => {
      const val = transform ? transform(el) : el.value;
      updateSetting(key, val);
    });
    el.addEventListener('input', () => {
      if (el.type === 'range') {
        updateSetting(key, transform ? transform(el) : el.value);
      }
    });
  };
  bind('rp-font-family', 'fontFamily');
  bind('rp-font-size', 'fontSize', (el) => {
    const val = parseFloat(el.value);
    document.getElementById('rp-font-size-label').textContent = val + 'rem';
    return val + 'rem';
  });
  bind('rp-text-color', 'textColor', (el) => el.value);
  bind('rp-line-spacing', 'lineSpacing', (el) => parseFloat(el.value));
  bind('rp-show-ref', 'showRef', (el) => el.checked);
  bind('rp-show-nums', 'showNums', (el) => el.checked);
  bind('rp-text-shadow', 'textShadow', (el) => el.checked);
  bind('rp-shadow-intensity', 'shadowIntensity', (el) => parseFloat(el.value));
  bind('rp-lyrics-style', 'lyricsStyle');
  bind('rp-transition', 'transition');
  bind('rp-bg-dim', 'bgDim', (el) => parseFloat(el.value));
  bind('rp-verse-num-color', 'verseNumColor', (el) => el.value);
  bind('rp-ref-font', 'refFont');
  bind('rp-ref-color', 'refColor', (el) => el.value);
  bind('rp-ref-size', 'refSize');

  document.querySelectorAll('#rp-text-align button').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#rp-text-align button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      updateSetting('textAlign', btn.dataset.value);
    });
  });
  document.querySelectorAll('#rp-vertical-pos button').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#rp-vertical-pos button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      updateSetting('verticalPos', btn.dataset.value);
    });
  });

  document.querySelectorAll('.rp-btn-group button').forEach(btn => {
    btn.addEventListener('mousedown', (e) => e.preventDefault());
  });
}

function updateSetting(key, value) {
  projectionSettings[key] = value;
  if (key === 'transition') currentTransition = value;
  if (key === 'lyricsStyle') currentLyricsStyle = value;
  syncSettingsToTabs();
  updatePreview();
  if (currentChapter) showVerseGrid(currentBook, currentChapter);

  window.api.saveSettings(projectionSettings).catch(() => {});
}

function applySettings() {
  window.api.project({ type: 'update-settings', settings: { ...projectionSettings } });
  showToast('Configuración aplicada a la proyección');
}

function syncSettingsToTabs() {
  const ts = document.getElementById('transition-select');
  if (ts && ts.value !== projectionSettings.transition) ts.value = projectionSettings.transition;
  const ls = document.getElementById('lyrics-style-select');
  if (ls && ls.value !== projectionSettings.lyricsStyle) ls.value = projectionSettings.lyricsStyle;
}

function updatePreview() {
  const box = document.getElementById('rp-preview-text');
  if (!box) return;
  const item = document.getElementById('current-item');
  const text = item ? item.textContent : 'Proyección';
  box.textContent = text;
  box.style.fontFamily = projectionSettings.fontFamily;
  box.style.fontSize = projectionSettings.fontSize || 'calc(2rem + 2vw)';
  box.style.color = projectionSettings.textColor;
  box.style.textAlign = projectionSettings.textAlign;
  if (projectionSettings.textShadow) {
    box.style.textShadow = `0 2px 10px rgba(0,0,0,${projectionSettings.shadowIntensity})`;
  } else {
    box.style.textShadow = 'none';
  }
}

async function initDisplays() {
  const select = document.getElementById('rp-display-select');
  const toggle = document.getElementById('rp-projection-visible');
  try {
    const displays = await window.api.getDisplays();
    select.innerHTML = displays.map(d =>
      `<option value="${d.index}">${escapeHTML(d.name)} (${d.size})${d.isPrimary ? ' (Principal)' : ''}</option>`
    ).join('');
    select.addEventListener('change', () => {
      window.api.setProjectionDisplay(parseInt(select.value));
    });
    const vis = await window.api.getProjectionVisible();
    toggle.checked = vis;
    toggle.addEventListener('change', () => {
      window.api.toggleProjection().then(v => {
        toggle.checked = v;
        showToast(v ? 'Proyección visible' : 'Proyección oculta');
      });
    });
  } catch {}
}

function sendBackground(bg) {
  currentBackground = bg;
  window.api.project({ type: 'set-background', content: bg });
  const el = document.getElementById('rp-current-bg');
  if (el) el.textContent = bg ? bg.name : 'Ninguno';
  projectionSettings.currentBackground = bg;
  window.api.saveSettings(projectionSettings).catch(() => {});
}

async function downloadBibleVersion(url, name, btn) {
  btn.disabled = true;
  btn.textContent = 'Procesando...';
  try {
    const result = await window.api.downloadBible(url, name);
    if (result && result.success) {
      btn.textContent = '✓ Listo';
      btn.style.background = 'var(--success)';
      showToast(`Biblia "${name}" descargada correctamente`);
      setTimeout(() => { closeDownloadDialog(); }, 1000);
      const data = await window.api.getBible();
      if (data) {
        bible = data;
        populateBibleSidebar();
      }
    } else {
      btn.disabled = false;
      btn.textContent = 'Reintentar';
      showToast(`Error: ${(result && result.error) || 'desconocido'}`);
    }
  } catch (err) {
    btn.disabled = false;
    btn.textContent = 'Reintentar';
    showToast(`Error: ${err.message}`);
  }
}

/* ── SetList ── */

function addToSetlist(song) {
  if (setlist.find(s => s.ti === song.ti)) {
    showToast('Canción ya está en el SetList');
    return;
  }
  setlist.push({ ...song });
  renderSetlist();
  showToast(`"${song.ti}" agregada al SetList`);
}

function removeFromSetlist(index) {
  if (index < 0 || index >= setlist.length) return;
  const song = setlist[index];
  setlist.splice(index, 1);
  renderSetlist();
  showToast(`"${song.ti}" quitada del SetList`);
}

function moveSetlistItem(dir) {
  const section = document.getElementById('setlist-items');
  const active = section.querySelector('.setlist-item.active');
  if (!active) return showToast('Selecciona una canción en el SetList');
  const index = parseInt(active.dataset.index);
  const newIndex = index + dir;
  if (newIndex < 0 || newIndex >= setlist.length) return;
  [setlist[index], setlist[newIndex]] = [setlist[newIndex], setlist[index]];
  renderSetlist();
  const newActive = section.querySelector(`.setlist-item[data-index="${newIndex}"]`);
  if (newActive) newActive.classList.add('active');
}

function removeSetlistItem() {
  const section = document.getElementById('setlist-items');
  const active = section.querySelector('.setlist-item.active');
  if (!active) return showToast('Selecciona una canción en el SetList');
  const index = parseInt(active.dataset.index);
  removeFromSetlist(index);
}

function clearSetlist() {
  if (setlist.length === 0) return;
  setlist = [];
  renderSetlist();
  showToast('SetList limpiado');
}

function renderSetlist() {
  const container = document.getElementById('setlist-items');
  if (!setlist.length) {
    container.innerHTML = '<div style="color:var(--text-muted);font-size:0.8rem;text-align:center;padding:10px;">SetList vacío. Haz clic en una canción para agregarla.</div>';
    document.getElementById('setlist-count').textContent = '0 canciones';
    return;
  }
  container.innerHTML = setlist.map((s, i) =>
    `<div class="setlist-item" data-index="${i}">
      <span class="sli-num">${i + 1}.</span>
      <span class="sli-name">${escapeHTML(s.ti || 'Sin título')}</span>
      ${s.tono ? `<span class="sli-tone">${escapeHTML(s.tono)}</span>` : ''}
    </div>`
  ).join('');
  container.querySelectorAll('.setlist-item').forEach(el => {
    el.addEventListener('click', () => {
      container.querySelectorAll('.setlist-item').forEach(e => e.classList.remove('active'));
      el.classList.add('active');
      const index = parseInt(el.dataset.index);
      const song = setlist[index];
      if (song) showSongPreview(song);
    });
    el.addEventListener('dblclick', () => {
      const index = parseInt(el.dataset.index);
      const song = setlist[index];
      if (song) {
        showSongPreview(song);
        projectSong();
      }
    });
  });
  document.getElementById('setlist-count').textContent = `${setlist.length} canciones`;
}

/* ── New Song ── */

function openNewSongModal() {
  document.getElementById('new-song-modal').style.display = 'flex';
  document.getElementById('ns-modal-title').textContent = 'Nueva Canción';
  document.getElementById('ns-title').value = '';
  document.getElementById('ns-artist').value = '';
  document.getElementById('ns-tone').value = '';
  document.getElementById('ns-lyrics').value = '';
  document.getElementById('ns-search-query').value = '';
  document.getElementById('ns-search-results').style.display = 'none';
  document.getElementById('ns-search-results').innerHTML = '';
  document.getElementById('new-song-modal').dataset.editId = '';
}

function openEditSongModal(song) {
  document.getElementById('new-song-modal').style.display = 'flex';
  document.getElementById('ns-modal-title').textContent = 'Editar Canción';
  document.getElementById('ns-title').value = song.ti || '';
  document.getElementById('ns-artist').value = '';
  document.getElementById('ns-tone').value = song.tono || '';
  document.getElementById('ns-lyrics').value = (song.le || '').replace(/\\n/g, '\n');
  document.getElementById('ns-search-query').value = '';
  document.getElementById('ns-search-results').style.display = 'none';
  document.getElementById('ns-search-results').innerHTML = '';
  document.getElementById('new-song-modal').dataset.editId = song.id;
}

function closeNewSongModal() {
  document.getElementById('new-song-modal').style.display = 'none';
}

async function saveNewSong() {
  const title = document.getElementById('ns-title').value.trim();
  const artist = document.getElementById('ns-artist').value.trim();
  const tone = document.getElementById('ns-tone').value.trim();
  const lyrics = document.getElementById('ns-lyrics').value.trim();
  const editId = document.getElementById('new-song-modal').dataset.editId;

  if (!title) { showToast('Ingresa un título'); return; }
  if (!lyrics) { showToast('Ingresa la letra'); return; }

  if (editId) {
    const result = await window.api.updateSong({ id: parseInt(editId), title, artist, tone, lyrics });
    if (result && result.success) {
      showToast(`Canción "${title}" actualizada`);
      closeNewSongModal();
      await loadSongs();
    } else {
      showToast(`Error: ${(result && result.error) || 'desconocido'}`);
    }
  } else {
    const result = await window.api.saveNewSong({ title, artist, tone, lyrics });
    if (result && result.success) {
      showToast(`Canción "${title}" guardada`);
      closeNewSongModal();
      await loadSongs();
    } else {
      showToast(`Error: ${(result && result.error) || 'desconocido'}`);
    }
  }
}

/* ── Letras.com Search ── */

async function searchLetras() {
  const query = document.getElementById('ns-search-query').value.trim();
  if (!query) { showToast('Ingresa un nombre de canción'); return; }
  const btn = document.getElementById('ns-search-btn');
  const resultsEl = document.getElementById('ns-search-results');
  btn.disabled = true;
  btn.textContent = 'Buscando...';
  resultsEl.style.display = 'block';
  resultsEl.innerHTML = '<div style="padding:10px;text-align:center;color:var(--text-muted);font-size:0.8rem;">Buscando...</div>';
  try {
    const result = await window.api.searchLetras(query);
    if (result && result.success && result.results.length) {
      resultsEl.innerHTML = result.results.map((r, i) =>
        `<div class="bible-search-item ns-result-item" data-index="${i}" data-url="${escapeHTML(r.url)}" data-title="${escapeHTML(r.title)}" data-artist="${escapeHTML(r.artist)}">
          <span class="bsi-ref">${escapeHTML(r.title)}</span>
          <span class="bsi-text">${r.artist ? escapeHTML(r.artist) : ''}</span>
        </div>`
      ).join('');
      resultsEl.querySelectorAll('.ns-result-item').forEach(el => {
        el.addEventListener('click', async () => {
          const url = el.dataset.url;
          const title = el.dataset.title;
          const artist = el.dataset.artist;
          resultsEl.innerHTML = '<div style="padding:10px;text-align:center;color:var(--text-muted);font-size:0.8rem;">Descargando letra...</div>';
          try {
            const lyrResult = await window.api.fetchLetras({ url, title, artist });
            if (lyrResult && lyrResult.success) {
              document.getElementById('ns-title').value = lyrResult.title || title;
              document.getElementById('ns-artist').value = lyrResult.artist || artist;
              document.getElementById('ns-lyrics').value = lyrResult.lyrics || '';
              resultsEl.style.display = 'none';
              showToast('Letra importada');
            } else {
              showToast('Error al descargar la letra: ' + (lyrResult && lyrResult.error || ''));
              resultsEl.innerHTML = '';
              resultsEl.style.display = 'none';
            }
          } catch (e) {
            showToast('Error: ' + e.message);
            resultsEl.innerHTML = '';
            resultsEl.style.display = 'none';
          }
        });
      });
    } else {
      const errMsg = result && result.error ? ': ' + result.error : '';
      resultsEl.innerHTML = '<div style="padding:10px;text-align:center;color:var(--text-muted);font-size:0.8rem;">Sin resultados' + escapeHTML(errMsg) + '</div>';
    }
  } catch (err) {
    resultsEl.innerHTML = '<div style="padding:10px;text-align:center;color:var(--danger);font-size:0.8rem;">Error: ' + escapeHTML(err.message) + '</div>';
  }
  btn.disabled = false;
  btn.textContent = 'Buscar';
}

/* ── YouTube Search ── */

async function searchYouTube() {
  const query = document.getElementById('yt-search-query').value.trim();
  if (!query) { showToast('Ingresa un nombre para buscar'); return; }
  const btn = document.getElementById('yt-search-btn');
  const resultsEl = document.getElementById('yt-search-results');
  btn.disabled = true;
  btn.textContent = 'Buscando...';
  resultsEl.style.display = 'block';
  resultsEl.innerHTML = '<div style="padding:10px;text-align:center;color:var(--text-muted);font-size:0.8rem;">Buscando...</div>';
  try {
    const result = await window.api.searchYoutube(query);
    if (result && result.success && result.results.length) {
      resultsEl.innerHTML = result.results.map((r, i) => {
        const mins = Math.floor((r.lengthSeconds || 0) / 60);
        const secs = (r.lengthSeconds || 0) % 60;
        const duration = mins > 0 ? mins + ':' + String(secs).padStart(2, '0') : secs + 's';
        return '<div class="bible-search-item yt-result-item" data-index="' + i + '" data-videoid="' + escapeHTML(r.videoId) + '" data-title="' + escapeHTML(r.title) + '">' +
          '<span class="bsi-ref">' + escapeHTML(r.title) + '</span>' +
          '<span class="bsi-text">' + escapeHTML(r.author) + ' &middot; ' + duration + '</span>' +
        '</div>';
      }).join('');
      resultsEl.querySelectorAll('.yt-result-item').forEach(el => {
        el.addEventListener('click', () => {
          const videoId = el.dataset.videoid;
          const title = el.dataset.title;
          document.getElementById('youtube-url').value = 'https://youtube.com/watch?v=' + videoId;
          currentVideoSrc = { type: 'youtube', url: 'https://youtube.com/watch?v=' + videoId };
          document.getElementById('video-path-display').textContent = 'YouTube: ' + title;
          document.getElementById('btn-project-video').disabled = false;
          document.getElementById('local-video-preview').style.display = 'none';
          resultsEl.style.display = 'none';
          projectVideo();
          showToast('Cargando: ' + title);
        });
      });
    } else {
      const errMsg = result && result.error ? ': ' + result.error : '';
      resultsEl.innerHTML = '<div style="padding:10px;text-align:center;color:var(--text-muted);font-size:0.8rem;">Sin resultados' + escapeHTML(errMsg) + '</div>';
    }
  } catch (err) {
    resultsEl.innerHTML = '<div style="padding:10px;text-align:center;color:var(--danger);font-size:0.8rem;">Error: ' + escapeHTML(err.message) + '</div>';
  }
  btn.disabled = false;
  btn.textContent = 'Buscar';
}

/* ── Update Checker ── */

function initUpdates() {
  document.getElementById('btn-check-updates').addEventListener('click', () => checkForUpdates(false));
  document.getElementById('ub-download').addEventListener('click', () => {
    var url = document.getElementById('ub-download').dataset.url;
    if (url) window.api.openExternalUrl(url);
  });
  document.getElementById('ub-changelog').addEventListener('click', () => {
    var version = document.getElementById('ub-changelog').dataset.version;
    var notes = document.getElementById('ub-changelog').dataset.notes;
    showChangelog(version, notes);
  });
  document.getElementById('ub-dismiss').addEventListener('click', () => {
    var version = document.getElementById('ub-dismiss').dataset.version;
    if (version) window.api.saveLastSeenVersion(version);
    hideUpdateBanner();
  });
  document.getElementById('btn-changelog-close').addEventListener('click', closeChangelog);
  document.getElementById('btn-changelog-close2').addEventListener('click', closeChangelog);
  document.getElementById('changelog-modal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('changelog-modal')) closeChangelog();
  });
  document.getElementById('btn-changelog-download').addEventListener('click', () => {
    var url = document.getElementById('btn-changelog-download').dataset.url;
    if (url) window.api.openExternalUrl(url);
    closeChangelog();
  });

  // Set current version display
  window.api.getAppVersion().then(v => {
    document.getElementById('rp-current-version').textContent = 'v' + v;
  });

  // Check for updates after 10s delay
  setTimeout(() => checkForUpdates(true), 10000);
}

async function checkForUpdates(silent) {
  var btn = document.getElementById('btn-check-updates');
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Buscando...';
  }
  try {
    var result = await window.api.checkUpdates();
    if (result.error && !silent) {
      showToast('Error al buscar: ' + result.error);
    } else if (result.hasUpdate) {
      var lastSeen = window._seenVersion;
      if (lastSeen !== result.latestVersion) {
        showUpdateBanner(result);
      } else if (!silent) {
        showToast('Nueva versión ' + result.latestVersion + ' disponible (descartada)');
      }
    } else if (!silent) {
      showToast('Tienes la última versión (' + result.currentVersion + ')');
    }
  } catch (e) {
    if (!silent) showToast('Error: ' + e.message);
  }
  if (btn) {
    btn.disabled = false;
    btn.textContent = '🔃 Buscar actualizaciones';
  }
}

function showUpdateBanner(data) {
  var banner = document.getElementById('update-banner');
  var text = document.getElementById('ub-text');
  text.textContent = 'Nueva versión v' + data.latestVersion + ' disponible';
  document.getElementById('ub-download').dataset.url = data.downloadUrl;
  document.getElementById('ub-changelog').dataset.version = data.latestVersion;
  document.getElementById('ub-changelog').dataset.notes = data.releaseNotes || 'Sin notas de versión.';
  document.getElementById('ub-dismiss').dataset.version = data.latestVersion;
  banner.classList.add('show');
}

function hideUpdateBanner() {
  document.getElementById('update-banner').classList.remove('show');
}

function showChangelog(version, notes) {
  document.getElementById('changelog-version').textContent = 'v' + version;
  document.getElementById('changelog-body').textContent = notes || 'Sin notas de versión.';
  document.getElementById('btn-changelog-download').dataset.url = document.getElementById('ub-download').dataset.url;
  document.getElementById('changelog-modal').style.display = 'flex';
}

function closeChangelog() {
  document.getElementById('changelog-modal').style.display = 'none';
}

/* ── Health Check ── */

let healthCheckFails = 0;

function startHealthCheck() {
  setInterval(async () => {
    try {
      const result = await window.api.ping();
      if (result && result.alive === false) {
        healthCheckFails++;
      } else {
        healthCheckFails = 0;
      }
    } catch {
      healthCheckFails++;
    }
    if (healthCheckFails >= 3) {
      showToast('Reconectando proyección...');
      try {
        await window.api.reloadProjection();
        healthCheckFails = 0;
        showToast('Proyección reconectada');
      } catch {}
    }
  }, 10000);
}

async function loadSettings() {
  try {
    const saved = await window.api.loadSettings();
    if (saved) {
      Object.assign(projectionSettings, saved);
      if (saved.currentBackground) {
        currentBackground = saved.currentBackground;
      }
      if (saved.lastSeenVersion) {
        window._seenVersion = saved.lastSeenVersion;
      }
      applySavedSettings();
    }
  } catch {}
}

function applySavedSettings() {
  const applySelect = (id, value) => {
    const el = document.getElementById(id);
    if (el && value !== undefined) el.value = value;
  };
  const applyColor = (id, value) => {
    const el = document.getElementById(id);
    if (el && value !== undefined) el.value = value;
  };
  const applyCheck = (id, value) => {
    const el = document.getElementById(id);
    if (el && value !== undefined) el.checked = value;
  };

  applySelect('rp-font-family', projectionSettings.fontFamily);
  const sizeSlider = document.getElementById('rp-font-size');
  if (projectionSettings.fontSize) {
    const rem = parseFloat(projectionSettings.fontSize);
    sizeSlider.value = rem;
    document.getElementById('rp-font-size-label').textContent = rem + 'rem';
  }
  applyColor('rp-text-color', projectionSettings.textColor);
  applySelect('rp-line-spacing', String(projectionSettings.lineSpacing));
  applyCheck('rp-show-ref', projectionSettings.showRef);
  applyCheck('rp-show-nums', projectionSettings.showNums);
  applyCheck('rp-text-shadow', projectionSettings.textShadow);
  applySelect('rp-shadow-intensity', String(projectionSettings.shadowIntensity));
  applySelect('rp-lyrics-style', projectionSettings.lyricsStyle);
  applySelect('rp-transition', projectionSettings.transition);
  applySelect('rp-bg-dim', String(projectionSettings.bgDim));
  applyColor('rp-verse-num-color', projectionSettings.verseNumColor);
  applySelect('rp-ref-font', projectionSettings.refFont || '');
  applyColor('rp-ref-color', projectionSettings.refColor);
  applySelect('rp-ref-size', projectionSettings.refSize);

  currentTransition = projectionSettings.transition;
  currentLyricsStyle = projectionSettings.lyricsStyle;
  syncSettingsToTabs();
  updatePreview();
  window.api.project({ type: 'update-settings', settings: { ...projectionSettings } });
  if (currentBackground) {
    window.api.project({ type: 'set-background', content: currentBackground });
  }
}
