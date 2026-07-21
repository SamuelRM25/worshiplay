let currentType = 'blank';
let isFrozen = false;
let contentCache = null;
let currentSettings = {};
let currentSetlist = [];
let currentSetlistIndex = 0;
let pendingProjection = null;

document.addEventListener('DOMContentLoaded', async () => {
  window.api.onProject((data) => {
    try {
      if (isFrozen && data.type !== 'freeze') return;
      if (data.type === 'freeze') { isFrozen = !isFrozen; return; }
      if (data.type === 'set-background') {
        setBackground(data.content);
        applyDim(currentSettings.bgDim);
        return;
      }
      if (data.type === 'update-settings') {
        Object.assign(currentSettings, data.settings);
        applyTransition(currentSettings.transition || 'crossfade');
        setTimeout(() => reapplyStyles(), 100);
        return;
      }
      if (data.type === 'clear-content') { animateOutContent(); return; }
      if (data.type === 'stop-video') { stopVideo(); return; }
      if (data.type === 'pip-add') { addPIP(data.content); return; }
      if (data.type === 'pip-update') { updatePIP(data.content); return; }
      if (data.type === 'pip-remove') { removePIP(data.content); return; }
      if (data.type === 'pip-clear') { clearPIPs(); return; }
      if (data.type === 'word-highlight') { showWordHighlight(data.content); return; }
      if (data.type === 'word-clear') { clearWordHighlight(); return; }
      isFrozen = false;
      if (pendingProjection) {
        applyProjection(data);
      } else {
        pendingProjection = data;
      }
    } catch (err) {
      console.error('Error en onProject:', err);
    }
  });

  const firstTime = await window.api.isFirstProjection();
  if (firstTime) {
    await showStartupCountdown();
  }

  if (pendingProjection && pendingProjection.type !== 'blank') {
    applyProjection(pendingProjection);
  } else {
    const data = await window.api.getProjectionData();
    if (data && data.type !== 'blank' && data.type !== 'update-settings' && data.type !== 'set-background' && data.type !== 'welcome') {
      applyProjection(data);
    } else {
      hideAll();
    }
  }
});

window.addEventListener('error', (e) => {
  console.error('Error global en proyección:', e.error || e.message);
});

function applyProjection(data) {
  contentCache = data;
  if (data.transition) currentSettings.transition = data.transition;
  Object.assign(currentSettings, data);
  hideAll();
  applyTransition(data.transition || currentSettings.transition || 'crossfade');

  switch (data.type) {
    case 'song': showSong(data); break;
    case 'setlist': showSetlist(data); break;
    case 'bible': showBible(data); break;
    case 'video': showVideo(data); break;
    case 'blank': showBlank(); break;
    case 'logo': showLogo(); break;
    case 'welcome': showWelcome(); break;
    case 'note': showNote(data); break;
    case 'announcement': showAnnouncement(data); break;
    default: showBlank();
  }
  currentType = data.type;
}

function reapplyStyles() {
  if (currentType === 'bible' && contentCache) {
    showBible({ ...contentCache, ...currentSettings });
    return;
  }
  const el = document.getElementById(currentType + '-display');
  if (!el || el.style.display === 'none') return;
  if (currentType === 'song') {
    const lyricsEl = document.getElementById('song-lyrics');
    if (lyricsEl) applyContentStyles(lyricsEl, currentSettings);
  } else if (currentType === 'video') {
    applyDim(currentSettings.bgDim);
  }
}

function hideAll() {
  ['song-display', 'bible-display', 'video-display', 'blank-display', 'logo-display'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });
  const noteEl = document.getElementById('note-display');
  if (noteEl) { noteEl.style.display = 'none'; noteEl.innerHTML = ''; }
  const ann = document.getElementById('announcement-banner');
  if (ann) { ann.style.display = 'none'; var t = ann.querySelector('#announcement-banner-text'); if (t) t.classList.remove('scroll'); }
  const overlay = document.getElementById('video-lyrics-overlay');
  if (overlay) overlay.innerHTML = '';
  const refBar = document.getElementById('ref-bar');
  if (refBar) { refBar.style.display = 'none'; }
}

function animateOutContent() {
  const displays = ['song-display', 'bible-display', 'logo-display'];
  let animated = false;
  displays.forEach(id => {
    const el = document.getElementById(id);
    if (el && el.style.display !== 'none' && el.style.display !== '') {
      el.classList.add('animate-fade-out');
      animated = true;
    }
  });
  if (animated) {
    setTimeout(() => {
      hideContentOnly();
      displays.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.remove('animate-fade-out');
      });
    }, 400);
  } else {
    hideContentOnly();
  }
}

function hideContentOnly() {
  ['song-display', 'bible-display', 'logo-display'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });
  const refBar = document.getElementById('ref-bar');
  if (refBar) { refBar.style.display = 'none'; }
}

function stopVideo() {
  const video = document.getElementById('projected-video');
  const iframe = document.querySelector('#video-display iframe');
  if (video) { video.pause(); video.src = ''; video.style.display = 'none'; }
  if (iframe) { iframe.remove(); }
  const vd = document.getElementById('video-display');
  if (vd) vd.style.display = 'none';
}

function applyTransition(type) {
  const layer = document.getElementById('content-layer');
  if (!layer) return;
  layer.className = '';
  layer.classList.add('transition-' + type);
  layer.style.animation = 'none';
  void layer.offsetHeight;
  layer.style.animation = '';
  // Force visible after animation regardless
  setTimeout(function() {
    layer.style.opacity = '1';
  }, 900);
}

function setBackground(bg) {
  var video = document.getElementById('bg-video');
  var image = document.getElementById('bg-image');
  var gradient = document.getElementById('bg-gradient');

  // If same bg, skip
  var currentSrc = video.style.display !== 'none' ? video.src : image.src;
  if (bg && currentSrc === bg.path) return;

  if (bg && bg.type === 'video') {
    video.style.opacity = '0';
    image.style.display = 'none';
    video.style.display = 'block';
    video.src = bg.path;
    video.loop = true;
    video.play().catch(function() {});
    gradient.style.background = '';
    // Fade in with RAF
    requestAnimationFrame(function() { video.style.opacity = '1'; });
  } else if (bg && bg.type === 'image') {
    image.style.opacity = '0';
    video.style.display = 'none';
    video.pause();
    image.style.display = 'block';
    image.src = bg.path;
    gradient.style.background = '';
    requestAnimationFrame(function() { image.style.opacity = '1'; });
  } else {
    video.style.display = 'none';
    video.pause();
    video.src = '';
    image.style.display = 'none';
    gradient.style.background = 'linear-gradient(135deg, #0a0a12 0%, #1a1a2e 100%)';
  }
}

function applyDim(level) {
  const dim = document.getElementById('bg-dim');
  if (!dim) return;
  currentSettings.bgDim = level;
  if (level && level > 0) {
    dim.style.background = 'rgba(0,0,0,' + level + ')';
    dim.classList.add('active');
  } else {
    dim.style.background = '';
    dim.classList.remove('active');
  }
}

function applyContentStyles(el, data) {
  if (!el) return;
  const s = el.style;
  if (data.fontFamily) s.fontFamily = data.fontFamily;
  if (data.fontSize) s.fontSize = data.fontSize;
  if (data.textColor) s.color = data.textColor;
  if (data.textAlign) s.textAlign = data.textAlign;
  if (data.lineSpacing) s.lineHeight = data.lineSpacing;

  const parent = el.parentElement;
  if (parent) {
    if (data.verticalPos === 'top') {
      parent.style.justifyContent = 'flex-start';
      parent.style.alignItems = 'center';
    } else if (data.verticalPos === 'bottom') {
      parent.style.justifyContent = 'flex-end';
      parent.style.alignItems = 'center';
    } else {
      parent.style.justifyContent = 'center';
      parent.style.alignItems = 'center';
    }
  }

  if (data.textShadow && data.shadowIntensity) {
    s.textShadow = '0 2px 20px rgba(0,0,0,' + data.shadowIntensity + ')';
  } else if (data.textShadow === false) {
    s.textShadow = 'none';
  }

  applyDim(data.bgDim);
}

function applyVerseNumberStyles(el, data) {
  if (!el) return;
  el.querySelectorAll('.verse-num').forEach(span => {
    if (data.verseNumColor) span.style.color = data.verseNumColor;
    if (data.verseNumFont) span.style.fontFamily = data.verseNumFont;
    if (data.verseNumSize) span.style.fontSize = data.verseNumSize;
  });
}

function applyRefStyles(el, data) {
  if (!el) return;
  if (data.refColor) el.style.color = data.refColor;
  if (data.refFont) el.style.fontFamily = data.refFont;
  if (data.refSize) el.style.fontSize = data.refSize;
}

function showSong(data) {
  const el = document.getElementById('song-display');
  el.style.display = 'flex';
  // Reset alignment before applying styles
  el.style.justifyContent = '';
  el.style.alignItems = '';

  const style = data.lyricsStyle || 'glow';
  const lyrics = ((data.content && data.content.le) || '').replace(/\\n/g, '\n');
  const showBlock = data.showBlock;

  const lyricsEl = document.getElementById('song-lyrics');
  lyricsEl.innerHTML = formatLyricsHTML(lyrics, style, showBlock);
  lyricsEl.className = 'lyrics-' + style;

  applyContentStyles(lyricsEl, data);

  // Responsive font sizing for songs
  if (lyricsEl.textContent) {
    var lineCount = lyricsEl.querySelectorAll('.lyric-line').length || 1;
    var userSize = data.fontSize ? parseFloat(data.fontSize) : 0;
    lyricsEl.style.fontSize = calcResponsiveFontSize(lyricsEl.textContent, lineCount, userSize);
  }
}

function showSetlist(data) {
  const el = document.getElementById('song-display');
  el.style.display = 'flex';
  const style = data.lyricsStyle || 'glow';
  const songs = Array.isArray(data.content) ? data.content : [];
  const lyricsEl = document.getElementById('song-lyrics');

  if (!currentSetlistIndex) currentSetlistIndex = 0;
  if (currentSetlistIndex >= songs.length) currentSetlistIndex = 0;

  const song = songs[currentSetlistIndex];
  if (!song) { showBlank(); return; }

  const lyrics = (song.le || '').replace(/\\n/g, '\n');
  lyricsEl.innerHTML = formatLyricsHTML(lyrics, style, data.showBlock);
  lyricsEl.className = 'lyrics-' + style;
  applyContentStyles(lyricsEl, data);
  currentSetlist = songs;
}

function formatLyricsHTML(lyrics, style, showBlock) {
  const blocks = lyrics.split(/\n\n+/).map(b => b.split('\n').map(l => l.trim()).filter(l => l)).filter(b => b.length);
  if (!blocks.length) return '<div class="lyrics-container"></div>';

  let html = '<div class="lyrics-container">';
  if (showBlock !== undefined && showBlock >= 0 && showBlock < blocks.length) {
    const block = blocks[showBlock];
    for (const line of block) {
      if (line.startsWith('//')) {
        html += '<div class="lyric-section">' + escapeHTML(line.replace(/\//g, '').trim()) + '</div>';
      } else {
        html += '<div class="lyric-line lyric-' + style + '">' + escapeHTML(line) + '</div>';
      }
    }
  } else {
    for (const block of blocks) {
      for (const line of block) {
        if (line.startsWith('//')) {
          html += '<div class="lyric-section">' + escapeHTML(line.replace(/\//g, '').trim()) + '</div>';
        } else {
          html += '<div class="lyric-line lyric-' + style + '">' + escapeHTML(line) + '</div>';
        }
      }
      html += '<div class="lyric-block-spacer"></div>';
    }
  }
  html += '</div>';
  return html;
}

function escapeHTML(text) {
  if (typeof text !== 'string') return '';
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function showBible(data) {
  const el = document.getElementById('bible-display');
  el.style.display = 'flex';

  const c = data.content;
  const textEl = document.getElementById('bible-text');

  textEl.innerHTML = (c.verses || []).map(function(v) {
    var num = c.showNums ? '<span class="verse-num">' + v.verse + '</span>' : '';
    var words = escapeHTML(v.text).split(' ').map(function(w) {
      return '<span class="bible-word" onclick="toggleWordHighlight(this)">' + w + '</span>';
    }).join(' ');
    return '<div class="verse-line">' + num + '<span class="verse-text">' + words + '</span></div>';
  }).join('');
  applyContentStyles(textEl, data);
  applyVerseNumberStyles(textEl, data);

  // Responsive font sizing — respects user preference as baseline
  if (c.verses && c.verses.length) {
    var fullText = c.verses.map(function(v) { return v.text; }).join(' ');
    var userSize = data.fontSize ? parseFloat(data.fontSize) : 0;
    var fontSize = calcResponsiveFontSize(fullText, c.verses.length, userSize);
    textEl.style.fontSize = fontSize;
  }

  var refBar = document.getElementById('ref-bar');
  var refText = document.getElementById('ref-bar-text');
  if (c.showRef && c.book) {
    refText.textContent = c.book + ' ' + c.chapter + (c.verses && c.verses.length === 1 ? ':' + c.verses[0].verse : '');
    refBar.style.display = 'block';
    applyRefStyles(refText, data);
  } else {
    refBar.style.display = 'none';
  }
}

function calcResponsiveFontSize(text, lineCount, userSize) {
  var maxW = window.innerWidth * 0.85;
  var maxH = window.innerHeight * 0.7;
  var wFactor = maxW / 20;
  var hFactor = maxH / (lineCount || 1);
  var base = Math.min(wFactor, hFactor);
  var len = text.length;
  if (len > 800) base *= 0.55;
  else if (len > 400) base *= 0.7;
  else if (len > 200) base *= 0.85;
  if (lineCount > 5) base *= 0.85;
  if (lineCount > 10) base *= 0.7;
  if (userSize > 0) base = Math.min(base, userSize * 16);
  base = Math.max(18, Math.round(base));
  return base + 'px';
}

var highlightedWord = null;
function toggleWordHighlight(el) {
  var overlay = document.getElementById('word-overlay');
  var overlayText = document.getElementById('word-overlay-text');
  if (highlightedWord === el) {
    clearWordHighlight();
    return;
  }
  highlightedWord = el;
  document.querySelectorAll('.bible-word').forEach(function(w) {
    w.style.opacity = '0.12';
    w.style.transition = 'opacity 0.4s';
  });
  var word = el.textContent;
  overlayText.textContent = word;
  overlayText.style.fontFamily = currentSettings.fontFamily || 'Inter';
  overlayText.style.fontSize = '5rem';
  overlayText.style.color = '#ffd700';
  overlayText.style.textShadow = '0 0 40px rgba(255,215,0,0.8), 0 0 80px rgba(255,215,0,0.4)';
  overlay.style.display = 'flex';
}

function showWordHighlight(data) {
  var overlay = document.getElementById('word-overlay');
  var overlayText = document.getElementById('word-overlay-text');
  clearWordHighlight();

  if (!data || !data.words || !data.words.length) return;

  if (data.effect === 'overlay') {
    overlayText.textContent = data.words.join(' ');
    overlayText.style.fontFamily = currentSettings.fontFamily || 'Inter';
    overlayText.style.fontSize = '5rem';
    overlayText.style.color = '#ffd700';
    overlayText.style.textShadow = '0 0 40px rgba(255,215,0,0.8), 0 0 80px rgba(255,215,0,0.4)';
    overlay.style.display = 'flex';
  } else {
    // Apply inline effects on matching Bible words in projection
    var effectMap = {
      highlight: { background: 'rgba(255,215,0,0.3)', borderRadius: '3px', padding: '1px 3px' },
      underline: { textDecoration: 'underline', textDecorationColor: '#ffd700', textDecorationThickness: '2px' },
      bold: { fontWeight: 'bold' },
      color: { color: '#ffd700' },
      circle: { outline: '2px solid #ffd700', outlineOffset: '1px', borderRadius: '4px', padding: '1px 3px' }
    };
    var styles = effectMap[data.effect];
    if (!styles) return;

    var targetWords = data.words.map(function(w) { return w.toLowerCase(); });
    var bibleWords = document.querySelectorAll('.bible-word');
    bibleWords.forEach(function(w) {
      w.style.opacity = '1';
      w.style.background = '';
      w.style.textDecoration = '';
      w.style.fontWeight = '';
      w.style.color = '';
      w.style.outline = '';
      w.style.borderRadius = '';
      w.style.padding = '';
      if (targetWords.indexOf(w.textContent.toLowerCase()) !== -1) {
        Object.keys(styles).forEach(function(key) {
          w.style[key] = styles[key];
        });
      }
    });
  }
}

function clearWordHighlight() {
  var overlay = document.getElementById('word-overlay');
  overlay.style.display = 'none';
  document.querySelectorAll('.bible-word').forEach(function(w) {
    w.style.opacity = '1';
    w.style.background = '';
    w.style.textDecoration = '';
    w.style.fontWeight = '';
    w.style.color = '';
    w.style.outline = '';
    w.style.borderRadius = '';
    w.style.padding = '';
  });
  highlightedWord = null;
}

function showVideo(data) {
  const el = document.getElementById('video-display');
  el.style.display = 'block';

  const video = document.getElementById('projected-video');
  const src = data.content;

  video.style.display = 'none';
  const existingIframe = el.querySelector('iframe');
  if (existingIframe) existingIframe.remove();

  if (src.type === 'local') {
    video.style.display = 'block';
    video.src = src.path;
    video.play().catch(function() {});
  } else if (src.type === 'youtube') {
    const videoId = extractYoutubeId(src.url);
    if (videoId) {
      var iframe = document.createElement('iframe');
      iframe.src = 'https://www.youtube-nocookie.com/embed/' + videoId + '?autoplay=1&rel=0&modestbranding=1&hl=es&iv_load_policy=3&fs=1&playsinline=1&cc_load_policy=0';
      iframe.style.cssText = 'width:100%;height:100%;border:none;';
      iframe.allow = 'autoplay; encrypted-media; fullscreen; picture-in-picture';
      iframe.allowFullscreen = true;
      el.appendChild(iframe);
      var overlay = document.getElementById('video-lyrics-overlay');
      el.appendChild(overlay);
    }
  } else if (src.type === 'url') {
    video.style.display = 'block';
    video.src = src.url;
    video.play().catch(function() {});
  }
  applyDim(data.bgDim);
}

function extractYoutubeId(url) {
  var m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  if (m) return m[1];
  m = url.match(/^([a-zA-Z0-9_-]{11})$/);
  return m ? m[1] : null;
}

function showBlank() {
  document.getElementById('blank-display').style.display = 'block';
}

function showLogo() {
  document.getElementById('logo-display').style.display = 'flex';
  applyDim(currentSettings.bgDim);
}

function showWelcome() {
  hideAll();
  var el = document.getElementById('logo-display');
  el.style.display = 'flex';
  var h1 = el.querySelector('h1');
  if (h1) h1.innerHTML = 'Bienvenido';
  var p = el.querySelector('p');
  if (p) p.textContent = 'WorshiPlay — Sistema de Proyección';
  applyDim(currentSettings.bgDim);
}

function addPIP(data) {
  var container = document.getElementById('pip-overlays');
  var el = document.createElement('div');
  el.className = 'pip-item';
  el.dataset.pipId = data.id || Date.now();

  var pos = data.position || 'bottom-right';
  var size = data.size || 'medium';
  var sizeMap = { small: '15vw', medium: '25vw', large: '35vw' };
  var posMap = {
    'top-left':    { top: '20px',  left: '20px',  right: '', bottom: '' },
    'top-right':   { top: '20px',  left: '',      right: '20px', bottom: '' },
    'bottom-left': { top: '',      left: '20px',  right: '', bottom: '20px' },
    'bottom-right':{ top: '',      left: '',      right: '20px', bottom: '20px' }
  };
  var p = posMap[pos] || posMap['bottom-right'];
  el.style.cssText = 'position:fixed;' +
    'top:' + p.top + ';left:' + p.left + ';right:' + p.right + ';bottom:' + p.bottom + ';' +
    'width:' + (sizeMap[size] || sizeMap.medium) + ';' +
    'z-index:50;border-radius:8px;overflow:hidden;' +
    'background:transparent;';

  if (data.type === 'video') {
    var vid = document.createElement('video');
    vid.src = data.path;
    vid.autoplay = true;
    vid.loop = true;
    vid.muted = data.muted !== false;
    vid.controls = false;
    vid.setAttribute('playsinline', '');
    vid.style.cssText = 'position:absolute;left:-9999px;'; // hide offscreen
    el.appendChild(vid);

    // Canvas for chroma key
    var canvas = document.createElement('canvas');
    canvas.className = 'pip-canvas';
    el.appendChild(canvas);

    // Process frames to remove black background
    var ctx = canvas.getContext('2d');
    var skipFrames = 2, frameCount = 0;
    var processing = false;

    function processFrame() {
      if (vid.paused || vid.ended) {
        if (!vid.ended) setTimeout(processFrame, 100);
        return;
      }
      if (processing) { requestAnimationFrame(processFrame); return; }
      processing = true;

      var w = vid.videoWidth || 320;
      var h = vid.videoHeight || 240;
      if (canvas.width !== w) { canvas.width = w; canvas.height = h; }

      frameCount++;
      if (frameCount >= skipFrames) {
        frameCount = 0;
        ctx.drawImage(vid, 0, 0, w, h);
        try {
          var imgData = ctx.getImageData(0, 0, w, h);
          var d = imgData.data;
          for (var i = 0; i < d.length; i += 4) {
            var b = d[i] * 0.299 + d[i+1] * 0.587 + d[i+2] * 0.114;
            if (b < 40) d[i+3] = 0;
          }
          ctx.putImageData(imgData, 0, 0);
        } catch(e) {
          ctx.drawImage(vid, 0, 0, w, h);
        }
      }
      processing = false;
      requestAnimationFrame(processFrame);
    }

    vid.addEventListener('loadedmetadata', function() {
      canvas.width = vid.videoWidth || 320;
      canvas.height = vid.videoHeight || 240;
    });
    vid.addEventListener('play', processFrame);
    if (!vid.paused) processFrame();
  }

  container.appendChild(el);
}

function updatePIP(data) {
  var el = document.querySelector('.pip-item[data-pip-id="' + data.id + '"]');
  if (!el) return;
  var sizeMap = { small: '15vw', medium: '25vw', large: '35vw' };
  var posMap = {
    'top-left':    { top: '20px',  left: '20px',  right: '', bottom: '' },
    'top-right':   { top: '20px',  left: '',      right: '20px', bottom: '' },
    'bottom-left': { top: '',      left: '20px',  right: '', bottom: '20px' },
    'bottom-right':{ top: '',      left: '',      right: '20px', bottom: '20px' }
  };
  var p = posMap[data.position] || posMap['bottom-right'];
  el.style.cssText = 'position:fixed;' +
    'top:' + p.top + ';left:' + p.left + ';right:' + p.right + ';bottom:' + p.bottom + ';' +
    'width:' + (sizeMap[data.size] || sizeMap.medium) + ';' +
    'z-index:50;border-radius:8px;overflow:hidden;' +
    'background:transparent;';
}

function removePIP(id) {
  var el = document.querySelector('.pip-item[data-pip-id="' + id + '"]');
  if (el) {
    var vid = el.querySelector('video');
    if (vid) { vid.pause(); vid.src = ''; }
    el.remove();
  }
}

function clearPIPs() {
  document.getElementById('pip-overlays').innerHTML = '';
}

function showStartupCountdown() {
  return new Promise(function(resolve) {
    var overlay = document.createElement('div');
    overlay.id = 'startup-countdown';
    overlay.innerHTML =
      '<div id="sc-content">' +
        '<div id="sc-label">INICIANDO</div>' +
        '<div id="sc-number">5</div>' +
        '<div id="sc-bar"><div id="sc-bar-fill"></div></div>' +
      '</div>';
    document.body.appendChild(overlay);

    var numEl = document.getElementById('sc-number');
    var barEl = document.getElementById('sc-bar-fill');
    var total = 5;
    var start = Date.now();

    function tick() {
      var elapsed = (Date.now() - start) / 1000;
      var remaining = Math.max(0, total - elapsed);
      var secs = Math.ceil(remaining);
      numEl.textContent = secs;
      barEl.style.width = ((total - remaining) / total * 100) + '%';
      if (remaining > 0) {
        requestAnimationFrame(tick);
      } else {
        numEl.textContent = '0';
        barEl.style.width = '100%';
        overlay.classList.add('sc-fade-out');
        setTimeout(function() {
          overlay.remove();
          resolve();
        }, 400);
      }
    }
    tick();
  });
}

function showNote(data) {
  hideAll();
  var el = document.getElementById('note-display');
  if (!data.content || !data.content.text) { el.style.display = 'none'; return; }
  var text = data.content.text.replace(/\\n/g, '\n');
  el.innerHTML = '<div id="note-display-content">' + escapeHTML(text).replace(/\n/g, '<br>') + '</div>';
  el.style.display = 'flex';
  applyContentStyles(el.querySelector('#note-display-content'), data);
  // Responsive sizing
  var contentEl = el.querySelector('#note-display-content');
  if (contentEl && text) {
    var words = text.split(/\s+/).length;
    var lineCount = Math.ceil(words / 8) || 1;
    var userSize = data.fontSize ? parseFloat(data.fontSize) : 0;
    contentEl.style.fontSize = calcResponsiveFontSize(text, lineCount, userSize);
    contentEl.style.maxWidth = '85%';
  }
}

function showAnnouncement(data) {
  var ann = document.getElementById('announcement-banner');
  var textEl = document.getElementById('announcement-banner-text');
  if (!data.content || !data.content.text) { ann.style.display = 'none'; return; }
  var repeat = data.content.repeat || 1;
  var count = 0;
  var duration = Math.max(4000, 8000 - (data.content.text.length * 20));

  textEl.textContent = data.content.text;
  ann.style.display = 'flex';

  function playCycle() {
    count++;
    textEl.classList.remove('scroll');
    void textEl.offsetWidth;
    textEl.classList.add('scroll');
    textEl.style.animationDuration = duration + 'ms';

    if (count < repeat) {
      setTimeout(function() {
        textEl.classList.remove('scroll');
        playCycle();
      }, duration + 200);
    } else {
      setTimeout(function() {
        ann.style.display = 'none';
        textEl.classList.remove('scroll');
      }, duration);
    }
  }
  playCycle();
}
