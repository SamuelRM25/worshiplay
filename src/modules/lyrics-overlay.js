const STYLES = {
  SIMPLE: 'simple',
  KARAOKE: 'karaoke',
  TYPING: 'typing',
  REVEAL: 'reveal',
  BOUNCE: 'bounce',
  GLOW: 'glow'
};

function generateLyricsHTML(lyrics, style = STYLES.GLOW) {
  const lines = lyrics.replace(/\\n/g, '\n').split('\n').filter(l => l.trim());
  let html = '<div class="lyrics-container">';
  lines.forEach((line, i) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('//')) {
      html += `<div class="lyric-section">${trimmed.replace(/\//g, '')}</div>`;
    } else {
      html += `<div class="lyric-line lyric-${style}" data-index="${i}">${escapeHtml(trimmed)}</div>`;
    }
  });
  html += '</div>';
  return html;
}

function escapeHtml(text) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return text.replace(/[&<>"']/g, c => map[c]);
}

function getLyricsCSS(style) {
  const base = `
    .lyrics-container { position:absolute; bottom:10%; left:5%; right:5%; text-align:center; z-index:10; }
    .lyric-section { font-size:1.5rem; color:#b8860b; text-transform:uppercase; letter-spacing:4px; margin:10px 0; opacity:0.7; }
    .lyric-line { font-size:3.2rem; font-weight:700; line-height:1.6; margin:8px 0; text-shadow:0 2px 20px rgba(0,0,0,0.8); }
  `;
  switch (style) {
    case STYLES.SIMPLE:
      return base + `.lyric-simple { color:#fff; transition:opacity 0.5s; }`;
    case STYLES.KARAOKE:
      return base + `.lyric-karaoke { color:#ddd; background:linear-gradient(90deg,#ffd700 50%,#ddd 50%); background-size:200% 100%; background-position:100%; -webkit-background-clip:text; -webkit-text-fill-color:transparent; transition:background-position 0.3s; }`;
    case STYLES.TYPING:
      return base + `.lyric-typing { color:#fff; overflow:hidden; white-space:nowrap; border-right:3px solid #ffd700; animation:typing 2s steps(30) forwards; width:0; @keyframes typing { to{width:100%} } }`;
    case STYLES.GLOW:
      return base + `.lyric-glow { color:#fff; text-shadow:0 0 10px rgba(255,215,0,0.5), 0 0 20px rgba(255,215,0,0.3), 0 0 40px rgba(255,215,0,0.1), 0 2px 20px rgba(0,0,0,0.8); animation:glowIn 0.8s ease-out; }
        @keyframes glowIn { 0%{opacity:0;transform:translateY(10px);text-shadow:0 0 0 transparent} 100%{opacity:1;transform:translateY(0)} }`;
    case STYLES.REVEAL:
      return base + `.lyric-reveal { color:#fff; clip-path:inset(0 100% 0 0); animation:reveal 1s ease-out forwards; }
        @keyframes reveal { to{clip-path:inset(0 0 0 0)} }`;
    case STYLES.BOUNCE:
      return base + `.lyric-bounce { color:#fff; animation:bounceIn 0.6s cubic-bezier(0.68,-0.55,0.265,1.55); }
        @keyframes bounceIn { 0%{opacity:0;transform:scale(0.3)} 50%{transform:scale(1.05)} 70%{transform:scale(0.9)} 100%{opacity:1;transform:scale(1)} }`;
    default:
      return base + `.lyric-glow { color:#fff; text-shadow:0 0 10px rgba(255,215,0,0.5); animation:fadeIn 0.5s; } @keyframes fadeIn { from{opacity:0} to{opacity:1} }`;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { STYLES, generateLyricsHTML, getLyricsCSS };
}
