#!/usr/bin/env node
"use strict";

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const Module = require("module");

const root = path.resolve(__dirname, "..");
const failures = [];
const WATERMARK = "创作者 夕夕雅 | 商用微信 cx355120343";
const THREE_SHA256 = "9274bbcec8d96168626c732b5d31c775aa8cfb7eaa0599bec0c175908a2c1ce2";
const THREE_LICENSE_SHA256 = "7dddf7c5b8fd10ee654db8857d75d104b5557889aa5a91fc4ca545ea7c07062f";
const DEMO_SHA256 = "8728e1cc392ccec398d300603221773a18ceeb4170cd9ef40783c88bcbed0a81";
const ZIP_NAME = "obsidian记忆星云.zip";

function check(cond, msg) {
  if (cond) console.log("ok  " + msg);
  else {
    console.error("FAIL " + msg);
    failures.push(msg);
  }
}

function sha256(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function walk(dir, acc) {
  for (const name of fs.readdirSync(dir)) {
    if (name === ".git" || name === "node_modules") continue;
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) walk(full, acc);
    else acc.push(full);
  }
  return acc;
}

function syntax(file) {
  const r = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
  check(r.status === 0, "syntax " + path.relative(root, file) + (r.status === 0 ? "" : "\n" + r.stderr));
}

function readText(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

console.log("node " + process.version);
console.log("time " + new Date().toISOString());
console.log("mode node mock and static checks; not an Obsidian desktop acceptance test");

syntax(path.join(root, "main.js"));
syntax(path.join(root, "three.min.js"));
syntax(__filename);

const manifest = JSON.parse(readText("manifest.json"));
check(manifest.id === "galaxy-graph", "manifest id galaxy-graph");
check(manifest.name === "obsidian记忆星云", "manifest visible name");
check(manifest.version === "1.2.0", "manifest version 1.2.0");
check(manifest.minAppVersion === "1.0.0", "manifest minAppVersion");
check(manifest.author === "夕夕雅", "manifest author");
check(manifest.isDesktopOnly === true, "manifest isDesktopOnly true");

const main = readText("main.js");
check(main.split(WATERMARK).length - 1 === 1, "watermark text occurs once");
check(main.includes('wctx.fillText("' + WATERMARK + '", wmCanvas.width - 14, wmCanvas.height - 12);'), "watermark call unchanged");
check(main.includes('require("./three.min.js")'), "local three require");
check(!main.includes("bgm.mp3"), "no bgm.mp3");
check(!main.includes("new Function"), "no new Function");
check(!main.includes("npmmirror"), "no npmmirror");
check(!main.includes("jsdelivr") && !main.includes("jsDelivr"), "no jsDelivr");
check(!main.includes('require("fs")') && !main.includes("require('fs')"), "no fs require");
check(!main.includes('require("path")') && !main.includes("require('path')"), "no path require");
check(!main.includes("basePath"), "no vault basePath");
check(!/https?:\/\//.test(main), "no URL in main.js");
check(main.includes("Copyright (c) 2026 夕夕雅"), "main.js copyright");

const css = readText("styles.css");
check(css.includes(".galaxy-watermark"), "watermark css kept");
check(css.includes("right: 14px;") && css.includes("bottom: 10px;"), "watermark css position kept");
check(css.includes("Copyright (c) 2026 夕夕雅"), "styles copyright");

check(sha256(path.join(root, "three.min.js")) === THREE_SHA256, "three.min.js official r128 sha256");
const threeHead = fs.readFileSync(path.join(root, "three.min.js"), "utf8").slice(0, 120);
check(threeHead.includes("Copyright 2010-2021 Three.js Authors"), "three copyright header");
check(threeHead.includes("SPDX-License-Identifier: MIT"), "three SPDX header");
check(sha256(path.join(root, "LICENSE-THREE")) === THREE_LICENSE_SHA256, "LICENSE-THREE official sha256");

const license = readText("LICENSE");
check(license.includes("MIT License"), "LICENSE is MIT");
check(license.includes("Copyright (c) 2026 夕夕雅"), "LICENSE copyright");
check(!/non-commercial|NonCommercial|非商业|不得用于商业|付款/.test(license), "LICENSE adds no commercial restriction");
check(!license.includes("cx355120343"), "wechat is not a LICENSE term");

const readme = readText("README.md");
check(readme.startsWith("# obsidian记忆星云\n"), "README title");
check(readme.includes("docs/demo.mp4"), "README demo link");
check(readme.includes(WATERMARK), "README keeps watermark text");
check(readme.includes("`.vault/.obsidian/plugins/galaxy-graph/`"), "README install path");
check(readme.includes("隐私遮挡") && readme.includes("静音"), "README describes processed silent demo");
check(readme.includes("galaxy-graph") && readme.includes("1.2.0"), "README keeps id and version");
check(!readme.includes("demo-public"), "README does not name the private upload");
check(!/\/Users\/|\/home\/|C:\\Users\\/.test(readme), "README has no personal path");

const notice = readText("NOTICE");
check(notice.includes("Copyright (c) 2026 夕夕雅"), "NOTICE plugin copyright");
check(notice.includes("Copyright 2010-2021 Three.js Authors"), "NOTICE three copyright");
check(notice.includes(THREE_SHA256), "NOTICE three hash");

const files = walk(root, []);
const mp4s = files.filter((f) => f.endsWith(".mp4"));
check(mp4s.length === 1 && mp4s[0] === path.join(root, "docs", "demo.mp4"), "only docs/demo.mp4 is published");
check(sha256(path.join(root, "docs", "demo.mp4")) === DEMO_SHA256, "demo bytes match the watermarked attachment");
const zips = files.filter((f) => f.endsWith(".zip"));
check(zips.length === 1 && path.basename(zips[0]) === ZIP_NAME, "only the named install zip is published");

const probe = spawnSync("ffprobe", [
  "-v", "error",
  "-show_entries", "format=duration,nb_streams,format_name:format_tags:stream=codec_type,codec_name,width,height,pix_fmt",
  "-of", "json",
  path.join(root, "docs", "demo.mp4")
], { encoding: "utf8" });
check(probe.status === 0, "ffprobe demo");
if (probe.status === 0) {
  const info = JSON.parse(probe.stdout);
  const streams = info.streams || [];
  check(streams.length === 1 && streams[0].codec_type === "video", "demo has one video stream and no audio");
  check(streams[0].codec_name === "h264" && streams[0].pix_fmt === "yuv420p", "demo h264 yuv420p");
  check(streams[0].width === 1214 && streams[0].height === 720, "demo 1214x720");
  const duration = Number(info.format.duration);
  check(Math.abs(duration - 10.066667) < 0.001, "demo duration 10.066667 (" + duration + ")");
}

const three = require(path.join(root, "three.min.js"));
check(three.REVISION === "128", "THREE.REVISION 128");
check(typeof three.Scene === "function" && typeof three.WebGLRenderer === "function", "THREE.Scene and WebGLRenderer export");

const createdTags = [];
class ClassList {
  constructor() { this._s = new Set(); }
  add(c) { this._s.add(c); }
  remove(c) { this._s.delete(c); }
  contains(c) { return this._s.has(c); }
}
const drawnText = [];
const fake2d = {
  fillStyle: "",
  font: "",
  textAlign: "",
  createRadialGradient: () => ({ addColorStop() {} }),
  createLinearGradient: () => ({ addColorStop() {} }),
  fillRect() {},
  clearRect() {},
  beginPath() {},
  arc() {},
  fill() {},
  save() {},
  restore() {},
  translate() {},
  rotate() {},
  moveTo() {},
  lineTo() {},
  closePath() {},
  fillText(text) { drawnText.push(String(text)); }
};
class El {
  constructor(tag) {
    this.tagName = String(tag).toUpperCase();
    this.className = "";
    this.classList = new ClassList();
    this.style = {};
    this.children = [];
    this.attrs = {};
    this._events = {};
    this._byId = {};
    this._html = "";
    this.textContent = "";
    this.title = "";
    this.type = "";
    this.placeholder = "";
    this.id = "";
    this.clientWidth = 800;
    this.clientHeight = 600;
    this.width = this.tagName === "CANVAS" ? 64 : 0;
    this.height = this.tagName === "CANVAS" ? 64 : 0;
    this.onclick = null;
  }
  get firstChild() { return this.children[0] || null; }
  appendChild(child) { this.children.push(child); return child; }
  removeChild(child) {
    const i = this.children.indexOf(child);
    if (i >= 0) this.children.splice(i, 1);
    return child;
  }
  setAttribute(name, value) { this.attrs[name] = String(value); }
  addEventListener(type, fn) {
    (this._events[type] || (this._events[type] = [])).push(fn);
  }
  getBoundingClientRect() {
    return { left: 0, top: 0, width: this.clientWidth, height: this.clientHeight };
  }
  set innerHTML(html) {
    this._html = String(html);
    this._byId = {};
    const re = /id="([^"]+)"/g;
    let m;
    while ((m = re.exec(this._html))) {
      const node = new El("div");
      node.id = m[1];
      this._byId[m[1]] = node;
    }
  }
  get innerHTML() { return this._html; }
  querySelector(sel) {
    if (!sel.startsWith("#")) return null;
    const id = sel.slice(1);
    if (this._byId[id]) return this._byId[id];
    for (const child of this.children) {
      if (child.querySelector) {
        const found = child.querySelector(sel);
        if (found) return found;
      }
    }
    return null;
  }
  getContext() { return fake2d; }
}
function collect(el, acc) {
  acc.push(el);
  for (const child of el.children || []) collect(child, acc);
  for (const child of Object.values(el._byId || {})) collect(child, acc);
  return acc;
}

global.document = {
  createElement(tag) {
    createdTags.push(tag);
    return new El(tag);
  },
  head: new El("head")
};
global.window = {
  devicePixelRatio: 1,
  addEventListener() {},
  removeEventListener() {},
  THREE: { sentinel: "preexisting" }
};
global.ResizeObserver = class {
  observe() {}
  disconnect() {}
};
global.requestAnimationFrame = () => 0;

class Plugin {
  registerView(type, factory) { this._viewType = type; this._viewFactory = factory; }
  addRibbonIcon(icon, title, cb) { this._ribbon = { icon, title, cb }; }
  addCommand(cmd) { this._command = cmd; }
}
class ItemView {
  constructor(leaf) {
    this.leaf = leaf;
    this.app = leaf.app;
    const outer = new El("div");
    outer.children = [new El("div"), new El("div")];
    this.containerEl = outer;
    this._regs = [];
  }
  register(fn) { this._regs.push(fn); }
}
const obsidianMock = { Plugin, ItemView };
let failThree = false;
const origRequire = Module.prototype.require;
Module.prototype.require = function (id) {
  if (id === "obsidian") return obsidianMock;
  if (failThree && id === "./three.min.js") {
    const err = new Error("mock missing three.min.js");
    err.code = "MODULE_NOT_FOUND";
    throw err;
  }
  return origRequire.apply(this, arguments);
};

let renderCount = 0;
three.WebGLRenderer = function WebGLRenderer() {
  this.domElement = new El("canvas");
  this.setSize = (w, h) => { this._w = w; this._h = h; };
  this.setPixelRatio = (v) => { this._dpr = v; };
  this.setClearColor = () => {};
  this.getPixelRatio = () => this._dpr || 1;
  this.getSize = (target) => {
    if (target && target.set) target.set(this._w || 800, this._h || 600);
    return target;
  };
  this.render = () => { renderCount += 1; };
};

const calls = { files: 0, reads: 0, viewState: null, revealed: false };
const fixtureFiles = [
  { path: "notes/alpha.md", basename: "alpha", stat: { mtime: Date.UTC(2026, 0, 2) } },
  { path: "notes/beta.md", basename: "beta", stat: { mtime: Date.UTC(2026, 0, 3) } }
];
const app = {
  vault: {
    getMarkdownFiles() { calls.files += 1; return fixtureFiles; },
    async cachedRead() { calls.reads += 1; return "Fixture memory text"; }
  },
  workspace: {
    detachLeavesOfType() {},
    getLeavesOfType() { return []; },
    getLeaf() {
      return { async setViewState(state) { calls.viewState = state; }, openFile() {} };
    },
    revealLeaf() { calls.revealed = true; }
  }
};

async function lifecycle() {
  const GalaxyGraphPlugin = require(path.join(root, "main.js"));
  const plugin = new GalaxyGraphPlugin();
  plugin.app = app;
  await plugin.onload();
  check(plugin._viewType === "galaxy-graph-view", "onload registers galaxy-graph-view");
  check(plugin._ribbon && plugin._ribbon.icon === "sparkles", "ribbon icon registered");
  check(plugin._command && plugin._command.id === "open-galaxy-graph", "command open-galaxy-graph");
  await plugin.activateView();
  check(calls.viewState && calls.viewState.type === "galaxy-graph-view", "activateView sets the view");
  check(calls.revealed === true, "activateView reveals the leaf");

  const sentinel = global.window.THREE;
  const view = plugin._viewFactory({ app });
  check(view.getViewType() === "galaxy-graph-view", "view type");
  check(view.getDisplayText() === "记忆星图", "in-app title remains 记忆星图");
  check(view.getIcon() === "sparkles", "view icon");
  const loaded = await view.loadThree();
  check(loaded && loaded.REVISION === "128", "loadThree returns local r128");
  check(global.window.THREE === sentinel, "loadThree leaves window.THREE untouched");
  await view.onOpen();
  check(calls.files === 1, "onOpen reads the local markdown list once");
  check(renderCount === 1, "one mocked animation frame");
  check(drawnText.includes(WATERMARK), "mocked frame draws the original watermark");
  check(!createdTags.includes("script"), "onOpen injects no remote script");
  const nodes = collect(view.containerEl, []);
  const music = nodes.find((n) => n.textContent === "♪");
  check(music && music.attrs["aria-disabled"] === "true", "music control disabled");
  if (music && music._events.click) music._events.click.forEach((fn) => fn({ stopPropagation() {} }));
  view._regs.forEach((fn) => fn());

  console.log("expected observable error when local three.min.js cannot be loaded:");
  failThree = true;
  const failed = plugin._viewFactory({ app });
  await failed.onOpen();
  const failedNodes = collect(failed.containerEl, []);
  check(failedNodes.some((n) => String(n.textContent).includes("3D 引擎加载失败")), "missing three.min.js is visible in the view");
}

lifecycle().then(() => {
  const zipPath = path.join(root, ZIP_NAME);
  check(fs.existsSync(zipPath), "install zip exists");
  if (fs.existsSync(zipPath)) {
    const py = spawnSync("python3", ["-c", "import zipfile,sys\nz=zipfile.ZipFile(sys.argv[1])\nprint('\\n'.join(z.namelist()))", zipPath], { encoding: "utf8" });
    check(py.status === 0, "zip can be listed");
    const names = py.stdout.split("\n").map((s) => s.trim()).filter(Boolean);
    const expected = [
      "galaxy-graph/main.js",
      "galaxy-graph/manifest.json",
      "galaxy-graph/styles.css",
      "galaxy-graph/three.min.js",
      "galaxy-graph/LICENSE",
      "galaxy-graph/LICENSE-THREE",
      "galaxy-graph/NOTICE",
      "galaxy-graph/README.md"
    ];
    check(expected.every((n) => names.includes(n)) && names.length === expected.length, "zip entries: " + names.join(", "));
    const extracted = spawnSync("python3", ["-c", `
import hashlib, zipfile, sys
z = zipfile.ZipFile(sys.argv[1])
for name in z.namelist():
    print(hashlib.sha256(z.read(name)).hexdigest(), name)
`, zipPath], { encoding: "utf8" });
    check(extracted.status === 0, "zip hashes");
    const zipHashes = Object.fromEntries(extracted.stdout.trim().split("\n").filter(Boolean).map((line) => {
      const [hash, name] = line.split(" ");
      return [name, hash];
    }));
    for (const name of ["main.js", "manifest.json", "styles.css", "three.min.js", "LICENSE", "LICENSE-THREE", "NOTICE", "README.md"]) {
      check(zipHashes["galaxy-graph/" + name] === sha256(path.join(root, name)), "zip matches " + name);
    }
  }

  const checksumPath = path.join(root, "CHECKSUMS.txt");
  if (fs.existsSync(checksumPath)) {
    const lines = readText("CHECKSUMS.txt").split("\n").map((l) => l.trim()).filter(Boolean);
    for (const line of lines) {
      const match = line.match(/^([a-f0-9]{64})\s+(.+)$/);
      check(Boolean(match), "checksum line " + line);
      if (!match) continue;
      const file = path.join(root, match[2]);
      check(fs.existsSync(file) && sha256(file) === match[1], "CHECKSUMS " + match[2]);
    }
  } else {
    check(false, "CHECKSUMS.txt present");
  }

  console.log("--- release sha256 ---");
  for (const rel of ["main.js", "manifest.json", "styles.css", "three.min.js", "LICENSE", "LICENSE-THREE", "NOTICE", "README.md", "docs/demo.mp4", ZIP_NAME]) {
    console.log(sha256(path.join(root, rel)) + "  " + rel);
  }
  console.log("failures " + failures.length);
  if (failures.length) process.exit(1);
}).catch((err) => {
  console.error(err && err.stack ? err.stack : err);
  process.exit(1);
});
