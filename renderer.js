// renderer.js — Empeethree

// ── Logo Builder ───────────────────────────────────────────────────────────
const LOGO_COLORS = {
  a: '#2a1500', b: '#4a2800', c: '#7a4a0a', d: '#b8891a', e: '#EAAC34',
};

function s(color, text) {
  return `<span style="color:${LOGO_COLORS[color]}">${text}</span>`;
}

function buildLogo(size) {
  // size: 'large' (splash) | 'small' (panel)
  const bars = size === 'large'
    ? [['a','▮'],['b','▯▮'],['c','▯▮'],['d','▯▮▯▮']]
    : [['b','▮'],['c','▯▮'],['d','▯▮▯']];

  const leftBars  = bars.map(([,ch]) => ch).join('');
  const rightBars = [...bars].reverse().map(([,ch]) => ch).join('');
  const name      = 'EMPEETHREE';
  const inner     = ` ${leftBars}  ${name}  ${rightBars} `;
  const width     = inner.length;
  const hr        = '─'.repeat(width);

  const top    = s('e', '┌' + hr + '┐');
  const bottom = s('e', '└' + hr + '┘');

  let mid = s('e', '│ ');
  for (const [col, ch] of bars) mid += s(col, ch);
  mid += s('e', `  ${name}  `);
  for (const [col, ch] of [...bars].reverse()) mid += s(col, ch);
  mid += s('e', ' │');

  return top + '\n' + mid + '\n' + bottom;
}

// Panel logo (text-based, stays as-is)
document.getElementById('panel-logo-pre').innerHTML = buildLogo('small');

// ── Splash canvas glow renderer ────────────────────────────────────────────
(function() {
  const splash = document.getElementById('splash');

  // Replace the <pre> with a canvas
  const oldPre = document.getElementById('splash-logo');
  oldPre.style.display = 'none';

  const cv = document.createElement('canvas');
  cv.id = 'splash-canvas';
  cv.style.cssText = 'display:block;width:100%;max-width:700px;';
  splash.insertBefore(cv, oldPre);

  function renderSplashCanvas() {
    const DPR  = window.devicePixelRatio || 1;
    const W    = cv.offsetWidth  || 600;
    const H    = Math.round(W * 0.22);
    cv.width   = W * DPR;
    cv.height  = H * DPR;
    cv.style.height = H + 'px';

    const ctx  = cv.getContext('2d');
    ctx.scale(DPR, DPR);
    ctx.clearRect(0, 0, W, H);

    // ── Geometry ──
    const N_BARS   = 7;
    const BAR_W    = Math.max(3, W * 0.009);
    const BAR_GAP  = Math.max(2, W * 0.007);
    const NAME_PAD = W * 0.038;
    const WALL_PAD = W * 0.03;
    const bars_span = N_BARS * BAR_W + (N_BARS - 1) * BAR_GAP;

    // Amber color stops (RGB) — same as Instagram post
    const BAR_COLORS = [
      [195,115,18], [195,115,18],
      [145,82,10],  [90,50,5],
      [52,28,0],    [52,28,0], [24,12,0]
    ];

    // Font size — fill available name width
    const availNameW = W - 2 * (WALL_PAD + bars_span + NAME_PAD);
    let fontSize = 10;
    ctx.font = `bold ${fontSize}px 'JetBrains Mono', monospace`;
    while (ctx.measureText('EMPEETHREE').width < availNameW && fontSize < 200) {
      fontSize++;
      ctx.font = `bold ${fontSize}px 'JetBrains Mono', monospace`;
    }
    fontSize = Math.max(1, fontSize - 1);
    ctx.font = `bold ${fontSize}px 'JetBrains Mono', monospace`;

    const nameW  = ctx.measureText('EMPEETHREE').width;
    const nameX  = W/2 - nameW/2;
    const cy     = H/2;
    const barH   = H * 0.38;
    const barTop = cy - barH/2;

    // ── Offscreen glow layer ──
    const off    = document.createElement('canvas');
    off.width    = W; off.height = H;
    const og     = off.getContext('2d');
    og.font      = ctx.font;

    function drawElements(g, alpha) {
      // bars left (index 0 = closest to name = brightest)
      for (let i = 0; i < N_BARS; i++) {
        const [r,gv,b] = BAR_COLORS[i];
        g.fillStyle = `rgba(${r},${gv},${b},${alpha})`;
        const bx = nameX - NAME_PAD - BAR_W - i * (BAR_W + BAR_GAP);
        g.fillRect(bx, barTop, BAR_W, barH);
      }
      // bars right
      for (let i = 0; i < N_BARS; i++) {
        const [r,gv,b] = BAR_COLORS[i];
        g.fillStyle = `rgba(${r},${gv},${b},${alpha})`;
        const bx = nameX + nameW + NAME_PAD + i * (BAR_W + BAR_GAP);
        g.fillRect(bx, barTop, BAR_W, barH);
      }
      // name
      g.fillStyle = `rgba(195,115,18,${alpha})`;
      g.fillText('EMPEETHREE', nameX, cy + fontSize * 0.35);
    }

    drawElements(og, 1.0);

    // ── Blur passes (simulate bloom) ──
    // We do multiple draw passes at different scales to fake gaussian glow
    ctx.clearRect(0, 0, W, H);

    // Wide ambient glow — draw offscreen scaled up slightly + blurred via shadow
    ctx.save();
    ctx.filter = 'blur(18px)';
    ctx.globalAlpha = 0.55;
    ctx.drawImage(off, 0, 0);
    ctx.restore();

    // Medium halo
    ctx.save();
    ctx.filter = 'blur(6px)';
    ctx.globalAlpha = 0.70;
    ctx.drawImage(off, 0, 0);
    ctx.restore();

    // Tight bloom
    ctx.save();
    ctx.filter = 'blur(2px)';
    ctx.globalAlpha = 0.85;
    ctx.drawImage(off, 0, 0);
    ctx.restore();

    // Sharp layer on top
    ctx.save();
    ctx.filter = 'none';
    ctx.globalAlpha = 1.0;
    // Reduce green to keep amber not yellow
    // Draw directly with slightly desaturated amber
    drawElements(ctx, 1.0);
    ctx.restore();

    // ── Scanlines ──
    for (let y = 0; y < H; y += 4) {
      ctx.fillStyle = 'rgba(0,0,0,0.22)';
      ctx.fillRect(0, y, W, 1);
    }
  }

  // Wait for fonts then render
  document.fonts.ready.then(() => {
    renderSplashCanvas();
  });
  setTimeout(renderSplashCanvas, 100);
  window.addEventListener('resize', renderSplashCanvas);
})();

// Scale panel logo to fill sidebar width
function scalePanelLogo() {
  const pre       = document.getElementById('panel-logo-pre');
  const container = document.getElementById('panel-logo');
  const available = container.clientWidth;
  const natural   = pre.scrollWidth;
  if (!natural) return;
  const scale = Math.min((available / natural), 1.6); // cap at 1.6x to avoid blurriness
  pre.style.transform = `scaleX(${scale})`;
}
// Run after fonts load and on resize
document.fonts.ready.then(scalePanelLogo);
window.addEventListener('resize', scalePanelLogo);
setTimeout(scalePanelLogo, 200); // fallback

// ── Splash Screen ──────────────────────────────────────────────────────────
const elSplash    = document.getElementById('splash');
const elSplashMsg = document.getElementById('splash-msg');

function setSplashMsg(msg) { elSplashMsg.textContent = msg; }

function dismissSplash() {
  elSplash.classList.add('hidden');
  setTimeout(() => { elSplash.style.display = 'none'; }, 420);
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
const elBtnFiles    = document.getElementById('btn-open-files');
const elBtnClearQ   = document.getElementById('btn-clear-queue');
const elBtnSettings = document.getElementById('btn-settings');
const elBtnSetRoot  = document.getElementById('btn-set-root-empty');
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
    setSplashMsg('ready.');
    setTimeout(dismissSplash, 500);
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

  state.tracks.forEach((t, i) => {
    const item = document.createElement('div');
    item.className = 'pl-item' + (i === state.currentIndex ? ' active' : '');

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
  if (!state.tracks.length) return;
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

elBtnFiles.addEventListener('click', async () => {
  const files = await window.electronAPI.openFiles();
  if (!files.length) return;
  addToQueue(files);
  setStatus(`${files.length} file(s) added`);
});

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

// ── Visualizer: centered symmetrical fading bars ──────────────────────────
// Half-count bars mirrored L/R from center.
// Frequency bins mapped outward: low freqs at center, highs at edges.
// Opacity steps match the logo fade pattern.

const HALF       = 18;    // bars per side — 36 total
const BAR_GAP    = 3;     // gap between bars in px
const MAX_H      = 0.88;  // max bar height fraction
const SMOOTHING  = 0.14;  // easing (lower = snappier)

const barHeights = new Float32Array(HALF * 2).fill(0);

function edgeOpacity(distFromCenter) {
  // distFromCenter: 0 = innermost bar, 1 = outermost
  // Stepped to echo ▮▯▮▯ logo pattern
  if (distFromCenter < 0.12) return 1.00;
  if (distFromCenter < 0.28) return 0.90;
  if (distFromCenter < 0.44) return 0.65;
  if (distFromCenter < 0.58) return 0.40;
  if (distFromCenter < 0.72) return 0.20;
  if (distFromCenter < 0.85) return 0.09;
  return 0.03;
}

function drawVisualizer() {
  requestAnimationFrame(drawVisualizer);
  const W = elCanvas.width, H = elCanvas.height;
  analyser.getByteFrequencyData(freqData);

  canvasCtx.fillStyle = '#0d0d0d';
  canvasCtx.fillRect(0, 0, W, H);

  // Use log-scaled frequency range so bass/mids dominate center
  // and highs taper off toward edges — musically feels right
  const binRange = Math.floor(bufLen * 0.6);

  const totalBarW = W / (HALF * 2);
  const barW      = Math.max(2, totalBarW - BAR_GAP);

  for (let i = 0; i < HALF; i++) {
    // Log scale: inner bars map to low freqs, outer to high
    const t      = i / HALF;
    const logT   = Math.pow(t, 0.6); // compress low end
    const binIdx = Math.floor(logT * binRange);
    const raw    = freqData[binIdx] / 255;

    const target = state.isPlaying ? raw * MAX_H : 0.0;
    const ease   = state.isPlaying ? SMOOTHING : 0.08;

    // Apply to both sides (mirrored)
    barHeights[HALF - 1 - i] += (target - barHeights[HALF - 1 - i]) * ease; // left side
    barHeights[HALF + i]     += (target - barHeights[HALF + i])     * ease; // right side
  }

  for (let i = 0; i < HALF * 2; i++) {
    const bH   = Math.max(2, barHeights[i] * H);
    const x    = i * totalBarW + (totalBarW - barW) / 2;
    const yTop = H / 2 - bH / 2;

    // Distance from center: 0 = innermost, 1 = outermost
    const dist    = Math.abs(i - (HALF - 0.5)) / HALF;
    const opacity = edgeOpacity(dist);

    canvasCtx.fillStyle = `rgba(234, 172, 52, ${opacity})`;
    canvasCtx.fillRect(Math.round(x), Math.round(yTop), barW, Math.round(bH));
  }

  // Idle: single faint center line
  if (!state.isPlaying) {
    canvasCtx.strokeStyle = 'rgba(232,168,56,0.06)';
    canvasCtx.lineWidth = 1;
    canvasCtx.beginPath();
    canvasCtx.moveTo(0, H / 2);
    canvasCtx.lineTo(W, H / 2);
    canvasCtx.stroke();
  }
}

drawVisualizer();

// ── Init ───────────────────────────────────────────────────────────────────
setVolume(0.8);
renderPlaylist();
init();
