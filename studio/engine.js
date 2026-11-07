// SAOKO Studio · Motor 3D de mockups (three.js).
//
// Cada teléfono se construye con SUS medidas reales (1 unidad = 1 mm): cuerpo con bordes
// redondeados, marco metálico, cristal frontal, pantalla con la proporción exacta de su
// resolución, Dynamic Island o perforación, botones laterales y módulo de cámaras atrás.
// La escena es un estudio: luz principal con sombra suave proyectada sobre el fondo,
// reflejos de ambiente en el metal y el cristal. Exporta PNG, JPG o WebP en alta resolución.

import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { byId, screenMm } from "./devices.js";

// ---------------------------------------------------------------- utilidades de forma
function roundedRect(w, h, r) {
  const s = new THREE.Shape();
  const x = -w / 2, y = -h / 2;
  r = Math.min(r, w / 2, h / 2);
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

/** Forma plana con UV de 0 a 1 (para poner una imagen encima). */
function flatShape(w, h, r, segments = 24) {
  const g = new THREE.ShapeGeometry(roundedRect(w, h, r), segments);
  const pos = g.attributes.position, uv = g.attributes.uv;
  for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) / w + 0.5, pos.getY(i) / h + 0.5);
  return g;
}

const loader = new THREE.TextureLoader();
const texCache = new Map();
function loadTexture(src) {
  if (!texCache.has(src)) {
    texCache.set(src, new Promise((ok) => loader.load(src, async (t) => {
      t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
      // Imagen decodificada del todo antes de usarla (si no, la primera vez podía salir negra).
      try { await Promise.race([t.image?.decode?.(), new Promise((r) => setTimeout(r, 1500))]); } catch (e) {}
      ok(t);
    }, undefined, () => ok(null))));
  }
  return texCache.get(src);
}

/** La captura llena la pantalla sin deformarse (recorta lo que sobre, mostrando la parte de arriba). */
function fitTexture(tex, screenAspect) {
  const t = tex.clone();
  t.needsUpdate = true;
  const img = tex.image;
  const imgAspect = img.width / img.height;
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  if (imgAspect > screenAspect) { // imagen más ancha: se recortan los lados
    t.repeat.set(screenAspect / imgAspect, 1);
    t.offset.set((1 - t.repeat.x) / 2, 0);
  } else { // imagen más alta: se recorta abajo (se ve la parte de arriba)
    t.repeat.set(1, imgAspect / screenAspect);
    t.offset.set(0, 1 - t.repeat.y);
  }
  return t;
}

// ---------------------------------------------------------------- materiales
function frameMaterial(hex, kind) {
  const c = new THREE.Color(hex);
  // El marco toma el color del teléfono, un poco más metálico y claro.
  c.lerp(new THREE.Color(kind === "titanium" ? "#9a9a98" : "#c9c9cb"), 0.25);
  return new THREE.MeshPhysicalMaterial({ color: c, metalness: 1, roughness: kind === "titanium" ? 0.42 : 0.28, envMapIntensity: 1.2 });
}
const backMaterial = (hex) => new THREE.MeshPhysicalMaterial({ color: new THREE.Color(hex), metalness: 0.15, roughness: 0.38, clearcoat: 1, clearcoatRoughness: 0.12 });
// polygonOffset: el cristal se dibuja "un poco más atrás" para que nunca tape la pantalla.
const glassBlack = new THREE.MeshPhysicalMaterial({ color: "#050506", metalness: 0, roughness: 0.06, clearcoat: 1, clearcoatRoughness: 0.03, polygonOffset: true, polygonOffsetFactor: 2, polygonOffsetUnits: 2 });
const lensGlass = new THREE.MeshPhysicalMaterial({ color: "#07080c", metalness: 0.2, roughness: 0.05, clearcoat: 1 });
const ringMetal = new THREE.MeshPhysicalMaterial({ color: "#9b9b9e", metalness: 1, roughness: 0.25 });

// ---------------------------------------------------------------- un teléfono
export class Phone {
  constructor(spec, opts = {}) {
    this.spec = typeof spec === "string" ? byId[spec] : spec;
    this.group = new THREE.Group();
    this.group.userData.phone = this;
    this.colorIndex = opts.colorIndex ?? 0;
    this.screenSrc = opts.screen ?? null;
    this.back = !!opts.back;
    this.build();
  }

  get color() { return this.spec.colors[this.colorIndex % this.spec.colors.length]; }

  build() {
    const g = this.group;
    g.clear();
    const { h, w, d } = this.spec.mm;
    const r = this.spec.corner;
    const bevel = Math.min(d * 0.32, 2.6);
    const core = d - bevel * 2;
    // Cuerpo: tapa trasera (color) + marco metálico redondeado.
    const body = new THREE.ExtrudeGeometry(roundedRect(w - bevel * 1.2, h - bevel * 1.2, r - bevel * 0.6), {
      depth: core, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel * 0.6, bevelSegments: 8, curveSegments: 32,
    });
    body.center();
    const frame = frameMaterial(this.color.hex, this.spec.frame);
    const bodyMesh = new THREE.Mesh(body, [backMaterial(this.color.hex), frame]);
    bodyMesh.castShadow = true;
    g.add(bodyMesh);
    const front = d / 2 + 0.02;

    // Cristal negro del frente (de borde a borde) y la pantalla con su tamaño real.
    const glass = new THREE.Mesh(flatShape(w - bevel * 1.25, h - bevel * 1.25, r - bevel * 0.6), glassBlack);
    glass.position.z = front;
    g.add(glass);
    const scr = screenMm(this.spec);
    this.screenSize = scr;
    const screenR = Math.max(r - (w - scr.w) / 2, 2);
    this.screenMat = new THREE.MeshBasicMaterial({ color: "#111", toneMapped: false });
    const screen = new THREE.Mesh(flatShape(scr.w, scr.h, screenR, 32), this.screenMat);
    screen.position.z = front + 0.25;
    g.add(screen);
    this.applyScreen();

    // Dynamic Island (iPhone) o perforación de la cámara (Android).
    const pxToMm = 25.4 / this.spec.ppi;
    if (this.spec.cutout === "island") {
      const iw = 126 * 3 * pxToMm, ih = 37 * 3 * pxToMm; // 126 × 37 pt
      const island = new THREE.Mesh(flatShape(iw, ih, ih / 2), glassBlack);
      island.position.set(0, scr.h / 2 - 11 * 3 * pxToMm - ih / 2, front + 0.4);
      g.add(island);
    } else {
      const dot = new THREE.Mesh(new THREE.CircleGeometry(1.7, 32), glassBlack);
      dot.position.set(0, scr.h / 2 - 4.2, front + 0.4);
      g.add(dot);
    }

    // Botones laterales (sobresalen del marco).
    const btn = (len, y, side) => {
      const b = new THREE.Mesh(new THREE.BoxGeometry(0.9, len, d * 0.42), frame);
      b.position.set(side * (w / 2 + 0.25), y, 0);
      b.castShadow = true;
      g.add(b);
    };
    btn(h * 0.12, h * 0.17, 1);
    if (this.spec.brand === "Apple") { btn(h * 0.07, h * 0.24, -1); btn(h * 0.07, h * 0.15, -1); }
    else btn(h * 0.16, h * 0.24, 1);

    this.buildCameras(-d / 2 - 0.02);
    g.rotation.y = this.back ? Math.PI : 0;
  }

  /** Módulo de cámaras de la parte trasera (forma aproximada de cada familia). */
  buildCameras(z) {
    const { h, w } = this.spec.mm;
    const g = this.group;
    const back = backMaterial(this.color.hex);
    let base = 0; // altura del módulo sobre el que van las lentes
    const lens = (x, y, rad) => {
      const ring = new THREE.Mesh(new THREE.CylinderGeometry(rad + 0.9, rad + 0.9, 1.4, 48), ringMetal);
      ring.rotation.x = Math.PI / 2; ring.position.set(x, y, z - base - 0.7); ring.castShadow = true;
      const glass = new THREE.Mesh(new THREE.CircleGeometry(rad, 48), lensGlass);
      glass.position.set(x, y, z - base - 1.42); glass.rotation.y = Math.PI;
      g.add(ring, glass);
    };
    const plate = (pw, ph, pr, x, y, thick = 1.2, mat = back) => {
      const geo = new THREE.ExtrudeGeometry(roundedRect(pw, ph, pr), { depth: thick, bevelEnabled: true, bevelThickness: 0.4, bevelSize: 0.4, bevelSegments: 4, curveSegments: 24 });
      const m = new THREE.Mesh(geo, mat);
      m.position.set(x, y, z - thick - 0.4); m.castShadow = true;
      g.add(m);
      base = thick + 0.8;
    };
    // Visto desde atrás, la izquierda del usuario es +x del modelo.
    const top = h / 2;
    switch (this.spec.camera) {
      case "pro-square": {
        const s = w * 0.47; const cx = w / 2 - 5 - s / 2; const cy = top - 5 - s / 2;
        plate(s, s, s * 0.28, cx, cy);
        const o = s * 0.24, rr = s * 0.17;
        lens(cx + o, cy + o, rr); lens(cx + o, cy - o, rr); lens(cx - o, cy, rr);
        break;
      }
      case "plateau": {
        const ph = w * 0.53; const cy = top - 4 - ph / 2;
        plate(w - 6, ph, 10, 0, cy, 1.4);
        const cx = w / 2 - 4 - w * 0.22, o = w * 0.11, rr = w * 0.075;
        lens(cx + o, cy + o, rr); lens(cx + o, cy - o, rr); lens(cx - o, cy, rr);
        break;
      }
      case "pill": {
        const pw = w * 0.28, ph = w * 0.5; const cx = w / 2 - 5 - pw / 2, cy = top - 5 - ph / 2;
        plate(pw, ph, pw / 2, cx, cy);
        lens(cx, cy + ph * 0.22, pw * 0.3); lens(cx, cy - ph * 0.22, pw * 0.3);
        break;
      }
      case "ultra-rings": {
        const cx = w / 2 - 12, rr = 5.2;
        lens(cx, top - 12, rr); lens(cx, top - 25, rr); lens(cx, top - 38, rr);
        lens(cx - 12, top - 14, 3.2); lens(cx - 12, top - 26, 3.2);
        break;
      }
      case "rings3": {
        const cx = w / 2 - 12, rr = 4.6;
        lens(cx, top - 12, rr); lens(cx, top - 24, rr); lens(cx, top - 36, rr);
        break;
      }
      case "visor": {
        const ph = 18, cy = top - 24;
        plate(w - 10, ph, ph / 2, 0, cy, 2.2);
        lens(w / 2 - 15, cy, 4.6); lens(w / 2 - 28, cy, 4.6); lens(w / 2 - 40, cy, 3.4);
        break;
      }
    }
  }

  async applyScreen() {
    if (!this.screenSrc) { this.screenMat.map = null; this.screenMat.color.set("#0b0b10"); this.screenMat.needsUpdate = true; return; }
    const tex = await loadTexture(this.screenSrc);
    if (!tex) return;
    this.screenMat.map = fitTexture(tex, this.screenSize.w / this.screenSize.h);
    this.screenMat.color.set("#ffffff");
    this.screenMat.needsUpdate = true;
    this.onChange?.();
    // La primera vez que se usa una imagen, a veces la pantalla se dibujaba antes de que la
    // imagen estuviera lista (quedaba negra): se vuelve a subir y dibujar un instante después.
    await new Promise((r) => setTimeout(r, 120));
    if (this.screenMat.map) { this.screenMat.map.needsUpdate = true; this.onChange?.(); }
  }

  /** Un video sonando DENTRO de la pantalla (con el mismo recorte que una captura). */
  setVideo(video) {
    const tex = new THREE.VideoTexture(video);
    tex.colorSpace = THREE.SRGBColorSpace;
    const apply = () => {
      const imgAspect = (video.videoWidth || 1080) / (video.videoHeight || 2320);
      const screenAspect = this.screenSize.w / this.screenSize.h;
      if (imgAspect > screenAspect) { tex.repeat.set(screenAspect / imgAspect, 1); tex.offset.set((1 - tex.repeat.x) / 2, 0); }
      else { tex.repeat.set(1, imgAspect / screenAspect); tex.offset.set(0, 1 - tex.repeat.y); }
      this.screenMat.map = tex; this.screenMat.color.set("#ffffff"); this.screenMat.needsUpdate = true;
      this.onChange?.();
    };
    if (video.readyState >= 1) apply(); else video.addEventListener("loadedmetadata", apply, { once: true });
    this.screenSrc = null;
    return tex;
  }

  setColor(i) { this.colorIndex = i; const t = this.group.position.clone(), rot = this.group.rotation.clone(), s = this.group.scale.clone(); this.build(); this.group.position.copy(t); this.group.rotation.copy(rot); this.group.scale.copy(s); this.onChange?.(); }
  setModel(id) { this.spec = byId[id]; this.colorIndex = 0; this.setColor(0); }
  setScreen(src) { this.screenSrc = src; this.applyScreen(); }
}

// ---------------------------------------------------------------- fondos
export const BACKGROUNDS = {
  "rosa-negro": { label: "Rosa y negro", stops: ["#FF2DB0", "#C21FA0", "#140A14"], angle: 160, shadow: 0.55 },
  "blanco": { label: "Blanco minimalista", stops: ["#FFFFFF", "#F1F0F4"], angle: 180, shadow: 0.18 },
  "gris": { label: "Gris tecnológico", stops: ["#D9DBE0", "#A8ADB6"], angle: 180, shadow: 0.35 },
  "saoko": { label: "Degradado SAOKO", stops: ["#FF07C4", "#C33BFF", "#9B8BFF"], angle: 105, shadow: 0.4 },
  "noche": { label: "Noche", stops: ["#1B1033", "#07060B"], angle: 180, shadow: 0.6 },
  "aurora": { label: "Aurora", stops: ["#29B6F6", "#8E5BFF", "#FF00B0"], angle: 135, shadow: 0.4 },
  "transparente": { label: "Transparente", stops: null, shadow: 0.3 },
};

function gradientTexture(stops, angle) {
  const c = document.createElement("canvas");
  c.width = 1024; c.height = 1024;
  const x = c.getContext("2d");
  const a = (angle - 90) * Math.PI / 180;
  const gr = x.createLinearGradient(512 - Math.cos(a) * 724, 512 - Math.sin(a) * 724, 512 + Math.cos(a) * 724, 512 + Math.sin(a) * 724);
  stops.forEach((s, i) => gr.addColorStop(i / Math.max(stops.length - 1, 1), s));
  x.fillStyle = gr; x.fillRect(0, 0, 1024, 1024);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// ---------------------------------------------------------------- el estudio (escena)
export class Studio {
  constructor(canvas, opts = {}) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, opts.maxPixelRatio ?? 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.VSMShadowMap;
    this.scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

    this.camera = new THREE.PerspectiveCamera(opts.fov ?? 26, 1, 20, 4000);
    this.ortho = new THREE.OrthographicCamera(-100, 100, 100, -100, 1, 5000);
    this.measuring = false;

    // Luz principal (proyecta la sombra sobre el fondo) + relleno suave.
    this.key = new THREE.DirectionalLight("#ffffff", 2.2);
    this.key.castShadow = true;
    this.key.shadow.mapSize.set(2048, 2048);
    this.key.shadow.radius = 28;
    this.key.shadow.blurSamples = 25;
    const sc = this.key.shadow.camera; sc.left = -320; sc.right = 320; sc.top = 320; sc.bottom = -320; sc.near = 1; sc.far = 1500;
    this.key.shadow.bias = -0.0004;
    this.scene.add(this.key, this.key.target);
    this.fill = new THREE.HemisphereLight("#ffffff", "#8a7fa0", 0.55);
    this.scene.add(this.fill);
    this.light = { angle: 35, height: 45, intensity: 1 };

    // Fondo: superficie de color (con su degradado) + capa que solo recibe la sombra.
    this.bgMat = new THREE.MeshBasicMaterial({ color: "#ffffff", toneMapped: false });
    this.bgPlane = new THREE.Mesh(new THREE.PlaneGeometry(4000, 4000), this.bgMat);
    this.bgPlane.position.z = -36;
    this.shadowMat = new THREE.ShadowMaterial({ opacity: 0.4 });
    this.shadowPlane = new THREE.Mesh(new THREE.PlaneGeometry(4000, 4000), this.shadowMat);
    this.shadowPlane.position.z = -35.8;
    this.shadowPlane.receiveShadow = true;
    this.scene.add(this.bgPlane, this.shadowPlane);

    this.phones = [];
    this.selected = null;
    this.setBackground(opts.background ?? "blanco");
    this.updateLight();
    this.resize();
    this._raf = 0;
    this.needs = true;
    this.loop = () => { this._raf = requestAnimationFrame(this.loop); if (this.needs || this.onFrame) { this.onFrame?.(); this.render(); this.needs = false; } };
    this.loop();
    window.addEventListener("resize", () => this.resize());
  }

  invalidate() { this.needs = true; }

  resize() {
    const w = this.canvas.clientWidth || 800, h = this.canvas.clientHeight || 600;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.fit();
  }

  setBackground(id) {
    this.bgId = id;
    const bg = BACKGROUNDS[id] ?? BACKGROUNDS.blanco;
    this.bgPlane.visible = !!bg.stops;
    if (bg.stops) { this.bgMat.map?.dispose(); this.bgMat.map = gradientTexture(bg.stops, bg.angle); this.bgMat.needsUpdate = true; }
    this.shadowMat.opacity = this.shadowStrength ?? bg.shadow;
    this.invalidate();
  }

  setShadow(strength, softness) {
    this.shadowStrength = strength;
    this.shadowMat.opacity = strength;
    if (softness != null) this.key.shadow.radius = softness;
    this.invalidate();
  }

  updateLight() {
    const a = this.light.angle * Math.PI / 180, e = this.light.height * Math.PI / 180;
    this.key.position.set(Math.sin(a) * 500 * Math.cos(e), Math.sin(e) * 500, Math.cos(a) * 500 * Math.cos(e) + 40);
    this.key.intensity = 2.2 * this.light.intensity;
    this.fill.intensity = 0.55 * (0.6 + this.light.intensity * 0.4);
    this.invalidate();
  }

  add(spec, opts = {}) {
    const p = new Phone(spec, opts);
    p.onChange = () => this.invalidate();
    const t = opts.transform ?? {};
    p.group.position.set(t.x ?? 0, t.y ?? 0, t.z ?? 0);
    p.group.rotation.set((t.rx ?? 0) * Math.PI / 180, ((t.ry ?? 0) + (p.back ? 180 : 0)) * Math.PI / 180, (t.rz ?? 0) * Math.PI / 180);
    p.group.scale.setScalar(t.s ?? 1);
    this.scene.add(p.group);
    this.phones.push(p);
    this.invalidate();
    return p;
  }

  remove(p) {
    this.scene.remove(p.group);
    this.phones = this.phones.filter((x) => x !== p);
    if (this.selected === p) this.selected = null;
    this.invalidate();
  }

  clear() { [...this.phones].forEach((p) => this.remove(p)); }

  /** Encuadra todos los teléfonos con un margen. */
  fit(margin = 1.18) {
    if (!this.phones.length) { this.camera.position.set(0, 0, 600); this.camera.lookAt(0, 0, 0); return; }
    const box = new THREE.Box3();
    this.phones.forEach((p) => box.expandByObject(p.group));
    const size = box.getSize(new THREE.Vector3()), center = box.getCenter(new THREE.Vector3());
    const vFov = this.camera.fov * Math.PI / 180;
    const dist = Math.max((size.y * margin) / 2 / Math.tan(vFov / 2), (size.x * margin) / 2 / Math.tan(vFov / 2) / this.camera.aspect) + size.z;
    this.camera.position.set(center.x, center.y, center.z + dist);
    this.camera.lookAt(center);
    this.key.target.position.copy(center);
    // Modo medición: cámara ortográfica de frente (proporciones reales, sin perspectiva).
    const w = this.canvas.clientWidth || 800, h = this.canvas.clientHeight || 600, asp = w / h;
    const halfH = Math.max(size.y, size.x / asp) * margin / 2;
    Object.assign(this.ortho, { left: -halfH * asp, right: halfH * asp, top: halfH, bottom: -halfH });
    this.ortho.position.set(center.x, center.y, 1500);
    this.ortho.lookAt(center.x, center.y, 0);
    this.ortho.updateProjectionMatrix();
    this.invalidate();
  }

  render() { this.renderer.render(this.scene, this.measuring ? this.ortho : this.camera); }

  /** El teléfono que está bajo el dedo / el cursor. */
  pick(clientX, clientY) {
    const r = this.canvas.getBoundingClientRect();
    const v = new THREE.Vector2(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
    const ray = new THREE.Raycaster();
    ray.setFromCamera(v, this.measuring ? this.ortho : this.camera);
    const hit = ray.intersectObjects(this.phones.map((p) => p.group), true)[0];
    let o = hit?.object;
    while (o && !o.userData.phone) o = o.parent;
    return o?.userData.phone ?? null;
  }

  /** Punto del plano z del teléfono bajo el cursor (para arrastrarlo). */
  planePoint(clientX, clientY, z) {
    const r = this.canvas.getBoundingClientRect();
    const v = new THREE.Vector2(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
    const ray = new THREE.Raycaster();
    ray.setFromCamera(v, this.measuring ? this.ortho : this.camera);
    const out = new THREE.Vector3();
    return ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 0, 1), -z), out) ? out : null;
  }

  /** Posición en pantalla (px) de un punto 3D (para las etiquetas de medidas). */
  toScreen(v3) {
    const v = v3.clone().project(this.measuring ? this.ortho : this.camera);
    const r = this.canvas.getBoundingClientRect();
    return { x: (v.x + 1) / 2 * r.width, y: (1 - v.y) / 2 * r.height };
  }

  /** Exporta la imagen: "png" | "jpeg" | "webp", a [scale] veces el tamaño en pantalla. */
  async export(type = "png", scale = 2, transparent = false) {
    const w = this.canvas.clientWidth, h = this.canvas.clientHeight;
    const prevRatio = this.renderer.getPixelRatio();
    const bgVisible = this.bgPlane.visible;
    if (transparent && type !== "jpeg") this.bgPlane.visible = false;
    this.renderer.setPixelRatio(scale);
    this.renderer.setSize(w, h, false);
    if (type === "jpeg" && !this.bgPlane.visible) { this.renderer.setClearColor("#ffffff", 1); }
    // Cuadro de "calentamiento": la tarjeta gráfica termina de subir las imágenes grandes
    // (sin esto, una captura usada por primera vez podía salir negra en la imagen).
    this.render();
    await new Promise((r) => setTimeout(r, 250));
    this.render();
    const blob = await new Promise((ok) => this.canvas.toBlob(ok, "image/" + type, 0.95));
    this.renderer.setClearColor("#000000", 0);
    this.bgPlane.visible = bgVisible;
    this.renderer.setPixelRatio(prevRatio);
    this.resize();
    this.render();
    return blob;
  }
}

// ---------------------------------------------------------------- composiciones listas
// x/y/z en mm, rx/ry/rz en grados. "screen" es el id de la captura de SAOKO.
export const COMPOSITIONS = {
  heroe: {
    label: "Central con secundarios",
    items: [
      { model: "galaxy-s25-ultra", screen: "radio", t: { x: -86, y: -8, z: -14, ry: 24, rz: 4 } },
      { model: "pixel-9-pro", screen: "karaoke-letra", t: { x: 86, y: -8, z: -14, ry: -24, rz: -4 } },
      { model: "iphone-17-pro-max", screen: "inicio", t: { x: 0, y: 0, z: 10, ry: -6, rx: 4 } },
    ],
  },
  dos: {
    label: "Dos verticales",
    items: [
      { model: "iphone-17-pro", screen: "reproductor", t: { x: -42, y: 6, ry: 14 } },
      { model: "galaxy-s25", screen: "letras", t: { x: 42, y: -6, ry: -14 } },
    ],
  },
  abanico: {
    label: "Tres en abanico",
    items: [
      { model: "pixel-9", screen: "recap-portada", t: { x: -70, y: -14, z: -6, rz: 12 } },
      { model: "iphone-16-pro", screen: "inicio", t: { x: 0, y: 6, z: 4 } },
      { model: "galaxy-s25-plus", screen: "ia", t: { x: 70, y: -14, z: -6, rz: -12 } },
    ],
  },
  diagonal: {
    label: "Cinco en diagonal",
    items: [
      { model: "iphone-17-pro-max", screen: "radio", t: { x: -190, y: 70, z: -30, rz: -28, ry: 10 } },
      { model: "galaxy-s25-ultra", screen: "karaoke", t: { x: -95, y: 35, z: -12, rz: -28, ry: 10 } },
      { model: "iphone-17-pro", screen: "inicio", t: { x: 0, y: 0, z: 6, rz: -28, ry: 10 } },
      { model: "pixel-9-pro", screen: "letras", t: { x: 95, y: -35, z: -12, rz: -28, ry: 10 } },
      { model: "galaxy-s25", screen: "recap-portada", t: { x: 190, y: -70, z: -30, rz: -28, ry: 10 } },
    ],
  },
  flotantes: {
    label: "Flotantes",
    items: [
      { model: "iphone-16-pro-max", screen: "reproductor-video", t: { x: -60, y: 20, z: 30, rx: 12, ry: 28, rz: -8 } },
      { model: "galaxy-s24-ultra", screen: "recap-top", t: { x: 70, y: -10, z: -10, rx: -10, ry: -30, rz: 10 } },
    ],
  },
  mixtos: {
    label: "Android e iOS juntos",
    items: [
      { model: "iphone-17-pro", screen: "inicio", t: { x: -40, y: 0, ry: 18 }, back: false },
      { model: "galaxy-s25-ultra", screen: "radio", t: { x: 40, y: 0, ry: -18 } },
    ],
  },
  estudio: {
    label: "Un teléfono de estudio",
    items: [{ model: "iphone-17-pro-max", screen: "reproductor", t: { x: 0, y: 0, rx: 6, ry: -22, rz: 2 } }],
  },
  espalda: {
    label: "Frente y espalda",
    items: [
      { model: "iphone-17-pro", screen: "inicio", t: { x: -42, ry: 16 } },
      { model: "iphone-17-pro", back: true, t: { x: 42, ry: -16 } },
    ],
  },
};
