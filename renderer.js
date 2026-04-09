// renderer.js — Empeethree

// ── Shared Logo Canvas Renderer ────────────────────────────────────────────
function renderLogoCanvas(cv, heightRatio = 0.22, contentScale = 1.0, charAlphas = null, charOverrides = null, barPulses = null) {
  const DPR = window.devicePixelRatio || 1;
  const W   = cv.offsetWidth || 300;
  const H   = Math.round(W * heightRatio);
  cv.width  = W * DPR;
  cv.height = H * DPR;
  cv.style.height = H + 'px';

  const ctx = cv.getContext('2d');
  ctx.scale(DPR, DPR);

  // Logo elements are drawn within a scaled sub-region, centered in the canvas
  const LW = W * contentScale;
  const LH = H * contentScale;
  const ox = (W - LW) / 2;
  const oy = (H - LH) / 2;

  const N_BARS    = 7;
  const BAR_W     = Math.max(2, LW * 0.014);
  const BAR_GAP   = Math.max(1, LW * 0.007);
  const NAME_PAD  = LW * 0.038;
  const WALL_PAD  = LW * 0.03;
  const bars_span = N_BARS * BAR_W + (N_BARS - 1) * BAR_GAP;

  const BAR_COLORS = VIZ_C.barColors;

  const availNameW = LW - 2 * (WALL_PAD + bars_span + NAME_PAD);
  let fontSize = 10;
  ctx.font = `bold ${fontSize}px 'JetBrains Mono', monospace`;
  while (ctx.measureText('EMPEETHREE').width < availNameW && fontSize < 200) {
    fontSize++;
    ctx.font = `bold ${fontSize}px 'JetBrains Mono', monospace`;
  }
  fontSize = Math.max(1, fontSize - 1);
  ctx.font = `bold ${fontSize}px 'JetBrains Mono', monospace`;

  const nameW  = ctx.measureText('EMPEETHREE').width;
  const nameX  = ox + LW / 2 - nameW / 2;
  const cy     = oy + LH / 2;
  const barH   = LH * 0.38;
  const barTop = cy - barH / 2;

  const off = document.createElement('canvas');
  off.width = W; off.height = H;
  const og  = off.getContext('2d');
  og.font   = ctx.font;

  function drawElements(g, alpha) {
    for (let i = 0; i < N_BARS; i++) {
      const [r,gv,b] = BAR_COLORS[i];
      const bp = barPulses ? barPulses[i] : 1.0;
      g.fillStyle = `rgba(${r},${gv},${b},${alpha * bp})`;
      const bx = nameX - NAME_PAD - BAR_W - i * (BAR_W + BAR_GAP);
      g.fillRect(bx, barTop, BAR_W, barH);
    }
    for (let i = 0; i < N_BARS; i++) {
      const [r,gv,b] = BAR_COLORS[i];
      const bp = barPulses ? barPulses[i] : 1.0;
      g.fillStyle = `rgba(${r},${gv},${b},${alpha * bp})`;
      const bx = nameX + nameW + NAME_PAD + i * (BAR_W + BAR_GAP);
      g.fillRect(bx, barTop, BAR_W, barH);
    }
    if (charAlphas || charOverrides) {
      const word = 'EMPEETHREE';
      const charW = nameW / word.length;
      for (let i = 0; i < word.length; i++) {
        const a  = charAlphas ? charAlphas[i] ?? 1.0 : 1.0;
        const ch = charOverrides?.[i] ?? word[i];
        g.fillStyle = tc(VIZ_C.logo, alpha * a);
        g.fillText(ch, nameX + i * charW, cy + fontSize * 0.35);
      }
    } else {
      g.fillStyle = tc(VIZ_C.logo, alpha);
      g.fillText('EMPEETHREE', nameX, cy + fontSize * 0.35);
    }
  }

  drawElements(og, 1.0);

  ctx.fillStyle = '#0d0d0d';
  ctx.fillRect(0, 0, W, H);

  ctx.save(); ctx.filter = 'blur(18px)'; ctx.globalAlpha = 0.55; ctx.drawImage(off, 0, 0); ctx.restore();
  ctx.save(); ctx.filter = 'blur(6px)';  ctx.globalAlpha = 0.70; ctx.drawImage(off, 0, 0); ctx.restore();
  ctx.save(); ctx.filter = 'blur(2px)';  ctx.globalAlpha = 0.85; ctx.drawImage(off, 0, 0); ctx.restore();
  ctx.save(); ctx.filter = 'none';       ctx.globalAlpha = 1.0;  drawElements(ctx, 1.0);   ctx.restore();

  for (let y = 0; y < H; y += 4) {
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.fillRect(0, y, W, 1);
  }
}

let charAlphas    = Array(10).fill(1.0);
let charOverrides = Array(10).fill(null);

// ── Splash canvas ──────────────────────────────────────────────────────────
(function() {
  const splash = document.getElementById('splash');
  const oldPre = document.getElementById('splash-logo');
  oldPre.style.display = 'none';

  const cv = document.createElement('canvas');
  cv.id = 'splash-canvas';
  cv.style.cssText = 'display:block;width:100%;max-width:700px;';
  splash.insertBefore(cv, oldPre);

  // Two letters to flicker: index 2 (P) and index 8 (E in THREE)
  const FLICKER = [2, 8];
  const fstate  = FLICKER.map(() => ({ alpha: 1.0, timer: 0, on: true }));

  charAlphas    = Array(10).fill(1.0);
  charOverrides = Array(10).fill(null);

  // Index 3: E after P occasionally glitches to "3"
  const swap3 = { active: false, timer: 0 };

  function tickFlicker(fs) {
    if (fs.timer > 0) {
      fs.timer--;
      if (!fs.on) {
        // quick random stutter while off
        fs.alpha = Math.random() < 0.4 ? 0.06 + Math.random() * 0.2 : 0.05;
      } else {
        fs.alpha = 1.0;
      }
    } else {
      // decide next state
      if (!fs.on) {
        // coming back on — sometimes flicker briefly first
        fs.on    = true;
        fs.alpha = 1.0;
        fs.timer = 80 + Math.floor(Math.random() * 220); // stay on a while
      } else if (Math.random() < 0.004) {
        // go off
        fs.on    = false;
        fs.alpha = 0.05;
        fs.timer = 2 + Math.floor(Math.random() * 10);
      }
    }
  }

  function tickSwap3() {
    if (swap3.timer > 0) {
      swap3.timer--;
    } else if (swap3.active) {
      swap3.active = false;
      charOverrides[3] = null;
      swap3.timer = 120 + Math.floor(Math.random() * 300); // cooldown
    } else if (Math.random() < 0.005) {
      swap3.active = true;
      charOverrides[3] = '3';
      swap3.timer = 20 + Math.floor(Math.random() * 25);
    }
  }

  let rafId = null;
  function frame() {
    fstate.forEach(tickFlicker);
    tickSwap3();

    if (swap3.active) {
      // MP3 moment: M(1) P(2) 3(3) stay lit, everything else goes dark
      for (let i = 0; i < 10; i++) {
        charAlphas[i] = (i === 1 || i === 2 || i === 3) ? 1.0 : 0.06;
      }
    } else {
      charAlphas.fill(1.0);
      fstate.forEach((fs, i) => { charAlphas[FLICKER[i]] = fs.alpha; });
    }

    const t = performance.now() / 1000;
    const BAR_FREQS  = [1.3, 0.7, 2.1, 1.6, 0.9, 1.8, 0.5];
    const BAR_PHASES = [0.0, 2.4, 1.1, 4.8, 0.7, 3.2, 5.5];
    const barPulses = Array.from({ length: 7 }, (_, i) =>
      swap3.active ? 0.0 : 0.55 + 0.45 * Math.sin(t * BAR_FREQS[i] + BAR_PHASES[i])
    );
    renderLogoCanvas(cv, 0.22, 1.0, charAlphas, charOverrides, barPulses);
    if (!splash.classList.contains('hidden')) {
      rafId = requestAnimationFrame(frame);
    } else {
      rafId = null;
    }
  }

  function start() {
    if (!rafId) rafId = requestAnimationFrame(frame);
  }

  document.fonts.ready.then(start);
  setTimeout(start, 100);
  window.addEventListener('resize', () => renderLogoCanvas(cv, 0.22, 1.0, charAlphas, charOverrides, 1.0));
})();

// ── Panel logo canvas ──────────────────────────────────────────────────────
(function() {
  const cv = document.getElementById('panel-logo-canvas');
  function render() { renderLogoCanvas(cv, 0.22, 0.82); }
  document.fonts.ready.then(render);
  setTimeout(render, 200);
  window.addEventListener('resize', render);
})();

// ── Splash Screen ──────────────────────────────────────────────────────────
const elSplash    = document.getElementById('splash');
const elSplashMsg = document.getElementById('splash-msg');

function setSplashMsg(msg) { elSplashMsg.textContent = msg; }

let splashReady = false;

function dismissSplash() {
  elSplash.classList.add('hidden');
  setTimeout(() => { elSplash.style.display = 'none'; }, 420);
}

document.getElementById('splash').addEventListener('click', () => {
  if (splashReady) dismissSplash();
});

// ── Theme ──────────────────────────────────────────────────────────────────
const THEMES = {
  amber: {
    logo:   [234, 172,  52],
    base:   [255, 200,   0],
    hot:    [255, 235,  60],
    glitch: [255, 245,  80],
    barColors: [[234,172,52],[234,172,52],[145,82,10],[90,50,5],[52,28,0],[52,28,0],[24,12,0]],
  },
  green: {
    logo:   [  0, 230,  80],
    base:   [  0, 220,  70],
    hot:    [160, 255, 140],
    glitch: [200, 255, 180],
    barColors: [[0,230,80],[0,230,80],[0,130,40],[0,85,25],[0,42,12],[0,42,12],[0,20,6]],
  },
  blue: {
    logo:   [ 60, 160, 255],
    base:   [ 80, 180, 255],
    hot:    [180, 230, 255],
    glitch: [140, 200, 255],
    barColors: [[60,160,255],[60,160,255],[30,80,160],[15,45,100],[5,20,50],[5,20,50],[2,8,22]],
  },
  red: {
    logo:   [230,  50,  30],
    base:   [255,  60,  30],
    hot:    [255, 160,  80],
    glitch: [255, 120,  60],
    barColors: [[230,50,30],[230,50,30],[130,22,10],[80,12,5],[40,5,2],[40,5,2],[18,2,1]],
  },
};
let VIZ_C = THEMES.amber;
function tc(arr, a) { return `rgba(${arr[0]},${arr[1]},${arr[2]},${typeof a === 'number' ? a.toFixed(3) : a})`; }

function applyTheme(name) {
  VIZ_C = THEMES[name] || THEMES.amber;
  document.body.dataset.theme = name;
  // Re-render logos with new color
  const splashCv  = document.getElementById('splash-canvas');
  const panelCv   = document.getElementById('panel-logo-canvas');
  if (splashCv) renderLogoCanvas(splashCv, 0.22, 1.0, charAlphas, charOverrides, null);
  if (panelCv)  renderLogoCanvas(panelCv,  0.22, 0.82);
}

// ── State ──────────────────────────────────────────────────────────────────
const state = {
  rootFolder:   null,
  library:      [],
  tracks:       [],
  currentIndex: -1,
  isPlaying:    false,
  shuffle:      false,
  repeat:       'none',
  volume:       0.8,
  showHint:     false,
};

// ── Audio ──────────────────────────────────────────────────────────────────
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const analyser = audioCtx.createAnalyser();
analyser.fftSize = 2048;
const gainNode = audioCtx.createGain();
gainNode.gain.value = state.volume;
gainNode.connect(analyser);
analyser.connect(audioCtx.destination);

const audio = new Audio();
let sourceNode = null;
function connectAudio() {
  if (sourceNode) return;
  sourceNode = audioCtx.createMediaElementSource(audio);
  sourceNode.connect(gainNode);
}

// ── DOM ────────────────────────────────────────────────────────────────────
const elPlaylist    = document.getElementById('playlist');
const elPlEmpty     = document.getElementById('playlist-empty');
const elNoRoot      = document.getElementById('no-root');
const elSearchInput = document.getElementById('search-input');
const elSearchClear = document.getElementById('btn-clear-search');
const elResults     = document.getElementById('search-results');
const elTrackName   = document.getElementById('track-name');
const elTrackIdx    = document.getElementById('track-index');
const elTrackTotal  = document.getElementById('track-total');
const elTrackFmt    = document.getElementById('track-format');
const elTimeCur     = document.getElementById('time-current');
const elTimeTot     = document.getElementById('time-total');
const elSeekFill    = document.getElementById('seek-bar-fill');
const elSeekThumb   = document.getElementById('seek-bar-thumb');
const elSeekWrap    = document.getElementById('seek-bar-wrap');
const elVolFill     = document.getElementById('vol-bar-fill');
const elVolThumb    = document.getElementById('vol-bar-thumb');
const elVolWrap     = document.getElementById('vol-bar-wrap');
const elVolValue    = document.getElementById('vol-value');
const elBtnPlay     = document.getElementById('btn-play');
const elBtnPrev     = document.getElementById('btn-prev');
const elBtnNext     = document.getElementById('btn-next');
const elBtnShuffle  = document.getElementById('btn-shuffle');
const elBtnRepeat   = document.getElementById('btn-repeat');
const elBtnClearQ   = document.getElementById('btn-clear-queue');
const elBtnSettings  = document.getElementById('btn-settings');
const elBtnSetRoot   = document.getElementById('btn-set-root-empty');
const elBtnSaveQ     = document.getElementById('btn-save-queue');
const elBrowseTree   = document.getElementById('browse-tree');
const elPlistsList   = document.getElementById('playlists-list');
const elPlistsEmpty  = document.getElementById('playlists-empty');
const elStatusMsg   = document.getElementById('status-msg');
const elStatusMode  = document.getElementById('status-mode');
const elCanvas      = document.getElementById('visualizer');
const canvasCtx     = elCanvas.getContext('2d');

// ── Helpers ────────────────────────────────────────────────────────────────
function fmtTime(s) {
  if (!isFinite(s) || s < 0) return '0:00';
  return `${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`;
}
function pad2(n) { return String(n).padStart(2,'0'); }
function setStatus(m) { elStatusMsg.textContent = `▸ ${m}`; }
function setMode(m)   { elStatusMode.textContent = m; }

// ── Library Indexing ───────────────────────────────────────────────────────
async function buildLibrary(rootPath) {
  setSplashMsg('indexing library…');
  setStatus('indexing library…');
  elSearchInput.placeholder = 'indexing…';
  elSearchInput.disabled = true;

  const tracks = await window.electronAPI.buildIndex(rootPath);
  state.library = tracks;

  elSearchInput.disabled = false;
  elSearchInput.placeholder = `search ${tracks.length.toLocaleString()} tracks…`;
  setStatus(`${tracks.length.toLocaleString()} tracks indexed · ${rootPath} · ready`);
  elNoRoot.style.display = 'none';
}

// ── Root Folder ────────────────────────────────────────────────────────────
// Boot sequence messages — shown on splash before dismissing
const BOOT_SEQUENCE = [
  { msg: 'initializing audio engine…',  delay: 0    },
  { msg: 'loading config…',             delay: 600  },
  { msg: 'scanning library…',           delay: 1400 },
  { msg: 'indexing tracks…',            delay: 2400 },
  { msg: 'warming visualizer…',         delay: 3500 },
  { msg: 'calibrating waveform…',       delay: 4200 },
  { msg: 'ready.',                       delay: 5000 },
];

async function runBootSequence(afterDelay, onComplete) {
  // Run timed messages in parallel with actual work
  BOOT_SEQUENCE.forEach(({ msg, delay }) => {
    setTimeout(() => setSplashMsg(msg), delay);
  });
  // Wait for the longer of: real work OR boot sequence
  await afterDelay;
  const seqEnd = BOOT_SEQUENCE[BOOT_SEQUENCE.length - 1].delay + 700;
  const elapsed = Date.now();
  const remaining = seqEnd - (Date.now() - elapsed);
  setTimeout(() => {
    setSplashMsg('ready.');
    setTimeout(onComplete, 500);
  }, Math.max(0, seqEnd));
}

async function init() {
  const startTime = Date.now();

  // Kick off boot messages immediately
  BOOT_SEQUENCE.forEach(({ msg, delay }) => {
    setTimeout(() => setSplashMsg(msg), delay);
  });

  // GIF capture mode
  if (await window.electronAPI.isGifMode()) {
    window.electronAPI.startGifCapture();
  }

  const config = await window.electronAPI.getConfig();

  if (config.defaultViz !== undefined) setVizMode(config.defaultViz);
  if (config.theme) { currentTheme = config.theme; applyTheme(config.theme); }

  if (config.rootFolder) {
    state.rootFolder = config.rootFolder;
    // Do real indexing work
    const indexPromise = buildLibrary(config.rootFolder);
    await indexPromise;
  }

  // Wait until boot sequence finishes (min 5.5s)
  const elapsed = Date.now() - startTime;
  const minDuration = 5500;
  const wait = Math.max(0, minDuration - elapsed);

  setTimeout(() => {
    setSplashMsg('ready. click to continue.');
    splashReady = true;
    elSplash.classList.add('ready');
  }, wait);
}

async function setRootFolder() {
  const folder = await window.electronAPI.setRootFolder();
  if (!folder) return;
  state.rootFolder = folder;
  elResults.style.display = 'none';
  elResults.innerHTML = '';
  elSearchInput.value = '';
  await buildLibrary(folder);
  elSearchInput.focus();
}

elBtnSettings.addEventListener('click', setRootFolder);
elBtnSetRoot.addEventListener('click', setRootFolder);

// ── App Settings Panel ──────────────────────────────────────────────────────
const elSettingsPanel   = document.getElementById('settings-panel');
const elSettingsClose   = document.getElementById('settings-close');
const elSettingsFolder  = document.getElementById('settings-set-folder');
const elDefaultVizRadios  = document.querySelectorAll('input[name="default-viz"]');
const elThemeRadios       = document.querySelectorAll('input[name="color-theme"]');
const elSettingsFolderName = document.getElementById('settings-folder-name');
let   currentTheme        = 'amber';

function openSettings() {
  // Sync radios to current state
  elDefaultVizRadios.forEach(r => { r.checked = Number(r.value) === vizMode; });
  elThemeRadios.forEach(r => { r.checked = r.value === currentTheme; });
  // Show current folder name if set
  if (state.rootFolder) {
    elSettingsFolderName.textContent = state.rootFolder.split('/').pop() || state.rootFolder;
  } else {
    elSettingsFolderName.textContent = '';
  }
  elSettingsPanel.classList.remove('hidden');
}

function closeSettings() {
  elSettingsPanel.classList.add('hidden');
}

document.getElementById('btn-app-settings').addEventListener('click', openSettings);
elSettingsClose.addEventListener('click', closeSettings);
elSettingsPanel.addEventListener('click', e => { if (e.target === elSettingsPanel) closeSettings(); });

elSettingsFolder.addEventListener('click', () => { closeSettings(); setRootFolder(); });

elDefaultVizRadios.forEach(r => {
  r.addEventListener('change', () => {
    const m = Number(r.value);
    setVizMode(m);
    window.electronAPI.setConfig({ defaultViz: m });
  });
});

elThemeRadios.forEach(r => {
  r.addEventListener('change', () => {
    currentTheme = r.value;
    applyTheme(r.value);
    window.electronAPI.setConfig({ theme: r.value });
  });
});

// ── Search ─────────────────────────────────────────────────────────────────
let searchDebounce = null;

elSearchInput.addEventListener('input', () => {
  clearTimeout(searchDebounce);
  const q = elSearchInput.value.trim();
  if (!q) { elResults.style.display = 'none'; elResults.innerHTML = ''; return; }
  searchDebounce = setTimeout(() => doSearch(q), 150);
});

elSearchClear.addEventListener('click', () => {
  elSearchInput.value = '';
  elResults.style.display = 'none';
  elResults.innerHTML = '';
  elSearchInput.focus();
});

async function doSearch(query) {
  if (!state.library.length) return;
  const { albums, tracks } = await window.electronAPI.search(state.library, query);
  renderResults(albums, tracks, query);
}

function renderResults(albums, tracks, query) {
  elResults.innerHTML = '';

  if (!albums.length && !tracks.length) {
    elResults.innerHTML = `<div class="sr-empty">no results for "${query}"</div>`;
    elResults.style.display = 'block';
    return;
  }

  if (albums.length) {
    elResults.appendChild(sectionLabel(`albums & artists (${albums.length})`));
    albums.forEach(album => {
      const row = document.createElement('div');
      row.className = 'sr-item';

      const icon = document.createElement('span');
      icon.className = 'sr-icon'; icon.textContent = '▸';

      const info = document.createElement('div');
      info.style.cssText = 'flex:1;min-width:0;';

      const name = document.createElement('div');
      name.className = 'sr-name';
      name.textContent = album.album || album.artist;

      const sub = document.createElement('div');
      sub.className = 'sr-sub';
      sub.textContent = album.album ? album.artist : `${album.tracks.length} tracks`;

      info.appendChild(name);
      info.appendChild(sub);

      const meta = document.createElement('span');
      meta.className = 'sr-meta'; meta.textContent = album.tracks.length;

      const addBtn = document.createElement('button');
      addBtn.className = 'sr-add-btn'; addBtn.textContent = '+ all';
      addBtn.addEventListener('click', e => {
        e.stopPropagation();
        addToQueue(album.tracks);
        setStatus(`added ${album.tracks.length} tracks — "${album.album || album.artist}"`);
      });

      row.appendChild(icon); row.appendChild(info);
      row.appendChild(meta); row.appendChild(addBtn);

      const subList = document.createElement('div');
      subList.className = 'sr-folder-tracks';
      let expanded = false;

      row.addEventListener('click', () => {
        expanded = !expanded;
        icon.textContent = expanded ? '▾' : '▸';
        subList.classList.toggle('open', expanded);
        if (expanded && !subList.children.length) {
          album.tracks.forEach(t => subList.appendChild(buildTrackRow(t, true)));
        }
      });

      elResults.appendChild(row);
      elResults.appendChild(subList);
    });
  }

  if (tracks.length) {
    elResults.appendChild(sectionLabel(`tracks (${tracks.length})`));
    tracks.forEach(t => elResults.appendChild(buildTrackRow(t, false)));
  }

  elResults.style.display = 'block';
}

function sectionLabel(text) {
  const el = document.createElement('div');
  el.className = 'sr-section-label';
  el.textContent = text;
  return el;
}

function buildTrackRow(t, isSub) {
  const row = document.createElement('div');
  row.className = isSub ? 'sr-sub-item' : 'sr-item';

  const icon = document.createElement('span');
  icon.className = 'sr-icon'; icon.textContent = '♪';

  const info = document.createElement('div');
  info.style.cssText = 'flex:1;min-width:0;';

  const name = document.createElement('div');
  name.className = 'sr-name'; name.textContent = t.name;

  const sub = document.createElement('div');
  sub.className = 'sr-sub';
  sub.textContent = [t.artist, t.album].filter(Boolean).join(' · ');

  info.appendChild(name);
  if (sub.textContent) info.appendChild(sub);

  const fmt = document.createElement('span');
  fmt.className = 'sr-meta';
  fmt.textContent = t.filename.split('.').pop().toUpperCase();

  const addBtn = document.createElement('button');
  addBtn.className = 'sr-add-btn'; addBtn.textContent = '+';
  addBtn.addEventListener('click', e => {
    e.stopPropagation();
    addToQueue([t]);
    setStatus(`added: ${t.name}`);
  });

  row.appendChild(icon); row.appendChild(info);
  row.appendChild(fmt); row.appendChild(addBtn);

  row.addEventListener('click', () => {
    addToQueue([t]);
    const idx = state.tracks.findIndex(x => x.path === t.path);
    if (idx >= 0) playIndex(idx);
  });

  return row;
}

// ── Queue ──────────────────────────────────────────────────────────────────
function addToQueue(newTracks) {
  const existing = new Set(state.tracks.map(t => t.path));
  const fresh = newTracks.filter(t => !existing.has(t.path));
  state.tracks.push(...fresh);
  renderPlaylist();
  if (state.currentIndex === -1 && state.tracks.length > 0) playIndex(0);
}

function renderPlaylist() {
  elPlaylist.innerHTML = '';
  elPlEmpty.style.display = state.tracks.length ? 'none' : 'block';
  elTrackTotal.textContent = pad2(state.tracks.length);

  let dragSrcIndex = null;

  state.tracks.forEach((t, i) => {
    const item = document.createElement('div');
    item.className = 'pl-item' + (i === state.currentIndex ? ' active' : '');
    item.draggable = true;

    const num = document.createElement('span');
    num.className = 'pl-num'; num.textContent = pad2(i+1);

    const nameWrap = document.createElement('div');
    nameWrap.style.cssText = 'flex:1;min-width:0;';
    const name = document.createElement('div');
    name.className = 'pl-name'; name.textContent = t.name;
    nameWrap.appendChild(name);

    const icon = document.createElement('span');
    icon.className = 'pl-playing-icon';
    icon.textContent = (i === state.currentIndex && state.isPlaying) ? '♪' : '';

    item.appendChild(num); item.appendChild(nameWrap); item.appendChild(icon);
    item.addEventListener('click', () => playIndex(i));

    item.addEventListener('dragstart', e => {
      dragSrcIndex = i;
      e.dataTransfer.effectAllowed = 'move';
      setTimeout(() => item.classList.add('dragging'), 0);
    });
    item.addEventListener('dragend', () => {
      item.classList.remove('dragging');
      elPlaylist.querySelectorAll('.pl-item').forEach(el => el.classList.remove('drag-over'));
    });
    item.addEventListener('dragover', e => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      elPlaylist.querySelectorAll('.pl-item').forEach(el => el.classList.remove('drag-over'));
      item.classList.add('drag-over');
    });
    item.addEventListener('drop', e => {
      e.preventDefault();
      if (dragSrcIndex === null || dragSrcIndex === i) return;
      const moved = state.tracks.splice(dragSrcIndex, 1)[0];
      state.tracks.splice(i, 0, moved);
      if (state.currentIndex === dragSrcIndex) {
        state.currentIndex = i;
      } else if (dragSrcIndex < state.currentIndex && i >= state.currentIndex) {
        state.currentIndex--;
      } else if (dragSrcIndex > state.currentIndex && i <= state.currentIndex) {
        state.currentIndex++;
      }
      dragSrcIndex = null;
      renderPlaylist();
    });

    elPlaylist.appendChild(item);
  });
}

function scrollToActive() {
  const a = elPlaylist.querySelector('.pl-item.active');
  if (a) a.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

// ── Playback ───────────────────────────────────────────────────────────────
function playIndex(index) {
  if (index < 0 || index >= state.tracks.length) return;
  state.currentIndex = index;
  const t = state.tracks[index];
  if (audioCtx.state === 'suspended') audioCtx.resume();
  audio.src = `file://${t.path}`;
  connectAudio();
  audio.play().then(() => {
    state.isPlaying = true;
    state.showHint = false;
    updateVizIcons();
    elTrackName.textContent = t.name;
    elTrackName.classList.add('playing');
    elTrackIdx.textContent = pad2(index+1);
    elTrackFmt.textContent = t.filename.split('.').pop().toUpperCase();
    elBtnPlay.textContent = '⏸';
    setStatus(`playing: ${t.name}`);
    renderPlaylist();
    scrollToActive();
  }).catch(err => setStatus(`error: ${err.message}`));
}

function togglePlay() {
  if (!state.tracks.length) { state.showHint = true; hintScrollY = 0; updateVizIcons(); return; }
  if (audioCtx.state === 'suspended') audioCtx.resume();
  if (state.currentIndex === -1) { playIndex(0); return; }
  if (state.isPlaying) {
    audio.pause(); state.isPlaying = false;
    elBtnPlay.textContent = '▶';
    elTrackName.classList.remove('playing');
    setStatus('paused');
  } else {
    audio.play(); state.isPlaying = true;
    elBtnPlay.textContent = '⏸';
    elTrackName.classList.add('playing');
    setStatus(`playing: ${state.tracks[state.currentIndex].name}`);
  }
  renderPlaylist();
}

function nextTrack() {
  if (!state.tracks.length) return;
  if (state.repeat === 'one') { audio.currentTime = 0; audio.play(); return; }
  let next = state.shuffle
    ? Math.floor(Math.random() * state.tracks.length)
    : state.currentIndex + 1;
  if (next >= state.tracks.length) {
    if (state.repeat === 'all') next = 0;
    else { state.isPlaying = false; elBtnPlay.textContent = '▶'; setStatus('end of queue'); return; }
  }
  playIndex(next);
}

function prevTrack() {
  if (!state.tracks.length) return;
  if (audio.currentTime > 3) { audio.currentTime = 0; return; }
  playIndex(Math.max(0, state.currentIndex - 1));
}

audio.addEventListener('timeupdate', () => {
  if (!isFinite(audio.duration)) return;
  const pct = (audio.currentTime / audio.duration) * 100;
  elSeekFill.style.width = `${pct}%`;
  elSeekThumb.style.left = `${pct}%`;
  elTimeCur.textContent  = fmtTime(audio.currentTime);
  elTimeTot.textContent  = fmtTime(audio.duration);
});
audio.addEventListener('ended', nextTrack);

// ── Controls ───────────────────────────────────────────────────────────────
elBtnPlay.addEventListener('click', togglePlay);
elBtnNext.addEventListener('click', nextTrack);
elBtnPrev.addEventListener('click', prevTrack);

elBtnShuffle.addEventListener('click', () => {
  state.shuffle = !state.shuffle;
  elBtnShuffle.classList.toggle('active', state.shuffle);
  setMode(modeStr());
  setStatus(state.shuffle ? 'shuffle on' : 'shuffle off');
});

elBtnRepeat.addEventListener('click', () => {
  const modes = ['none','all','one'];
  const icons  = { none:'↻', all:'↻', one:'⟳' };
  state.repeat = modes[(modes.indexOf(state.repeat)+1)%3];
  elBtnRepeat.textContent = icons[state.repeat];
  elBtnRepeat.classList.toggle('active', state.repeat !== 'none');
  setMode(modeStr());
  setStatus(state.repeat === 'none' ? 'repeat off' : `repeat ${state.repeat}`);
});

function modeStr() {
  const p = [];
  if (state.shuffle) p.push('SHUFFLE');
  if (state.repeat === 'all') p.push('REPEAT ALL');
  if (state.repeat === 'one') p.push('REPEAT ONE');
  return p.join(' · ');
}


elBtnClearQ.addEventListener('click', () => {
  audio.pause(); audio.src = '';
  state.isPlaying = false; state.currentIndex = -1; state.tracks = [];
  elTrackName.textContent = '─── no track selected ───';
  elTrackName.classList.remove('playing');
  elTrackIdx.textContent = '00'; elTrackTotal.textContent = '00';
  elTrackFmt.textContent = '───';
  elTimeCur.textContent = '0:00'; elTimeTot.textContent = '0:00';
  elSeekFill.style.width = '0%'; elSeekThumb.style.left = '0%';
  elBtnPlay.textContent = '▶';
  renderPlaylist();
  setStatus(`${state.library.length.toLocaleString()} tracks indexed · ${state.rootFolder || ''} · ready`);
  setMode('');
});

// ── Seek ───────────────────────────────────────────────────────────────────
let isSeeking = false;
function seekPct(e) {
  const r = elSeekWrap.getBoundingClientRect();
  return Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
}
elSeekWrap.addEventListener('mousedown', () => { isSeeking = true; });
document.addEventListener('mousemove', e => {
  if (!isSeeking) return;
  const p = seekPct(e) * 100;
  elSeekFill.style.width = `${p}%`; elSeekThumb.style.left = `${p}%`;
});
document.addEventListener('mouseup', e => {
  if (!isSeeking) return; isSeeking = false;
  if (isFinite(audio.duration)) audio.currentTime = seekPct(e) * audio.duration;
});

// ── Volume ─────────────────────────────────────────────────────────────────
let isVolDrag = false;
function volPct(e) {
  const r = elVolWrap.getBoundingClientRect();
  return Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
}
function setVolume(pct) {
  state.volume = pct;
  gainNode.gain.value = pct;
  elVolFill.style.width  = `${pct*100}%`;
  elVolThumb.style.left  = `${pct*100}%`;
  elVolValue.textContent = `${Math.round(pct*100)}%`;
}
elVolWrap.addEventListener('mousedown', e => { isVolDrag = true; setVolume(volPct(e)); });
document.addEventListener('mousemove', e => { if (isVolDrag) setVolume(volPct(e)); });
document.addEventListener('mouseup', () => { isVolDrag = false; });

// ── Keyboard ───────────────────────────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT') return;
  switch (e.code) {
    case 'Space':      e.preventDefault(); togglePlay(); break;
    case 'ArrowRight': e.preventDefault(); audio.currentTime = Math.min(audio.duration||0, audio.currentTime+5); break;
    case 'ArrowLeft':  e.preventDefault(); audio.currentTime = Math.max(0, audio.currentTime-5); break;
    case 'ArrowUp':    e.preventDefault(); setVolume(Math.min(1, state.volume+.05)); break;
    case 'ArrowDown':  e.preventDefault(); setVolume(Math.max(0, state.volume-.05)); break;
    case 'KeyN':       nextTrack(); break;
    case 'KeyP':       prevTrack(); break;
  }
});

// ── Visualizer ─────────────────────────────────────────────────────────────
const bufLen   = analyser.frequencyBinCount;
const timeData = new Uint8Array(bufLen);
const freqData = new Uint8Array(bufLen);

function resizeCanvas() {
  const wrap = document.getElementById('visualizer-wrap');
  elCanvas.width  = wrap.clientWidth;
  elCanvas.height = wrap.clientHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// ── Visualizer mode (0 = glyph, 1 = bars) ────────────────────────────────────
let vizMode = 0;

// ── Bar visualizer state ──────────────────────────────────────────────────────
const BAR_HALF    = 18;
const BAR_GAP     = 3;
const BAR_MAX_H   = 0.88;
const BAR_SMOOTH  = 0.14;
const barHeights  = new Float32Array(BAR_HALF * 2).fill(0);

function barEdgeOpacity(dist) {
  if (dist < 0.12) return 1.00;
  if (dist < 0.28) return 0.90;
  if (dist < 0.44) return 0.65;
  if (dist < 0.58) return 0.40;
  if (dist < 0.72) return 0.20;
  if (dist < 0.85) return 0.09;
  return 0.03;
}


// ── ASCII glyph state ─────────────────────────────────────────────────────────
const VIZ_CHARS  = [
  // sparse / light
  ' ', '·', '∙', '˙', '⠂', '⠄', '⠈', '⠐', '⠠',
  // punctuation density
  ':', ';', '!', '+', '~', '=',
  // quadrant & fractional blocks (bitmap feel)
  '▖', '▗', '▘', '▝', '▚', '▞', '▒',
  '▁', '▂', '▃', '▄', '▅', '▆', '▇',   // lower eighths
  '▏', '▎', '▍', '▌', '▋', '▊', '▉',   // left eighths
  '▙', '▛', '▜', '▟',                   // three-quarter blocks
  // heavy
  '╱', '╲', '╳', '░', '╬', '╪', '╫', '▓', '█',
];
const VIZ_GLITCH = [
  '╔', '╗', '╚', '╝', '║', '═', '╠', '╣', '╦', '╩',
  '▀', '▄', '▐', '◆', '●', '■', '⌐', '¬', '¦',
  '╭', '╮', '╯', '╰', '◈', '◉', '▸', '∆', '≈', '≡',
  '⠿', '⡿', '⢿', '⣿', '⠛', '⠻', '⣹', '⢺', '⡼', '⠼',
];
const VIZ_BANDS = 28;    // frequency rows
const VIZ_EASE  = 0.16;  // amplitude smoothing (playing)
const vizAmps   = new Float32Array(VIZ_BANDS).fill(0);
let   vizGrid   = null;  // { cols, rows, cidx, gcidx, gtimer }
const vizOff    = document.createElement('canvas');
const vizOffCtx = vizOff.getContext('2d');
let hintCloseBtn  = null;
let hintScrollY   = 0;
let hintMaxScroll = 0;


function drawVisualizer() {
  requestAnimationFrame(drawVisualizer);
  const W = elCanvas.width, H = elCanvas.height;
  analyser.getByteFrequencyData(freqData);

  canvasCtx.fillStyle = '#0d0d0d';
  canvasCtx.fillRect(0, 0, W, H);

  // ── Hint screen — skip bars entirely ──────────────────────────────────────
  if (state.showHint && !state.isPlaying) {
    const fSize = Math.max(9, Math.min(12, W / 38));
    const font  = `${fSize}px 'JetBrains Mono', monospace`;
    const lineH = fSize * 2.1;
    const title = 'GETTING STARTED';
    const lines = [
      '1) click the folder icon to set your music folder',
      '2) search your library and add tracks to the queue',
      '3) press play to start listening',
    ];
    const shortcutsTitle = 'KEYBOARD SHORTCUTS';
    const shortcuts = [
      ['space',  'play / pause'   ],
      ['← →',   'seek 5s'        ],
      ['↑ ↓',   'volume'         ],
      ['N / P',  'next / previous'],
    ];

    const mc = document.createElement('canvas').getContext('2d');
    mc.font = font;
    const maxKeyW = Math.max(...shortcuts.map(([k]) => mc.measureText(k).width));
    const maxActW = Math.max(...shortcuts.map(([,a]) => mc.measureText(a).width));
    const shortcutRowW = maxKeyW + fSize * 3 + maxActW;
    const maxW = Math.max(
      ...lines.map(l => mc.measureText(l).width),
      mc.measureText(title).width,
      mc.measureText(shortcutsTitle).width,
      shortcutRowW,
    );
    const padX = fSize * 3;
    const padY = fSize * 2;
    const boxW = maxW + padX * 2;
    const boxH = (lines.length + shortcuts.length + 7.5) * lineH + padY * 2;
    const boxX = (W - boxW) / 2;
    const needsScroll = boxH > H * 0.92;
    hintMaxScroll = needsScroll ? Math.max(0, boxH - H + padY * 2) : 0;
    const boxY = needsScroll ? padY - hintScrollY : Math.round((H - boxH) / 2);

    const renderHint = (g, a) => {
      g.font = font;
      g.textAlign = 'center';

      // Title
      const titleY = boxY + padY + fSize * 1.1;
      g.fillStyle = tc(VIZ_C.logo, a * 0.85);
      g.fillText(title, W/2, titleY);
      const titleW = g.measureText(title).width;
      g.strokeStyle = tc(VIZ_C.logo, a * 0.85);
      g.lineWidth = 1;
      g.beginPath(); g.moveTo(W/2 - titleW/2, titleY + 3); g.lineTo(W/2 + titleW/2, titleY + 3); g.stroke();

      // Instructions
      let ty = boxY + padY + lineH * 2.2;
      for (const text of lines) {
        g.fillStyle = tc(VIZ_C.logo, a * 0.85);
        g.fillText(text, W/2, ty);
        ty += lineH;
      }

      // Shortcuts title
      ty += lineH * 0.6;
      g.fillStyle = tc(VIZ_C.logo, a * 0.55);
      g.fillText(shortcutsTitle, W/2, ty);
      const stW = g.measureText(shortcutsTitle).width;
      g.strokeStyle = tc(VIZ_C.logo, a * 0.55);
      g.lineWidth = 1;
      g.beginPath(); g.moveTo(W/2 - stW/2, ty + 3); g.lineTo(W/2 + stW/2, ty + 3); g.stroke();
      ty += lineH;

      // Shortcut rows — key right-aligned, action left-aligned, centred as a unit
      const colGap  = fSize * 2.5;
      const unitW   = maxKeyW + colGap + maxActW;
      const unitX   = W/2 - unitW/2;
      g.textAlign = 'left';
      for (const [key, action] of shortcuts) {
        g.fillStyle = tc(VIZ_C.logo, a * 0.85);
        const kw = g.measureText(key).width;
        g.fillText(key, unitX + maxKeyW - kw, ty);
        g.fillStyle = tc(VIZ_C.logo, a * 0.5);
        g.fillText(action, unitX + maxKeyW + colGap, ty);
        ty += lineH;
      }

      // Close button — centered text below shortcuts
      ty += lineH * 1.2;
      const closeLabel = '[ close ]';
      g.textAlign = 'center';
      g.fillStyle = tc(VIZ_C.logo, a * 0.6);
      g.fillText(closeLabel, W / 2, ty);
      const labelW = g.measureText(closeLabel).width;
      hintCloseBtn = { x: W/2 - labelW/2, y: ty - fSize, size: fSize * 1.4, w: labelW };
    };

    // Ambient glow
    const grad = canvasCtx.createRadialGradient(W/2,H/2,0,W/2,H/2,Math.max(boxW,boxH)*0.85);
    grad.addColorStop(0, tc(VIZ_C.logo, 0.07));
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    canvasCtx.fillStyle = grad;
    canvasCtx.fillRect(0, 0, W, H);

    const off = document.createElement('canvas');
    off.width = W; off.height = H;
    renderHint(off.getContext('2d'), 1.0);

    canvasCtx.save(); canvasCtx.filter='blur(22px)'; canvasCtx.globalAlpha=0.5;  canvasCtx.drawImage(off,0,0); canvasCtx.restore();
    canvasCtx.save(); canvasCtx.filter='blur(8px)';  canvasCtx.globalAlpha=0.65; canvasCtx.drawImage(off,0,0); canvasCtx.restore();
    canvasCtx.save(); canvasCtx.filter='blur(2px)';  canvasCtx.globalAlpha=0.8;  canvasCtx.drawImage(off,0,0); canvasCtx.restore();
    canvasCtx.save(); canvasCtx.filter='none';        canvasCtx.globalAlpha=1.0;  renderHint(canvasCtx, 1.0);  canvasCtx.restore();

    for (let y = 0; y < H; y += 4) {
      canvasCtx.fillStyle = 'rgba(0,0,0,0.25)';
      canvasCtx.fillRect(0, y, W, 1);
    }
    return;
  }

  hintCloseBtn = null;

  if (vizMode === 1) {
    // ── Glowing bars ───────────────────────────────────────────────────────────
    const binRange  = Math.floor(bufLen * 0.6);
    const totalBarW = W / (BAR_HALF * 2);
    const barW      = Math.max(2, totalBarW - BAR_GAP);

    for (let i = 0; i < BAR_HALF; i++) {
      const t      = i / BAR_HALF;
      const logT   = Math.pow(t, 0.6);
      const binIdx = Math.floor(logT * binRange);
      const raw    = freqData[binIdx] / 255;
      const target = state.isPlaying ? raw * BAR_MAX_H : 0.0;
      const ease   = state.isPlaying ? BAR_SMOOTH : 0.08;
      barHeights[BAR_HALF - 1 - i] += (target - barHeights[BAR_HALF - 1 - i]) * ease;
      barHeights[BAR_HALF + i]     += (target - barHeights[BAR_HALF + i])     * ease;
    }

    // Render bars to offscreen for glow
    if (vizOff.width !== W || vizOff.height !== H) { vizOff.width = W; vizOff.height = H; }
    vizOffCtx.clearRect(0, 0, W, H);

    for (let i = 0; i < BAR_HALF * 2; i++) {
      const bH      = Math.max(2, barHeights[i] * H);
      const x       = i * totalBarW + (totalBarW - barW) / 2;
      const yTop    = H / 2 - bH / 2;
      const dist    = Math.abs(i - (BAR_HALF - 0.5)) / BAR_HALF;
      const opacity = barEdgeOpacity(dist);
      vizOffCtx.fillStyle = tc(VIZ_C.base, opacity);
      vizOffCtx.fillRect(Math.round(x), Math.round(yTop), barW, Math.round(bH));
    }

    // Glow passes
    canvasCtx.save(); canvasCtx.filter = 'blur(12px)'; canvasCtx.globalAlpha = 0.55; canvasCtx.drawImage(vizOff, 0, 0); canvasCtx.restore();
    canvasCtx.save(); canvasCtx.filter = 'blur(4px)';  canvasCtx.globalAlpha = 0.75; canvasCtx.drawImage(vizOff, 0, 0); canvasCtx.restore();
    canvasCtx.save(); canvasCtx.filter = 'blur(1px)';  canvasCtx.globalAlpha = 0.9;  canvasCtx.drawImage(vizOff, 0, 0); canvasCtx.restore();
    canvasCtx.drawImage(vizOff, 0, 0);

    if (!state.isPlaying) {
      canvasCtx.strokeStyle = tc(VIZ_C.base, 0.06);
      canvasCtx.lineWidth = 1;
      canvasCtx.beginPath();
      canvasCtx.moveTo(0, H / 2);
      canvasCtx.lineTo(W, H / 2);
      canvasCtx.stroke();
    }
    return;
  }


  // ── ASCII glyph grid ─────────────────────────────────────────────────────────
  const fSize  = Math.max(9, Math.min(14, W / 52));
  const cW     = fSize * 0.62;   // monospace char width
  const cH     = fSize * 1.55;   // row height
  const cols   = Math.floor(W / cW);
  const rows   = Math.floor(H / cH);

  // Sample freqData into VIZ_BANDS (log-scaled, low→high)
  const binRange = Math.floor(bufLen * 0.72);
  for (let b = 0; b < VIZ_BANDS; b++) {
    const t      = (b + 1) / VIZ_BANDS;
    const logT   = Math.pow(t, 0.5);
    const bin    = Math.floor(logT * binRange);
    const target = state.isPlaying ? freqData[bin] / 255 : 0;
    vizAmps[b]  += (target - vizAmps[b]) * (state.isPlaying ? VIZ_EASE : 0.06);
  }

  // Ensure grid state matches current canvas dimensions
  if (!vizGrid || vizGrid.cols !== cols || vizGrid.rows !== rows) {
    vizGrid = {
      cols, rows,
      cidx:   new Uint8Array(cols * rows).fill(0),
      gcidx:  new Uint8Array(cols * rows).fill(255), // 255 = no glitch
      gtimer: new Uint8Array(cols * rows).fill(0),
    };
  }

  // Update each cell's character and glitch state
  for (let c = 0; c < cols; c++) {
    const dist = Math.abs(c - (cols - 1) / 2) / ((cols - 1) / 2); // 0=center, 1=edge
    const band = Math.floor(Math.pow(dist, 0.55) * (VIZ_BANDS - 1));
    const amp  = vizAmps[band];

    for (let r = 0; r < rows; r++) {
      const idx = r * cols + c;

      // Tick glitch timer
      if (vizGrid.gtimer[idx] > 0) {
        vizGrid.gtimer[idx]--;
      } else {
        vizGrid.gcidx[idx] = 255;
      }

      // Drift base char toward target amplitude with jitter
      const changeP = amp > 0.6 ? 0.35 : amp > 0.3 ? 0.12 : 0.025;
      if (Math.random() < changeP) {
        const target = Math.round(amp * (VIZ_CHARS.length - 1));
        const jitter = Math.floor((Math.random() - 0.5) * 4);
        vizGrid.cidx[idx] = Math.max(0, Math.min(VIZ_CHARS.length - 1, target + jitter));
      }

      // Spark a new glitch
      const glitchP = amp > 0.65 ? 0.09 : amp > 0.4 ? 0.025 : 0.004;
      if (Math.random() < glitchP) {
        vizGrid.gcidx[idx]  = Math.floor(Math.random() * VIZ_GLITCH.length);
        vizGrid.gtimer[idx] = Math.floor(Math.random() * 5) + 1;
      }
    }
  }

  // Render to offscreen canvas (for glow pass)
  if (vizOff.width !== W || vizOff.height !== H) { vizOff.width = W; vizOff.height = H; }
  vizOffCtx.clearRect(0, 0, W, H);
  vizOffCtx.font         = `${fSize}px 'JetBrains Mono', monospace`;
  vizOffCtx.textBaseline = 'top';
  vizOffCtx.textAlign    = 'left';
  const off    = vizOff;
  const offCtx = vizOffCtx;

  for (let c = 0; c < cols; c++) {
    const dist = Math.abs(c - (cols - 1) / 2) / ((cols - 1) / 2); // 0=center, 1=edge
    const band = Math.floor(Math.pow(dist, 0.55) * (VIZ_BANDS - 1));
    const amp  = vizAmps[band];
    const x    = c * cW;

    for (let r = 0; r < rows; r++) {
      const vDist = Math.abs(r - (rows - 1) / 2) / ((rows - 1) / 2);
      const vFade = Math.pow(1 - vDist, 0.6);

      const idx      = r * cols + c;
      const isGlitch = vizGrid.gcidx[idx] !== 255;
      const ch       = isGlitch
        ? VIZ_GLITCH[vizGrid.gcidx[idx]]
        : VIZ_CHARS[vizGrid.cidx[idx]];
      if (!isGlitch && ch === ' ') continue;

      const y = r * cH;

      // Base ghost layer — always visible across the full grid
      const ghost = 0.055 + vFade * 0.03;
      // Amplitude-driven brightness on top, strongest near center
      const reach = Math.max(0, amp - vDist * 0.82);
      const lit   = Math.pow(reach, 0.45) * vFade * 0.96;
      const alpha = Math.min(1, ghost + lit);

      if (isGlitch) {
        offCtx.fillStyle = tc(VIZ_C.glitch, Math.min(1, alpha * 1.6));
      } else if (amp > 0.68 && reach > 0.1) {
        const hot = ((amp - 0.68) / 0.32 * vFade).toFixed(3);
        offCtx.fillStyle = tc(VIZ_C.hot, Number(hot));
        offCtx.fillText(ch, x, y);
        offCtx.fillStyle = tc(VIZ_C.base, alpha);
      } else {
        offCtx.fillStyle = tc(VIZ_C.base, alpha);
      }
      offCtx.fillText(ch, x, y);
    }
  }

  // Phosphor glow: wide → tight → sharp
  canvasCtx.save();
  canvasCtx.filter      = 'blur(10px)';
  canvasCtx.globalAlpha = 0.5;
  canvasCtx.drawImage(off, 0, 0);
  canvasCtx.restore();

  canvasCtx.save();
  canvasCtx.filter      = 'blur(4px)';
  canvasCtx.globalAlpha = 0.75;
  canvasCtx.drawImage(off, 0, 0);
  canvasCtx.restore();

  canvasCtx.save();
  canvasCtx.filter      = 'blur(1px)';
  canvasCtx.globalAlpha = 0.9;
  canvasCtx.drawImage(off, 0, 0);
  canvasCtx.restore();

  // Sharp pass
  canvasCtx.drawImage(off, 0, 0);

  // CRT scanlines
  for (let y = 0; y < H; y += 3) {
    canvasCtx.fillStyle = 'rgba(0,0,0,0.15)';
    canvasCtx.fillRect(0, y, W, 1);
  }

  // Idle line when paused
  if (!state.isPlaying && !vizGrid) {
    canvasCtx.strokeStyle = tc(VIZ_C.logo, 0.06);
    canvasCtx.lineWidth   = 1;
    canvasCtx.beginPath();
    canvasCtx.moveTo(0, H / 2);
    canvasCtx.lineTo(W, H / 2);
    canvasCtx.stroke();
  }
}

drawVisualizer();

// ── Viz mode toggle ───────────────────────────────────────────────────────────
const vizIconsEl = document.getElementById('viz-icons');
const vizBtns    = document.querySelectorAll('.viz-icon-btn');

function updateVizIcons() {
  vizIconsEl.style.display = state.showHint ? 'none' : 'flex';
}

function setVizMode(m) {
  vizMode = m;
  vizBtns.forEach(b => b.classList.toggle('active', Number(b.dataset.mode) === m));
}

setVizMode(0);
updateVizIcons();
vizBtns.forEach(b => b.addEventListener('click', () => setVizMode(Number(b.dataset.mode))));

elCanvas.addEventListener('click', e => {
  if (!state.showHint || !hintCloseBtn) return;
  const { x, y, size, w } = hintCloseBtn;
  const padX = (w ?? size) * 0.5;
  const padY = size * 0.5;
  if (e.offsetX >= x - padX && e.offsetX <= x + (w ?? size) + padX &&
      e.offsetY >= y - padY && e.offsetY <= y + size + padY) {
    state.showHint = false;
    updateVizIcons();
  }
});

elCanvas.addEventListener('wheel', e => {
  if (!state.showHint || hintMaxScroll === 0) return;
  e.preventDefault();
  hintScrollY = Math.max(0, Math.min(hintMaxScroll, hintScrollY + e.deltaY * 0.4));
}, { passive: false });

// ── Panel Tabs ─────────────────────────────────────────────────────────────
function switchTab(tabName) {
  document.querySelectorAll('.panel-tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabName);
  });
  document.querySelectorAll('.tab-panel').forEach(panel => {
    panel.classList.toggle('active', panel.id === `tab-${tabName}`);
  });
  if (tabName === 'artists') renderBrowse();
  if (tabName === 'playlists') renderPlaylists();
}

document.getElementById('panel-tabs').addEventListener('click', e => {
  const btn = e.target.closest('.panel-tab');
  if (btn) switchTab(btn.dataset.tab);
});

// ── Browse ─────────────────────────────────────────────────────────────────
function renderBrowse() {
  elBrowseTree.innerHTML = '';
  if (!state.library.length) {
    const msg = document.createElement('div');
    msg.className = 'browse-empty';
    msg.textContent = state.rootFolder ? 'no tracks found' : 'set a music folder first';
    elBrowseTree.appendChild(msg);
    return;
  }

  // Group: artist → album → tracks
  const tree = new Map();
  for (const t of state.library) {
    const artist = t.artist || '(unknown artist)';
    const album  = t.album  || '(unknown album)';
    if (!tree.has(artist)) tree.set(artist, new Map());
    const albumMap = tree.get(artist);
    if (!albumMap.has(album)) albumMap.set(album, []);
    albumMap.get(album).push(t);
  }

  const sortedArtists = [...tree.keys()].sort((a, b) => a.localeCompare(b));

  for (const artist of sortedArtists) {
    const albumMap = tree.get(artist);
    const allArtistTracks = [...albumMap.values()].flat();

    const artistRow = document.createElement('div');
    artistRow.className = 'browse-artist-row';

    const arIcon = document.createElement('span');
    arIcon.className = 'br-icon'; arIcon.textContent = '▸';

    const arName = document.createElement('span');
    arName.className = 'browse-artist-name'; arName.textContent = artist;

    const arCount = document.createElement('span');
    arCount.className = 'browse-count'; arCount.textContent = allArtistTracks.length;

    const arAddBtn = document.createElement('button');
    arAddBtn.className = 'br-add-btn'; arAddBtn.textContent = '+ all';
    arAddBtn.addEventListener('click', e => {
      e.stopPropagation();
      addToQueue(allArtistTracks);
      setStatus(`added ${allArtistTracks.length} tracks — ${artist}`);
    });

    artistRow.append(arIcon, arName, arCount, arAddBtn);

    const albumsEl = document.createElement('div');
    albumsEl.className = 'browse-albums';
    let artistOpen = false;

    artistRow.addEventListener('click', () => {
      artistOpen = !artistOpen;
      arIcon.textContent = artistOpen ? '▾' : '▸';
      albumsEl.classList.toggle('open', artistOpen);
      if (artistOpen && !albumsEl.children.length) {
        const sortedAlbums = [...albumMap.keys()].sort((a, b) => a.localeCompare(b));
        for (const album of sortedAlbums) {
          const albumTracks = albumMap.get(album);

          const albumRow = document.createElement('div');
          albumRow.className = 'browse-album-row';

          const alIcon = document.createElement('span');
          alIcon.className = 'br-icon'; alIcon.textContent = '▸';

          const alName = document.createElement('span');
          alName.className = 'browse-album-name'; alName.textContent = album;

          const alCount = document.createElement('span');
          alCount.className = 'browse-count'; alCount.textContent = albumTracks.length;

          const alAddBtn = document.createElement('button');
          alAddBtn.className = 'br-add-btn'; alAddBtn.textContent = '+ all';
          alAddBtn.addEventListener('click', e => {
            e.stopPropagation();
            addToQueue(albumTracks);
            setStatus(`added ${albumTracks.length} tracks — ${album}`);
          });

          albumRow.append(alIcon, alName, alCount, alAddBtn);

          const tracksEl = document.createElement('div');
          tracksEl.className = 'browse-tracks';
          let albumOpen = false;

          albumRow.addEventListener('click', () => {
            albumOpen = !albumOpen;
            alIcon.textContent = albumOpen ? '▾' : '▸';
            tracksEl.classList.toggle('open', albumOpen);
            if (albumOpen && !tracksEl.children.length) {
              albumTracks.forEach(t => {
                const trackRow = document.createElement('div');
                trackRow.className = 'browse-track-row';

                const tIcon = document.createElement('span');
                tIcon.className = 'br-icon'; tIcon.textContent = '♪';

                const tName = document.createElement('span');
                tName.className = 'browse-track-name'; tName.textContent = t.name;

                trackRow.append(tIcon, tName);
                trackRow.addEventListener('click', () => {
                  addToQueue([t]);
                  const idx = state.tracks.findIndex(x => x.path === t.path);
                  if (idx >= 0) playIndex(idx);
                  switchTab('queue');
                });
                tracksEl.appendChild(trackRow);
              });
            }
          });

          albumsEl.appendChild(albumRow);
          albumsEl.appendChild(tracksEl);
        }
      }
    });

    elBrowseTree.appendChild(artistRow);
    elBrowseTree.appendChild(albumsEl);
  }
}


// ── Playlists ──────────────────────────────────────────────────────────────
async function renderPlaylists() {
  const lists = await window.electronAPI.getPlaylists();
  elPlistsList.innerHTML = '';
  elPlistsEmpty.style.display = lists.length ? 'none' : 'block';

  lists.forEach(pl => {
    const item = document.createElement('div');
    item.className = 'pl-saved-item';

    const nameEl = document.createElement('span');
    nameEl.className = 'pl-saved-name'; nameEl.textContent = pl.name;

    const countEl = document.createElement('span');
    countEl.className = 'pl-saved-count'; countEl.textContent = pl.tracks.length;

    const actions = document.createElement('div');
    actions.className = 'pl-saved-actions';

    const loadBtn = document.createElement('button');
    loadBtn.className = 'cmd-btn'; loadBtn.textContent = 'load';
    loadBtn.addEventListener('click', e => {
      e.stopPropagation();
      audio.pause(); audio.src = '';
      state.isPlaying = false; state.currentIndex = -1;
      state.tracks = [...pl.tracks];
      elTrackName.textContent = '─── no track selected ───';
      elTrackName.classList.remove('playing');
      elTrackIdx.textContent = '00'; elBtnPlay.textContent = '▶';
      renderPlaylist();
      switchTab('queue');
      setStatus(`loaded: ${pl.name} (${pl.tracks.length} tracks)`);
      if (state.tracks.length) playIndex(0);
    });

    const delBtn = document.createElement('button');
    delBtn.className = 'cmd-btn danger'; delBtn.textContent = 'del';
    delBtn.addEventListener('click', async e => {
      e.stopPropagation();
      await window.electronAPI.deletePlaylist(pl.name);
      renderPlaylists();
      setStatus(`deleted: ${pl.name}`);
    });

    actions.append(loadBtn, delBtn);
    item.append(nameEl, countEl, actions);
    elPlistsList.appendChild(item);
  });
}

const elQueueName = document.getElementById('queue-name');

(function setDefaultQueueName() {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const yy = String(now.getFullYear()).slice(-2);
  elQueueName.textContent = `${mm}/${dd}/${yy} QUEUE`;
})();

elQueueName.addEventListener('keydown', e => {
  if (e.key === 'Enter') { e.preventDefault(); elQueueName.blur(); }
});
elQueueName.addEventListener('blur', () => {
  if (!elQueueName.textContent.trim()) {
    const now = new Date();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const yy = String(now.getFullYear()).slice(-2);
    elQueueName.textContent = `${mm}/${dd}/${yy} QUEUE`;
  }
});

elBtnSaveQ.addEventListener('click', async () => {
  if (!state.tracks.length) { setStatus('queue is empty'); return; }
  const name = elQueueName.textContent.trim() || 'QUEUE';
  await window.electronAPI.savePlaylist(name, state.tracks);
  setStatus(`saved: "${name}"`);
});

// ── Init ───────────────────────────────────────────────────────────────────
setVolume(0.8);
renderPlaylist();
init();
