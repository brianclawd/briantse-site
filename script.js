const panels = [...document.querySelectorAll('.panel')];
const bgVideo = document.getElementById('bgVideo');
const audio = document.getElementById('storyAudio');
const playBtn = document.getElementById('playBtn');
const readBtn = document.getElementById('readBtn');
const notice = document.getElementById('modeNotice');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let syncTimer = null;
const cues = [0, 5, 10, 15, 20, 25, 30, 35, 41, 47];

const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (e.isIntersecting) {
      panels.forEach(p => p.classList.remove('active'));
      e.target.classList.add('active');
    }
  });
}, { threshold: 0.65 });
panels.forEach(p => io.observe(p));

function showNotice(text = '') {
  notice.textContent = text;
}

function scrollToPanel(i) {
  if (!panels[i]) return;
  panels[i].scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
}

function stopSync() {
  if (syncTimer) clearInterval(syncTimer);
  syncTimer = null;
}

function startSync() {
  stopSync();
  syncTimer = setInterval(() => {
    const t = audio.currentTime;
    let idx = 0;
    for (let i = 0; i < cues.length; i++) if (t >= cues[i]) idx = i;
    idx = Math.min(idx, panels.length - 1);
    scrollToPanel(idx);
    if (idx >= panels.length - 1) stopSync();
  }, 500);
}

function setMode(mode, msg = '') {
  const play = mode === 'play';
  playBtn.classList.toggle('active', play);
  readBtn.classList.toggle('active', !play);

  if (play) {
    Promise.all([
      audio.play(),
      bgVideo ? bgVideo.play() : Promise.resolve()
    ]).then(() => {
      startSync();
      showNotice(msg);
    }).catch(() => {
      setMode('read', 'Media unavailable. Switched to reading mode.');
    });
  } else {
    stopSync();
    audio.pause();
    if (bgVideo) bgVideo.pause();
    showNotice(msg);
  }
}

playBtn.addEventListener('click', () => setMode('play'));
readBtn.addEventListener('click', () => setMode('read', ''));

audio.addEventListener('error', () => setMode('read', 'Audio failed to load. Reading mode enabled.'));
if (bgVideo) bgVideo.addEventListener('error', () => showNotice('Video unavailable. Story remains fully readable.'));

if (reducedMotion) {
  setMode('read', 'Reduced motion enabled — reading mode active.');
} else {
  setMode('read', '');
}
