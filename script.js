/* ============================================================
   CONFESSION SITE — SCRIPT
   Sections:
   1. Ambient particle background (hearts / stars / glow dots)
   2. Landing -> main content transition
   3. Scroll-triggered fade-up reveals
   4. Interactive envelope / letter
   5. Question buttons + response
   6. Floating music player
   ============================================================ */

/* ---------------------------------------------------------
   1. AMBIENT PARTICLES
   Lightweight canvas animation: soft glowing dots, tiny hearts
   and stars drifting upward. Respects reduced-motion.
--------------------------------------------------------- */
(function initParticles() {
  const canvas = document.getElementById('particle-canvas');
  const ctx = canvas.getContext('2d');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let width, height, particles;
  const SHAPES = ['heart', 'star', 'dot'];
  const COLORS = ['#e98fb0', '#c9a8e9', '#9fc6ea', '#ffffff'];

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }

  function makeParticle() {
    return {
      x: Math.random() * width,
      y: height + Math.random() * height,
      size: 6 + Math.random() * 10,
      speed: 0.25 + Math.random() * 0.5,
      drift: (Math.random() - 0.5) * 0.4,
      opacity: 0.15 + Math.random() * 0.35,
      shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      wobble: Math.random() * Math.PI * 2
    };
  }

  function initParticleField() {
    const count = window.innerWidth < 700 ? 18 : 32;
    particles = Array.from({ length: count }, makeParticle);
  }

  function drawHeart(p) {
    const s = p.size / 12;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.scale(s, s);
    ctx.beginPath();
    ctx.moveTo(0, 4);
    ctx.bezierCurveTo(-8, -6, -14, 4, 0, 14);
    ctx.bezierCurveTo(14, 4, 8, -6, 0, 4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawStar(p) {
    const spikes = 4;
    const outer = p.size / 2;
    const inner = outer / 2.4;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.beginPath();
    for (let i = 0; i < spikes * 2; i++) {
      const r = i % 2 === 0 ? outer : inner;
      const angle = (Math.PI / spikes) * i;
      ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawDot(p) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size / 3.2, 0, Math.PI * 2);
    ctx.fill();
  }

  function tick() {
    ctx.clearRect(0, 0, width, height);
    particles.forEach((p) => {
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = p.color;

      if (p.shape === 'heart') drawHeart(p);
      else if (p.shape === 'star') drawStar(p);
      else drawDot(p);

      p.wobble += 0.01;
      p.y -= p.speed;
      p.x += p.drift + Math.sin(p.wobble) * 0.15;

      if (p.y < -20) {
        Object.assign(p, makeParticle(), { y: height + 20 });
      }
    });
    ctx.globalAlpha = 1;
    requestAnimationFrame(tick);
  }

  resize();
  initParticleField();
  window.addEventListener('resize', () => {
    resize();
    initParticleField();
  });

  if (!prefersReducedMotion) {
    requestAnimationFrame(tick);
  }
})();

/* ---------------------------------------------------------
   2. LANDING -> MAIN CONTENT
--------------------------------------------------------- */
const landing = document.getElementById('landing');
const mainContent = document.getElementById('mainContent');
const continueBtn = document.getElementById('continueBtn');

continueBtn.addEventListener('click', () => {
  landing.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
  landing.style.opacity = '0';
  landing.style.transform = 'translateY(-24px)';

  setTimeout(() => {
    landing.style.display = 'none';
    mainContent.classList.add('visible');
    // Reveal whatever is already in the first viewport
    revealVisibleElements();
  }, 750);
});

/* ---------------------------------------------------------
   3. SCROLL-TRIGGERED FADE-UP REVEALS
--------------------------------------------------------- */
const fadeEls = document.querySelectorAll('.fade-up, .ending-reveal');

// Small stagger for list items that share a parent
document.querySelectorAll('.attention-list li, .truth-list .fade-up').forEach((el, i) => {
  el.style.setProperty('--stagger', `${(i % 7) * 0.08}s`);
});

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.18, rootMargin: '0px 0px -60px 0px' }
);

fadeEls.forEach((el) => revealObserver.observe(el));

function revealVisibleElements() {
  fadeEls.forEach((el) => {
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.9) {
      el.classList.add('in-view');
    }
  });
}

/* ---------------------------------------------------------
   4. INTERACTIVE ENVELOPE / LETTER
--------------------------------------------------------- */
const envelope = document.getElementById('envelope');

envelope.addEventListener('click', () => {
  envelope.classList.toggle('open');
});

envelope.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    envelope.classList.toggle('open');
  }
});
envelope.setAttribute('tabindex', '0');
envelope.setAttribute('role', 'button');
envelope.setAttribute('aria-label', 'Open the letter');

/* ---------------------------------------------------------
   5. QUESTION BUTTONS + RESPONSE
--------------------------------------------------------- */
const btnYes = document.getElementById('btnYes');
const btnMaybe = document.getElementById('btnMaybe');
const questionResponse = document.getElementById('questionResponse');

const RESPONSES = {
  yes: "That means more to me than you probably realize. Thank you for giving this a chance \u2014 I'd love to talk whenever you're ready.",
  maybe: "That's completely okay. There's no clock running on this. I'm just glad I finally said it \u2014 the rest can happen whenever it happens."
};

let answerLocked = false;

function selectAnswer(button, key) {
  if (answerLocked) return; // choice is final — no switching afterward
  answerLocked = true;

  [btnYes, btnMaybe].forEach((b) => {
    b.classList.remove('selected');
    b.disabled = true;
    b.classList.add('locked');
  });
  button.classList.add('selected');

  questionResponse.textContent = RESPONSES[key];
  questionResponse.classList.remove('show');
  // force reflow so the transition replays even if clicked twice
  void questionResponse.offsetWidth;
  questionResponse.classList.add('show');
}

btnYes.addEventListener('click', () => selectAnswer(btnYes, 'yes'));
btnMaybe.addEventListener('click', () => selectAnswer(btnMaybe, 'maybe'));

/* ---------------------------------------------------------
   6. FLOATING MUSIC PLAYER
   To change the song: replace the src on the <audio id="audioEl">
   element in index.html with a path to your own audio file,
   e.g. <audio id="audioEl" src="assets/our-song.mp3" ...>
--------------------------------------------------------- */
const audioEl = document.getElementById('audioEl');
const musicToggle = document.getElementById('musicToggle');
const musicPanel = document.getElementById('musicPanel');
const playPauseBtn = document.getElementById('playPauseBtn');
const playIcon = document.getElementById('playIcon');
const pauseIcon = document.getElementById('pauseIcon');
const progressBar = document.getElementById('progressBar');
const volumeBar = document.getElementById('volumeBar');
const currentTimeEl = document.getElementById('currentTime');
const durationEl = document.getElementById('duration');
const musicDisc = document.getElementById('musicDisc');

audioEl.volume = 0.6;

musicToggle.addEventListener('click', () => {
  musicPanel.classList.toggle('open');
});

function formatTime(seconds) {
  if (!isFinite(seconds) || isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

playPauseBtn.addEventListener('click', () => {
  if (!audioEl.src) {
    // No audio file has been added yet — let the disc spin briefly as gentle feedback.
    musicDisc.classList.add('spinning');
    setTimeout(() => musicDisc.classList.remove('spinning'), 1200);
    return;
  }
  if (audioEl.paused) {
    audioEl.play();
  } else {
    audioEl.pause();
  }
});

audioEl.addEventListener('play', () => {
  playIcon.style.display = 'none';
  pauseIcon.style.display = 'inline';
  musicDisc.classList.add('spinning');
});

audioEl.addEventListener('pause', () => {
  playIcon.style.display = 'inline';
  pauseIcon.style.display = 'none';
  musicDisc.classList.remove('spinning');
});

audioEl.addEventListener('loadedmetadata', () => {
  durationEl.textContent = formatTime(audioEl.duration);
});

audioEl.addEventListener('timeupdate', () => {
  if (audioEl.duration) {
    progressBar.value = (audioEl.currentTime / audioEl.duration) * 100;
    currentTimeEl.textContent = formatTime(audioEl.currentTime);
  }
});

progressBar.addEventListener('input', () => {
  if (audioEl.duration) {
    audioEl.currentTime = (progressBar.value / 100) * audioEl.duration;
  }
});

volumeBar.addEventListener('input', () => {
  audioEl.volume = volumeBar.value / 100;
});
