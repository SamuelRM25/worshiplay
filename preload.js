const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getSongs: () => ipcRenderer.invoke('get-songs'),
  getBible: () => ipcRenderer.invoke('get-bible'),
  convertBible: () => ipcRenderer.invoke('convert-bible'),
  getBackgrounds: () => ipcRenderer.invoke('get-backgrounds'),
  openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),
  openBiFileDialog: () => ipcRenderer.invoke('open-bi-file-dialog'),
  project: (data) => ipcRenderer.invoke('project', data),
  getProjectionData: () => ipcRenderer.invoke('get-projection-data'),
  getLocalVideo: (relativePath) => ipcRenderer.invoke('get-local-video', relativePath),
  onProject: (callback) => {
    ipcRenderer.on('project', (event, data) => callback(data));
  },
  getAvailableBibles: () => ipcRenderer.invoke('get-available-bibles'),
  downloadBible: (url, name) => ipcRenderer.invoke('download-bible', url, name),
  getDisplays: () => ipcRenderer.invoke('get-displays'),
  setProjectionDisplay: (index) => ipcRenderer.invoke('set-projection-display', index),
  toggleProjection: () => ipcRenderer.invoke('toggle-projection'),
  getProjectionVisible: () => ipcRenderer.invoke('get-projection-visible'),
  saveNewSong: (data) => ipcRenderer.invoke('save-new-song', data),
  updateSong: (data) => ipcRenderer.invoke('update-song', data),
  deleteSong: (id) => ipcRenderer.invoke('delete-song', id),
  fetchLetras: (data) => ipcRenderer.invoke('fetch-letras', data),
  searchLetras: (query) => ipcRenderer.invoke('search-letras', query),
  searchYoutube: (query) => ipcRenderer.invoke('search-youtube', query),
  ping: () => ipcRenderer.invoke('ping'),
  reloadProjection: () => ipcRenderer.invoke('reload-projection'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  loadSettings: () => ipcRenderer.invoke('load-settings'),
  isFirstProjection: () => ipcRenderer.invoke('is-first-projection'),
  searchWordMeaning: (word) => ipcRenderer.invoke('search-word-meaning', word),
  searchExegesis: (query) => ipcRenderer.invoke('search-exegesis', query),
  openExternalUrl: (url) => ipcRenderer.invoke('open-external-url', url),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  checkUpdates: () => ipcRenderer.invoke('check-for-updates'),
  saveLastSeenVersion: (version) => ipcRenderer.invoke('save-last-seen-version', version)
});
