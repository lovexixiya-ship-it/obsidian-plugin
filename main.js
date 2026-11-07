/*
 * 记忆星图 Galaxy Graph
 * Copyright (c) 2026 夕夕雅
 * SPDX-License-Identifier: MIT
 *
 * 本文件的 MIT 许可不覆盖 three.min.js。Three.js 的版权与许可见 LICENSE-THREE。
 */

const { Plugin, ItemView } = require("obsidian");

const VIEW_TYPE_GALAXY = "galaxy-graph-view";

function el(tag, cls) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  return e;
}

class GalaxyView extends ItemView {
  constructor(leaf) {
    super(leaf);
  }

  getViewType() {
    return VIEW_TYPE_GALAXY;
  }

  getDisplayText() {
    return "记忆星图";
  }

  getIcon() {
    return "sparkles";
  }

  async onOpen() {
    const container = this.containerEl.children[1];
    while (container.firstChild) container.removeChild(container.firstChild);
    container.classList.add("galaxy-graph-view");

    const header = el("div", "galaxy-header-bar");
    const titleEl = el("div", "galaxy-app-title");
    titleEl.innerHTML = "<span>✦</span> 记忆星图";
    header.appendChild(titleEl);

    const searchWrap = el("div", "galaxy-search-wrap");
    const searchInput = el("input", "galaxy-search-input");
    searchInput.type = "text";
    searchInput.placeholder = "搜索记忆、日记、小说...";
    searchWrap.appendChild(searchInput);
    header.appendChild(searchWrap);
    container.appendChild(header);

    const closeBtn = el("div", "galaxy-close-btn");
    closeBtn.textContent = "✕";
    closeBtn.onclick = () => this.app.workspace.detachLeavesOfType(VIEW_TYPE_GALAXY);
    container.appendChild(closeBtn);

    const musicBtn = el("div", "galaxy-music-btn");
    musicBtn.textContent = "♪";
    musicBtn.title = "公开版本不含配乐";
    musicBtn.setAttribute("aria-disabled", "true");
    container.appendChild(musicBtn);
    musicBtn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      console.info("Galaxy Graph: 公开版本不含配乐，不会读取或播放音频");
    });

    const canvasContainer = el("div", "galaxy-canvas-container");
    container.appendChild(canvasContainer);

    const vignette = el("div", "galaxy-vignette");
    container.appendChild(vignette);

    const card = el("div", "galaxy-info-card hidden");
    card.innerHTML = `
      <div class="galaxy-card-header">
        <div class="galaxy-card-title-wrap">
          <span class="galaxy-card-icon">✦</span>
          <div class="galaxy-card-title" id="gx-title">数据神庙</div>
        </div>
        <span class="galaxy-card-close" id="gx-close-card">✕</span>
      </div>
      <div class="galaxy-card-meta">
        <span id="gx-date">2026.10.29</span>
        <span>• 记忆</span>
      </div>
      <div class="galaxy-card-snippet" id="gx-snippet">读取笔记内容...</div>
      <div class="galaxy-card-bottom">
        <div class="galaxy-card-subdate" id="gx-subinfo">2026.08.23 · 记忆节点</div>
        <button class="galaxy-card-btn" id="gx-jump-btn">查看记忆 ›</button>
      </div>
    `;
    container.appendChild(card);

    card.querySelector("#gx-close-card").onclick = () => card.classList.add("hidden");

    const THREE = await this.loadThree();
    if (!THREE) {
      const err = el("div", "galaxy-app-title");
      err.style.cssText = "position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);pointer-events:none;";
      err.textContent = "3D 引擎加载失败，请检查插件目录下的 three.min.js";
      container.appendChild(err);
      return;
    }
    this.initGalaxy(canvasContainer, card, searchInput, THREE);
  }

  /**
   * 只载入与 main.js 同目录的 three.min.js。
   * CommonJS 导出会留在模块 exports 上，不读写 window.THREE / window.__THREE__，
   * 避免干扰库内其它使用 three.js 的插件（例如 mind-sea）。
   * 失败时在控制台留下错误；调用方会在界面提示缺少本地文件。
   */
  async loadThree() {
    if (this._three) return this._three;
    let three;
    try {
      three = require("./three.min.js");
    } catch (e) {
      console.error("Galaxy Graph: 无法加载插件目录中的 three.min.js", e);
      return null;
    }
    if (!three || typeof three.Scene !== "function") {
      console.error("Galaxy Graph: 本地 three.min.js 未导出可用的 THREE.Scene");
      return null;
    }
    this._three = three;
    return three;
  }

  /* ---------- 程序化贴图 ---------- */

  softDotTexture(THREE) {
    const s = 64;
    const c = document.createElement("canvas");
    c.width = c.height = s;
    const x = c.getContext("2d");
    const g = x.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.15, "rgba(255,255,255,0.85)");
    g.addColorStop(0.35, "rgba(255,255,255,0.25)");
    g.addColorStop(0.6, "rgba(255,255,255,0.03)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    x.fillStyle = g;
    x.fillRect(0, 0, s, s);
    return new THREE.CanvasTexture(c);
  }

  coreGlowTexture(THREE) {
    const s = 256;
    const c = document.createElement("canvas");
    c.width = c.height = s;
    const x = c.getContext("2d");
    const g = x.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.06, "rgba(255,252,238,0.98)");
    g.addColorStop(0.16, "rgba(255,240,196,0.78)");
    g.addColorStop(0.34, "rgba(255,214,150,0.36)");
    g.addColorStop(0.58, "rgba(255,196,134,0.13)");
    g.addColorStop(0.8, "rgba(180,200,255,0.035)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    x.fillStyle = g;
    x.fillRect(0, 0, s, s);
    return new THREE.CanvasTexture(c);
  }

  glintTexture(THREE) {
    const s = 128;
    const c = document.createElement("canvas");
    c.width = c.height = s;
    const x = c.getContext("2d");
    const cx = s / 2;

    // 紧而锐的核心光晕：白心 → 彩色层 → 快速衰减
    const halo = x.createRadialGradient(cx, cx, 0, cx, cx, cx);
    halo.addColorStop(0, "rgba(255,255,255,1)");
    halo.addColorStop(0.03, "rgba(255,255,255,1)");
    halo.addColorStop(0.08, "rgba(255,255,255,0.4)");
    halo.addColorStop(0.2, "rgba(255,255,255,0.06)");
    halo.addColorStop(0.4, "rgba(255,255,255,0.01)");
    halo.addColorStop(1, "rgba(255,255,255,0)");
    x.fillStyle = halo;
    x.fillRect(0, 0, s, s);

    const spike = (angle, len, wid, alpha) => {
      x.save();
      x.translate(cx, cx);
      x.rotate(angle);
      const g = x.createLinearGradient(0, 0, len, 0);
      g.addColorStop(0, `rgba(255,255,255,${alpha})`);
      g.addColorStop(0.12, `rgba(255,255,255,${alpha * 0.45})`);
      g.addColorStop(0.5, "rgba(255,255,255,0)");
      x.fillStyle = g;
      x.beginPath();
      x.moveTo(0, -wid / 2);
      x.lineTo(len, 0);
      x.lineTo(0, wid / 2);
      x.closePath();
      x.fill();
      x.restore();
    };

    spike(0, cx * 0.9, 3, 1.0);
    spike(Math.PI, cx * 0.9, 3, 1.0);
    spike(Math.PI / 2, cx * 0.6, 2, 0.9);
    spike(-Math.PI / 2, cx * 0.6, 2, 0.9);

    return new THREE.CanvasTexture(c);
  }

  bigStarTexture(THREE) {
    const s = 256;
    const c = document.createElement("canvas");
    c.width = c.height = s;
    const x = c.getContext("2d");
    const cx = s / 2;

    // 锐利的小热核 + 紧彩色晕
    const halo = x.createRadialGradient(cx, cx, 0, cx, cx, cx);
    halo.addColorStop(0, "rgba(255,255,255,1)");
    halo.addColorStop(0.025, "rgba(255,255,255,1)");
    halo.addColorStop(0.06, "rgba(255,255,255,0.6)");
    halo.addColorStop(0.15, "rgba(255,255,255,0.12)");
    halo.addColorStop(0.3, "rgba(255,255,255,0.02)");
    halo.addColorStop(1, "rgba(255,255,255,0)");
    x.fillStyle = halo;
    x.fillRect(0, 0, s, s);

    const spike = (angle, len, wid, alpha) => {
      x.save();
      x.translate(cx, cx);
      x.rotate(angle);
      const g = x.createLinearGradient(0, 0, len, 0);
      g.addColorStop(0, `rgba(255,255,255,${alpha})`);
      g.addColorStop(0.1, `rgba(255,255,255,${alpha * 0.5})`);
      g.addColorStop(0.4, "rgba(255,255,255,0)");
      x.fillStyle = g;
      x.beginPath();
      x.moveTo(0, -wid / 2);
      x.lineTo(len, 0);
      x.lineTo(0, wid / 2);
      x.closePath();
      x.fill();
      x.restore();
    };

    spike(0, cx * 0.92, 5, 1.0);
    spike(Math.PI, cx * 0.92, 5, 1.0);
    spike(Math.PI / 2, cx * 0.65, 3.5, 0.95);
    spike(-Math.PI / 2, cx * 0.65, 3.5, 0.95);

    return new THREE.CanvasTexture(c);
  }

  streakTexture(THREE) {
    const w = 512, h = 64;
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const x = c.getContext("2d");
    const g = x.createLinearGradient(0, h / 2, w, h / 2);
    g.addColorStop(0, "rgba(255,255,255,0)");
    g.addColorStop(0.5, "rgba(255,255,255,0.85)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    x.fillStyle = g;
    x.fillRect(0, h / 2 - 1, w, 2);
    const g2 = x.createLinearGradient(0, 0, 0, h);
    g2.addColorStop(0, "rgba(255,255,255,0)");
    g2.addColorStop(0.5, "rgba(255,255,255,0.16)");
    g2.addColorStop(1, "rgba(255,255,255,0)");
    x.fillStyle = g2;
    x.fillRect(0, 0, w, h);
    return new THREE.CanvasTexture(c);
  }

  nebulaTexture(THREE) {
    const s = 512;
    const c = document.createElement("canvas");
    c.width = c.height = s;
    const x = c.getContext("2d");
    x.clearRect(0, 0, s, s);

    const blob = (bx, by, br, color, a) => {
      const g = x.createRadialGradient(bx, by, 0, bx, by, br);
      g.addColorStop(0, `rgba(${color},${a})`);
      g.addColorStop(0.45, `rgba(${color},${a * 0.42})`);
      g.addColorStop(1, `rgba(${color},0)`);
      x.fillStyle = g;
      x.fillRect(0, 0, s, s);
    };

    blob(s * 0.5, s * 0.55, s * 0.5, "32,104,156", 0.42);
    blob(s * 0.3, s * 0.4, s * 0.3, "26,84,140", 0.3);
    blob(s * 0.74, s * 0.68, s * 0.28, "22,64,112", 0.26);
    blob(s * 0.46, s * 0.2, s * 0.2, "16,52,96", 0.18);

    for (let i = 0; i < 700; i++) {
      const px = s * 0.5 + (Math.random() - 0.5) * s * 0.9;
      const py = s * 0.55 + (Math.random() - 0.5) * s * 0.75;
      x.fillStyle = `rgba(180,220,255,${Math.random() * 0.12})`;
      x.beginPath();
      x.arc(px, py, Math.random() * 1.4 + 0.3, 0, Math.PI * 2);
      x.fill();
    }
    return new THREE.CanvasTexture(c);
  }

  /* ---------- 星系渲染 ---------- */

  initGalaxy(container, cardEl, searchInput, THREE) {
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    const FOV = 46;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(FOV, width / height, 0.1, 4000);
    camera.position.set(0, 720, 620);
    camera.lookAt(0, -8, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // 水印覆盖层 canvas，和 WebGL 画面叠在一起输出
    const wmCanvas = document.createElement("canvas");
    wmCanvas.style.position = "absolute";
    wmCanvas.style.top = "0";
    wmCanvas.style.left = "0";
    wmCanvas.style.pointerEvents = "none";
    wmCanvas.style.zIndex = "25";
    container.appendChild(wmCanvas);

    const galaxyGroup = new THREE.Group();
    scene.add(galaxyGroup);

    renderer.setClearColor(0x050d1a, 1);

    const dotsTex = this.softDotTexture(THREE);
    const glowTex = this.coreGlowTexture(THREE);
    const glintTex = this.glintTexture(THREE);
    const bigStarTex = this.bigStarTexture(THREE);
    const streakTex = this.streakTexture(THREE);
    const nebulaTex = this.nebulaTexture(THREE);

    // 点尺寸按视口像素精确换算，避免尘埃被压成亚像素而消失
    const shared = {
      uScale: { value: 900 },
      uTime: { value: 0 }
    };
    const updatePointScale = () => {
      const h = renderer.getSize(new THREE.Vector2()).y;
      shared.uScale.value = h / (2 * Math.tan((camera.fov * Math.PI) / 360));
    };
    updatePointScale();

    const pointsMaterial = (tex, opacity) => new THREE.ShaderMaterial({
      uniforms: {
        uTex: { value: tex },
        uOpacity: { value: opacity },
        uScale: shared.uScale,
        uTime: shared.uTime
      },
      vertexShader: [
        "attribute vec3 aColor;",
        "attribute float aSize;",
        "attribute float aPhase;",
        "uniform float uScale;",
        "uniform float uTime;",
        "varying vec3 vColor;",
        "varying float vTwinkle;",
        "void main() {",
        "  vColor = aColor;",
        "  vTwinkle = 0.78 + 0.22 * sin(uTime * 1.2 + aPhase);",
        "  vec4 mv = modelViewMatrix * vec4(position, 1.0);",
        "  gl_PointSize = aSize * uScale / max(-mv.z, 1.0);",
        "  gl_Position = projectionMatrix * mv;",
        "}"
      ].join("\n"),
      fragmentShader: [
        "uniform sampler2D uTex;",
        "uniform float uOpacity;",
        "varying vec3 vColor;",
        "varying float vTwinkle;",
        "void main() {",
        "  vec4 t = texture2D(uTex, gl_PointCoord);",
        "  if (t.a < 0.01) discard;",
        "  gl_FragColor = vec4(vColor * t.a, t.a * uOpacity * vTwinkle);",
        "}"
      ].join("\n"),
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    /* 背景星云 */
    const nebula = new THREE.Sprite(new THREE.SpriteMaterial({
      map: nebulaTex,
      transparent: true,
      opacity: 0.26,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    }));
    nebula.scale.set(1600, 1600, 1);
    nebula.position.set(0, -40, -420);
    scene.add(nebula);

    /* 远景星空 */
    const bgCount = 1600;
    const bgGeo = new THREE.BufferGeometry();
    const bgPos = new Float32Array(bgCount * 3);
    const bgCol = new Float32Array(bgCount * 3);
    for (let i = 0; i < bgCount; i++) {
      const i3 = i * 3;
      const r = 900 + Math.random() * 1500;
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      bgPos[i3] = Math.sin(ph) * Math.cos(th) * r;
      bgPos[i3 + 1] = Math.cos(ph) * r * 0.6;
      bgPos[i3 + 2] = Math.sin(ph) * Math.sin(th) * r;
      const b = 0.25 + Math.random() * 0.5;
      bgCol[i3] = b * (0.82 + Math.random() * 0.18);
      bgCol[i3 + 1] = b * (0.9 + Math.random() * 0.1);
      bgCol[i3 + 2] = b;
    }
    bgGeo.setAttribute("position", new THREE.BufferAttribute(bgPos, 3));
    bgGeo.setAttribute("color", new THREE.BufferAttribute(bgCol, 3));
    scene.add(new THREE.Points(bgGeo, new THREE.PointsMaterial({
      size: 2.2,
      map: dotsTex,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true
    })));

    /* 尘埃旋臂 */
    const ARM = 3;
    const CORE_R = 16;
    const MAX_R = 300;
    const PITCH = 1.95;
    const spiralTheta = (r, arm) => (arm * Math.PI * 2) / ARM + PITCH * Math.log(Math.max(r, 1) / CORE_R);

    const randomGauss = () => {
      let u = 0, v = 0;
      while (u === 0) u = Math.random();
      while (v === 0) v = Math.random();
      return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    };

    const buildDust = (count, sizeMin, sizeMax, spreadK, warmMix, opacity) => {
      const geo = new THREE.BufferGeometry();
      const pos = new Float32Array(count * 3);
      const col = new Float32Array(count * 3);
      const siz = new Float32Array(count);
      const phase = new Float32Array(count);

      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        const t = Math.pow(Math.random(), 1.2);
        const r = CORE_R + t * (MAX_R - CORE_R);
        const arm = i % ARM;
        const th = spiralTheta(r, arm);

        const spread = (6 + (r / MAX_R) * 42) * spreadK;
        const offIn = randomGauss() * spread * 0.55;
        const offY = randomGauss() * (1.2 + (r / MAX_R) * 6);

        pos[i3] = Math.cos(th) * r - Math.sin(th) * offIn;
        pos[i3 + 1] = offY;
        pos[i3 + 2] = Math.sin(th) * r + Math.cos(th) * offIn;

        const k = Math.min(r / MAX_R, 1);
        const mix = Math.pow(k, 0.75) * warmMix + Math.random() * 0.05;
        const bright = 0.5 + Math.random() * 0.35 + (1 - k) * 0.32;

        col[i3] = (1.0 + (0.56 - 1.0) * mix) * bright;
        col[i3 + 1] = (0.86 + (0.74 - 0.86) * mix) * bright;
        col[i3 + 2] = (0.62 + (1.0 - 0.62) * mix) * bright;

        siz[i] = sizeMin + Math.random() * (sizeMax - sizeMin);
        if (Math.random() < 0.015) siz[i] *= 2.2;
        phase[i] = Math.random() * Math.PI * 2;
      }

      geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      geo.setAttribute("aColor", new THREE.BufferAttribute(col, 3));
      geo.setAttribute("aSize", new THREE.BufferAttribute(siz, 1));
      geo.setAttribute("aPhase", new THREE.BufferAttribute(phase, 1));

      const mat = pointsMaterial(dotsTex, opacity);
      const pts = new THREE.Points(geo, mat);
      galaxyGroup.add(pts);
      return mat;
    };

    const dustMats = [];
    dustMats.push(buildDust(135000, 1.3, 3.4, 1.05, 0.78, 0.5));
    dustMats.push(buildDust(36000, 2.6, 5.0, 1.8, 0.8, 0.12));
    dustMats.push(buildDust(6000, 2.6, 5.4, 0.5, 0.9, 0.85));

    /* 沿旋臂的宽暗尘埃层：比主臂暗、扩散范围大 */
    {
      const count = 80000;
      const geo = new THREE.BufferGeometry();
      const pos = new Float32Array(count * 3);
      const col = new Float32Array(count * 3);
      const siz = new Float32Array(count);
      const phase = new Float32Array(count);
      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        const t = Math.pow(Math.random(), 1.1);
        const r = CORE_R + t * (MAX_R - CORE_R);
        const arm = i % ARM;
        const th = spiralTheta(r, arm);
        const spread = (20 + (r / MAX_R) * 110);
        const offIn = randomGauss() * spread;
        const offY = randomGauss() * (3 + (r / MAX_R) * 12);
        pos[i3] = Math.cos(th) * r - Math.sin(th) * offIn;
        pos[i3 + 1] = offY;
        pos[i3 + 2] = Math.sin(th) * r + Math.cos(th) * offIn;
        const k = Math.min(r / MAX_R, 1);
        const mix = Math.pow(k, 0.75) * 0.78;
        const bright = (0.5 + Math.random() * 0.35) * (1 - k * 0.2);
        col[i3] = (1.0 + (0.56 - 1.0) * mix) * bright;
        col[i3 + 1] = (0.86 + (0.74 - 0.86) * mix) * bright;
        col[i3 + 2] = (0.62 + (1.0 - 0.62) * mix) * bright;
        siz[i] = 1.0 + Math.random() * 2.5;
        phase[i] = Math.random() * Math.PI * 2;
      }
      geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      geo.setAttribute("aColor", new THREE.BufferAttribute(col, 3));
      geo.setAttribute("aSize", new THREE.BufferAttribute(siz, 1));
      geo.setAttribute("aPhase", new THREE.BufferAttribute(phase, 1));
      const mat = pointsMaterial(dotsTex, 0.65);
      galaxyGroup.add(new THREE.Points(geo, mat));
      dustMats.push(mat);
    }

    /* 核心尘埃 */
    {
      const count = 13000;
      const geo = new THREE.BufferGeometry();
      const pos = new Float32Array(count * 3);
      const col = new Float32Array(count * 3);
      const siz = new Float32Array(count);
      const phase = new Float32Array(count);
      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        const r = Math.pow(Math.random(), 1.7) * 85;
        const th = Math.random() * Math.PI * 2;
        pos[i3] = Math.cos(th) * r;
        pos[i3 + 1] = (Math.random() - 0.5) * 12 * (1 - r / 85);
        pos[i3 + 2] = Math.sin(th) * r;
        const b = 0.75 + Math.random() * 0.45;
        col[i3] = 1.0 * b;
        col[i3 + 1] = (0.94 - (r / 85) * 0.16) * b;
        col[i3 + 2] = (0.72 - (r / 85) * 0.3) * b;
        siz[i] = 1.2 + Math.random() * 2.2;
        phase[i] = Math.random() * Math.PI * 2;
      }
      geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      geo.setAttribute("aColor", new THREE.BufferAttribute(col, 3));
      geo.setAttribute("aSize", new THREE.BufferAttribute(siz, 1));
      geo.setAttribute("aPhase", new THREE.BufferAttribute(phase, 1));
      const mat = pointsMaterial(dotsTex, 0.9);
      galaxyGroup.add(new THREE.Points(geo, mat));
      dustMats.push(mat);
    }

    /* 星核：多层光晕 + 横向镜头光带 */
    const coreLayers = [];
    const addCoreLayer = (map, color, scale, opacity) => {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({
        map: map,
        color: color,
        transparent: true,
        opacity: opacity,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      }));
      sp.scale.set(scale, scale, 1);
      galaxyGroup.add(sp);
      coreLayers.push({ sprite: sp, base: scale });
      return sp;
    };
    addCoreLayer(glowTex, 0xffcf8a, 460, 0.32);
    addCoreLayer(glowTex, 0xffeecb, 210, 0.7);
    addCoreLayer(glowTex, 0xffffff, 68, 0.92);
    addCoreLayer(glintTex, 0xffffff, 86, 0.6);
    const streak = addCoreLayer(streakTex, 0xffe0b0, 320, 0.1);
    streak.scale.set(320, 18, 1);

    /* 笔记星点 */
    const files = this.app.vault.getMarkdownFiles();
    const palette = [0x4dd8ff, 0x4dd8ff, 0x5a8aff, 0x5a8aff, 0x6ff0ff, 0xffc840, 0xff55cc, 0x4dffb0];
    const noteNodes = [];
    const fileNodeMap = new Map();

    const nodeCount = files.length || 120;
    for (let i = 0; i < nodeCount; i++) {
      const file = files.length ? files[i] : null;
      const hero = Math.random() < 0.09;
      let r, th, off;
      r = CORE_R + 22 + Math.pow(Math.random(), 0.8) * (MAX_R - CORE_R - 24);
      const arm = i % ARM;
      th = spiralTheta(r, arm) + (Math.random() - 0.5) * 0.22;
      // 大星贴近旋臂，小记忆星散到旋臂旁边的空区
      off = hero
        ? randomGauss() * (5 + (r / MAX_R) * 20)
        : randomGauss() * (35 + (r / MAX_R) * 110);

      const pos = new THREE.Vector3(
        Math.cos(th) * r - Math.sin(th) * off,
        (Math.random() - 0.5) * 12,
        Math.sin(th) * r + Math.cos(th) * off
      );

      const color = palette[i % palette.length];
      const base = hero ? (60 + Math.random() * 30) : (16 + Math.random() * 12);
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
        map: hero ? bigStarTex : glintTex,
        color: color,
        transparent: true,
        opacity: hero ? 1.0 : 0.95,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      }));
      sprite.position.copy(pos);
      sprite.scale.set(base, base, 1);
      sprite.userData = {
        file: file,
        base: base,
        color: color,
        hero: hero,
        phase: Math.random() * Math.PI * 2,
        twinkleSpeed: 0.8 + Math.random() * 1.5
      };
      galaxyGroup.add(sprite);
      noteNodes.push(sprite);
      if (file) fileNodeMap.set(file.path, sprite);
    }

    /* 流星：起点终点都随机，循环刷新 */
    const rays = [];
    const randomMeteorPoint = (inner) => {
      const arm = Math.floor(Math.random() * ARM);
      const r = inner
        ? (CORE_R + 15 + Math.random() * 90)
        : (60 + Math.random() * (MAX_R - 50));
      const th = spiralTheta(r, arm) + (Math.random() - 0.5) * 0.4;
      const off = randomGauss() * (6 + (r / MAX_R) * 30);
      return new THREE.Vector3(
        Math.cos(th) * r - Math.sin(th) * off,
        (Math.random() - 0.5) * 10,
        Math.sin(th) * r + Math.cos(th) * off
      );
    };

    const spawnRay = (fromPos, toPos) => {
      const curve = new THREE.LineCurve3(fromPos.clone(), toPos.clone());
      const segs = 26;
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(segs * 3), 3));
      geo.setAttribute("color", new THREE.BufferAttribute(new Float32Array(segs * 3), 3));
      const line = new THREE.Line(geo, new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      }));
      galaxyGroup.add(line);
      rays.push({
        line: line,
        curve: curve,
        head: Math.random(),
        tail: 0.14 + Math.random() * 0.12,
        speed: 0.004 + Math.random() * 0.005,
        warm: false
      });
    };

    for (let i = 0; i < 14; i++) {
      spawnRay(randomMeteorPoint(true), randomMeteorPoint(false));
    }

    /* 交互 */
    let isDragging = false;
    let prev = { x: 0, y: 0 };
    let userTilt = 0;
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let hovered = null;

    container.addEventListener("mousedown", (e) => {
      isDragging = true;
      prev = { x: e.clientX, y: e.clientY };
      container.style.cursor = "grabbing";
    });
    const onUp = () => {
      isDragging = false;
      container.style.cursor = "default";
    };
    window.addEventListener("mouseup", onUp);
    this.register(() => window.removeEventListener("mouseup", onUp));

    container.addEventListener("mousemove", async (e) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / container.clientWidth) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / container.clientHeight) * 2 + 1;

      if (isDragging) {
        galaxyGroup.rotation.y += (e.clientX - prev.x) * 0.004;
        userTilt += (e.clientY - prev.y) * 0.0022;
        userTilt = Math.min(Math.max(userTilt, -0.55), 0.55);
        prev = { x: e.clientX, y: e.clientY };
        return;
      }

      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(noteNodes);
      if (hits.length > 0) {
        const hit = hits[0].object;
        if (hovered !== hit) {
          if (hovered) {
            hovered.scale.set(hovered.userData.base, hovered.userData.base, 1);
            hovered.material.opacity = 0.9;
          }
          hovered = hit;
          container.style.cursor = "pointer";
          hit.scale.set(hit.userData.base * 1.9, hit.userData.base * 1.9, 1);
          hit.material.opacity = 1;

          const f = hit.userData.file;
          if (f) {
            const txt = await this.app.vault.cachedRead(f);
            const titleBox = cardEl.querySelector("#gx-title");
            const dateBox = cardEl.querySelector("#gx-date");
            const snippetBox = cardEl.querySelector("#gx-snippet");
            const subBox = cardEl.querySelector("#gx-subinfo");
            const jumpBtn = cardEl.querySelector("#gx-jump-btn");
            const dt = new Date(f.stat.mtime);
            const ds = `${dt.getFullYear()}.${String(dt.getMonth() + 1).padStart(2, "0")}.${String(dt.getDate()).padStart(2, "0")}`;
            titleBox.textContent = f.basename;
            dateBox.textContent = ds;
            snippetBox.textContent = txt.slice(0, 110).replace(/[#*`\n]/g, " ") || "暂无描述...";
            subBox.textContent = `${ds} · ${f.path}`;
            jumpBtn.onclick = () => this.app.workspace.getLeaf(false).openFile(f);
            cardEl.classList.remove("hidden");
          }
        }
      } else if (hovered) {
        hovered.scale.set(hovered.userData.base, hovered.userData.base, 1);
        hovered.material.opacity = 0.9;
        hovered = null;
        container.style.cursor = "default";
      }
    });

    container.addEventListener("wheel", (e) => {
      e.preventDefault();
      const z = Math.min(Math.max(camera.position.z + e.deltaY * 0.3, 200), 1000);
      camera.position.z = z;
      camera.position.y = z * 1.15;
    }, { passive: false });

    searchInput.addEventListener("input", (e) => {
      const val = e.target.value.toLowerCase().trim();
      noteNodes.forEach((n) => {
        const match = !val || (n.userData.file && n.userData.file.basename.toLowerCase().includes(val));
        const s = match ? (val ? n.userData.base * 1.5 : n.userData.base) : n.userData.base * 0.4;
        n.scale.set(s, s, 1);
        n.material.opacity = match ? 0.9 : 0.15;
        n.material.color.setHex(val ? (match ? 0xffffff : 0x223344) : n.userData.color);
      });
    });

    let stopped = false;
    this.register(() => (stopped = true));

    const t0 = Date.now();
    const animate = () => {
      if (stopped) return;
      requestAnimationFrame(animate);
      const t = (Date.now() - t0) / 1000;

      if (!isDragging) galaxyGroup.rotation.y += 0.0012;
      galaxyGroup.rotation.x = userTilt + Math.sin(t * 0.1) * 0.03;

      shared.uTime.value = t * 1.1;

      coreLayers.forEach((c, i) => {
        const pulse = 1 + Math.sin(t * 0.8 + i * 0.9) * 0.045;
        if (i === coreLayers.length - 1) {
          c.sprite.scale.set(c.base * (1 + Math.sin(t * 0.7) * 0.03), 18 * (1 + Math.sin(t * 1.2) * 0.02), 1);
        } else {
          c.sprite.scale.set(c.base * pulse, c.base * pulse, 1);
        }
      });

      noteNodes.forEach((n) => {
        if (n === hovered) return;
        const spd = n.userData.twinkleSpeed || (n.userData.hero ? 1.0 : 1.5);
        const ph = t * spd + n.userData.phase;
        const tw = 0.65 + 0.35 * Math.sin(ph);
        n.material.opacity = (n.userData.hero ? 1.0 : 0.9) * tw;
        const b = n.userData.base * (1 + Math.sin(ph) * (n.userData.hero ? 0.18 : 0.12));
        n.scale.set(b, b, 1);
      });

      rays.forEach((b) => {
        b.head += b.speed;
        if (b.head > 1 + b.tail) {
          b.head = 0;
          b.curve = new THREE.LineCurve3(randomMeteorPoint(true), randomMeteorPoint(false));
        }
        const posAttr = b.line.geometry.attributes.position;
        const colAttr = b.line.geometry.attributes.color;
        const sc = posAttr.count;
        for (let j = 0; j < sc; j++) {
          const stepRatio = j / (sc - 1);
          const pointProg = b.head - (1 - stepRatio) * b.tail;
          const clamped = Math.min(Math.max(pointProg, 0), 1);
          const p = b.curve.getPoint(clamped);
          posAttr.setXYZ(j, p.x, p.y, p.z);
          if (pointProg < 0 || pointProg > 1) {
            colAttr.setXYZ(j, 0.04, 0.09, 0.16);
          } else {
            const a = Math.pow(stepRatio, 2.0);
            if (b.warm) {
              colAttr.setXYZ(j, 0.9 + 0.1 * a, 0.72 + 0.2 * a, 0.45 + 0.4 * a);
            } else {
              colAttr.setXYZ(j, 0.3 + 0.6 * a, 0.4 + 0.55 * a, 0.55 + 0.45 * a);
            }
          }
        }
        posAttr.needsUpdate = true;
        colAttr.needsUpdate = true;
      });

      renderer.render(scene, camera);
      // 水印直接画进覆盖层 canvas，和画面一起输出，改 CSS 删不掉
      if (wmCanvas) {
        const wctx = wmCanvas.getContext("2d");
        wctx.clearRect(0, 0, wmCanvas.width, wmCanvas.height);
        wctx.font = "10px -apple-system, BlinkMacSystemFont, sans-serif";
        wctx.fillStyle = "rgba(180, 210, 240, 0.38)";
        wctx.textAlign = "right";
        wctx.fillText("创作者 夕夕雅 | 商用微信 cx355120343", wmCanvas.width - 14, wmCanvas.height - 12);
      }
    };
    animate();

    const ro = new ResizeObserver(() => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (!w || !h) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      const dpr = renderer.getPixelRatio();
      wmCanvas.width = w * dpr;
      wmCanvas.height = h * dpr;
      wmCanvas.style.width = w + "px";
      wmCanvas.style.height = h + "px";
      updatePointScale();
    });
    ro.observe(container);
    this.register(() => ro.disconnect());
  }

  async onClose() {}
}

class GalaxyGraphPlugin extends Plugin {
  async onload() {
    this.registerView(VIEW_TYPE_GALAXY, (leaf) => new GalaxyView(leaf));
    this.addRibbonIcon("sparkles", "打开记忆星图", () => this.activateView());
    this.addCommand({
      id: "open-galaxy-graph",
      name: "打开记忆星图视图",
      callback: () => this.activateView()
    });
  }

  async activateView() {
    const { workspace } = this.app;
    let leaf = workspace.getLeavesOfType(VIEW_TYPE_GALAXY)[0];
    if (!leaf) {
      leaf = workspace.getLeaf("tab");
      await leaf.setViewState({ type: VIEW_TYPE_GALAXY, active: true });
    }
    workspace.revealLeaf(leaf);
  }
}

module.exports = GalaxyGraphPlugin;
