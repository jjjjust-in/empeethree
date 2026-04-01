const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs   = require('fs');
const os   = require('os');

let mainWindow;
const AUDIO_EXTS = new Set(['.mp3', '.wav', '.ogg', '.flac', '.m4a']);

// ── Config ─────────────────────────────────────────────────────────────────
const configPath = path.join(app.getPath('userData'), 'config.json');
function loadConfig() {
  try { return JSON.parse(fs.readFileSync(configPath, 'utf8')); }
  catch { return {}; }
}
function saveConfig(data) {
  fs.writeFileSync(configPath, JSON.stringify(data, null, 2));
}

// ── Library Index ──────────────────────────────────────────────────────────
// Each track: { name, filename, path, artist, album }
function buildIndex(rootPath) {
  const tracks = [];

  function walk(dirPath, artist, album) {
    let entries;
    try { entries = fs.readdirSync(dirPath, { withFileTypes: true }); }
    catch { return; }

    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue;
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        // Depth heuristic: if no artist yet, this is the artist folder.
        // If artist is set but no album, this is the album folder.
        // Deeper nesting just inherits current artist+album.
        if (!artist) {
          walk(fullPath, entry.name, null);
        } else if (!album) {
          walk(fullPath, artist, entry.name);
        } else {
          walk(fullPath, artist, album);
        }
      } else if (entry.isFile() && AUDIO_EXTS.has(path.extname(entry.name).toLowerCase())) {
        tracks.push({
          name:     entry.name.replace(/\.[^.]+$/, ''),
          filename: entry.name,
          path:     fullPath,
          artist:   artist || '',
          album:    album  || '',
        });
      }
    }
  }

  walk(rootPath, null, null);
  return tracks;
}

function searchIndex(index, query) {
  const q = query.toLowerCase().trim();
  if (!q) return { albums: [], tracks: [] };

  // Collect matching albums (unique artist+album combos)
  const albumMap = new Map();
  const matchedTracks = [];

  for (const t of index) {
    const artistMatch = t.artist.toLowerCase().includes(q);
    const albumMatch  = t.album.toLowerCase().includes(q);
    const trackMatch  = t.name.toLowerCase().includes(q);

    if (artistMatch || albumMatch) {
      const key = `${t.artist}////${t.album}`;
      if (!albumMap.has(key)) {
        albumMap.set(key, {
          artist: t.artist,
          album:  t.album,
          tracks: [],
        });
      }
      albumMap.get(key).tracks.push(t);
    }

    if (trackMatch && !artistMatch && !albumMatch) {
      matchedTracks.push(t);
    }
  }

  return {
    albums: Array.from(albumMap.values()),
    tracks: matchedTracks,
  };
}

// ── Window ─────────────────────────────────────────────────────────────────
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1040, height: 700, minWidth: 820, minHeight: 560,
    backgroundColor: '#0a0a0a',
    titleBarStyle: 'hidden',
    trafficLightPosition: { x: -100, y: -100 },
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  mainWindow.loadFile('index.html');
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// ── IPC ────────────────────────────────────────────────────────────────────
ipcMain.handle('get-config', () => loadConfig());

ipcMain.handle('set-root-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title: 'Choose Your Music Folder',
  });
  if (result.canceled || !result.filePaths.length) return null;
  const rootPath = result.filePaths[0];
  const config = loadConfig();
  config.rootFolder = rootPath;
  saveConfig(config);
  return rootPath;
});

// Build and return the full index
ipcMain.handle('build-index', async (_, rootPath) => {
  return buildIndex(rootPath);
});

// Search the pre-built index passed from renderer
ipcMain.handle('search', async (_, { index, query }) => {
  return searchIndex(index, query);
});

ipcMain.handle('open-files', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile', 'multiSelections'],
    filters: [{ name: 'Audio', extensions: ['mp3', 'wav', 'ogg', 'flac', 'm4a'] }],
    title: 'Select Audio Files',
  });
  if (result.canceled) return [];
  return result.filePaths.map(p => ({
    name:     path.basename(p).replace(/\.[^.]+$/, ''),
    filename: path.basename(p),
    path:     p,
    artist:   '',
    album:    '',
  }));
});

ipcMain.on('window-minimize', () => mainWindow.minimize());
ipcMain.on('window-maximize', () => {
  if (mainWindow.isMaximized()) mainWindow.unmaximize();
  else mainWindow.maximize();
});
ipcMain.on('window-close', () => mainWindow.close());

// ── GIF Capture ────────────────────────────────────────────────────────────
ipcMain.handle('is-gif-mode', () => !!process.env.EMPEETHREE_CAPTURE_GIF);

ipcMain.handle('start-gif-capture', async () => {
  const { execFile } = require('child_process');
  const framesDir = path.join(os.tmpdir(), 'empeethree-frames');
  fs.mkdirSync(framesDir, { recursive: true });
  try { fs.readdirSync(framesDir).forEach(f => fs.unlinkSync(path.join(framesDir, f))); } catch {}

  // Capture right after each boot message appears
  const captureAt = [80, 680, 1480, 2480, 3580, 4280, 5080];
  const delays    = [600, 800, 1000, 1100, 700, 800, 1500];
  let captured = 0;

  for (let i = 0; i < captureAt.length; i++) {
    setTimeout(async () => {
      const img = await mainWindow.webContents.capturePage();
      fs.writeFileSync(path.join(framesDir, `frame_${String(i).padStart(2,'0')}.png`), img.toPNG());
      captured++;
      if (captured === captureAt.length) {
        const gifPath = path.join(os.homedir(), 'Downloads', 'empeethree-loading.gif');
        const scriptPath = path.join(__dirname, 'make-gif.py');
        execFile('python3', [scriptPath, framesDir, gifPath, delays.join(',')], (err, stdout, stderr) => {
          if (err) console.error('GIF error:', err, stderr);
          else console.log('GIF saved:', stdout.trim());
        });
      }
    }, captureAt[i]);
  }
  return 'capturing';
});
