const fs = require('fs');
const path = require('path');

const VIDEO_EXTS = new Set(['.mp4', '.webm', '.mov', '.avi', '.mkv', '.m4v']);
const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp']);

function scanBackgrounds(dirPath) {
  const items = [];
  function walk(dir, relFolder) {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(full, relFolder ? `${relFolder}/${entry.name}` : entry.name);
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          const type = VIDEO_EXTS.has(ext) ? 'video' : IMAGE_EXTS.has(ext) ? 'image' : null;
          if (type) {
            items.push({ path: full, type, folder: relFolder || '', name: entry.name });
          }
        }
      }
    } catch {}
  }
  walk(dirPath, '');
  return items;
}

module.exports = { scanBackgrounds };
