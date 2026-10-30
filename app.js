/* Web Ops recruitment, Pichavaram House.
   One question per card. Answers post to the house's Google Form (see config.js). */

const QUESTIONS = [
  { id: "name", type: "text", title: "First things first. <i>Your name?</i>", placeholder: "Full name", autocomplete: "name", required: true },
  { id: "email", type: "email", title: "Your IITM email.", hint: "The ds.study.iitm.ac.in one. That's how we'll find you.", placeholder: "21f1000000@ds.study.iitm.ac.in", autocomplete: "email", required: true },
  { id: "level", type: "single", title: "Where are you in the degree?", options: ["Foundation", "Diploma", "BSc", "BS"], required: true },
  {
    id: "skills", type: "multi", title: "What can you <i>actually</i> do?",
    hint: "Tick what you can do today, not what you plan to learn. Pick as many as are true.",
    options: [
      ["Frontend", "HTML, CSS, JS, React"],
      ["Backend & APIs", "Node, Python, databases"],
      ["UI / UX design", "Figma, layouts, type"],
      ["Automation", "Scripts, bots, Apps Script"],
      ["Hosting & deploys", "Vercel, GitHub Pages, domains"],
      ["Sheets & data", "Formulas, dashboards"],
      ["Graphics & video", "Posters, reels, motion"]
    ],
    required: true
  },
  {
    id: "work", type: "long", title: "Show us your work.",
    hint: "Done any projects before? Drop the links straight away: GitHub, live sites, Figma, Drive, anything. One per line. Nothing yet? Tell us what you'd build first.",
    placeholder: "https://github.com/…\nhttps://your-site.vercel.app", required: true, minLen: 10
  },
  { id: "proud", type: "long", title: "The one thing you've built that you're <i>proud</i> of.", hint: "Two or three lines. What it was, what you did on it.", placeholder: "Built a… / Fixed a… / Shipped a…", required: true, minLen: 15 },
  { id: "hours", type: "range", title: "Hours a week you can <i>really</i> give.", hint: "Be honest. Five steady hours beat twenty promised ones.", min: 2, max: 20, value: 6, required: true },
  { id: "phone", type: "tel", title: "WhatsApp number.", hint: "Only for adding you to the team group if you're picked.", placeholder: "98xxxxxx10", autocomplete: "tel", required: true },
  { id: "extra", type: "long", title: "Anything else we should know?", hint: "Optional. Skip it if there's nothing.", placeholder: "Ideas for the house site, tools you love, anything.", required: false }
];

const LABELS = { name: "Name", email: "Email", level: "Level", skills: "Skills", work: "Work", proud: "Proud of", hours: "Hours / week", phone: "WhatsApp", extra: "Anything else" };
const answers = { hours: 6, skills: [] };
const card = document.getElementById("card");
const bar = document.getElementById("bar");
const stepLabel = document.getElementById("step-label");
const prevBtn = document.getElementById("prev");
const nextBtn = document.getElementById("next");
const arrow = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 8h10M9 4l4 4-4 4"/></svg>';
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const total = QUESTIONS.length;
let current = 0;
let sending = false;
let booted = false;

/* ---------- Build slides ---------- */
function intro() {
  return `<section class="slide" data-kind="intro">
    <p class="qnum"><b>Recruitment</b><em>· Web Ops team</em></p>
    <h1>We need people<br>who <span class="u">build</span> <i>things.</i></h1>
    <p class="lead">Pichavaram House is picking people for Web Ops: the house site, tools, automations, the works. No cover letter, no long intro. Show us what you've made.</p>
    <ul class="facts"><li>9 questions</li><li>~3 minutes</li><li>Last date · 15 November</li></ul>
    <p class="hint">Every answer grows the mangrove a little more. Finish it.</p>
    <div class="actions"><button type="button" class="btn gold" data-go="next">Let's go ${arrow}</button><span class="press">press <kbd>Enter ↵</kbd></span></div>
  </section>`;
}

function field(q) {
  switch (q.type) {
    case "long":
      return `<div class="field"><textarea id="f-${q.id}" name="${q.id}" rows="4" placeholder="${esc(q.placeholder || "")}"></textarea></div>`;
    case "single":
      return `<div class="choices">${q.options.map((o, i) => `<button type="button" class="choice" data-val="${esc(o)}" aria-pressed="false"><kbd>${String.fromCharCode(65 + i)}</kbd><span>${o}</span></button>`).join("")}</div>`;
    case "multi":
      return `<div class="choices grid">${q.options.map(([o, sub], i) => `<button type="button" class="choice" data-val="${esc(o)}" aria-pressed="false"><kbd>${String.fromCharCode(65 + i)}</kbd><span>${o}<small>${sub}</small></span></button>`).join("")}</div>`;
    case "range":
      return `<div class="range"><output id="o-${q.id}">${q.value}<small>hrs / week</small></output>
        <input type="range" id="f-${q.id}" min="${q.min}" max="${q.max}" value="${q.value}" step="1" aria-label="Hours per week">
        <div class="ticks"><span>${q.min}</span><span>${(q.min + q.max) / 2 | 0}</span><span>${q.max}+</span></div>
        <p class="verdict" id="v-${q.id}"></p></div>`;
    default:
      return `<div class="field"><input id="f-${q.id}" name="${q.id}" type="${q.type}" placeholder="${esc(q.placeholder || "")}" autocomplete="${q.autocomplete || "off"}" ${q.type === "tel" ? 'inputmode="tel"' : ""}></div>`;
  }
}

function questionSlide(q, i) {
  const multiline = q.type === "long";
  const keyHint = multiline ? "<kbd>Ctrl</kbd> + <kbd>Enter ↵</kbd>" : "<kbd>Enter ↵</kbd>";
  return `<section class="slide" data-kind="q" data-id="${q.id}">
    <p class="qnum"><b>${String(i + 1).padStart(2, "0")}</b><em>/ ${String(total).padStart(2, "0")}${q.required ? "" : " · optional"}</em></p>
    <h2>${q.title}</h2>
    ${q.hint ? `<p class="hint">${q.hint}</p>` : ""}
    ${field(q)}
    <p class="err" role="alert"></p>
    <div class="actions"><button type="button" class="btn" data-go="next">${q.required ? "OK" : "Next"} ${arrow}</button><span class="press">press ${keyHint}</span></div>
  </section>`;
}

function reviewSlide() {
  return `<section class="slide" data-kind="review">
    <p class="qnum"><b>Last look</b><em>· check and send</em></p>
    <h2>All good?</h2>
    <dl class="review" id="review"></dl>
    <p class="err" role="alert"></p>
    <div class="actions"><button type="button" class="btn gold" data-go="submit">Send it ${arrow}</button><button type="button" class="ghost" data-go="prev">Back</button></div>
  </section>`;
}

function doneSlide() {
  return `<section class="slide" data-kind="done">
    <svg class="done-mark" viewBox="0 0 74 74"><circle cx="37" cy="37" r="35"/><path d="M24 38l9 9 18-19"/></svg>
    <p class="qnum"><b>Sent</b><em>· response saved</em></p>
    <h2>Got it, <i id="done-name">friend</i>.</h2>
    <p class="lead">We go through every response after 15 November. If you're shortlisted, you'll hear from us on WhatsApp for a quick chat. That's it.</p>
    <p class="hint">Know someone in Pichavaram who builds stuff? Send them this link.</p>
    <div class="actions"><button type="button" class="btn" id="copy-link">Copy link ${arrow}</button></div>
  </section>`;
}

card.innerHTML = intro() + QUESTIONS.map(questionSlide).join("") + reviewSlide() + doneSlide();
const slides = [...card.querySelectorAll(".slide")];
const LAST_Q = total;            // index of the last question slide
const REVIEW = total + 1;
const DONE = total + 2;

/* ---------- Answers ---------- */
QUESTIONS.forEach(q => {
  const slide = card.querySelector(`[data-id="${q.id}"]`);
  if (q.type === "single" || q.type === "multi") {
    slide.querySelectorAll(".choice").forEach(btn => btn.addEventListener("click", () => pick(q, btn)));
  } else if (q.type === "range") {
    const input = slide.querySelector("input");
    const sync = () => {
      const v = +input.value;
      answers[q.id] = v;
      slide.querySelector("output").innerHTML = `${v}${v === q.max ? "+" : ""}<small>hrs / week</small>`;
      input.style.setProperty("--p", ((v - q.min) / (q.max - q.min)) * 100 + "%");
      slide.querySelector(".verdict").textContent =
        v <= 3 ? "Fine for small fixes now and then." : v <= 7 ? "Solid. Enough to own a page or a tool." : v <= 12 ? "That's a core-team amount of time." : "Okay, you mean business.";
      if (booted) Scene.pulse(.4);
    };
    input.addEventListener("input", sync);
    sync();
  } else {
    const input = slide.querySelector("input, textarea");
    input.addEventListener("input", () => { answers[q.id] = input.value; clearErr(slide); Scene.pulse(.08); });
  }
});

function pick(q, btn) {
  const slide = btn.closest(".slide");
  clearErr(slide);
  if (q.type === "single") {
    slide.querySelectorAll(".choice").forEach(b => b.setAttribute("aria-pressed", String(b === btn)));
    answers[q.id] = btn.dataset.val;
    Scene.pulse(1);
    setTimeout(() => current === slides.indexOf(slide) && go(current + 1), 380);
  } else {
    const on = btn.getAttribute("aria-pressed") !== "true";
    btn.setAttribute("aria-pressed", String(on));
    answers[q.id] = [...slide.querySelectorAll('.choice[aria-pressed="true"]')].map(b => b.dataset.val);
    Scene.pulse(on ? .7 : .2);
  }
}

function validate(q) {
  const v = answers[q.id];
  const empty = v == null || (Array.isArray(v) ? v.length === 0 : String(v).trim() === "");
  if (!q.required && empty) return "";
  if (empty) return q.type === "multi" ? "Pick at least one." : q.type === "single" ? "Pick one." : "This one's needed.";
  const s = String(v).trim();
  if (q.id === "email" && !/^[^\s@]+@(ds|es)\.study\.iitm\.ac\.in$/i.test(s)) return "Use your IITM student email (…@ds.study.iitm.ac.in).";
  if (q.id === "phone" && s.replace(/\D/g, "").length < 10) return "That doesn't look like a full number.";
  if (q.minLen && s.length < q.minLen) return "Give us a little more than that.";
  return "";
}

function showErr(slide, msg) {
  const el = slide.querySelector(".err");
  el.textContent = msg;
  slide.classList.remove("shake");
  void slide.offsetWidth;
  slide.classList.add("shake");
}
function clearErr(slide) { const el = slide.querySelector(".err"); if (el) el.textContent = ""; }

/* ---------- Navigation ---------- */
function go(to) {
  if (sending) return;
  to = Math.max(0, Math.min(to, current === DONE ? DONE : REVIEW));
  if (to > current && current >= 1 && current <= LAST_Q) {
    const q = QUESTIONS[current - 1];
    const msg = validate(q);
    if (msg) return showErr(slides[current], msg);
  }
  if (to === REVIEW) {
    const bad = QUESTIONS.findIndex(q => validate(q));
    if (bad !== -1) { to = bad + 1; }
    else fillReview();
  }
  slides.forEach((s, i) => {
    s.classList.toggle("is-on", i === to);
    s.classList.toggle("is-past", i < to);
  });
  current = to;
  const answered = Math.min(Math.max(to - 1, 0), total);
  bar.style.width = (to >= REVIEW ? 100 : (answered / total) * 100) + "%";
  stepLabel.textContent = to === 0 ? "Web Ops · 2026" : to <= LAST_Q ? `Question ${to} of ${total}` : to === REVIEW ? "Review" : "Done";
  prevBtn.disabled = to === 0 || to === DONE;
  nextBtn.disabled = to >= REVIEW;
  Scene.step(to / DONE);
  const focusable = slides[to].querySelector("input, textarea");
  if (!focusable && document.activeElement && document.activeElement !== document.body) document.activeElement.blur();
  if (focusable && innerWidth > 760) setTimeout(() => focusable.focus({ preventScroll: true }), 420);
  if (to !== 0 && window.innerWidth <= 640) window.scrollTo({ top: 0, behavior: "smooth" });
}

function fillReview() {
  document.getElementById("review").innerHTML = QUESTIONS.map((q, i) => {
    let v = answers[q.id];
    if (Array.isArray(v)) v = v.join(", ");
    if (q.id === "hours") v = `${v}${v === q.max ? "+" : ""} hrs`;
    return `<div><dt>${LABELS[q.id]}</dt><dd>${esc(v || "—")}</dd><button type="button" data-jump="${i + 1}">Edit</button></div>`;
  }).join("");
}

card.addEventListener("click", e => {
  const t = e.target.closest("[data-go], [data-jump]");
  if (!t) return;
  if (t.dataset.jump) return go(+t.dataset.jump);
  const g = t.dataset.go;
  if (g === "next") go(current + 1);
  else if (g === "prev") go(current - 1);
  else if (g === "submit") submit();
});
prevBtn.addEventListener("click", () => go(current - 1));
nextBtn.addEventListener("click", () => go(current + 1));
card.addEventListener("submit", e => e.preventDefault());

document.addEventListener("keydown", e => {
  if (current === DONE) return;
  const inTextarea = e.target.tagName === "TEXTAREA";
  if (e.key === "Enter" && (!inTextarea || e.ctrlKey || e.metaKey)) {
    e.preventDefault();
    if (current === REVIEW) submit(); else go(current + 1);
    return;
  }
  if (e.target.matches("input, textarea")) return;
  const q = QUESTIONS[current - 1];
  if (q && (q.type === "single" || q.type === "multi") && /^[a-z]$/i.test(e.key)) {
    const btn = slides[current].querySelectorAll(".choice")[e.key.toUpperCase().charCodeAt(0) - 65];
    if (btn) btn.click();
  }
  if (e.key === "ArrowDown" || e.key === "PageDown") go(current + 1);
  if (e.key === "ArrowUp" || e.key === "PageUp") go(current - 1);
});

/* ---------- Submit ---------- */
async function submit() {
  if (sending) return;
  const slide = slides[REVIEW];
  const btn = slide.querySelector('[data-go="submit"]');
  const cfg = window.WEBOPS_CONFIG || {};
  const body = new URLSearchParams();
  QUESTIONS.forEach(q => {
    const entry = cfg.entries && cfg.entries[q.id];
    let v = answers[q.id];
    if (Array.isArray(v)) v = v.join(", ");
    if (entry && v !== undefined && v !== "") body.append(entry, String(v).trim());
  });
  sending = true;
  btn.disabled = true;
  btn.innerHTML = "Sending…";
  try {
    if (!cfg.formAction) throw new Error("Form not connected yet.");
    // Google Forms sends no CORS headers, so the reply is opaque; a network failure still throws.
    await fetch(cfg.formAction, { method: "POST", mode: "no-cors", body });
    sending = false;
    document.getElementById("done-name").textContent = String(answers.name).trim().split(/\s+/)[0];
    Scene.burst();
    go(DONE);
  } catch (err) {
    sending = false;
    btn.disabled = false;
    btn.innerHTML = `Try again ${arrow}`;
    showErr(slide, navigator.onLine ? `Couldn't send: ${err.message}` : "You're offline. Connect and hit send again.");
  }
}

document.getElementById("copy-link").addEventListener("click", async e => {
  const b = e.currentTarget;
  try { await navigator.clipboard.writeText(location.href.split("#")[0]); b.innerHTML = "Copied ✓"; }
  catch { b.innerHTML = "Copy from the address bar"; }
});

/* ---------- Card tilt ---------- */
const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
const pointer = { x: 0, y: 0 };
window.addEventListener("pointermove", e => {
  pointer.x = e.clientX / innerWidth - .5;
  pointer.y = e.clientY / innerHeight - .5;
  if (calm || e.pointerType !== "mouse" || innerWidth <= 980) return;
  card.style.transform = `rotateY(${pointer.x * 6}deg) rotateX(${-pointer.y * 5}deg)`;
});

/* ---------- 3D scene: a Pichavaram mangrove drawn in ink ----------
   Prop roots, trunk and branches are pen strokes that draw themselves as the form fills up.
   The water mirrors the tree; dragging turns it, tapping the water drops a ripple. */
const Scene = (() => {
  const noop = { step() {}, pulse() {}, burst() {} };
  if (!window.THREE) return noop;
  const canvas = document.getElementById("scene");
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }); }
  catch { return noop; }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, .1, 200);
  const INK = new THREE.Color("#161513"), GREEN = new THREE.Color("#1f5c43");

  // Seeded random, so everyone sees the same tree.
  let seed = 1508;
  const rnd = () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const jit = a => (rnd() - .5) * a;
  const v = (x, y, z) => new THREE.Vector3(x, y, z);

  const world = new THREE.Group();          // turns with drag
  const tree = new THREE.Group();           // the strokes
  const mirror = new THREE.Group();         // reflection in the water
  mirror.scale.y = -1;
  world.add(tree, mirror);
  scene.add(world);

  const strokes = [];
  function stroke(points, order, { color = INK, opacity = .85, span = .16, mirrorOpacity = .13 } = {}) {
    const curve = new THREE.CatmullRomCurve3(points);
    const pts = curve.getPoints(Math.max(24, points.length * 18));
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    geo.setDrawRange(0, 0);
    tree.add(new THREE.Line(geo, new THREE.LineBasicMaterial({ color, transparent: true, opacity, depthWrite: false })));
    mirror.add(new THREE.Line(geo, new THREE.LineBasicMaterial({ color, transparent: true, opacity: mirrorOpacity, depthWrite: false })));
    strokes.push({ geo, n: pts.length, order, span });
  }

  // Trunk: three loose pen passes.
  const TOP = 3.3, BASE = .55;
  for (let k = 0; k < 3; k++) {
    const o = (k - 1) * .045;
    stroke([v(o + jit(.03), BASE, jit(.03)), v(o + .05 + jit(.04), 1.4, jit(.04)), v(o - .04 + jit(.04), 2.4, jit(.04)), v(o + jit(.03), TOP, jit(.03))], 0, { opacity: k === 1 ? .9 : .4, span: .14 });
  }

  // Prop roots: arch out from the trunk and dive into the water.
  const ROOTS = 18;
  const rootEnds = [];
  for (let i = 0; i < ROOTS; i++) {
    const th = (i / ROOTS) * Math.PI * 2 + jit(.35);
    const h = .7 + rnd() * 1.5, r = 1.5 + rnd() * 2.1;
    const dx = Math.cos(th), dz = Math.sin(th);
    const at = (d, y) => v(dx * d, y, dz * d);
    const pts = [at(.05, h), at(r * .3, h + .3 + rnd() * .25), at(r * .72, h * .55 + .15), at(r, -.18)];
    const order = .04 + (i / ROOTS) * .5;
    stroke(pts, order, { opacity: .82 });
    stroke(pts.map(p => p.clone().add(v(jit(.06), jit(.05), jit(.06)))), order + .03, { opacity: .28, mirrorOpacity: .06 });
    rootEnds.push(at(r, 0));
  }

  // Branches and canopy, grown recursively from the top of the trunk.
  const tips = [];
  function branch(from, dir, len, depth, order) {
    const to = from.clone().add(dir.clone().multiplyScalar(len));
    const mid = from.clone().lerp(to, .5).add(v(jit(.18), jit(.12), jit(.18)));
    stroke([from, mid, to], order, { opacity: .75 - depth * .12, span: .12 });
    if (depth >= 3) { tips.push({ p: to, order: order + .05 }); return; }
    const kids = depth === 0 ? 3 : 2;
    for (let k = 0; k < kids; k++) {
      const d = dir.clone().add(v(jit(1.1), .35 + rnd() * .4, jit(1.1))).normalize();
      branch(to, d, len * (.62 + rnd() * .12), depth + 1, order + .09);
    }
  }
  for (let i = 0; i < 5; i++) {
    const th = (i / 5) * Math.PI * 2 + jit(.4);
    branch(v(0, TOP - .1, 0), v(Math.cos(th) * .9, 1, Math.sin(th) * .9).normalize(), 1.15 + rnd() * .3, 0, .38 + i * .025);
  }

  // Leaves: small ink-green marks clustered at the tips, sorted so they appear in order.
  const leafTex = (() => {
    const c = document.createElement("canvas"); c.width = c.height = 64;
    const g = c.getContext("2d");
    g.translate(32, 32); g.rotate(-.6);
    g.fillStyle = "#fff"; g.beginPath(); g.ellipse(0, 0, 28, 13, 0, 0, Math.PI * 2); g.fill();
    return new THREE.CanvasTexture(c);
  })();
  const leaves = [];
  tips.forEach(t => {
    for (let k = 0; k < 16; k++) leaves.push({ p: t.p.clone().add(v(jit(.9), jit(.55) + .1, jit(.9))), order: t.order + rnd() * .3 });
  });
  leaves.sort((a, b) => a.order - b.order);
  const leafGeo = new THREE.BufferGeometry().setFromPoints(leaves.map(l => l.p));
  const leafMat = new THREE.PointsMaterial({ color: GREEN, size: .2, map: leafTex, transparent: true, opacity: .8, depthWrite: false, alphaTest: .1 });
  const leafGhost = leafMat.clone(); leafGhost.opacity = .1;
  tree.add(new THREE.Points(leafGeo, leafMat));
  mirror.add(new THREE.Points(leafGeo, leafGhost));
  leafGeo.setDrawRange(0, 0);

  // Water: pen hatching and faint rings at y = 0.
  const hatch = [];
  for (let i = 0; i < 140; i++) {
    const z = jit(16), x = jit(22), len = .3 + rnd() * 1.6;
    hatch.push(v(x, 0, z), v(x + len, 0, z));
  }
  world.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(hatch), new THREE.LineBasicMaterial({ color: INK, transparent: true, opacity: .16, depthWrite: false })));
  const circle = (() => { const p = []; for (let i = 0; i <= 96; i++) { const a = i / 96 * Math.PI * 2; p.push(v(Math.cos(a), 0, Math.sin(a))); } return new THREE.BufferGeometry().setFromPoints(p); })();
  [4.4, 5.6, 7.2].forEach((r, i) => {
    const ring = new THREE.Line(circle, new THREE.LineBasicMaterial({ color: INK, transparent: true, opacity: .1 - i * .025, depthWrite: false }));
    ring.scale.setScalar(r);
    world.add(ring);
  });

  // Ripples dropped by taps and by answers.
  const ripples = [];
  function ripple(at, strength = 1) {
    for (let k = 0; k < 3; k++) {
      const ring = new THREE.Line(circle, new THREE.LineBasicMaterial({ color: k ? INK : GREEN, transparent: true, opacity: 0, depthWrite: false }));
      ring.position.set(at.x, .01, at.z);
      ring.scale.setScalar(.01);
      world.add(ring);
      ripples.push({ ring, t: -k * .22, life: 2.4 + strength * .6, max: (1.2 + k * .5) * strength });
    }
  }

  // A few birds: two-stroke Vs crossing the sky.
  const birds = [];
  for (let i = 0; i < 4; i++) {
    const b = new THREE.Line(new THREE.BufferGeometry().setFromPoints([v(-.18, .06, 0), v(0, 0, 0), v(.18, .06, 0)]), new THREE.LineBasicMaterial({ color: INK, transparent: true, opacity: .55 }));
    b.position.set(-9 - i * 3.5, 5 + rnd() * 1.6, -2 - rnd() * 4);
    b.userData = { speed: .6 + rnd() * .5, phase: rnd() * 6 };
    scene.add(b); birds.push(b);
  }

  let grow = .3, growTarget = .3, energy = 0;
  const growBar = document.getElementById("grow");

  // Drag to turn, tap the water for a ripple.
  const hint = document.getElementById("drag-hint");
  let dragging = false, lastX = 0, downX = 0, downY = 0, spinVel = 0;
  canvas.addEventListener("pointerdown", e => { dragging = true; lastX = downX = e.clientX; downY = e.clientY; canvas.classList.add("is-drag"); });
  addEventListener("pointerup", e => {
    if (!dragging) return;
    dragging = false; canvas.classList.remove("is-drag");
    if (Math.hypot(e.clientX - downX, e.clientY - downY) < 6) tapWater(e);
  });
  addEventListener("pointermove", e => {
    if (!dragging) return;
    spinVel = (e.clientX - lastX) * .005; lastX = e.clientX;
    world.rotation.y += spinVel;
    if (hint) hint.classList.add("is-gone");
  });
  const ray = new THREE.Raycaster(), plane = new THREE.Plane(v(0, 1, 0), 0), hit = new THREE.Vector3();
  function tapWater(e) {
    ray.setFromCamera({ x: e.clientX / innerWidth * 2 - 1, y: -(e.clientY / innerHeight) * 2 + 1 }, camera);
    plane.constant = -world.position.y;
    if (!ray.ray.intersectPlane(plane, hit)) return;
    ripple(world.worldToLocal(hit.clone()), 1.2);
    energy = Math.min(energy + .5, 1.5);
  }

  let lookY = 1.9;
  function resize() {
    const w = innerWidth, h = innerHeight, wide = w > 980;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.position.set(0, wide ? 3.4 : 4, wide ? 17 : 19);
    lookY = wide ? .9 : -1.2;
    camera.lookAt(0, lookY, 0);
    camera.updateProjectionMatrix();
    // On wide screens the tree sits in the left half, beside the card.
    const halfW = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z * camera.aspect;
    world.position.set(wide ? -halfW * .5 : 0, wide ? -.4 : 0, 0);
    world.scale.setScalar(wide ? .74 : .8);
  }
  addEventListener("resize", resize);
  resize();

  const clock = new THREE.Clock();
  (function tick() {
    const dt = Math.min(clock.getDelta(), .05), t = clock.elapsedTime;
    grow += (growTarget - grow) * (calm ? 1 : .025);
    energy *= .95;

    for (const s of strokes) {
      const k = THREE.MathUtils.clamp((grow - s.order) / s.span, 0, 1);
      s.geo.setDrawRange(0, Math.floor(s.n * k));
    }
    let lc = 0;
    while (lc < leaves.length && leaves[lc].order <= grow) lc++;
    leafGeo.setDrawRange(0, lc);

    if (!dragging && !calm) {
      spinVel *= .95;
      world.rotation.y += spinVel + .0018 + energy * .006;
    }
    tree.rotation.z = Math.sin(t * .6) * (.006 + energy * .02);
    mirror.rotation.z = -tree.rotation.z;
    mirror.position.x = Math.sin(t * 1.3) * .03;      // the reflection wavers a little

    for (let i = ripples.length - 1; i >= 0; i--) {
      const r = ripples[i];
      r.t += dt;
      if (r.t < 0) continue;
      const k = r.t / r.life;
      r.ring.scale.setScalar(.05 + (1 - Math.pow(1 - Math.min(k, 1), 3)) * r.max * 2);
      r.ring.material.opacity = Math.max(0, .5 * (1 - k));
      if (k >= 1) { world.remove(r.ring); r.ring.material.dispose(); ripples.splice(i, 1); }
    }
    for (const b of birds) {
      b.position.x += b.userData.speed * dt;
      b.position.y += Math.sin(t + b.userData.phase) * .003;
      b.scale.y = .6 + Math.abs(Math.sin(t * 6 + b.userData.phase)) * .8;
      if (b.position.x > 12) b.position.x = -12;
    }
    camera.position.x += (pointer.x * 1.2 - camera.position.x) * .03;
    camera.lookAt(camera.position.x * .6, lookY, 0);
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  })();

  return {
    step(p) {
      growTarget = .3 + .7 * p;
      if (growBar) growBar.style.setProperty("--g", Math.round(growTarget * 100) + "%");
      energy = Math.min(energy + .6, 1.5);
      if (p > 0) ripple(rootEnds[(rnd() * rootEnds.length) | 0], .8);
    },
    pulse(x) {
      energy = Math.min(energy + x * .4, 1.5);
      if (x >= .7) ripple(rootEnds[(rnd() * rootEnds.length) | 0], .6);
    },
    burst() {
      growTarget = 1;
      rootEnds.forEach((p, i) => setTimeout(() => ripple(p, 1), i * 90));
      spinVel = .06; energy = 1.5;
    }
  };
})();

booted = true;
go(0);
