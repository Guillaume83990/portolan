// Le plan-séquence : une visite continue du yacht, générée par IA vidéo (Wan 2.2, image de départ
// et image d'arrivée) entre les photographies de chaque pièce, puis découpée en images.
// Le scroll avance ou recule dans la séquence. L'ouverture est une carte marine ancienne,
// au même cadrage que la première image, qui brûle depuis le yacht et révèle la mer.
// Tout est composé dans un petit shader WebGL : fondu entre deux images voisines (mouvement fluide),
// carte, étalonnage et grain.

const vertex = `
  attribute vec2 aPos;
  varying vec2 vUv;
  void main() { vUv = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const fragment = `
  precision mediump float;
  uniform sampler2D uA; uniform sampler2D uB; uniform sampler2D uCarte;
  uniform float uBlend; uniform float uCarteMix; uniform float uIntro;
  uniform vec2 uRes; uniform vec2 uImg; uniform vec2 uYacht; uniform float uTime;
  varying vec2 vUv;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
  }
  float fbm(vec2 p) { float v = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; } return v; }

  // Cadrage. Écran plus large que l'image : « cover » classique. Écran vertical (téléphone) :
  // on montre au moins BAND de la largeur de l'image, dans une bande placée un peu au-dessus du centre ;
  // au-dessus et en dessous, un halo flou de la même image prolonge la scène (les textes s'y posent).
  const float BAND = 0.52;
  const float BAND_Y = 0.6;
  vec2 frame(vec2 uv, out float inside) {
    float rs = uRes.x / uRes.y; float ri = uImg.x / uImg.y;
    inside = 1.0;
    if (rs > ri) return (uv - 0.5) * vec2(1.0, ri / rs) + 0.5;
    float vw = max(rs / ri, BAND);
    vec2 s = vec2(vw, vw * ri / rs);
    vec2 c = vec2(clamp(uYacht.x, vw * 0.5, 1.0 - vw * 0.5), 0.5);
    vec2 p = vec2((uv.x - 0.5) * s.x + c.x, (uv.y - BAND_Y) * s.y + 0.5);
    // Fondu doux entre la bande nette et le halo
    float e = 0.035 * s.y;
    inside = smoothstep(-e, e, p.y) * smoothstep(1.0 + e, 1.0 - e, p.y);
    return p;
  }

  vec3 frames(vec2 uv) { return mix(texture2D(uA, uv).rgb, texture2D(uB, uv).rgb, uBlend); }

  vec3 carteAt(vec2 uv) {
    // Carte légèrement assombrie : le titre clair doit rester lisible sur le papier
    vec3 carte = texture2D(uCarte, uv).rgb * 0.72;
    float n = fbm(uv * 4.0 + 3.1);
    float dist = distance(uv * vec2(1.777, 1.0), uYacht * vec2(1.777, 1.0));
    float ink = smoothstep(uIntro * 1.6 - 0.1, uIntro * 1.6, n * 0.7 + dist * 0.5);
    return mix(carte, vec3(0.043, 0.082, 0.075), ink);
  }

  void main() {
    float inside;
    vec2 uv = frame(vUv, inside);
    uv.y = 1.0 - uv.y;
    vec2 q = clamp(uv, 0.0, 1.0);
    vec3 col = frames(q);

    // La carte ancienne brûle depuis le yacht, avec un liseré de laiton
    if (uCarteMix < 1.0) {
      float n = fbm(q * 4.0 + 3.1);
      float dist = distance(q * vec2(1.777, 1.0), uYacht * vec2(1.777, 1.0));
      float field = dist * 0.9 + n * 0.55;
      float t = uCarteMix * 1.9;
      float m = smoothstep(t - 0.06, t + 0.06, field);
      float edge = smoothstep(0.1, 0.0, abs(field - t)) * step(0.001, uCarteMix);
      col = mix(col, carteAt(q), m);
      col += edge * vec3(0.70, 0.60, 0.38) * 0.9;
    }

    // Halo : la même scène, très floue et assombrie, au-dessus et au-dessous de la bande
    if (inside < 1.0) {
      vec3 halo = vec3(0.0);
      vec2 base = vec2(q.x, clamp(q.y, 0.04, 0.96));
      for (int i = 0; i < 8; i++) {
        float a = float(i) * 0.7854;
        vec2 o = vec2(cos(a), sin(a)) * (0.05 + 0.04 * mod(float(i), 3.0));
        vec2 sp = clamp(base + o, 0.0, 1.0);
        halo += mix(frames(sp), texture2D(uCarte, sp).rgb * 0.72, 1.0 - smoothstep(0.0, 1.0, uCarteMix));
      }
      halo = halo / 8.0 * 0.42;
      col = mix(halo, col, inside);
    }

    // Grain léger et vignette, comme une pellicule
    float vig = smoothstep(1.25, 0.35, length((vUv - 0.5) * vec2(uRes.x / uRes.y, 1.0)));
    col *= mix(0.78, 1.0, vig);
    col += (hash(vUv * uRes + fract(uTime) * 91.0) - 0.5) * 0.025;
    gl_FragColor = vec4(col, 1.0);
  }
`;

const clamp01 = (v) => Math.min(Math.max(v, 0), 1);
const smooth = (a, b, v) => { const t = clamp01((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const pad = (n) => String(n).padStart(4, '0');

export function createPlanSequence(canvas, options) {
  const {
    count, dir, carte, ext = 'webp',
    // Part du scroll où la carte brûle, sur la première image, avant que la caméra ne bouge
    // Sans carte (visites des fiches yachts), la caméra part dès le début du défilement
    carteRange = carte ? [0.02, 0.1] : [0, 0], yacht = [0.56, 0.48],
    startAt = 24, parallel = 8, onLoad,
    // Hero de l'accueil : seules les premières images sont téléchargées au chargement ; la suite part dès que
    // le visiteur touche, fait défiler ou appuie sur une touche (10 Mo épargnés à qui ne fait que passer)
    sobre = false,
  } = options;

  const gl = canvas.getContext('webgl', { antialias: false, alpha: false, premultipliedAlpha: false });
  if (!gl) throw new Error('WebGL indisponible');

  function shader(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }
  const program = gl.createProgram();
  gl.attachShader(program, shader(gl.VERTEX_SHADER, vertex));
  gl.attachShader(program, shader(gl.FRAGMENT_SHADER, fragment));
  gl.linkProgram(program);
  gl.useProgram(program);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(program, 'aPos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
  const U = {};
  ['uA', 'uB', 'uCarte', 'uBlend', 'uCarteMix', 'uIntro', 'uRes', 'uImg', 'uYacht', 'uTime'].forEach((n) => { U[n] = gl.getUniformLocation(program, n); });
  gl.uniform1i(U.uA, 0);
  gl.uniform1i(U.uB, 1);
  gl.uniform1i(U.uCarte, 2);
  gl.uniform2f(U.uYacht, yacht[0], yacht[1]);

  function texture(unit) {
    const t = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([11, 21, 19, 255]));
    return t;
  }
  const texA = texture(0);
  const texB = texture(1);
  const texC = texture(2);
  const bound = { 0: -1, 1: -1 };

  function upload(unit, tex, bitmap, key) {
    if (bound[unit] === key) return;
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, bitmap);
    bound[unit] = key;
  }

  // Chargement : d'abord le début, puis en priorité les images juste devant le visiteur.
  // Les images restent COMPRESSÉES en mémoire (quelques Mo) ; seules celles autour de la position du visiteur
  // sont décodées (une trentaine). Tout décoder d'avance demandait 400 Mo sur téléphone (1,4 Go sur ordinateur) :
  // les téléphones refusaient les dernières images, et la visite restait bloquée avant la fin.
  const blobs = new Array(count + 1); // image téléchargée (Blob), ou false si elle n'a jamais pu l'être
  const decoded = new Map(); // numéro → ImageBitmap décodée
  const decoding = new Set();
  const CAPACITY = window.matchMedia('(max-width: 760px)').matches ? 28 : 48;
  let done = 0;
  const total = count + 1;
  let size = [16, 9];
  let resolveStart;
  const ready = new Promise((r) => { resolveStart = r; });
  const state = { target: 1, current: 1, p: 0, intro: 0, running: false, visible: true };
  let carteReady = false;

  const tick = () => { done++; onLoad?.(done / total); if (carteReady && decoded.has(1) && done >= Math.min(startAt, count) + 1) resolveStart(); };

  if (!carte) { carteReady = true; tick(); } else fetch(carte).then((r) => r.blob()).then((b) => createImageBitmap(b)).then((bmp) => {
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, texC);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, bmp);
    bmp.close();
    carteReady = true;
    tick();
  }).catch(() => { carteReady = true; tick(); });

  // Décode une image au moment où elle va servir, et libère les plus éloignées du visiteur
  function decode(i) {
    if (i < 1 || i > count || !blobs[i] || decoded.has(i) || decoding.has(i)) return;
    decoding.add(i);
    createImageBitmap(blobs[i], { imageOrientation: 'from-image', premultiplyAlpha: 'none' }).then((bmp) => {
      decoding.delete(i);
      decoded.set(i, bmp);
      if (i === 1) { size = [bmp.width, bmp.height]; if (done >= Math.min(startAt, count) + 1 && carteReady) resolveStart(); }
      if (decoded.size > CAPACITY) {
        const pos = state.current;
        const loin = [...decoded.keys()].filter((k) => k !== bound[0] && k !== bound[1]).sort((a, b) => Math.abs(b - pos) - Math.abs(a - pos));
        for (const k of loin.slice(0, decoded.size - CAPACITY)) { decoded.get(k).close(); decoded.delete(k); }
      }
    }).catch(() => { decoding.delete(i); blobs[i] = false; advance(); });
  }

  async function fetchOne(i) {
    for (let essai = 0; essai < 3; essai++) {
      try {
        const res = await fetch(`${dir}f${pad(i)}.${ext}`);
        if (!res.ok) throw new Error(res.status);
        blobs[i] = await res.blob();
        break;
      } catch {
        await new Promise((r) => setTimeout(r, 400 * (essai + 1)));
      }
    }
    if (!blobs[i]) { blobs[i] = false; console.warn('Image manquante :', i); }
    advance();
    if (i === 1) decode(1);
    tick();
  }
  const taken = new Array(count + 1).fill(false);
  let loadedUpTo = 0;
  // Une image introuvable ne bloque plus la suite : on affiche sa voisine
  const advance = () => { while (loadedUpTo < count && blobs[loadedUpTo + 1] !== undefined) loadedUpTo++; };
  let ouvert = !sobre;
  let pris = 0;
  function next() {
    if (!ouvert && pris >= Math.min(startAt, count)) return null;
    pris++;
    // On charge d'abord la suite immédiate de ce qui est déjà prêt, en direction du visiteur
    const head = Math.max(1, Math.min(Math.floor(state.target), loadedUpTo + 1));
    for (let d = 0; d < 64; d++) {
      for (const i of [head + d, head - d]) if (i >= 1 && i <= count && !taken[i]) { taken[i] = true; return i; }
    }
    const i = taken.indexOf(false, 1);
    if (i < 0) return null;
    taken[i] = true;
    return i;
  }
  async function worker() { for (let i = next(); i; i = next()) await fetchOne(i); }
  for (let k = 0; k < parallel; k++) worker();
  // Première interaction du visiteur : on télécharge la suite du film
  function ouvrir() {
    if (ouvert) return;
    ouvert = true;
    ['pointerdown', 'wheel', 'touchstart', 'keydown', 'scroll'].forEach((t) => window.removeEventListener(t, ouvrir));
    for (let k = 0; k < parallel; k++) worker();
  }
  if (!ouvert) ['pointerdown', 'wheel', 'touchstart', 'keydown', 'scroll'].forEach((t) => window.addEventListener(t, ouvrir, { passive: true }));

  // L'image décodée la plus proche (en attendant que la bonne soit prête, quelques millisecondes)
  function nearest(i) {
    for (let d = 0; d < count; d++) {
      if (decoded.has(i - d)) return i - d;
      if (decoded.has(i + d)) return i + d;
    }
    return -1;
  }

  let listener = null;
  const t0 = performance.now();
  // Résolution adaptée à l'appareil : si dessiner une image prend trop longtemps (téléphone modeste,
  // ordinateur sans carte graphique), on calcule moins de pixels ; l'image reste nette à l'œil (elle est floue par nature)
  let echelle = 1;
  const durees = [];
  let derniereCle = '';

  function resize() {
    // Les images font 640 à 832 px de large : calculer l'écran en plus haute définition ne montrerait
    // aucun détail de plus, et coûtait jusqu'à neuf fois plus de calcul sur les téléphones (saccades)
    const dpr = Math.min(window.devicePixelRatio || 1, 1.25) * echelle;
    const w = Math.round(canvas.clientWidth * dpr);
    const h = Math.round(canvas.clientHeight * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
    }
  }
  window.addEventListener('resize', resize);
  resize();

  function frame() {
    if (!state.running) return;
    requestAnimationFrame(frame);
    if (!state.visible) return;
    // Glissement doux vers la position du scroll, sans dépasser les images déjà chargées
    const goal = Math.min(state.target, Math.max(1, loadedUpTo));
    state.current += (goal - state.current) * 0.1;
    const f = Math.min(Math.max(state.current, 1), count);
    const i0 = Math.floor(f);
    const i1 = Math.min(i0 + 1, count);
    // Décodage d'avance dans le sens du mouvement (et un peu derrière, pour revenir en arrière sans attente)
    const sens = state.target >= state.current ? 1 : -1;
    for (let d = -3; d <= 10; d++) decode(i0 + d * sens);
    const a = nearest(i0);
    const b = decoded.has(i1) ? i1 : a;
    if (a < 0) return;
    const melange = b === a ? 0 : f - i0;
    const carteMix = carte ? smooth(carteRange[0], carteRange[1], state.p) : 1;
    // Rien n'a changé depuis la dernière image dessinée : on ne redessine pas (le processeur se repose)
    const cle = `${a}|${b}|${melange.toFixed(3)}|${carteMix.toFixed(3)}|${state.intro.toFixed(3)}|${canvas.width}x${canvas.height}`;
    if (cle === derniereCle) return;
    derniereCle = cle;
    const debut = performance.now();
    upload(0, texA, decoded.get(a), a);
    upload(1, texB, decoded.get(b), b);

    gl.uniform1f(U.uBlend, melange);
    gl.uniform1f(U.uCarteMix, carteMix);
    gl.uniform1f(U.uIntro, state.intro);
    gl.uniform2f(U.uRes, canvas.width, canvas.height);
    gl.uniform2f(U.uImg, size[0], size[1]);
    gl.uniform1f(U.uTime, (debut - t0) / 1000);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    durees.push(performance.now() - debut);
    if (durees.length >= 4) {
      const moyenne = durees.reduce((s, d) => s + d, 0) / durees.length;
      durees.length = 0;
      if (moyenne > 20 && echelle > 0.4) { echelle = Math.max(0.4, echelle * 0.7); resize(); }
    }
    // Les textes suivent l'image réellement affichée (lissée), pas la position brute du scroll
    listener?.(f <= 1.001 ? state.p : fromFrame(f), f);
  }

  // La caméra reste sur la première image pendant que la carte brûle, puis la séquence démarre
  const toFrame = (p) => 1 + clamp01((p - carteRange[1]) / (1 - carteRange[1])) * (count - 1);
  const fromFrame = (f) => carteRange[1] + ((f - 1) / (count - 1)) * (1 - carteRange[1]);

  return {
    ready,
    count,
    start() {
      if (state.running) return;
      state.running = true;
      frame();
    },
    intro(duration = 2600) {
      const start = performance.now();
      const step = () => {
        state.intro = clamp01((performance.now() - start) / duration);
        if (state.intro < 1) requestAnimationFrame(step);
      };
      step();
    },
    setProgress(p) {
      state.p = clamp01(p);
      state.target = toFrame(state.p);
    },
    setVisible(v) { state.visible = v; },
    onUpdate(fn) { listener = fn; },
  };
}
