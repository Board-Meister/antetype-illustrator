// ../antetype-workspace/dist/index.js
var Event = /* @__PURE__ */ ((Event22) => {
  Event22["STRUCTURE"] = "antetype.structure";
  Event22["MIDDLE"] = "antetype.structure.middle";
  Event22["BAR_BOTTOM"] = "antetype.structure.bar.bottom";
  Event22["CENTER"] = "antetype.structure.center";
  Event22["COLUMN_LEFT"] = "antetype.structure.column.left";
  Event22["COLUMN_RIGHT"] = "antetype.structure.column.right";
  Event22["BAR_TOP"] = "antetype.structure.bar.top";
  Event22["MODULES"] = "antetype.modules";
  return Event22;
})(Event || {});
var Event2 = /* @__PURE__ */ ((Event32) => {
  Event32["SELECT"] = "antetype.cursor.select";
  return Event32;
})(Event2 || {});
var AntetypeCursor = class {
  #injected;
  #module = null;
  #instance = null;
  static inject = {
    minstrel: "boardmeister/minstrel",
    herald: "boardmeister/herald"
  };
  inject(injections) {
    this.#injected = injections;
  }
  async register(event) {
    const { modules, canvas } = event.detail;
    if (!this.#module) {
      const module = this.#injected.minstrel.getResourceUrl(this, "module.js");
      this.#module = (await import(module)).default;
    }
    this.#instance = modules.transform = this.#module({
      canvas,
      modules,
      injected: this.#injected
    });
    this.#instance;
  }
  static subscriptions = {
    [Event.MODULES]: "register"
  };
};
var Event3 = /* @__PURE__ */ ((Event22) => {
  Event22["STRUCTURE"] = "antetype.structure";
  Event22["MIDDLE"] = "antetype.structure.middle";
  Event22["BAR_BOTTOM"] = "antetype.structure.bar.bottom";
  Event22["CENTER"] = "antetype.structure.center";
  Event22["COLUMN_LEFT"] = "antetype.structure.column.left";
  Event22["COLUMN_RIGHT"] = "antetype.structure.column.right";
  Event22["BAR_TOP"] = "antetype.structure.bar.top";
  Event22["MODULES"] = "antetype.modules";
  return Event22;
})(Event3 || {});
var i = ((t) => (t.STRUCTURE = "antetype.structure", t.MIDDLE = "antetype.structure.middle", t.BAR_BOTTOM = "antetype.structure.bar.bottom", t.CENTER = "antetype.structure.center", t.COLUMN_LEFT = "antetype.structure.column.left", t.COLUMN_RIGHT = "antetype.structure.column.right", t.BAR_TOP = "antetype.structure.bar.top", t.MODULES = "antetype.modules", t))(i || {});
var c = ((r) => (r.INIT = "antetype.init", r.DRAW = "antetype.draw", r.CALC = "antetype.calc", r))(c || {});
var s = class {
  #t;
  #r = null;
  #e = null;
  static inject = { minstrel: "boardmeister/minstrel", herald: "boardmeister/herald" };
  inject(e) {
    this.#t = e;
  }
  async #n(e, o) {
    if (!this.#e) {
      let r = this.#t.minstrel.getResourceUrl(this, "core.js");
      this.#r = (await import(r)).default, this.#e = this.#r({ canvas: o, modules: e, injected: this.#t });
    }
    return this.#e;
  }
  async register(e) {
    let { modules: o, canvas: r } = e.detail;
    o.core = await this.#n(o, r);
  }
  async init(e) {
    if (!this.#e) throw new Error("Instance not loaded, trigger registration event first");
    let { base: o, settings: r } = e.detail;
    for (let a in r) this.#e.setting.set(a, r[a]);
    let n = this.#e.meta.document;
    n.base = o;
    let l = [];
    return (this.#e.setting.get("fonts") ?? []).forEach((a) => {
      l.push(this.#e.font.load(a));
    }), await Promise.all(l), n.layout = await this.#e.view.recalculate(n, n.base), await this.#e.view.redraw(n.layout), console.log(n), n;
  }
  async cloneDefinitions(e) {
    if (!this.#e) throw new Error("Instance not loaded, trigger registration event first");
    e.detail.element !== null && (e.detail.element = await this.#e.clone.definitions(e.detail.element));
  }
  static subscriptions = { [i.MODULES]: "register", "antetype.init": "init", "antetype.calc": [{ method: "cloneDefinitions", priority: -255 }] };
};
var Workspace = class {
  #canvas;
  #modules;
  #ctx;
  #translationSet = 0;
  constructor(canvas, modules) {
    if (!canvas) {
      throw new Error("[Antetype Workspace] Provided canvas is empty");
    }
    this.#canvas = canvas;
    this.#modules = modules;
    this.#ctx = this.#canvas.getContext("2d");
  }
  drawCanvas() {
    const ctx = this.#ctx;
    ctx.save();
    ctx.fillStyle = "#FFF";
    const { height: height2, width: width2 } = this.#getSize();
    ctx.fillRect(0, 0, width2, height2);
    ctx.restore();
  }
  getLeft() {
    const ctx = this.#ctx;
    const { width: width2 } = this.#getSize();
    return (ctx.canvas.offsetWidth - width2) / 2;
  }
  getTop() {
    const ctx = this.#ctx;
    const { height: height2 } = this.#getSize();
    return (ctx.canvas.offsetHeight - height2) / 2;
  }
  setOrigin() {
    this.#translationSet++;
    if (this.#translationSet > 1) {
      return;
    }
    const ctx = this.#ctx;
    ctx.save();
    ctx.translate(this.getLeft(), this.getTop());
  }
  restore() {
    this.#translationSet--;
    if (this.#translationSet != 0) {
      return;
    }
    this.#ctx.restore();
  }
  calc(operation) {
    if (typeof operation == "number") {
      return operation;
    }
    if (typeof operation != "string" || operation.match(/[^-()\d/*+.pxw%hv ]/g)) {
      return NaN;
    }
    const convertUnitToNumber = (unit, suffixLen = 2) => Number(unit.slice(0, unit.length - suffixLen));
    const { height: aHeight, width: aWidth } = this.#getSize();
    const { height, width } = this.#getSizeRelative();
    const unitsTranslator = {
      "px": (number) => {
        return convertUnitToNumber(number);
      },
      "w%": (number) => {
        return convertUnitToNumber(number) / 100 * width;
      },
      "h%": (number) => {
        return convertUnitToNumber(number) / 100 * height;
      },
      "vh": (number) => {
        return convertUnitToNumber(number) / 100 * aHeight;
      },
      "vw": (number) => {
        return convertUnitToNumber(number) / 100 * aWidth;
      },
      "default": (number) => number
    };
    let calculation = "";
    operation.split(" ").forEach((expression) => {
      expression = expression.trim();
      const last = expression[expression.length - 1], secondToLast = expression[expression.length - 2];
      let result2 = (unitsTranslator[secondToLast + last] || unitsTranslator.default)(expression);
      if (typeof result2 == "number") {
        result2 = this.#decimal(result2);
      }
      calculation += String(result2);
    });
    const result = eval(calculation);
    if (result == void 0) {
      return NaN;
    }
    return this.#decimal(result);
  }
  #decimal(number, precision = 2) {
    return +number.toFixed(precision);
  }
  #getSystem() {
    return this.#modules.core;
  }
  #getSettings() {
    const height2 = this.#ctx.canvas.offsetHeight;
    const set = this.#getSystem().setting.get("workspace") ?? {};
    if (typeof set.height != "number") {
      set.height = height2;
    }
    if (typeof set.width != "number") {
      const a4Ratio = 0.707070707;
      set.width = height2 * a4Ratio;
    }
    return set;
  }
  #getSize() {
    const { width: aWidth2, height: aHeight2 } = this.#getSettings(), ratio = aWidth2 / aHeight2;
    let height2 = this.#ctx.canvas.offsetHeight, width2 = height2 * ratio;
    if (width2 > this.#ctx.canvas.offsetWidth) {
      width2 = this.#ctx.canvas.offsetWidth;
      height2 = width2 * (height2 / width2);
    }
    return {
      width: width2,
      height: height2
    };
  }
  #getSizeRelative() {
    const settings = this.#getSettings(), { width: aWidth2, height: aHeight2 } = this.#getSize(), rWidth = settings.relative?.width ?? aWidth2, rHeight = settings.relative?.height ?? aHeight2;
    const ratio = rWidth / rHeight;
    let height2 = this.#ctx.canvas.offsetHeight, width2 = height2 * ratio;
    if (width2 > this.#ctx.canvas.offsetWidth) {
      width2 = this.#ctx.canvas.offsetWidth;
      height2 = width2 * (rHeight / rWidth);
    }
    return {
      width: width2,
      height: height2
    };
  }
};
var Event4 = /* @__PURE__ */ ((Event5) => {
  Event5["CALC"] = "antetype.workspace.calc";
  return Event5;
})(Event4 || {});
var AntetypeWorkspace = class {
  #module = null;
  #instance = null;
  #injected;
  static inject = {
    minstrel: "boardmeister/minstrel",
    herald: "boardmeister/herald"
  };
  inject(injections) {
    this.#injected = injections;
  }
  async register(event) {
    const { modules, canvas } = event.detail;
    if (!this.#module) {
      const module = this.#injected.minstrel.getResourceUrl(this, "module.js");
      this.#module = (await import(module)).default;
    }
    this.#instance = modules.workspace = new this.#module(canvas, modules);
  }
  draw(event) {
    if (!this.#instance) {
      return;
    }
    const { element } = event.detail;
    const typeToAction = {
      clear: this.#instance.drawCanvas.bind(this.#instance)
    };
    const el = typeToAction[element.type];
    if (typeof el == "function") {
      el(element);
    }
  }
  setOrigin() {
    this.#instance?.setOrigin();
  }
  restoreOrigin() {
    this.#instance?.restore();
  }
  calc(event) {
    const values = event.detail.values;
    const keys = Object.keys(values);
    for (const key of keys) {
      values[key] = this.#instance.calc(values[key]);
    }
  }
  subtractWorkspace(event) {
    event.detail.x -= this.#instance.getLeft();
    event.detail.y -= this.#instance.getTop();
  }
  static subscriptions = {
    [
      "antetype.workspace.calc"
      /* CALC */
    ]: "calc",
    [Event3.MODULES]: "register",
    [c.DRAW]: [
      {
        method: "draw",
        priority: 255
      },
      {
        method: "setOrigin",
        priority: -255
      },
      {
        method: "restoreOrigin",
        priority: 255
      }
    ],
    [Event2.SELECT]: "subtractWorkspace"
  };
};
var EnAntetypeWorkspace = AntetypeWorkspace;
var src_default = EnAntetypeWorkspace;

// src/shared.tsx
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
var generateLinearGradient = (colors, x, y, width2, height2) => {
  const canvas = document.createElement("canvas"), ctx = canvas.getContext("2d");
  const grd = ctx.createLinearGradient(x, y, width2, height2);
  colors.forEach((color) => {
    grd.addColorStop(color.offset, color.color);
  });
  return grd;
};

// src/action/polygon.tsx
var Actions = {
  line: (ctx, x, y) => {
    ctx.lineTo(x, y);
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
  begin: (ctx, x, y) => {
    ctx.beginPath();
    ctx.moveTo(x, y);
  },
  move: (ctx, x, y) => {
    ctx.moveTo(x, y);
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
  default: (ctx, x, y) => Actions.line(ctx, x, y)
};
function ResolvePolygonAction(ctx, action, x, y) {
  const objSwitch = {
    fill: (action2) => {
      Actions.fill(ctx, action2.args);
    },
    line: (action2) => {
      Actions.line(ctx, action2.args.x + x, action2.args.y + y);
    },
    curve: (action2) => {
      Actions.curve(
        ctx,
        action2.args.cp1x + x,
        action2.args.cp1y + y,
        action2.args.cp2x + x,
        action2.args.cp2y + y,
        action2.args.x + x,
        action2.args.y + y
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
      Actions.begin(ctx, action2.args.x + x, action2.args.y + y);
    },
    move: (action2) => {
      Actions.move(ctx, action2.args.x + x, action2.args.y + y);
    },
    close: () => Actions.close(ctx)
  };
  if (!objSwitch[action.means]) {
    return;
  }
  objSwitch[action.means](action);
}

// src/action/image.tsx
var IMAGE_ERROR_STATUS = Symbol("error");
var IMAGE_TIMEOUT_STATUS = Symbol("timeout");
var IMAGE_LOADING_STATUS = Symbol("loading");
var CalculatedImage = class {
  image;
  coords;
  constructor(image, coords) {
    this.image = image;
    this.coords = coords;
  }
};
var ResolveImageAction = async (ctx, def) => {
  const image = def.image.calculated;
  if (!image || imageTimeoutReached(image) || imageIsBeingLoaded(image)) {
    return;
  }
  if (!(image instanceof CalculatedImage)) {
    return;
  }
  const { x, y, width: width2, height: height2 } = image.coords;
  ctx.drawImage(image.image, x, y, width2, height2);
};
var imageTimeoutReached = (image) => {
  return image === IMAGE_TIMEOUT_STATUS;
};
var imageIsBeingLoaded = (image) => {
  return image === IMAGE_LOADING_STATUS;
};

// src/action/text.tsx
var getFontSizeForCalc = (def) => String(def.text.font?.size ?? 10);
var getFontSize = (def) => Number(def.text.font?.size ?? 10);
var getSpaceChart = () => String.fromCharCode(8202);
var ResolveTextAction = (ctx, def) => {
  let { x } = def.start, lines = [], previousColumnsLines = 0;
  const { start: { y }, size: { w }, text } = def, { columns, transY, lineHeight } = text, value = [...text.lines], linesAmount = Math.ceil(value.length / columns.amount), { textBaseline = "top" } = def.text;
  ctx.save();
  ctx.font = prepareFontShorthand(def, ctx, String(getFontSize(def)));
  ctx.textBaseline = textBaseline;
  while ((lines = value.splice(0, linesAmount)).length) {
    lines.forEach((text2, i2) => {
      const nextLine = lines[i2 + 1] || value[0] || [""];
      const isLast = i2 + 1 == lines.length || nextLine[0] == "" || text2[0][text2[0].length - 1] == "\n";
      const verticalMove = transY + (text2[1] - previousColumnsLines) * lineHeight;
      fillText(ctx, text2[0], def, x, y, w, verticalMove, isLast);
    });
    previousColumnsLines += lines[lines.length - 1][1] + 1;
    x += columns.gap + w;
  }
  ctx.restore();
};
var fillText = (ctx, text, def, x, y, width2, transY, isLast) => {
  const { color = "#000", outline = null } = def.text;
  const horizontal = def.text.align?.horizontal || "left";
  if (horizontal != "left") {
    ({ text, x } = alignHorizontally(ctx, horizontal, text, width2, isLast, x));
  }
  if (transY > 0) {
    y = y + transY;
  }
  ctx.fillStyle = typeof color == "object" ? generateFill(color.type, color.style) : color;
  if (outline) {
    outlineText(ctx, outline, text, x, y, width2);
  }
  ctx.fillText(text, x, y, width2);
};
var outlineText = (ctx, outline, text, x, y, width2) => {
  ctx.strokeStyle = generateFill(outline.fill.type, outline.fill.style);
  ctx.lineWidth = outline.thickness;
  ctx.lineJoin = outline.lineJoin ?? "round";
  ctx.miterLimit = outline.miterLimit ?? 2;
  ctx.strokeText(text, x, y, width2);
};
var alignHorizontally = (ctx, horizontal, text, width2, isLast, x) => {
  const metrics = ctx.measureText(text);
  const realWidth = metrics.width;
  if (horizontal == "center") {
    const transX = (width2 - realWidth) / 2;
    if (transX > 0) {
      x = x + transX;
    }
  } else if (horizontal == "right") {
    x = x + width2 - realWidth;
  } else if (horizontal == "justify" && !isLast) {
    text = justifyText(text, metrics, width2, ctx);
  }
  return { text, x };
};
var justifyText = (text, metrics, width2, ctx) => {
  if (metrics.width >= width2) {
    return text;
  }
  const words = text.split(" "), spacingMeasure = ctx.measureText(getSpaceChart()), spacings = Math.floor((width2 - metrics.width) / spacingMeasure.width), amount = spacings / (words.length - 1);
  for (let j = 0; j < words.length - 1; j++) {
    words[j] += getSpaceChart().repeat(amount);
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

// src/action/group.tsx
var ResolveGroupAction = (ctx, modules, def) => {
  const { group, start } = def;
  if (def.layout.length === 0) {
    return;
  }
  ctx.save();
  ctx.translate(start.x, start.y);
  if (group.interaction === "fixed") {
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
  const { group } = def;
  const { vertical, horizontal } = group.gap;
  const rows = separateIntoRows(def, def.layout);
  if (group.clip && (!isNaN(def.size?.w) || !isNaN(def.size?.h))) {
    ctx.beginPath();
    ctx.rect(
      def.start.x,
      def.start.y,
      isNaN(def.size.w) ? getRowsWidth(def, rows) : def.size.w,
      isNaN(def.size.h) ? getRowsHeight(def, rows) : def.size.h
    );
    ctx.clip();
  }
  let currentHeight = 0;
  let xShift = 0;
  rows.forEach((row) => {
    row.layers.forEach((layer) => {
      ctx.save();
      ctx.translate(xShift, currentHeight);
      modules.core.view.draw(layer.def);
      ctx.restore();
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
  layout.forEach((layer, i2) => {
    if (def.group.wrap && size.w != 0 && row.width + layer.size.w > size.w || i2 != 0 && def.group.direction === "column") {
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

// src/action/polygon.calc.tsx
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
    const p = def.polygon.size.positive;
    p[dir] = Math.max(p[dir], value);
  }
};

// src/action/image.calc.tsx
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
  def.size = await modules.illustrator.calc({
    layerType: "image",
    purpose: "size",
    values: def.size
  });
  def.start = await modules.illustrator.calc({
    layerType: "image",
    purpose: "position",
    values: def.start
  });
  def.area = ResolveImageSize(def);
  if (def.image.outline?.thickness) {
    def.image.outline.thickness = (await modules.illustrator.calc({
      layerType: "image",
      purpose: "thickness",
      values: {
        thickness: def.image.outline.thickness
      }
    })).thickness;
  }
  const cacheKey = getImageCacheKey(def.image, def.size.w, def.size.h), cached = cachedBySettings[cacheKey];
  if (cached) {
    def.image.calculated = calculateFromCache(def, cached);
    return;
  }
  if (def.image.src instanceof Image) {
    def.image.calculated = await calculateImage(def, def.image.src, cacheKey);
    return;
  }
  if (typeof def.image.src != "string") {
    return;
  }
  const source = def.image.src;
  if (typeof source != "string" || !source.startsWith("http") && !source.startsWith("/")) {
    console.warn("Image `" + source + "` has invalid source");
    return;
  }
  await loadImage(def, source, modules);
};
var calculateFromCache = (def, cached) => {
  const image = def.image, { w, h } = def.size;
  let { x, y } = def.start;
  const { width: asWidth, height: asHeight } = calculateAspectRatioFit(
    image.fit ?? "default",
    cached.width,
    cached.height,
    w,
    h
  ), leftDiff = getImageHorizontalDiff(image.align?.horizontal ?? "center", w, asWidth), topDiff = getImageVerticalDiff(image.align?.vertical ?? "center", h, asHeight);
  x += leftDiff;
  y += topDiff;
  return new CalculatedImage(
    cached.image,
    {
      x,
      y,
      width: asWidth,
      height: asHeight
    }
  );
};
var calculateImage = async (def, source, cacheKey = null) => {
  const image = def.image, { w, h } = def.size, sWidth = source.width, sHeight = source.height;
  let { x, y } = def.start;
  const { width: asWidth, height: asHeight } = calculateAspectRatioFit(
    image.fit ?? "default",
    sWidth,
    sHeight,
    w,
    h
  ), leftDiff = getImageHorizontalDiff(image.align?.horizontal ?? "center", w, asWidth), topDiff = getImageVerticalDiff(image.align?.vertical ?? "center", h, asHeight);
  x += leftDiff;
  y += topDiff;
  if (image.fit === "crop") {
    source = await cropImage(source, def);
  }
  if (image.overcolor) {
    source = await overcolorImage(source, def, asWidth, asHeight);
  }
  if (image.outline) {
    source = await outlineImage(source, def, asWidth, asHeight);
  }
  cachedBySettings[cacheKey ?? getImageCacheKey(def.image, def.size.w, def.size.h)] = {
    image: source,
    width: sWidth,
    height: sHeight
  };
  return new CalculatedImage(
    source,
    {
      x,
      y,
      width: asWidth,
      height: asHeight
    }
  );
};
var getImageCacheKey = (image, width2, height2) => JSON.stringify({ ...image, timeout: 0, calculated: 0, width: width2, height: height2 });
var loadImage = async (def, src, modules) => {
  const image = new Image(), { image: { timeout = 3e4 } } = def, view = modules.core.view;
  image.crossOrigin = "anonymous";
  image.src = src;
  const promise = new Promise((resolve) => {
    const timeoutTimer = setTimeout(() => {
      def.image.calculated = IMAGE_TIMEOUT_STATUS;
      resolve();
    }, timeout);
    image.onerror = () => {
      clearTimeout(timeoutTimer);
      def.image.calculated = IMAGE_ERROR_STATUS;
      resolve();
    };
    image.onload = async () => {
      clearTimeout(timeoutTimer);
      def.image.calculated = await calculateImage(def, image);
      resolve();
      void view.redrawDebounce(getDoc(def).layout);
    };
  });
  loadedImages[src] = IMAGE_LOADING_STATUS;
  await promise;
};
var getDoc = (def) => {
  if (!def.hierarchy?.parent) {
    return def;
  }
  return getDoc(def.hierarchy.parent);
};
var overcolorImage = async (image, def, asWidth, asHeight) => {
  const canvas = document.createElement("canvas"), ctx = canvas.getContext("2d"), overcolor = def.image.overcolor;
  canvas.setAttribute("width", String(asWidth));
  canvas.setAttribute("height", String(asHeight));
  ctx.drawImage(image, 0, 0, asWidth, asHeight);
  ctx.globalCompositeOperation = "source-in";
  ctx.fillStyle = generateFill(overcolor.fill.type, overcolor.fill.style);
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.globalCompositeOperation = "source-over";
  const imageOvercolored = await canvasToWebp(canvas, image);
  ctx.drawImage(imageOvercolored, 0, 0, asWidth, asHeight);
  return canvasToWebp(canvas, imageOvercolored);
};
var outlineImage = async (image, def, asWidth, asHeight) => {
  const canvas = document.createElement("canvas"), ctx = canvas.getContext("2d"), outline = def.image.outline, thickness = outline.thickness;
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
    for (let i2 = 0; i2 < dArr.length; i2++) {
      newDArr.push(dArr[i2]);
      const [cX, cY] = dArr[i2], [dX, dY] = i2 + 1 === dArr.length ? dArr[0] : dArr[i2 + 1];
      const trendX = cX > dX ? -1 : 1, trendY = cY > dY ? -1 : 1, bX = Math.abs(cX - dX) / granularity * trendX, bY = Math.abs(cY - dY) / granularity * trendY, between = [];
      let x = cX, y = cY;
      while ((trendX > 0 && x + bX < dX || trendX < 0 && x + bX > dX) && (trendY > 0 && y + bY < dY || trendY < 0 && y + bY > dY)) {
        x += bX;
        y += bY;
        between.push([x, y]);
      }
      newDArr = newDArr.concat(between);
    }
    dArr = newDArr;
  }
  canvas.setAttribute("width", String(asWidth + thickness * 2));
  canvas.setAttribute("height", String(asHeight + thickness * 2));
  for (let i2 = 0; i2 < dArr.length; i2++) {
    ctx.drawImage(
      image,
      thickness + dArr[i2][0] * thickness,
      thickness + dArr[i2][1] * thickness,
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
  ctx.drawImage(image, thickness, thickness, asWidth, asHeight);
  return canvasToWebp(canvas, image);
};
var canvasToWebp = async (canvas, dft) => {
  const image = new Image();
  image.src = canvas.toDataURL("image/webp");
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      resolve(dft);
    }, 1e3);
    image.onerror = () => {
      clearTimeout(timeout);
      resolve(dft);
    };
    image.onload = () => {
      clearTimeout(timeout);
      resolve(image);
    };
  });
};
var cropImage = async (image, def) => {
  const { w: width2, h: height2 } = def.size;
  let fitTo = def.image.fitTo ?? "auto", x = 0, y = 0;
  if (fitTo === "auto") {
    fitTo = height2 > width2 ? "height" : "width";
  }
  if (fitTo === "height") {
    x = (width2 - image.width * (height2 / image.height)) / 2;
  } else if (fitTo === "width") {
    y = (height2 - image.height * (width2 / image.width)) / 2;
  }
  const canvas = document.createElement("canvas"), ctx = canvas.getContext("2d");
  canvas.setAttribute("width", String(width2));
  canvas.setAttribute("height", String(height2));
  ctx.drawImage(image, x, y, width2 - x * 2, height2 - y * 2);
  return canvasToWebp(canvas, image);
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

// src/action/text.calc.tsx
var ResolveTextSize = (def) => {
  let fontSize = def.text.font?.size;
  if (!fontSize || typeof fontSize == "string") {
    fontSize = 0;
  }
  return {
    start: {
      y: def.start.y - (def.text.transY ?? 0) / 2,
      x: def.start.x
    },
    size: {
      w: def.size.w,
      h: def.size.h ?? (def.text.lineHeight ?? fontSize) * (def.text.lines?.length ?? 0)
    }
  };
};
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
      lineHeight: def.text.lineHeight ?? 0,
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
  def.text.columns = def.text.columns ?? { amount: 1, gap: 0 };
  def.text.columns.gap = gap;
  def.text.font = def.text.font ?? {};
  def.text.font.size = fontSize;
  if (typeof def.text.color.type == "string") {
    await calcFill(illustrator, def.text.color);
  }
  const {
    lines,
    lineHeight: preparedLineHeight,
    width: width2,
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
  def.size.w = width2;
  def.text.lines = lines;
  def.area = ResolveTextSize(def);
  return def;
};
var prepare = (def, ctx, width2) => {
  const columns = def.text.columns ?? { gap: 0, amount: 1 }, fontSize = getFontSize(def), { textBaseline = "top" } = def.text;
  let { value: text } = def.text;
  ctx.save();
  ctx.font = prepareFontShorthand(def, ctx, String(fontSize));
  ctx.textBaseline = textBaseline;
  const colWidth = calcColumnWidth(width2, columns);
  text = addSpacing(def, text);
  const lines = getTextLines(def, text, ctx, colWidth);
  ctx.restore();
  return {
    lines,
    fontSize,
    lineHeight: def.text.lineHeight ?? fontSize,
    width: colWidth,
    columns
  };
};
var getTextLines = (def, text, ctx, width2) => {
  if (!def.text.wrap) {
    return [[text, 0]];
  }
  const rows = [];
  let words = text.split(/[^\S\r\n]/), line = "", i2 = 0;
  while (words.length > 0) {
    const newLinePos = words[0].search(/[\r\n]/);
    if (newLinePos !== -1) {
      const newLine = words[0].substring(0, newLinePos);
      rows.push([(line + " " + newLine).trim() + "\n", i2]);
      line = "";
      i2++;
      words[0] = words[0].substring(newLinePos + 1);
      continue;
    }
    const metrics = ctx.measureText(line + words[0]);
    if (metrics.width > width2) {
      if (line.length > 0) {
        rows.push([line.trim(), i2]);
        i2++;
      }
      line = "";
    }
    line += " " + words[0];
    words = words.splice(1);
  }
  if (line.length > 0) {
    rows.push([line.replace(/^\s+/, ""), i2]);
  }
  return rows;
};
var addSpacing = (def, text) => {
  if (!def.text.spacing) {
    return text;
  }
  return text.split("").join(getSpaceChart().repeat(def.text.spacing));
};
var calcColumnWidth = (rWidth, columns) => {
  return (rWidth - (columns.amount - 1) * columns.gap) / columns.amount;
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

// src/action/group.calc.tsx
var ResolveGroupSize = async (def) => {
  let area;
  if (def.group.interaction === "fixed") {
    area = ResolveGroupSizeForFixed(def);
    area.start.y += def.start.y;
    area.start.x += def.start.x;
  } else {
    area = ResolveGroupSizeForRelative(def);
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
var generateArea = () => {
  return {
    size: {
      w: 0,
      h: 0
    },
    start: {
      x: 0,
      y: 0
    }
  };
};
var ResolveGroupSizeForRelative = (def) => {
  const area = generateArea();
  const rows = separateIntoRows(def, def.layout);
  area.size.h = getRowsHeight(def, rows);
  area.size.w = getRowsWidth(def, rows);
  area.start.x = def.start.x;
  area.start.y = def.start.y;
  return area;
};
var ResolveGroupSizeForFixed = (def) => {
  const area = generateArea();
  for (let i2 = 0; i2 < def.layout.length; i2++) {
    const subArea = def.layout[i2].area;
    if (!subArea) {
      continue;
    }
    area.size.h = Math.max(area.size.h, subArea.size.h);
    area.size.w = Math.max(area.size.w, subArea.size.w);
    area.start.y = Math.min(area.start.y, subArea.start.y);
    area.start.x = Math.min(area.start.x, subArea.start.x);
  }
  return area;
};
var ResolveGroupCalc = async (modules, def) => {
  const { group } = def;
  def.size = await modules.illustrator.calc({
    layerType: "group",
    purpose: "size",
    values: def.size ?? { w: 0, h: 0 }
  });
  def.size.w ??= NaN;
  def.size.h ??= NaN;
  def.start = await modules.illustrator.calc({
    layerType: "group",
    purpose: "position",
    values: def.start ?? { x: 0, y: 0 }
  });
  def.start.y ??= 0;
  def.start.x ??= 0;
  const settings = modules.core.setting.get("workspace") ?? {};
  settings.relative ??= {};
  const pRelHeight = settings.relative.height;
  const pRelWidth = settings.relative.width;
  if (!isNaN(def.size.h)) settings.relative.height = Math.floor(def.size.h);
  if (!isNaN(def.size.w)) settings.relative.width = Math.floor(def.size.w);
  modules.core.setting.set("workspace", settings);
  def.layout = await modules.core.view.recalculate(def, def.layout);
  group.gap = await modules.illustrator.calc({
    layerType: "group",
    purpose: "gap",
    values: group.gap ?? { vertical: 0, horizontal: 0 }
  });
  group.gap.vertical ??= 0;
  group.gap.horizontal ??= 0;
  group.interaction ??= "fixed";
  settings.relative.height = pRelHeight;
  settings.relative.width = pRelWidth;
  def.area = await ResolveGroupSize(def);
};

// src/module.tsx
var Illustrator = class {
  #canvas2;
  #modules2;
  #ctx2;
  #injected;
  constructor(canvas, modules, injected) {
    if (!canvas) {
      throw new Error("[Antetype Illustrator] Provided canvas is empty");
    }
    this.#canvas2 = canvas;
    this.#modules2 = modules;
    this.#injected = injected;
    this.#ctx2 = this.#canvas2.getContext("2d");
  }
  reset() {
    this.#canvas2.width += 0;
  }
  clear() {
    this.#ctx2.clearRect(
      0,
      0,
      this.#canvas2.width,
      this.#canvas2.height
    );
  }
  async groupCalc(def) {
    await ResolveGroupCalc(this.#modules2, def);
  }
  group(def) {
    ResolveGroupAction(this.#ctx2, this.#modules2, def);
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
  polygon({ polygon: { steps }, start: { x, y } }) {
    const ctx = this.#ctx2;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x, y);
    for (const step of steps) {
      ResolvePolygonAction(ctx, step, x, y);
    }
    ctx.closePath();
    ctx.restore();
  }
  async imageCalc(def) {
    await ResolveImageCalc(this.#modules2, def);
  }
  image(def) {
    ResolveImageAction(this.#ctx2, def);
  }
  async textCalc(def) {
    await ResolveTextCalc(def, this.#modules2, this.#ctx2);
  }
  text(def) {
    ResolveTextAction(this.#ctx2, def);
  }
  async calc(def) {
    const event = new CustomEvent(Event4.CALC, { detail: def });
    await this.#injected.herald.dispatch(event);
    return event.detail.values;
  }
};
export {
  Illustrator as default
};
