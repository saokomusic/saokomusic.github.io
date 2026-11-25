// SAOKO Studio · Galería y editor.
import { DEVICES, SCREENS, byId, screenMm } from "./devices.js";
import { Studio, COMPOSITIONS, BACKGROUNDS } from "./engine.js";

const $ = (id) => document.getElementById(id);
const screenSrc = (id) => SCREENS.find((s) => s.id === id)?.src ?? null;
const deg = (r) => Math.round((r * 180) / Math.PI);
const rad = (d) => (d * Math.PI) / 180;

// ---------------------------------------------------------------- modo claro / oscuro
$("theme").onclick = () => {
  const root = document.documentElement;
  const dark = root.getAttribute("data-theme") ? root.getAttribute("data-theme") === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
  const next = dark ? "light" : "dark";
  root.setAttribute("data-theme", next);
  try { localStorage.setItem("saoko-theme", next); } catch (e) {}
};

// ---------------------------------------------------------------- sin WebGL
function webglOk() {
  try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); } catch (e) { return false; }
}
if (!webglOk()) {
  document.body.innerHTML = '<div class="noweb"><h2>Tu navegador no puede mostrar gráficos 3D</h2><p>Abre SAOKO Studio en Chrome, Edge, Firefox o Safari actualizados.</p><p><a href="./">Volver a SAOKO</a></p></div>';
  throw new Error("WebGL no disponible");
}

// ---------------------------------------------------------------- galería
let filter = "Todos";
const FILTERS = ["Todos", "iOS", "Android", "Apple", "Samsung", "Google"];
$("chips").innerHTML = FILTERS.map((f) => `<button class="chip${f === filter ? " on" : ""}" data-f="${f}">${f}</button>`).join("");
$("chips").onclick = (e) => {
  const b = e.target.closest("[data-f]"); if (!b) return;
  filter = b.dataset.f;
  [...$("chips").children].forEach((c) => c.classList.toggle("on", c === b));
  renderGrid();
};
$("q").oninput = renderGrid;

const thumbs = {};
function renderGrid() {
  const q = $("q").value.trim().toLowerCase();
  const list = DEVICES.filter((d) => (filter === "Todos" || d.os === filter || d.brand === filter) &&
    (!q || `${d.name} ${d.brand} ${d.os} ${d.inches} ${d.year}`.toLowerCase().includes(q)));
  $("grid").innerHTML = list.map((d) => {
    const s = screenMm(d);
    return `<article class="card" data-id="${d.id}">
      <div class="shot">${thumbs[d.id] ? `<img src="${thumbs[d.id]}" alt="${d.name}">` : '<span class="empty">Preparando…</span>'}</div>
      <div class="info">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><h3 class="tech">${d.name}</h3><span class="os">${d.os}</span></div>
        <div class="sub">${d.brand} · ${d.year}</div>
        <div class="specs">
          <div><b>Medidas</b>${d.mm.h} × ${d.mm.w} × ${d.mm.d} mm</div>
          <div><b>Pantalla</b>${d.inches}" · ${d.ppi} ppi</div>
          <div><b>Resolución</b>${d.res[1]} × ${d.res[0]} px</div>
          <div><b>Área visible</b>${s.h.toFixed(1)} × ${s.w.toFixed(1)} mm</div>
        </div>
        <div class="swatches">${d.colors.map((c) => `<span class="sw" title="${c.name}" style="background:${c.hex}"></span>`).join("")}</div>
      </div></article>`;
  }).join("") || '<p class="empty">No hay modelos con esa búsqueda.</p>';
}
$("grid").onclick = (e) => {
  const c = e.target.closest("[data-id]"); if (!c) return;
  openEditor(() => loadSingle(c.dataset.id));
};
renderGrid();

// Miniaturas: cada teléfono se renderiza una vez en 3D (en tres cuartos, con sombra).
async function makeThumbs() {
  const cv = document.createElement("canvas");
  cv.style.cssText = "position:fixed;left:-9999px;width:520px;height:546px";
  document.body.appendChild(cv);
  const st = new Studio(cv, { background: "transparente", maxPixelRatio: 1.5 });
  st.setShadow(0.28, 22);
  for (const d of DEVICES) {
    st.clear();
    const p = st.add(d.id, { screen: screenSrc("inicio"), transform: { rx: 4, ry: -24, rz: 3 } });
    await p.applyScreen();
    st.fit(1.12);
    st.render();
    thumbs[d.id] = cv.toDataURL("image/webp", 0.92);
    renderGrid();
    await new Promise((r) => setTimeout(r, 30));
  }
  cancelAnimationFrame(st._raf);
  st.renderer.dispose();
  cv.remove();
}
makeThumbs();

// ---------------------------------------------------------------- editor
let studio = null;
let currentComp = null;
function ensureStudio() {
  if (studio) return studio;
  studio = new Studio($("canvas"), { background: "blanco" });
  studio.setShadow(0.22, 28);
  studio.onFrame = updateLabels;
  window.saokoStudio = studio; // para revisar desde la consola
  bindStage();
  return studio;
}

function openEditor(load) {
  document.body.classList.add("editing");
  $("tabEditor").classList.add("on"); $("tabGallery").classList.remove("on");
  ensureStudio();
  setTimeout(() => { studio.resize(); load?.(); }, 0);
}
$("tabEditor").onclick = () => openEditor(() => { if (!studio.phones.length) loadComposition("heroe"); });
$("tabGallery").onclick = () => {
  document.body.classList.remove("editing");
  $("tabGallery").classList.add("on"); $("tabEditor").classList.remove("on");
};

// Composiciones
$("comps").innerHTML = Object.entries(COMPOSITIONS).map(([id, c]) => `<button class="comp" data-c="${id}">${c.label}</button>`).join("");
$("comps").onclick = (e) => { const b = e.target.closest("[data-c]"); if (b) loadComposition(b.dataset.c); };

function loadComposition(id) {
  const comp = COMPOSITIONS[id];
  if (measuring) toggleMeasure();
  studio.clear();
  comp.items.forEach((it) => studio.add(it.model, { screen: it.screen ? screenSrc(it.screen) : null, back: it.back, transform: it.t }));
  currentComp = id;
  [...$("comps").children].forEach((b) => b.classList.toggle("on", b.dataset.c === id));
  studio.fit();
  select(studio.phones[studio.phones.length - 1]);
}

function loadSingle(modelId) {
  if (measuring) toggleMeasure();
  studio.clear();
  studio.add(modelId, { screen: screenSrc("inicio"), transform: { rx: 4, ry: -20, rz: 2 } });
  currentComp = null;
  [...$("comps").children].forEach((b) => b.classList.remove("on"));
  studio.fit();
  select(studio.phones[0]);
}

// Agregar teléfonos
$("addModel").innerHTML = DEVICES.map((d) => `<option value="${d.id}">${d.name}</option>`).join("");
$("addBtn").onclick = () => {
  const n = studio.phones.length;
  const p = studio.add($("addModel").value, { screen: screenSrc(SCREENS[n % SCREENS.length].id), transform: { x: n * 40 - 40, y: 0, ry: -10 } });
  studio.fit();
  select(p);
};

function layersHtml() {
  $("layers").innerHTML = studio.phones.map((p, i) => `<div class="layer${p === studio.selected ? " on" : ""}" data-i="${i}">
    <span class="icon">smartphone</span><span>${p.spec.name}${p.back ? " (espalda)" : ""}</span></div>`).join("") || '<p class="empty">Agrega un teléfono o elige una composición.</p>';
}
$("layers").onclick = (e) => { const l = e.target.closest("[data-i]"); if (l) select(studio.phones[+l.dataset.i]); };

// ---------------------------------------------------------------- propiedades del teléfono
function select(p) {
  studio.selected = p ?? null;
  layersHtml();
  const box = $("sel");
  if (!p) { box.innerHTML = '<p class="empty">Toca un teléfono para editarlo.</p>'; return; }
  const g = p.group;
  const ry = deg(g.rotation.y) - (p.back ? 180 : 0);
  const slider = (id, label, min, max, val, unit = "") =>
    `<div class="field"><label>${label} <span id="v_${id}">${val}${unit}</span></label><input type="range" id="${id}" min="${min}" max="${max}" step="1" value="${val}"></div>`;
  box.innerHTML = `
    <div class="field"><label>Modelo</label><select id="pModel">${DEVICES.map((d) => `<option value="${d.id}"${d.id === p.spec.id ? " selected" : ""}>${d.name}</option>`).join("")}</select></div>
    <div class="field"><label>Color <span>${p.color.name}</span></label><div class="colors" id="pColors">${p.spec.colors.map((c, i) => `<button title="${c.name}" data-i="${i}" class="${i === p.colorIndex ? "on" : ""}" style="background:${c.hex}"></button>`).join("")}</div></div>
    <div class="field"><label>Vista</label><div class="opts"><button data-v="front" class="${p.back ? "" : "on"}" id="vFront">Frente</button><button data-v="back" class="${p.back ? "on" : ""}" id="vBack">Espalda</button></div></div>
    <div class="field"><label>Pantalla <span>arrastra una imagen aquí o súbela</span></label>
      <div class="screens" id="pScreens">${SCREENS.map((s) => `<img src="${s.src}" alt="${s.label}" title="${s.label}" data-s="${s.src}" class="${s.src === p.screenSrc ? "on" : ""}">`).join("")}</div>
      <button class="btn btn-soft" id="pUpload" type="button" style="margin-top:8px;width:100%"><span class="icon">upload</span>Subir mi imagen</button></div>
    ${slider("px", "Posición X", -300, 300, Math.round(g.position.x), " mm")}
    ${slider("py", "Posición Y", -250, 250, Math.round(g.position.y), " mm")}
    ${slider("pz", "Profundidad", -120, 120, Math.round(g.position.z), " mm")}
    ${slider("prx", "Inclinación (X)", -60, 60, deg(g.rotation.x), "°")}
    ${slider("pry", "Giro (Y)", -80, 80, ry, "°")}
    ${slider("prz", "Rotación (Z)", -90, 90, deg(g.rotation.z), "°")}
    ${slider("ps", "Tamaño", 50, 160, Math.round(g.scale.x * 100), " %")}
    <div class="row2"><button class="btn btn-soft" id="pDup" type="button"><span class="icon">content_copy</span>Duplicar</button><button class="btn btn-soft" id="pDel" type="button"><span class="icon">delete</span>Quitar</button></div>
    <p class="empty" style="margin-top:10px">${p.spec.mm.h} × ${p.spec.mm.w} × ${p.spec.mm.d} mm · ${p.spec.inches}" · ${p.spec.res[1]}×${p.spec.res[0]} px</p>`;
  const live = (id, fn, unit) => { const el = $(id); el.oninput = () => { $("v_" + id).textContent = el.value + unit; fn(+el.value); studio.invalidate(); }; };
  live("px", (v) => (g.position.x = v), " mm");
  live("py", (v) => (g.position.y = v), " mm");
  live("pz", (v) => (g.position.z = v), " mm");
  live("prx", (v) => (g.rotation.x = rad(v)), "°");
  live("pry", (v) => (g.rotation.y = rad(v + (p.back ? 180 : 0))), "°");
  live("prz", (v) => (g.rotation.z = rad(v)), "°");
  live("ps", (v) => g.scale.setScalar(v / 100), " %");
  $("pModel").onchange = (e) => { p.setModel(e.target.value); select(p); };
  $("pColors").onclick = (e) => { const b = e.target.closest("[data-i]"); if (b) { p.setColor(+b.dataset.i); select(p); } };
  const setBack = (back) => { if (p.back === back) return; p.back = back; g.rotation.y += Math.PI; select(p); studio.invalidate(); };
  $("vFront").onclick = () => setBack(false);
  $("vBack").onclick = () => setBack(true);
  $("pScreens").onclick = (e) => { const i = e.target.closest("[data-s]"); if (i) { p.setScreen(i.dataset.s); select(p); } };
  $("pUpload").onclick = () => $("upload").click();
  $("pDup").onclick = () => {
    const c = studio.add(p.spec.id, { colorIndex: p.colorIndex, screen: p.screenSrc, back: p.back, transform: { x: g.position.x + 30, y: g.position.y - 10, z: g.position.z, rx: deg(g.rotation.x), ry: ry, rz: deg(g.rotation.z), s: g.scale.x } });
    select(c);
  };
  $("pDel").onclick = () => { studio.remove(p); select(studio.phones[0]); };
}

$("upload").onchange = (e) => {
  const f = e.target.files?.[0]; e.target.value = "";
  if (f && studio.selected) { studio.selected.setScreen(URL.createObjectURL(f)); select(studio.selected); }
};

// ---------------------------------------------------------------- escena
$("bgs").innerHTML = Object.entries(BACKGROUNDS).map(([id, b]) => {
  const bg = b.stops ? `linear-gradient(${b.angle}deg, ${b.stops.join(",")})` : "repeating-conic-gradient(#ccc 0 25%, #fff 0 50%) 0 0 / 12px 12px";
  return `<button class="bg${id === "blanco" ? " on" : ""}" data-b="${id}" title="${b.label}" style="background:${bg}"></button>`;
}).join("");
$("bgs").onclick = (e) => {
  const b = e.target.closest("[data-b]"); if (!b) return;
  studio.setBackground(b.dataset.b);
  [...$("bgs").children].forEach((x) => x.classList.toggle("on", x === b));
};
const sceneSlider = (id, label, fn, unit = "") => { const el = $(id); const out = () => ($(label).textContent = el.value + unit); out(); el.oninput = () => { out(); fn(+el.value); }; };
sceneSlider("la", "vLa", (v) => { studio.light.angle = v; studio.updateLight(); }, "°");
sceneSlider("lh", "vLh", (v) => { studio.light.height = v; studio.updateLight(); }, "°");
sceneSlider("li", "vLi", (v) => { studio.light.intensity = v / 100; studio.updateLight(); }, " %");
sceneSlider("so", "vSo", (v) => studio.setShadow(v / 100, null), " %");
sceneSlider("ss", "vSs", (v) => studio.setShadow(studio.shadowMat.opacity, v));
sceneSlider("fov", "vFov", (v) => { studio.camera.fov = v; studio.camera.updateProjectionMatrix(); studio.fit(); }, "°");

// ---------------------------------------------------------------- arrastrar teléfonos y soltar imágenes
function bindStage() {
  const cv = $("canvas");
  let drag = null;
  cv.addEventListener("pointerdown", (e) => {
    const p = studio.pick(e.clientX, e.clientY);
    select(p);
    if (!p) return;
    const pt = studio.planePoint(e.clientX, e.clientY, p.group.position.z);
    if (!pt) return;
    drag = { p, dx: p.group.position.x - pt.x, dy: p.group.position.y - pt.y };
    cv.setPointerCapture(e.pointerId);
  });
  cv.addEventListener("pointermove", (e) => {
    if (!drag) return;
    const pt = studio.planePoint(e.clientX, e.clientY, drag.p.group.position.z);
    if (!pt) return;
    drag.p.group.position.x = Math.round(pt.x + drag.dx);
    drag.p.group.position.y = Math.round(pt.y + drag.dy);
    studio.invalidate();
  });
  const end = () => { if (drag) { select(drag.p); drag = null; } };
  cv.addEventListener("pointerup", end);
  cv.addEventListener("pointercancel", end);
  const stage = $("stage");
  stage.addEventListener("dragover", (e) => { e.preventDefault(); stage.classList.add("dragging"); });
  stage.addEventListener("dragleave", () => stage.classList.remove("dragging"));
  stage.addEventListener("drop", (e) => {
    e.preventDefault(); stage.classList.remove("dragging");
    const f = [...(e.dataTransfer?.files ?? [])].find((x) => x.type.startsWith("image/"));
    if (!f) return;
    const target = studio.pick(e.clientX, e.clientY) ?? studio.selected;
    if (target) { target.setScreen(URL.createObjectURL(f)); select(target); }
  });
}
$("fitBtn").onclick = () => studio.fit();

// ---------------------------------------------------------------- modo medición (proporciones reales)
let measuring = false, saved = null;
function toggleMeasure() {
  measuring = !measuring;
  document.body.classList.toggle("measuring", measuring);
  $("measureBtn").classList.toggle("on", measuring);
  studio.measuring = measuring;
  if (measuring) {
    saved = studio.phones.map((p) => ({ p, pos: p.group.position.clone(), rot: p.group.rotation.clone(), s: p.group.scale.x }));
    // De frente, sin giro, tamaño real y uno al lado del otro (20 mm de separación).
    let x = 0;
    const total = studio.phones.reduce((a, p) => a + p.spec.mm.w, 0) + 20 * (studio.phones.length - 1);
    studio.phones.forEach((p) => {
      p.group.rotation.set(0, p.back ? Math.PI : 0, 0);
      p.group.scale.setScalar(1);
      p.group.position.set(-total / 2 + x + p.spec.mm.w / 2, p.spec.mm.h / 2 - 85, 0);
      x += p.spec.mm.w + 20;
    });
  } else if (saved) {
    saved.forEach(({ p, pos, rot, s }) => { p.group.position.copy(pos); p.group.rotation.copy(rot); p.group.scale.setScalar(s); });
    saved = null;
  }
  studio.fit(1.3);
  updateLabels();
}
$("measureBtn").onclick = toggleMeasure;

function updateLabels() {
  const box = $("labels");
  if (!measuring || !studio) { if (box.innerHTML) box.innerHTML = ""; return; }
  box.innerHTML = studio.phones.map((p) => {
    const g = p.group;
    const at = studio.toScreen(g.position.clone().setY(g.position.y - p.spec.mm.h / 2 - 6));
    return `<div class="lab" style="left:${at.x}px;top:${at.y}px">${p.spec.name}<br>${p.spec.mm.h} × ${p.spec.mm.w} × ${p.spec.mm.d} mm</div>`;
  }).join("");
}

// ---------------------------------------------------------------- exportar
let fmt = "png", scale = 3;
const opt = (id, fn) => { $(id).onclick = (e) => { const b = e.target.closest("[data-v]"); if (!b) return; [...$(id).children].forEach((x) => x.classList.toggle("on", x === b)); fn(b.dataset.v); info(); }; };
opt("fmt", (v) => (fmt = v));
opt("scale", (v) => (scale = +v));
function info() {
  const c = $("canvas");
  $("exportInfo").textContent = `Se exporta en ${Math.round(c.clientWidth * scale)} × ${Math.round(c.clientHeight * scale)} px, con sombras, perspectiva y fondo.`;
  $("transp").disabled = fmt === "jpeg";
}
$("exportBtn").onclick = () => { info(); $("exportModal").classList.add("on"); };
$("exportCancel").onclick = () => $("exportModal").classList.remove("on");
$("exportGo").onclick = async () => {
  const btn = $("exportGo"); btn.disabled = true;
  const blob = await studio.export(fmt, scale, $("transp").checked);
  btn.disabled = false;
  if (!blob) { $("exportInfo").textContent = "Tu navegador no pudo crear la imagen en ese formato. Prueba PNG."; return; }
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `saoko-mockup-${Date.now()}.${fmt === "jpeg" ? "jpg" : fmt}`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  $("exportModal").classList.remove("on");
};

// Enlace directo a un modelo: estudio.html#modelo=iphone-17-pro
const m = location.hash.match(/modelo=([\w-]+)/);
if (m && byId[m[1]]) openEditor(() => loadSingle(m[1]));
