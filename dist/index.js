// src/type/event.d.ts
var Event = /* @__PURE__ */ ((Event2) => {
  Event2["CALC"] = "antetype.illustrator.calc";
  return Event2;
})(Event || {});

// node_modules/@boardmeister/antetype-workspace/dist/index.js
var d = ((t) => (t.CALC = "antetype.workspace.calc", t))(d || {});
var p = ((a) => (a.WEBP = "image/webp", a.PNG = "image/png", a.JPG = "image/jpeg", a))(p || {});
var c = ((e) => (e.CALC = "antetype.cursor.calc", e.POSITION = "antetype.cursor.position", e.DOWN = "antetype.cursor.on.down", e.UP = "antetype.cursor.on.up", e.MOVE = "antetype.cursor.on.move", e.SLIP = "antetype.cursor.on.slip", e.RESIZED = "antetype.cursor.on.resized", e))(c || {});
var y = { INIT: "antetype.init", CLOSE: "antetype.close", DRAW: "antetype.draw", CALC: "antetype.calc", RECALC_FINISHED: "antetype.recalc.finished", MODULES: "antetype.modules", SETTINGS: "antetype.settings.definition", TYPE_DEFINITION: "antetype.layer.type.definition", FONTS_LOADED: "antetype.font.loaded" };
var E = "core";
var S = "0.0.5";
var L = class {
  #e;
  #t = null;
  #r = null;
  static inject = { marshal: "boardmeister/marshal", herald: "boardmeister/herald" };
  inject(e) {
    this.#e = e;
  }
  async loadModules(e, t) {
    return (await this.#i()).loadModules(e, t);
  }
  register(e) {
    let { registration: t } = e.detail;
    t[E] = { load: async () => (this.#t ??= (await this.#a("core.js")).default, (r, a) => this.#t({ canvas: a, modules: r, herald: this.#e.herald })), version: S };
  }
  static subscriptions = { [y.MODULES]: "register" };
  #a(e) {
    return import(this.#e.marshal.getResourceUrl(this, e));
  }
  async #i() {
    return this.#r ??= (await this.#a("helper.js")).default, new this.#r(this.#e.herald);
  }
};
var x = ((e) => (e.SAVE = "antetype.memento.save", e))(x || {});
var m = { INIT: "antetype.init", CLOSE: "antetype.close", DRAW: "antetype.draw", CALC: "antetype.calc", RECALC_FINISHED: "antetype.recalc.finished", MODULES: "antetype.modules", SETTINGS: "antetype.settings.definition", TYPE_DEFINITION: "antetype.layer.type.definition", FONTS_LOADED: "antetype.font.loaded" };
var C = "core";
var I = "0.0.5";
var R = class {
  #e;
  #t = null;
  #r = null;
  static inject = { marshal: "boardmeister/marshal", herald: "boardmeister/herald" };
  inject(e) {
    this.#e = e;
  }
  async loadModules(e, t) {
    return (await this.#i()).loadModules(e, t);
  }
  register(e) {
    let { registration: t } = e.detail;
    t[C] = { load: async () => (this.#t ??= (await this.#a("core.js")).default, (r, a) => this.#t({ canvas: a, modules: r, herald: this.#e.herald })), version: I };
  }
  static subscriptions = { [m.MODULES]: "register" };
  #a(e) {
    return import(this.#e.marshal.getResourceUrl(this, e));
  }
  async #i() {
    return this.#r ??= (await this.#a("helper.js")).default, new this.#r(this.#e.herald);
  }
};
var T = "memento";
var D = "0.0.4";
var A = class {
  #e;
  #t = null;
  static inject = { marshal: "boardmeister/marshal", herald: "boardmeister/herald" };
  inject(e) {
    this.#e = e;
  }
  register(e) {
    let { registration: t } = e.detail;
    t[T] = { load: async () => {
      if (!this.#t) {
        let r = this.#e.marshal.getResourceUrl(this, "module.js");
        this.#t = (await import(r)).default;
      }
      return (r, a) => this.#t({ canvas: a, modules: r, herald: this.#e.herald });
    }, version: D };
  }
  static subscriptions = { [m.MODULES]: "register" };
};
var z = "cursor";
var O = "0.0.5";
var j = class {
  #e;
  #t = null;
  static inject = { marshal: "boardmeister/marshal", herald: "boardmeister/herald" };
  inject(e) {
    this.#e = e;
  }
  register(e) {
    let { registration: t } = e.detail;
    t[z] = { load: async () => {
      if (!this.#t) {
        let r = this.#e.marshal.getResourceUrl(this, "module.js");
        this.#t = (await import(r)).default;
      }
      return (r, a) => this.#t({ canvas: a, modules: r, herald: this.#e.herald });
    }, version: O };
  }
  static subscriptions = { [y.MODULES]: "register" };
};
var l = { INIT: "antetype.init", CLOSE: "antetype.close", DRAW: "antetype.draw", CALC: "antetype.calc", RECALC_FINISHED: "antetype.recalc.finished", MODULES: "antetype.modules", SETTINGS: "antetype.settings.definition", TYPE_DEFINITION: "antetype.layer.type.definition", FONTS_LOADED: "antetype.font.loaded" };
var k = "core";
var N = "0.0.5";
var K = class {
  #e;
  #t = null;
  #r = null;
  static inject = { marshal: "boardmeister/marshal", herald: "boardmeister/herald" };
  inject(e) {
    this.#e = e;
  }
  async loadModules(e, t) {
    return (await this.#i()).loadModules(e, t);
  }
  register(e) {
    let { registration: t } = e.detail;
    t[k] = { load: async () => (this.#t ??= (await this.#a("core.js")).default, (r, a) => this.#t({ canvas: a, modules: r, herald: this.#e.herald })), version: N };
  }
  static subscriptions = { [l.MODULES]: "register" };
  #a(e) {
    return import(this.#e.marshal.getResourceUrl(this, e));
  }
  async #i() {
    return this.#r ??= (await this.#a("helper.js")).default, new this.#r(this.#e.herald);
  }
};
var h = class {
  #canvas;
  #modules;
  #herald;
  #ctx;
  #translationSet = 0;
  #drawWorkspace = true;
  #isExporting = false;
  #quality = 1;
  #scale = 1;
  #translate = { left: 0, top: 0 };
  constructor(e, t, r) {
    if (!e) throw new Error("[Antetype Workspace] Provided canvas is empty");
    this.#canvas = e, this.#updateCanvas(), this.#modules = t, this.#ctx = this.#canvas.getContext("2d"), this.#observeCanvasResize(), this.#herald = r, this.subscribe();
  }
  subscribe() {
    let e = this.#herald.batch([{ event: l.CLOSE, subscription: () => {
      e();
    } }, { event: "antetype.workspace.calc", subscription: this.calcEventHandle.bind(this) }, { event: l.DRAW, subscription: [{ method: (t) => {
      let { element: r } = t.detail, i = { clear: this.clearCanvas.bind(this), workspace: this.drawWorkspace.bind(this) }[r.type];
      typeof i == "function" && i(r);
    }, priority: 1 }, { method: () => {
      this.setOrigin();
    }, priority: -255 }, { method: () => {
      this.restore();
    }, priority: 255 }] }, { event: c.POSITION, subscription: (t) => {
      t.detail.x -= this.getLeft(), t.detail.y -= this.getTop();
    } }, { event: c.CALC, subscription: this.calcEventHandle.bind(this) }, { event: l.SETTINGS, subscription: (t) => {
      t.detail.settings.push(this.getSettingsDefinition());
    } }, { event: "antetype.conditions.method.register", subscription: (t) => {
      this.handleConditionsMethodRegisterMethod(t);
    } }]);
  }
  calcEventHandle(e) {
    let t = e.detail.values, r = Object.keys(t);
    for (let a of r) t[a] = this.calc(t[a]);
  }
  #observeCanvasResize() {
    new ResizeObserver(() => {
      !this.#updateCanvas() || !this.#modules.core || this.#modules.core.view.recalculate().then(() => {
        this.#modules.core.view.redraw();
      });
    }).observe(this.#canvas);
  }
  #updateCanvas() {
    let e = this.#canvas.offsetWidth * this.#quality, t = this.#canvas.offsetHeight * this.#quality, r = Number(this.#canvas.getAttribute("width")), a = Number(this.#canvas.getAttribute("height"));
    return !t || !e || r === e && a === t ? false : (this.#canvas.setAttribute("height", String(t)), this.#canvas.setAttribute("width", String(e)), true);
  }
  setTranslateLeft(e) {
    this.#translate.left = e;
  }
  setTranslateTop(e) {
    this.#translate.top = e;
  }
  getTranslate() {
    return this.#translate;
  }
  setQuality(e) {
    if (isNaN(e)) throw new Error("Workspace quality must be a number");
    this.#quality = Number(e), this.#updateCanvas();
  }
  getQuality() {
    return this.#quality;
  }
  getScale() {
    return this.#scale;
  }
  setScale(e) {
    if (isNaN(e)) throw new Error("Workspace scale must be a number");
    this.#scale = e;
  }
  scale(e) {
    return e * this.#scale * this.#quality;
  }
  typeToExt(e) {
    return e == "image/png".toString() ? "png" : e == "image/jpeg".toString() ? "jpg" : "webp";
  }
  async download(e) {
    let t = document.createElement("a");
    t.download = e.filename + "." + this.typeToExt(e.type);
    let r = URL.createObjectURL(await this.export(e));
    t.href = r, t.click(), URL.revokeObjectURL(r);
  }
  #updateQualityBasedOnDpi(e) {
    let a = e * 11.692913385826772, i = this.getSize().height / this.#quality;
    this.setQuality(a / i);
  }
  async export({ type: e = "image/webp", quality: t = 0.9, dpi: r = 300 } = {}) {
    let a = this.#modules.core.view, i = this.#drawWorkspace;
    try {
      this.#drawWorkspace = false, this.setExporting(true), this.#updateQualityBasedOnDpi(r), this.#updateCanvas(), await a.recalculate(), a.redraw();
      let n = await this.#canvasToBlob(e, t);
      if (!n) throw new Error("Couldn't export canvas workspace");
      return n;
    } finally {
      this.#drawWorkspace = i, this.setExporting(false), this.setQuality(1), this.#updateCanvas(), await a.recalculate(), a.redraw();
    }
  }
  #canvasToBlob(e = "image/webp", t = 0.9) {
    let { width: r, height: a } = this.getSize(), i = this.getTop(), n = this.getLeft(), s = this.#ctx.getImageData(n, i, r, a), o = document.createElement("canvas");
    return o.width = r, o.height = a, o.getContext("2d").putImageData(s, 0, 0), new Promise((u2) => {
      let w = setTimeout(() => {
        u2(null);
      }, 3e4);
      o.toBlob((b) => {
        clearTimeout(w), u2(b);
      }, e, t);
    });
  }
  clearCanvas() {
    this.#ctx.clearRect(-this.getLeft(), -this.getTop(), this.#canvas.width, this.#canvas.height);
  }
  setExporting(e) {
    this.#isExporting = e;
  }
  isExporting() {
    return this.#isExporting;
  }
  drawWorkspace() {
    if (this.#isExporting) return;
    let e = this.#ctx;
    e.save();
    let { height: t, width: r } = this.getSize();
    e.fillStyle = "#FFF", e.fillRect(0, 0, r, t), e.restore();
  }
  getLeft() {
    let e = this.#ctx, { width: t } = this.getSize();
    return (Number(e.canvas.getAttribute("width")) - t) / 2 + this.getTranslate().left;
  }
  getTop() {
    let e = this.#ctx, { height: t } = this.getSize();
    return (Number(e.canvas.getAttribute("height")) - t) / 2 + this.getTranslate().top;
  }
  setOrigin() {
    if (this.#translationSet++, this.#translationSet > 1) return;
    let e = this.#ctx;
    e.save(), e.translate(this.getLeft(), this.getTop());
  }
  restore() {
    this.#translationSet--, this.#translationSet == 0 && this.#ctx.restore();
  }
  toRelative(e, t = "x", r = 3) {
    let { height: a, width: i } = this.#getSizeRelative();
    e = Math.round((e + Number.EPSILON) * 10 ** r) / 10 ** r;
    let n = e / a * 100, s = "h%";
    return t === "x" && (n = e / i * 100, s = "w%"), String(Math.round((n + Number.EPSILON) * 10 ** r) / 10 ** r) + s;
  }
  calc(operation, quiet = false) {
    if (typeof operation == "number") return this.scale(operation);
    if (typeof operation != "string" || operation.match(/[^-()\d/*+.pxw%hv ]/g)) return console.warn("Calculation contains invalid characters!", operation), NaN;
    let convertUnitToNumber = (e, t = 2) => Number(e.slice(0, e.length - t)), { height: aHeight, width: aWidth } = this.getSize(), { height, width } = this.#getSizeRelative(), unitsTranslator = { px: (e) => convertUnitToNumber(e), "w%": (e) => convertUnitToNumber(e) / 100 * width, "h%": (e) => convertUnitToNumber(e) / 100 * height, vh: (e) => convertUnitToNumber(e) / 100 * aHeight, vw: (e) => convertUnitToNumber(e) / 100 * aWidth, default: (e) => e }, calculation = "";
    operation.split(" ").forEach((e) => {
      e = e.trim();
      let t = e[e.length - 1], r = e[e.length - 2], a = (unitsTranslator[r + t] || unitsTranslator.default)(e);
      typeof a == "number" && (a = this.#decimal(a)), calculation += String(a);
    });
    let result;
    try {
      result = eval(calculation);
    } catch (e) {
      result = void 0, quiet || console.warn("Invalid calculation! Tried to calculate from", calculation);
    }
    return result == null ? NaN : this.#decimal(result);
  }
  #decimal(e, t = 2) {
    return +e.toFixed(t);
  }
  #getSystem() {
    return this.#modules.core;
  }
  #getSettings() {
    let e = this.#ctx.canvas.offsetHeight, t = this.#getSystem().setting.get("workspace") ?? {};
    if (isNaN(Number(t.height)) && (t.height = e), isNaN(Number(t.width))) {
      let r = 0.707070707;
      t.width = Math.round(e * r);
    }
    return t;
  }
  getSize() {
    let { width: e, height: t } = this.#getSettings(), r = e / t, a = this.#ctx.canvas.offsetHeight, i = a * r;
    return i > this.#ctx.canvas.offsetWidth && (i = this.#ctx.canvas.offsetWidth, a = i / r), { width: this.scale(i), height: this.scale(a) };
  }
  #getSizeRelative() {
    let e = this.#getSettings(), { width: t, height: r } = this.getSize(), a = e.relative?.width ?? t, i = e.relative?.height ?? r, n = a / i, s = { width: e.relative?.width ?? 0, height: e.relative?.height ?? 0 }, o = this.#ctx.canvas.offsetHeight;
    return s.width || (s.width = this.scale(o * n)), s.height || (s.height = this.scale(o)), s.width > this.scale(this.#ctx.canvas.offsetWidth) && (s.width = this.scale(this.#ctx.canvas.offsetWidth), s.height = this.scale(this.#ctx.canvas.offsetWidth / n)), { width: s.width, height: s.height };
  }
  handleConditionsMethodRegisterMethod(e) {
    let { methods: t } = e.detail;
    t.hideOnExport = { name: "Hide on export", type: "hide-export", resolve: ({ event: r }) => {
      this.isExporting() && (r.detail.element = null);
    } };
  }
  getSettingsDefinition() {
    let e = this.#getSettings();
    return { details: { label: "Workspace" }, name: "workspace", tabs: [{ label: "General", fields: [[{ label: "Dimensions", type: "container", fields: [[{ label: "Height", type: "number", name: "height", value: e.height }, { label: "Width", type: "number", name: "width", value: e.width }]] }]] }] };
  }
};
var f = "workspace";
var v = "0.0.4";
var g = class {
  #e = null;
  #t;
  static inject = { marshal: "boardmeister/marshal", herald: "boardmeister/herald" };
  inject(t) {
    this.#t = t;
  }
  register(t) {
    let { registration: r } = t.detail;
    r[f] = { load: async () => {
      if (!this.#e) {
        let a = this.#t.marshal.getResourceUrl(this, "module.js");
        this.#e = (await import(a)).default;
      }
      return (a, i) => new this.#e(i, a, this.#t.herald);
    }, version: v };
  }
  static subscriptions = { [l.MODULES]: "register" };
};

// src/shared.ts
async function calcFill(illustrator, fill) {
  if (fill.type === "linear") {
    const style = fill.style;
    style.pos = await illustrator.calc({
      layerType: "polygon-fill-linear",
      purpose: "position",
      values: style.pos
    });
    style.size = await illustrator.calc({
      layerType: "polygon-fill-linear",
      purpose: "size",
      values: style.size
    });
  }
  return fill;
}
function generateFill(type, style) {
  const filTypes = {
    "default": (style2) => {
      return style2;
    },
    linear: (style2) => {
      return generateLinearGradient(
        style2.colors,
        style2.pos.x,
        style2.pos.y,
        style2.size.w,
        style2.size.h
      );
    }
  };
  return (filTypes[type] || filTypes["default"])(style);
}
var generateLinearGradient = (colors, x3, y2, width2, height2) => {
  const canvas = document.createElement("canvas"), ctx = canvas.getContext("2d");
  const grd = ctx.createLinearGradient(x3, y2, width2, height2);
  colors.forEach((color) => {
    grd.addColorStop(color.offset, color.color);
  });
  return grd;
};

// src/action/polygon.ts
var Actions = {
  line: (ctx, x3, y2) => {
    ctx.lineTo(x3, y2);
  },
  curve: (ctx, cp1x, cp1y, cp2x, cp2y, curveX, curveY) => {
    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, curveX, curveY);
  },
  stroke: (ctx, thickness = 5, fill = "#000", lineJoin = "round", miterLimit = 2) => {
    ctx.save();
    ctx.strokeStyle = fill;
    ctx.lineWidth = thickness;
    ctx.lineJoin = lineJoin;
    ctx.miterLimit = miterLimit;
    ctx.stroke();
    ctx.restore();
  },
  begin: (ctx, x3, y2) => {
    ctx.beginPath();
    ctx.moveTo(x3, y2);
  },
  move: (ctx, x3, y2) => {
    ctx.moveTo(x3, y2);
  },
  fill: (ctx, fill) => {
    if (!fill.type) {
      fill.type = "default";
    }
    const tmp = ctx.fillStyle;
    ctx.fillStyle = generateFill(fill.type, fill.style);
    ctx.fill();
    ctx.fillStyle = tmp;
  },
  close: (ctx) => {
    ctx.closePath();
  },
  default: (ctx, x3, y2) => Actions.line(ctx, x3, y2)
};
function ResolvePolygonAction(ctx, action, x3, y2) {
  const objSwitch = {
    fill: (action2) => {
      Actions.fill(ctx, action2.args);
    },
    line: (action2) => {
      Actions.line(ctx, action2.args.x + x3, action2.args.y + y2);
    },
    curve: (action2) => {
      Actions.curve(
        ctx,
        action2.args.cp1x + x3,
        action2.args.cp1y + y2,
        action2.args.cp2x + x3,
        action2.args.cp2y + y2,
        action2.args.x + x3,
        action2.args.y + y2
      );
    },
    stroke: (action2) => {
      Actions.stroke(
        ctx,
        action2.args.thickness ?? 5,
        action2.args.fill ?? "#000",
        action2.args.lineJoin ?? "round",
        action2.args.miterLimit ?? 2
      );
    },
    begin: (action2) => {
      Actions.begin(ctx, action2.args.x + x3, action2.args.y + y2);
    },
    move: (action2) => {
      Actions.move(ctx, action2.args.x + x3, action2.args.y + y2);
    },
    close: () => Actions.close(ctx)
  };
  if (!objSwitch[action.means]) {
    return;
  }
  objSwitch[action.means](action);
}

// src/action/image.ts
var IMAGE_ERROR_STATUS = Symbol("error");
var IMAGE_TIMEOUT_STATUS = Symbol("timeout");
var IMAGE_LOADING_STATUS = Symbol("loading");
var CalculatedImage = class {
  image;
  coords;
  constructor(image2, coords) {
    this.image = image2;
    this.coords = coords;
  }
};
var ResolveImageAction = (ctx, def) => {
  const image2 = def.image.calculated;
  if (!image2 || imageTimeoutReached(image2) || imageIsBeingLoaded(image2) || !(image2 instanceof CalculatedImage)) {
    return;
  }
  const { start: { x: x3, y: y2 } } = def.area;
  ctx.drawImage(image2.image, x3 + image2.coords.xDiff, y2 + image2.coords.yDiff, image2.coords.width, image2.coords.height);
};
var imageTimeoutReached = (image2) => {
  return image2 === IMAGE_TIMEOUT_STATUS;
};
var imageIsBeingLoaded = (image2) => {
  return image2 === IMAGE_LOADING_STATUS;
};

// src/action/text.ts
var getFontSizeForCalc = (def) => String(def.text.font?.size ?? 10);
var getFontSize = (def) => Number(def.text.font?.size || 10);
var getSpaceChart = () => String.fromCharCode(8202);
var ResolveTextAction = (ctx, def) => {
  let { x: x3 } = def.start, lines = [];
  const { start: { y: y2 }, size: { w, h: h2 }, text: text2 } = def, { columns, lineHeight, direction, overflow } = text2, value = [...text2.lines], { textBaseline = "top" } = def.text, { gap = 0, amount = 1 } = columns ?? {}, fullW = w - gap * (amount - 1);
  let transY = text2.transY ?? 0;
  let linesAmount = Math.floor(h2 / lineHeight) || 1;
  if (columns?.tactic == "evenly") {
    linesAmount = Math.ceil(value.length / amount);
  }
  ctx.save();
  if (direction == "right") {
    ctx.direction = "rtl";
    x3 += fullW / amount;
  } else {
    ctx.direction = "ltr";
  }
  ctx.font = prepareFontShorthand(def, ctx, String(getFontSize(def)));
  ctx.textBaseline = textBaseline;
  const getStartFrom = (lines2, linesAmount2) => direction == "right" && lines2.length >= linesAmount2 ? lines2.length - linesAmount2 : 0;
  const startingX = x3;
  while ((lines = value.splice(getStartFrom(value, linesAmount), linesAmount)).length) {
    lines.forEach((text3, i) => {
      const nextLine = lines[i + 1] || value[getStartFrom(value, linesAmount)] || [""];
      const isLast = i + 1 == lines.length || nextLine[0] == "" || text3[0][text3[0].length - 1] == "\n";
      const verticalMove = transY + i * lineHeight;
      fillText(ctx, text3[0], def, x3, y2, fullW / amount, verticalMove, isLast);
    });
    x3 += fullW / amount + gap;
    if (x3 + (startingX < 0 ? Math.abs(startingX) : 0) >= w && (!overflow || overflow == "vertical")) {
      x3 = startingX;
      transY += lines.length * lineHeight + gap;
    }
  }
  ctx.restore();
};
var fillText = (ctx, text2, def, x3, y2, width2, transY, isLast) => {
  const { color = "#000", outline = null } = def.text;
  const horizontal = def.text.align?.horizontal || "left";
  let realWidth;
  ({ text: text2, x: x3, realWidth } = alignHorizontally(def, ctx, horizontal, text2, width2, isLast, x3));
  if (transY > 0) {
    y2 = y2 + transY;
  }
  ctx.fillStyle = typeof color == "object" ? generateFill(color.type, color.style) : color;
  if (outline) {
    outlineText(ctx, outline, text2, x3, y2, width2);
  }
  ctx.fillText(text2, x3, y2, width2);
  return realWidth;
};
var outlineText = (ctx, outline, text2, x3, y2, width2) => {
  if (!outline.fill?.style) {
    return;
  }
  ctx.strokeStyle = generateFill(outline.fill.type, outline.fill.style);
  ctx.lineWidth = outline.thickness;
  ctx.lineJoin = outline.lineJoin ?? "round";
  ctx.miterLimit = outline.miterLimit ?? 2;
  ctx.strokeText(text2, x3, y2, width2);
};
var alignHorizontally = (def, ctx, horizontal, text2, width2, isLast, x3) => {
  const metrics = ctx.measureText(text2);
  const realWidth = metrics.width;
  const isRight = def.text.direction === "right";
  ctx.textAlign = "left";
  if (horizontal == "center") {
    ctx.textAlign = "center";
    x3 += width2 / 2 * (isRight ? -1 : 1);
  } else if (horizontal == "right") {
    ctx.textAlign = "right";
    x3 += width2 * (isRight ? 0 : 1);
  } else if (horizontal == "justify" && !isLast) {
    text2 = justifyText(text2, metrics, width2, ctx);
  } else if (isRight && realWidth < width2) {
    x3 -= width2 - realWidth;
  }
  return { text: text2, x: x3, realWidth };
};
var justifyText = (text2, metrics, width2, ctx) => {
  if (metrics.width >= width2) {
    return text2;
  }
  const words = text2.split(" "), spacingMeasure = ctx.measureText(getSpaceChart()), spacings = Math.floor((width2 - metrics.width) / spacingMeasure.width), amount = spacings / (words.length - 1);
  for (let j2 = 0; j2 < words.length - 1; j2++) {
    words[j2] += getSpaceChart().repeat(amount);
  }
  return words.join(" ");
};
var prepareFontShorthand = (def, ctx, fontSize) => {
  const { font = null } = def.text;
  if (!font) {
    return ctx.font;
  }
  fontSize = fontSize + "px ";
  const fontFamily = (font.family || "serif") + " ";
  const fontWeight = (font.weight ?? 100) + " ";
  let fontSh = "";
  if (font.style) {
    fontSh += font.style + " ";
  }
  if (font.variant) {
    fontSh += font.variant + " ";
  }
  fontSh += fontWeight;
  if (font.stretch) {
    fontSh += font.stretch + " ";
  }
  fontSh += fontSize;
  if (font.height) {
    fontSh += "/" + font.height + " ";
  }
  return fontSh + fontFamily;
};

// src/action/group.ts
var ResolveGroupAction = (ctx, modules, def) => {
  const { group: group2, start } = def;
  if (def.layout.length === 0) {
    return;
  }
  ctx.save();
  ctx.translate(start.x, start.y);
  if (group2.interaction === "fixed") {
    modules.core.view.redraw(def.layout);
  } else {
    drawLayersRelatively(ctx, modules, def);
  }
  ctx.restore();
};
var getRowsHeight = (def, rows) => {
  let height2 = 0;
  const horizontal = def.group.gap.horizontal;
  rows.forEach((row) => {
    height2 += row.height + horizontal;
  });
  return height2 - horizontal;
};
var getRowsWidth = (def, rows) => {
  let width2 = 0;
  const vertical = def.group.gap.vertical;
  rows.forEach((row) => {
    if (def.group.direction === "column") {
      width2 = Math.max(width2, row.width);
    } else {
      width2 += row.width + vertical;
    }
  });
  if (def.group.direction === "row") {
    width2 -= vertical;
  }
  return width2;
};
var drawLayersRelatively = (ctx, modules, def) => {
  const { group: group2 } = def;
  const { vertical, horizontal } = group2.gap;
  const rows = separateIntoRows(def, def.layout);
  if (group2.clip && (!isNaN(def.size?.w) || !isNaN(def.size?.h))) {
    ctx.beginPath();
    ctx.rect(
      0,
      0,
      isNaN(def.size.w) ? getRowsWidth(def, rows) : def.size.w,
      isNaN(def.size.h) ? getRowsHeight(def, rows) : def.size.h
    );
    ctx.clip();
  }
  let currentHeight = 0;
  let xShift = 0;
  rows.forEach((row) => {
    row.layers.forEach((layer) => {
      layer.def.start.x = xShift;
      layer.def.start.y = currentHeight;
      if (layer.def.area) {
        layer.def.area.start.x = xShift;
        layer.def.area.start.y = currentHeight;
      }
      modules.core.view.draw(layer.def);
      xShift += layer.def.size.w + vertical;
    });
    xShift = 0;
    currentHeight += row.height + horizontal;
  });
};
var separateIntoRows = (def, layout) => {
  const { size } = def;
  const rows = [];
  const generateRow = () => ({ height: 0, width: 0, layers: [] });
  let row = generateRow();
  layout.forEach((layer, i) => {
    if (def.group.wrap && size.w != 0 && row.width + layer.size.w > size.w || i != 0 && def.group.direction === "column") {
      rows.push(row);
      row = generateRow();
    }
    row.layers.push({ x: row.width, def: layer });
    if (row.height < layer.size.h) row.height = layer.size.h;
    row.width += layer.size.w + def.group.gap.vertical;
  });
  rows.push(row);
  return rows;
};

// src/action/polygon.calc.ts
var ResolvePolygonSize = (def) => {
  const size = def.polygon.size;
  return {
    start: {
      x: def.start.x + size.negative.x,
      y: def.start.y + size.negative.y
    },
    size: {
      w: size.positive.x - size.negative.x,
      h: size.positive.y - size.negative.y
    }
  };
};
var ResolveCalcPolygon = async (def, action, modules) => {
  const illustrator = modules.illustrator;
  const objSwitch = {
    close: () => {
    },
    fill: async (action2) => {
      await calcFill(illustrator, action2.args);
    },
    line: async (action2) => {
      action2.args = await illustrator.calc({
        layerType: "polygon-line",
        purpose: "position",
        values: action2.args
      });
      updateSizeVectors(def, action2.args.x, "x");
      updateSizeVectors(def, action2.args.y, "y");
    },
    curve: async (action2) => {
      action2.args = await illustrator.calc({
        layerType: "polygon-curve",
        purpose: "position",
        values: action2.args
      });
      updateSizeVectors(def, action2.args.x, "x");
      updateSizeVectors(def, action2.args.cp1x, "x");
      updateSizeVectors(def, action2.args.cp2x, "x");
      updateSizeVectors(def, action2.args.y, "y");
      updateSizeVectors(def, action2.args.cp2y, "y");
    },
    stroke: async (action2) => {
      action2.args.thickness = (await illustrator.calc({
        layerType: "polygon-stroke",
        purpose: "thickness",
        values: { thickness: action2.args.thickness ?? 5 }
      })).thickness;
    },
    begin: async (action2) => {
      action2.args = await illustrator.calc({
        layerType: "polygon-begin",
        purpose: "position",
        values: action2.args
      });
      updateSizeVectors(def, action2.args.x, "x");
      updateSizeVectors(def, action2.args.y, "y");
    },
    move: async (action2) => {
      action2.args = await illustrator.calc({
        layerType: "polygon-move",
        purpose: "position",
        values: action2.args
      });
    }
  };
  if (!action.means) {
    action.means = "line";
  }
  if (!objSwitch[action.means]) {
    return;
  }
  await objSwitch[action.means](action);
};
var updateSizeVectors = (def, value, dir) => {
  if (value < 0) {
    const n = def.polygon.size.negative;
    n[dir] = Math.min(n[dir], value);
  } else {
    const p2 = def.polygon.size.positive;
    p2[dir] = Math.max(p2[dir], value);
  }
};

// src/action/image.calc.ts
var loadedImages = {};
var cachedBySettings = {};
var ResolveImageSize = (def) => ({
  start: {
    x: def.start.x,
    y: def.start.y
  },
  size: {
    h: def.size.h,
    w: def.size.w
  }
});
var ResolveImageCalc = async (modules, def) => {
  const illustrator = modules.illustrator;
  def.size = await illustrator.calc({
    layerType: "image",
    purpose: "size",
    values: def.size
  });
  def.start = await illustrator.calc({
    layerType: "image",
    purpose: "position",
    values: def.start
  });
  def.area = ResolveImageSize(def);
  if (def.image?.outline?.thickness) {
    def.image.outline.thickness = (await illustrator.calc({
      layerType: "image",
      purpose: "thickness",
      values: {
        thickness: def.image.outline.thickness
      }
    })).thickness;
  }
  const cacheKey = getImageCacheKey(def.image), cached = cachedBySettings[cacheKey];
  if (cached) {
    def.image.calculated = calculateFromCache(def, cached);
    return;
  }
  if (def.image.src instanceof Image) {
    def.image.calculated = await calculateImage(def, def.image.src, modules, cacheKey);
    return;
  }
  if (typeof def.image.src != "string") {
    return;
  }
  const source = def.image.src;
  if (typeof source != "string" || !source.startsWith("blob:http") && !source.startsWith("http") && !source.startsWith("/")) {
    console.warn("Image `" + source + "` has invalid source");
    return;
  }
  const waitforLoad = modules.core.setting.get("illustrator.image.waitForLoad");
  const promise = loadImage(def, source, modules);
  if (waitforLoad) {
    await promise;
  } else {
  }
};
var calculateFromCache = (def, cached) => {
  const image2 = def.image, { w, h: h2 } = def.size;
  const { width: asWidth, height: asHeight } = calculateAspectRatioFit(
    image2.fit ?? "default",
    cached.width,
    cached.height,
    w,
    h2
  ), xDiff = getImageHorizontalDiff(image2.align?.horizontal ?? "center", w, asWidth), yDiff = getImageVerticalDiff(image2.align?.vertical ?? "center", h2, asHeight);
  return new CalculatedImage(
    cached.image,
    {
      xDiff,
      yDiff,
      width: asWidth,
      height: asHeight
    }
  );
};
var calculateImage = async (def, source, _modules, cacheKey = null) => {
  const image2 = def.image, { w, h: h2 } = def.size, sWidth = source.width || 200, sHeight = source.height || 200;
  const { width: asWidth, height: asHeight } = calculateAspectRatioFit(
    image2.fit ?? "default",
    sWidth,
    sHeight,
    w,
    h2
  ), xDiff = getImageHorizontalDiff(image2.align?.horizontal ?? "center", w, asWidth), yDiff = getImageVerticalDiff(image2.align?.vertical ?? "center", h2, asHeight);
  if (image2.fit === "crop") {
    source = await cropImage(source, def);
  }
  if (image2.overcolor) {
    source = await overcolorImage(source, def, asWidth, asHeight);
  }
  if (image2.outline) {
    source = await outlineImage(source, def, asWidth, asHeight);
  }
  cachedBySettings[cacheKey ?? getImageCacheKey(def.image)] = {
    image: source,
    width: sWidth,
    height: sHeight
  };
  return new CalculatedImage(
    source,
    {
      xDiff,
      yDiff,
      width: asWidth,
      height: asHeight
    }
  );
};
var getImageCacheKey = (image2) => JSON.stringify({ ...image2, timeout: void 0, calculated: void 0 });
var loadImage = async (def, src, modules) => {
  const image2 = new Image(), { image: { timeout = 3e4 } } = def, view = modules.core.view;
  image2.crossOrigin = "anonymous";
  image2.src = src;
  const promise = new Promise((resolve, reject) => {
    const timeoutTimer = setTimeout(() => {
      def.image.calculated = IMAGE_TIMEOUT_STATUS;
      reject(new Error("Image loading reached a timeout: " + src));
    }, timeout);
    image2.onerror = (e) => {
      clearTimeout(timeoutTimer);
      def.image.calculated = IMAGE_ERROR_STATUS;
      reject(e);
    };
    image2.onload = async () => {
      clearTimeout(timeoutTimer);
      def.image.calculated = await calculateImage(def, image2, modules);
      view.redrawDebounce();
      resolve();
    };
  });
  loadedImages[src] = IMAGE_LOADING_STATUS;
  await promise;
};
var overcolorImage = async (image2, def, asWidth, asHeight) => {
  const canvas = document.createElement("canvas"), ctx = canvas.getContext("2d"), overcolor = def.image.overcolor;
  canvas.setAttribute("width", String(asWidth));
  canvas.setAttribute("height", String(asHeight));
  ctx.drawImage(image2, 0, 0, asWidth, asHeight);
  ctx.globalCompositeOperation = "source-in";
  ctx.fillStyle = generateFill(overcolor.fill.type, overcolor.fill.style);
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.globalCompositeOperation = "source-over";
  const imageOvercolored = await canvasToWebp(canvas, image2);
  ctx.drawImage(imageOvercolored, 0, 0, asWidth, asHeight);
  return canvasToWebp(canvas, imageOvercolored);
};
var outlineImage = async (image2, def, asWidth, asHeight) => {
  const canvas = document.createElement("canvas"), ctx = canvas.getContext("2d"), outline = def.image.outline;
  if (!outline.thickness || !outline.fill) {
    return image2;
  }
  const thickness = outline.thickness;
  let dArr = [
    [-0.75, -0.75],
    // ↖️
    [0, -1],
    // ⬆️
    [0.75, -0.75],
    // ↗️
    [1, 0],
    // ➡️
    [0.75, 0.75],
    // ↘️
    [0, 1],
    // ⬇️
    [-0.75, 0.75],
    // ↙️
    [-1, 0]
    // ⬅️
  ];
  if (thickness > 5) {
    const granularity = Math.floor(thickness / 2.5);
    let newDArr = [];
    for (let i = 0; i < dArr.length; i++) {
      newDArr.push(dArr[i]);
      const [cX, cY] = dArr[i], [dX, dY] = i + 1 === dArr.length ? dArr[0] : dArr[i + 1];
      const trendX = cX > dX ? -1 : 1, trendY = cY > dY ? -1 : 1, bX = Math.abs(cX - dX) / granularity * trendX, bY = Math.abs(cY - dY) / granularity * trendY, between = [];
      let x3 = cX, y2 = cY;
      while ((trendX > 0 && x3 + bX < dX || trendX < 0 && x3 + bX > dX) && (trendY > 0 && y2 + bY < dY || trendY < 0 && y2 + bY > dY)) {
        x3 += bX;
        y2 += bY;
        between.push([x3, y2]);
      }
      newDArr = newDArr.concat(between);
    }
    dArr = newDArr;
  }
  canvas.setAttribute("width", String(asWidth + thickness * 2));
  canvas.setAttribute("height", String(asHeight + thickness * 2));
  for (let i = 0; i < dArr.length; i++) {
    ctx.drawImage(
      image2,
      thickness + dArr[i][0] * thickness,
      thickness + dArr[i][1] * thickness,
      asWidth,
      asHeight
    );
    if (thickness === 0) {
      break;
    }
  }
  ctx.globalCompositeOperation = "source-in";
  ctx.fillStyle = generateFill(outline.fill.type, outline.fill.style);
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.globalCompositeOperation = "source-over";
  ctx.drawImage(image2, thickness, thickness, asWidth, asHeight);
  return canvasToWebp(canvas, image2);
};
var canvasToWebp = async (canvas, dft) => {
  const image2 = new Image();
  image2.src = canvas.toDataURL("image/webp");
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      resolve(dft);
    }, 1e3);
    image2.onerror = () => {
      clearTimeout(timeout);
      resolve(dft);
    };
    image2.onload = () => {
      clearTimeout(timeout);
      resolve(image2);
    };
  });
};
var cropImage = async (image2, def) => {
  const { w: width2, h: height2 } = def.size;
  let fitTo = def.image.fitTo ?? "auto", x3 = 0, y2 = 0;
  if (fitTo === "auto") {
    fitTo = height2 > width2 ? "height" : "width";
  }
  if (fitTo === "height") {
    x3 = (width2 - image2.width * (height2 / image2.height)) / 2;
  } else if (fitTo === "width") {
    y2 = (height2 - image2.height * (width2 / image2.width)) / 2;
  }
  const canvas = document.createElement("canvas"), ctx = canvas.getContext("2d");
  canvas.setAttribute("width", String(width2));
  canvas.setAttribute("height", String(height2));
  ctx.drawImage(image2, x3, y2, width2 - x3 * 2, height2 - y2 * 2);
  return canvasToWebp(canvas, image2);
};
var calculateAspectRatioFit = (fit, srcWidth, srcHeight, maxWidth, maxHeight) => {
  if (fit === "stretch" || fit === "crop") {
    return {
      width: maxWidth,
      height: maxHeight
    };
  }
  return getResized(srcWidth, srcHeight, maxWidth, maxHeight);
};
var getResized = (srcWidth, srcHeight, maxWidth, maxHeight) => {
  const ratio = Math.min(maxWidth / srcWidth, maxHeight / srcHeight), width2 = srcWidth * ratio, height2 = srcHeight * ratio;
  return {
    width: width2,
    height: height2
  };
};
var getImageVerticalDiff = (align, height2, asHeight) => {
  if (align == "top") {
    return 0;
  }
  if (align == "bottom") {
    return height2 - asHeight;
  }
  return (height2 - asHeight) / 2;
};
var getImageHorizontalDiff = (align, width2, asWidth) => {
  if (align == "left") {
    return 0;
  }
  if (align == "right") {
    return width2 - asWidth;
  }
  return (width2 - asWidth) / 2;
};

// src/action/text.calc.ts
var getLineHeight = (def) => {
  return def.text.lineHeight || getFontSize(def);
};
var ResolveTextSize = (def) => {
  return {
    start: {
      y: def.start.y,
      x: def.start.x
    },
    size: {
      w: def.size.w,
      h: def.size.h ?? getLineHeight(def) * (def.text.lines?.length ?? 0)
    }
  };
};
var getColumnsDefault = () => ({ amount: 1, gap: 0, tactic: "from-side" });
var ResolveTextCalc = async (def, modules, ctx) => {
  const illustrator = modules.illustrator;
  def.size = await illustrator.calc({
    layerType: "text",
    purpose: "size",
    values: def.size
  });
  def.start = await illustrator.calc({
    layerType: "text",
    purpose: "position",
    values: def.start
  });
  const {
    outlineThickness,
    fontSize,
    gap,
    lineHeight
  } = await illustrator.calc({
    layerType: "text",
    purpose: "prepare",
    values: {
      fontSize: getFontSizeForCalc(def),
      lineHeight: getLineHeight(def),
      gap: def.text.columns?.gap ?? 0,
      outlineThickness: def.text.outline?.thickness ?? 0
    }
  });
  if (def.text.lineHeight) {
    def.text.lineHeight = lineHeight;
  }
  if (def.text.outline?.thickness) {
    def.text.outline.thickness = outlineThickness;
  }
  def.text.columns = def.text.columns ?? getColumnsDefault();
  def.text.columns.gap = gap;
  def.text.font = def.text.font ?? {};
  def.text.font.size = fontSize;
  if (typeof def.text.color?.type == "string") {
    await calcFill(illustrator, def.text.color);
  }
  const {
    lines,
    lineHeight: preparedLineHeight,
    columns,
    fontSize: preparedFontSize
  } = prepare(def, ctx, def.size.w);
  def.text.transY = calcVerticalMove(def.size.h, preparedLineHeight, lines, def.text.align?.vertical || "top");
  if (isSafari()) {
    def.start.y -= preparedFontSize * 0.2;
  }
  def.text.lineHeight = preparedLineHeight;
  def.text.font.size = preparedFontSize;
  def.text.columns = columns;
  def.text.lines = lines;
  def.area = ResolveTextSize(def);
  return def;
};
var prepare = (def, ctx, width2) => {
  const columns = def.text.columns ?? getColumnsDefault(), fontSize = getFontSize(def), { textBaseline = "top" } = def.text;
  let { value: text2 } = def.text;
  ctx.save();
  ctx.font = prepareFontShorthand(def, ctx, String(fontSize));
  ctx.textBaseline = textBaseline;
  const colWidth = calcColumnWidth(width2, columns);
  text2 = addSpacing(def, text2);
  const lines = getTextLines(def, text2, ctx, colWidth);
  ctx.restore();
  return {
    lines,
    fontSize,
    lineHeight: getLineHeight(def),
    width: colWidth,
    columns
  };
};
var getTextLines = (def, text2, ctx, width2) => {
  if (!def.text.wrap) {
    return [[text2, 0]];
  }
  const rows = [];
  let words = text2.split(/[^\S\r\n]/), line = "", i = 0;
  while (words.length > 0) {
    const newLinePos = words[0].search(/[\r\n]/);
    if (newLinePos !== -1) {
      const newLine = words[0].substring(0, newLinePos);
      rows.push([(line + " " + newLine).trim() + "\n", i]);
      line = "";
      i++;
      words[0] = words[0].substring(newLinePos + 1);
      continue;
    }
    const metrics = ctx.measureText(line + words[0]);
    if (metrics.width > width2) {
      if (line.length > 0) {
        rows.push([line.trim(), i]);
        i++;
      }
      line = "";
    }
    line += " " + words[0];
    words = words.splice(1);
  }
  if (line.length > 0) {
    rows.push([line.replace(/^\s+/, ""), i]);
  }
  return rows;
};
var addSpacing = (def, text2) => {
  if (!def.text.spacing) {
    return text2;
  }
  return text2.split("").join(getSpaceChart().repeat(def.text.spacing));
};
var calcColumnWidth = (rWidth, columns) => {
  return (rWidth - ((columns.amount ?? 1) - 1) * (columns.gap ?? 0)) / (columns.amount ?? 1);
};
var isSafari = () => {
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
};
var calcVerticalMove = (height2, lineHeight, lines, vAlign) => {
  if (!height2 || lines.length * lineHeight >= height2) {
    return 0;
  }
  const diff = height2 - lines.length * lineHeight;
  if (vAlign === "center") {
    return diff / 2;
  }
  if (vAlign === "bottom") {
    return diff;
  }
  return 0;
};

// src/action/group.calc.ts
var ResolveGroupSize = async (def) => {
  let area;
  if (def.group.interaction === "static") {
    area = ResolveGroupSizeForRelative(def);
  } else {
    area = ResolveGroupSizeForFixed(def);
    area.start.y += def.start.y;
    area.start.x += def.start.x;
  }
  if (def.group.clip) {
    if (!isNaN(def.size.h)) {
      area.size.h = def.size.h;
    }
    if (!isNaN(def.size.w)) {
      area.size.w = def.size.w;
    }
  }
  return area;
};
var generateArea = (def) => {
  return {
    size: {
      w: !isNaN(def.size.w ?? NaN) ? def.size.w : 0,
      h: !isNaN(def.size.h ?? NaN) ? def.size.h : 0
    },
    start: {
      x: 0,
      y: 0
    }
  };
};
var ResolveGroupSizeForRelative = (def) => {
  const area = generateArea(def);
  const rows = separateIntoRows(def, def.layout);
  if (!area.size.h) area.size.h = getRowsHeight(def, rows);
  if (!area.size.w) area.size.w = getRowsWidth(def, rows);
  area.start.x = def.start.x;
  area.start.y = def.start.y;
  return area;
};
var ResolveGroupSizeForFixed = (def) => {
  const area = generateArea(def);
  const skipW = !!area.size.w;
  const skipH = !!area.size.h;
  for (let i = 0; i < def.layout.length; i++) {
    const subArea = def.layout[i].area;
    if (!subArea) {
      continue;
    }
    if (!skipH) area.size.h = Math.max(area.size.h, subArea.size.h + subArea.start.y);
    if (!skipW) area.size.w = Math.max(area.size.w, subArea.size.w + subArea.start.x);
    area.start.y = Math.min(area.start.y, subArea.start.y);
    area.start.x = Math.min(area.start.x, subArea.start.x);
  }
  if (area.start.y < 0) {
    area.start.y = 0;
  }
  if (area.start.x < 0) {
    area.start.x = 0;
  }
  return area;
};
var ResolveGroupCalc = async (modules, def, sessionId) => {
  const { group: group2 } = def;
  const illustrator = modules.illustrator;
  def.size = await illustrator.calc({
    layerType: "group",
    purpose: "size",
    values: def.size ?? { w: 0, h: 0 }
  });
  def.size.w ??= NaN;
  def.size.h ??= NaN;
  def.start = await illustrator.calc({
    layerType: "group",
    purpose: "position",
    values: def.start ?? { x: 0, y: 0 }
  });
  def.start.y ??= 0;
  def.start.x ??= 0;
  group2.gap = await illustrator.calc({
    layerType: "group",
    purpose: "gap",
    values: group2.gap ?? { vertical: 0, horizontal: 0 }
  });
  group2.gap.vertical ??= 0;
  group2.gap.horizontal ??= 0;
  const settings = modules.core.setting.get("workspace") ?? {};
  settings.relative ??= {};
  const pRelHeight = settings.relative.height;
  const pRelWidth = settings.relative.width;
  if (!isNaN(def.size.h)) settings.relative.height = def.size.h;
  if (!isNaN(def.size.w)) settings.relative.width = def.size.w;
  def.layout = await modules.core.view.recalculate(def, def.layout, sessionId);
  group2.interaction ??= "fixed";
  settings.relative.height = pRelHeight;
  settings.relative.width = pRelWidth;
  def.area = await ResolveGroupSize(def);
};

// ../antetype-core/dist/index.js
var u = { INIT: "antetype.init", CLOSE: "antetype.close", DRAW: "antetype.draw", CALC: "antetype.calc", RECALC_FINISHED: "antetype.recalc.finished", MODULES: "antetype.modules", SETTINGS: "antetype.settings.definition", TYPE_DEFINITION: "antetype.layer.type.definition", FONTS_LOADED: "antetype.font.loaded", CANVAS_CHANGE: "antetype.canvas.change" };
var x2 = Symbol("original");
var Y = Symbol("clone");
var X = Symbol("layer");
var K2 = "core";
var J = "0.0.5";
var A2 = class {
  #n;
  #t = null;
  #e = false;
  #o = null;
  static inject = { marshal: "boardmeister/marshal", herald: "boardmeister/herald" };
  inject(d2) {
    this.#n = d2;
  }
  async loadModules(d2) {
    return (await this.#r()).loadModules(d2);
  }
  register(d2) {
    let { registration: g2 } = d2.detail;
    g2[K2] = { load: async () => (!this.#t && !this.#e && (this.#e = new Promise((p2) => {
      this.#i("core.js").then((c2) => {
        this.#t = c2.default, this.#e = false, p2();
      });
    })), this.#e && await this.#e, console.log("load module3", this.#t), (p2) => this.#t({ modules: p2, herald: this.#n.herald })), version: J };
  }
  static subscriptions = { [u.MODULES]: "register" };
  #i(d2) {
    return import(this.#n.marshal.getResourceUrl(this, d2));
  }
  async #r() {
    return this.#o ??= (await this.#i("helper.js")).default, new this.#o(this.#n.herald);
  }
};

// src/definition/group.ts
var group = () => ({
  group: {
    clip: "boolean",
    interaction: "string",
    direction: "string",
    wrap: "boolean",
    gap: {
      vertical: "number",
      horizontal: "number"
    }
  }
});
var group_default = group;

// src/definition/image.ts
var image = () => ({
  image: {
    timeout: "number",
    fit: "string",
    overcolor: {
      fill: "string"
    },
    outline: {
      thickness: "number",
      fill: "string"
    },
    align: {
      vertical: "string",
      horizontal: "string"
    },
    fitTo: "string",
    src: "string"
  }
});
var image_default = image;

// src/definition/polygon.ts
var polygon = () => ({
  polygon: {
    steps: [
      {
        means: "string",
        args: {
          x: "number",
          y: "number",
          cp1x: "number",
          cp1y: "number",
          cp2x: "number",
          cp2y: "number",
          thickness: "number",
          fill: "string",
          lineJoin: "string",
          miterLimit: "number"
        }
      }
    ],
    size: {
      negative: {
        x: "number",
        y: "number"
      },
      positive: {
        x: "number",
        y: "number"
      }
    }
  }
});
var polygon_default = polygon;

// src/definition/text.ts
var text = () => ({
  text: {
    value: "string",
    align: {
      vertical: "string",
      horizontal: "string"
    },
    columns: {
      amount: "number",
      gap: "number"
    },
    font: {
      style: "string",
      family: "string",
      weight: "string",
      size: "string",
      stretch: "string",
      variant: "string",
      height: "string"
    },
    spacing: "number",
    textBaseline: "string",
    wrap: "boolean",
    lineHeight: "number",
    color: "string",
    outline: {
      fill: "string",
      thickness: "number",
      lineJoin: "string",
      miterLimit: "number",
      transY: "number",
      lines: [["string", "number"]]
    }
  }
});
var text_default = text;

// src/module.ts
var Illustrator = class {
  #modules2;
  #herald2;
  constructor(modules, herald) {
    this.#modules2 = modules;
    this.#herald2 = herald;
    this.#registerEvents();
  }
  #ctx2() {
    const canvas = this.#modules2.core.meta.getCanvas();
    if (!canvas) {
      throw new Error("[Antetype Illustrator] Provided canvas is empty");
    }
    return canvas.getContext("2d");
  }
  #registerEvents(anchor = null) {
    const unregister = this.#herald2.batch([
      {
        event: u.CLOSE,
        subscription: () => {
          unregister();
        },
        anchor
      },
      {
        event: u.CANVAS_CHANGE,
        subscription: async ({ detail: { current } }) => {
          unregister();
          this.#registerEvents(current);
        },
        anchor
      },
      {
        event: u.DRAW,
        subscription: async (event) => {
          const { element } = event.detail;
          const typeToAction = {
            clear: this.clear.bind(this),
            polygon: this.polygon.bind(this),
            image: this.image.bind(this),
            text: this.text.bind(this),
            group: this.group.bind(this)
          };
          const el = typeToAction[element.type];
          if (typeof el == "function") {
            await el(element);
          }
        },
        anchor
      },
      {
        event: u.CALC,
        subscription: async (event) => {
          if (event.detail.element === null) {
            return;
          }
          const { element, sessionId } = event.detail;
          const typeToAction = {
            polygon: this.polygonCalc.bind(this),
            image: this.imageCalc.bind(this),
            text: this.textCalc.bind(this),
            group: this.groupCalc.bind(this)
          };
          const el = typeToAction[element.type];
          if (typeof el == "function") {
            await el(element, sessionId);
          }
        },
        anchor
      },
      {
        event: u.TYPE_DEFINITION,
        subscription: (event) => {
          const definitions = event.detail.definitions;
          definitions.text = text_default();
          definitions.group = group_default();
          definitions.image = image_default();
          definitions.polygon = polygon_default();
        },
        anchor
      }
    ]);
  }
  reset() {
    this.#ctx2().canvas.width += 0;
  }
  clear() {
    this.#ctx2().clearRect(
      0,
      0,
      this.#ctx2().canvas.width,
      this.#ctx2().canvas.height
    );
  }
  async groupCalc(def, sessionId = null) {
    await ResolveGroupCalc(this.#modules2, def, sessionId);
  }
  group(def) {
    ResolveGroupAction(this.#ctx2(), this.#modules2, def);
  }
  async polygonCalc(def) {
    def.start = await this.calc({
      layerType: "polygon",
      purpose: "position",
      values: def.start
    });
    def.polygon.size = {
      negative: { x: 0, y: 0 },
      positive: { x: 0, y: 0 }
    };
    for (const step of def.polygon.steps) {
      await ResolveCalcPolygon(def, step, this.#modules2);
    }
    def.area = ResolvePolygonSize(def);
  }
  polygon({ polygon: { steps }, start: { x: x3, y: y2 } }) {
    const ctx = this.#ctx2();
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x3, y2);
    for (const step of steps) {
      ResolvePolygonAction(ctx, step, x3, y2);
    }
    ctx.closePath();
    ctx.restore();
  }
  async imageCalc(def) {
    await ResolveImageCalc(this.#modules2, def);
  }
  image(def) {
    ResolveImageAction(this.#ctx2(), def);
  }
  async textCalc(def) {
    await ResolveTextCalc(def, this.#modules2, this.#ctx2());
  }
  text(def) {
    ResolveTextAction(this.#ctx2(), def);
  }
  async calc(def) {
    const event = new CustomEvent(d.CALC, { detail: def });
    await this.#herald2.dispatch(event, { origin: this.#modules2.core.meta.getCanvas() });
    return event.detail.values;
  }
  generateText(value) {
    return {
      type: "text",
      start: {
        x: 0,
        y: 0
      },
      size: {
        w: 300,
        h: 100
      },
      text: {
        value,
        font: {
          family: "Arial",
          weight: 400,
          size: 30
        }
      }
    };
  }
  generateImage(src) {
    return {
      type: "image",
      start: {
        x: 0,
        y: 0
      },
      size: {
        w: 300,
        h: 300
      },
      image: {
        src
      }
    };
  }
  generatePolygon(steps = []) {
    return {
      type: "polygon",
      start: {
        x: 0,
        y: 0
      },
      size: {
        w: NaN,
        h: NaN
      },
      polygon: {
        steps,
        size: {
          negative: {
            x: 0,
            y: 0
          },
          positive: {
            x: 0,
            y: 0
          }
        }
      }
    };
  }
  generateGroup(layout) {
    const group2 = {
      type: "group",
      start: {
        x: 0,
        y: 0
      },
      size: {
        w: NaN,
        h: NaN
      },
      group: {},
      layout: []
    };
    for (const layer of layout) {
      layer.hierarchy = {
        parent: group2,
        position: group2.layout.length
      };
      group2.layout.push(layer);
    }
    return group2;
  }
};

// src/module.conf.ts
var ID = "illustrator";
var VERSION = "0.0.4";
var AntetypeIllustrator = class {
  #module = null;
  #injected;
  static inject = {
    marshal: "boardmeister/marshal",
    herald: "boardmeister/herald"
  };
  inject(injections) {
    this.#injected = injections;
  }
  register(event) {
    const { registration } = event.detail;
    registration[ID] = {
      load: async () => {
        if (!this.#module) {
          const module = this.#injected.marshal.getResourceUrl(this, "module.js");
          this.#module = (await import(module)).default;
        }
        return (modules) => new this.#module(modules, this.#injected.herald);
      },
      version: VERSION
    };
  }
  static subscriptions = {
    [u.MODULES]: "register"
  };
};
export {
  Event,
  ID,
  Illustrator,
  VERSION
};
