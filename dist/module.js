// ../antetype-workspace/dist/index.js
var s = { INIT: "antetype.init", CLOSE: "antetype.close", DRAW: "antetype.draw", CALC: "antetype.calc", RECALC_FINISHED: "antetype.recalc.finished", MODULES: "antetype.modules", SETTINGS: "antetype.settings.definition", TYPE_DEFINITION: "antetype.layer.type.definition", FONTS_LOADED: "antetype.font.loaded" };
var d = class {
  #e;
  #t = null;
  static inject = { minstrel: "boardmeister/minstrel", herald: "boardmeister/herald" };
  inject(t) {
    this.#e = t;
  }
  async #r(t, e) {
    let r = this.#e.minstrel.getResourceUrl(this, "core.js");
    return this.#t = (await import(r)).default, this.#t({ canvas: e, modules: t, herald: this.#e.herald });
  }
  async register(t) {
    let { modules: e, canvas: r } = t.detail;
    e.core = await this.#r(e, r);
  }
  static subscriptions = { [s.MODULES]: "register" };
};
var o = ((e) => (e.CALC = "antetype.workspace.calc", e))(o || {});
var i = class {
  #e = null;
  #t;
  static inject = { minstrel: "boardmeister/minstrel", herald: "boardmeister/herald" };
  inject(e) {
    this.#t = e;
  }
  async register(e) {
    let { modules: r, canvas: a } = e.detail;
    if (!this.#e) {
      let n = this.#t.minstrel.getResourceUrl(this, "module.js");
      this.#e = (await import(n)).default;
    }
    r.workspace = new this.#e(a, r, this.#t.herald);
  }
  static subscriptions = { [s.MODULES]: "register" };
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
var generateLinearGradient = (colors, x, y, width, height) => {
  const canvas = document.createElement("canvas"), ctx = canvas.getContext("2d");
  const grd = ctx.createLinearGradient(x, y, width, height);
  colors.forEach((color) => {
    grd.addColorStop(color.offset, color.color);
  });
  return grd;
};

// src/action/polygon.ts
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
  const { start: { x, y } } = def.area;
  ctx.drawImage(image2.image, x + image2.coords.xDiff, y + image2.coords.yDiff, image2.coords.width, image2.coords.height);
};
var imageTimeoutReached = (image2) => {
  return image2 === IMAGE_TIMEOUT_STATUS;
};
var imageIsBeingLoaded = (image2) => {
  return image2 === IMAGE_LOADING_STATUS;
};

// src/action/text.ts
var getFontSizeForCalc = (def) => String(def.text.font?.size ?? 10);
var getFontSize = (def) => Number(def.text.font?.size ?? 10);
var getSpaceChart = () => String.fromCharCode(8202);
var ResolveTextAction = (ctx, def) => {
  let { x } = def.start, lines = [], previousColumnsLines = 0;
  const { start: { y }, size: { w }, text: text2 } = def, { columns, transY, lineHeight } = text2, value = [...text2.lines], linesAmount = Math.ceil(value.length / columns.amount), { textBaseline = "top" } = def.text;
  ctx.save();
  ctx.font = prepareFontShorthand(def, ctx, String(getFontSize(def)));
  ctx.textBaseline = textBaseline;
  while ((lines = value.splice(0, linesAmount)).length) {
    lines.forEach((text3, i3) => {
      const nextLine = lines[i3 + 1] || value[0] || [""];
      const isLast = i3 + 1 == lines.length || nextLine[0] == "" || text3[0][text3[0].length - 1] == "\n";
      const verticalMove = transY + (text3[1] - previousColumnsLines) * lineHeight;
      fillText(ctx, text3[0], def, x, y, w, verticalMove, isLast);
    });
    previousColumnsLines += lines[lines.length - 1][1] + 1;
    x += columns.gap + w;
  }
  ctx.restore();
};
var fillText = (ctx, text2, def, x, y, width, transY, isLast) => {
  const { color = "#000", outline = null } = def.text;
  const horizontal = def.text.align?.horizontal || "left";
  if (horizontal != "left") {
    ({ text: text2, x } = alignHorizontally(ctx, horizontal, text2, width, isLast, x));
  }
  if (transY > 0) {
    y = y + transY;
  }
  ctx.fillStyle = typeof color == "object" ? generateFill(color.type, color.style) : color;
  if (outline) {
    outlineText(ctx, outline, text2, x, y, width);
  }
  ctx.fillText(text2, x, y, width);
};
var outlineText = (ctx, outline, text2, x, y, width) => {
  if (!outline.fill?.style) {
    return;
  }
  ctx.strokeStyle = generateFill(outline.fill.type, outline.fill.style);
  ctx.lineWidth = outline.thickness;
  ctx.lineJoin = outline.lineJoin ?? "round";
  ctx.miterLimit = outline.miterLimit ?? 2;
  ctx.strokeText(text2, x, y, width);
};
var alignHorizontally = (ctx, horizontal, text2, width, isLast, x) => {
  const metrics = ctx.measureText(text2);
  const realWidth = metrics.width;
  if (horizontal == "center") {
    const transX = (width - realWidth) / 2;
    if (transX > 0) {
      x = x + transX;
    }
  } else if (horizontal == "right") {
    x = x + width - realWidth;
  } else if (horizontal == "justify" && !isLast) {
    text2 = justifyText(text2, metrics, width, ctx);
  }
  return { text: text2, x };
};
var justifyText = (text2, metrics, width, ctx) => {
  if (metrics.width >= width) {
    return text2;
  }
  const words = text2.split(" "), spacingMeasure = ctx.measureText(getSpaceChart()), spacings = Math.floor((width - metrics.width) / spacingMeasure.width), amount = spacings / (words.length - 1);
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
  let height = 0;
  const horizontal = def.group.gap.horizontal;
  rows.forEach((row) => {
    height += row.height + horizontal;
  });
  return height - horizontal;
};
var getRowsWidth = (def, rows) => {
  let width = 0;
  const vertical = def.group.gap.vertical;
  rows.forEach((row) => {
    if (def.group.direction === "column") {
      width = Math.max(width, row.width);
    } else {
      width += row.width + vertical;
    }
  });
  if (def.group.direction === "row") {
    width -= vertical;
  }
  return width;
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
  layout.forEach((layer, i3) => {
    if (def.group.wrap && size.w != 0 && row.width + layer.size.w > size.w || i3 != 0 && def.group.direction === "column") {
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
    const p = def.polygon.size.positive;
    p[dir] = Math.max(p[dir], value);
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
  const image2 = def.image, { w, h } = def.size;
  const { width: asWidth, height: asHeight } = calculateAspectRatioFit(
    image2.fit ?? "default",
    cached.width,
    cached.height,
    w,
    h
  ), xDiff = getImageHorizontalDiff(image2.align?.horizontal ?? "center", w, asWidth), yDiff = getImageVerticalDiff(image2.align?.vertical ?? "center", h, asHeight);
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
  const image2 = def.image, { w, h } = def.size, sWidth = source.width || 200, sHeight = source.height || 200;
  const { width: asWidth, height: asHeight } = calculateAspectRatioFit(
    image2.fit ?? "default",
    sWidth,
    sHeight,
    w,
    h
  ), xDiff = getImageHorizontalDiff(image2.align?.horizontal ?? "center", w, asWidth), yDiff = getImageVerticalDiff(image2.align?.vertical ?? "center", h, asHeight);
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
    for (let i3 = 0; i3 < dArr.length; i3++) {
      newDArr.push(dArr[i3]);
      const [cX, cY] = dArr[i3], [dX, dY] = i3 + 1 === dArr.length ? dArr[0] : dArr[i3 + 1];
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
  for (let i3 = 0; i3 < dArr.length; i3++) {
    ctx.drawImage(
      image2,
      thickness + dArr[i3][0] * thickness,
      thickness + dArr[i3][1] * thickness,
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
  const { w: width, h: height } = def.size;
  let fitTo = def.image.fitTo ?? "auto", x = 0, y = 0;
  if (fitTo === "auto") {
    fitTo = height > width ? "height" : "width";
  }
  if (fitTo === "height") {
    x = (width - image2.width * (height / image2.height)) / 2;
  } else if (fitTo === "width") {
    y = (height - image2.height * (width / image2.width)) / 2;
  }
  const canvas = document.createElement("canvas"), ctx = canvas.getContext("2d");
  canvas.setAttribute("width", String(width));
  canvas.setAttribute("height", String(height));
  ctx.drawImage(image2, x, y, width - x * 2, height - y * 2);
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
  const ratio = Math.min(maxWidth / srcWidth, maxHeight / srcHeight), width = srcWidth * ratio, height = srcHeight * ratio;
  return {
    width,
    height
  };
};
var getImageVerticalDiff = (align, height, asHeight) => {
  if (align == "top") {
    return 0;
  }
  if (align == "bottom") {
    return height - asHeight;
  }
  return (height - asHeight) / 2;
};
var getImageHorizontalDiff = (align, width, asWidth) => {
  if (align == "left") {
    return 0;
  }
  if (align == "right") {
    return width - asWidth;
  }
  return (width - asWidth) / 2;
};

// src/action/text.calc.ts
var ResolveTextSize = (def) => {
  let fontSize = def.text.font?.size;
  if (!fontSize || typeof fontSize == "string") {
    fontSize = 0;
  }
  return {
    start: {
      y: def.start.y,
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
  if (typeof def.text.color?.type == "string") {
    await calcFill(illustrator, def.text.color);
  }
  const {
    lines,
    lineHeight: preparedLineHeight,
    width,
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
  def.size.w = width;
  def.text.lines = lines;
  def.area = ResolveTextSize(def);
  return def;
};
var prepare = (def, ctx, width) => {
  const columns = def.text.columns ?? { gap: 0, amount: 1 }, fontSize = getFontSize(def), { textBaseline = "top" } = def.text;
  let { value: text2 } = def.text;
  ctx.save();
  ctx.font = prepareFontShorthand(def, ctx, String(fontSize));
  ctx.textBaseline = textBaseline;
  const colWidth = calcColumnWidth(width, columns);
  text2 = addSpacing(def, text2);
  const lines = getTextLines(def, text2, ctx, colWidth);
  ctx.restore();
  return {
    lines,
    fontSize,
    lineHeight: def.text.lineHeight ?? fontSize,
    width: colWidth,
    columns
  };
};
var getTextLines = (def, text2, ctx, width) => {
  if (!def.text.wrap) {
    return [[text2, 0]];
  }
  const rows = [];
  let words = text2.split(/[^\S\r\n]/), line = "", i3 = 0;
  while (words.length > 0) {
    const newLinePos = words[0].search(/[\r\n]/);
    if (newLinePos !== -1) {
      const newLine = words[0].substring(0, newLinePos);
      rows.push([(line + " " + newLine).trim() + "\n", i3]);
      line = "";
      i3++;
      words[0] = words[0].substring(newLinePos + 1);
      continue;
    }
    const metrics = ctx.measureText(line + words[0]);
    if (metrics.width > width) {
      if (line.length > 0) {
        rows.push([line.trim(), i3]);
        i3++;
      }
      line = "";
    }
    line += " " + words[0];
    words = words.splice(1);
  }
  if (line.length > 0) {
    rows.push([line.replace(/^\s+/, ""), i3]);
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
  return (rWidth - (columns.amount - 1) * columns.gap) / columns.amount;
};
var isSafari = () => {
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
};
var calcVerticalMove = (height, lineHeight, lines, vAlign) => {
  if (!height || lines.length * lineHeight >= height) {
    return 0;
  }
  const diff = height - lines.length * lineHeight;
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
  for (let i3 = 0; i3 < def.layout.length; i3++) {
    const subArea = def.layout[i3].area;
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
var o2 = { INIT: "antetype.init", CLOSE: "antetype.close", DRAW: "antetype.draw", CALC: "antetype.calc", RECALC_FINISHED: "antetype.recalc.finished", MODULES: "antetype.modules", SETTINGS: "antetype.settings.definition", TYPE_DEFINITION: "antetype.layer.type.definition", FONTS_LOADED: "antetype.font.loaded" };
var i2 = class {
  #e;
  #n = null;
  static inject = { minstrel: "boardmeister/minstrel", herald: "boardmeister/herald" };
  inject(e) {
    this.#e = e;
  }
  async #t(e, n) {
    let t = this.#e.minstrel.getResourceUrl(this, "core.js");
    return this.#n = (await import(t)).default, this.#n({ canvas: n, modules: e, herald: this.#e.herald });
  }
  async register(e) {
    let { modules: n, canvas: t } = e.detail;
    n.core = await this.#t(n, t);
  }
  static subscriptions = { [o2.MODULES]: "register" };
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
  #canvas;
  #modules;
  #ctx;
  #herald;
  constructor(canvas, modules, herald) {
    if (!canvas) {
      throw new Error("[Antetype Illustrator] Provided canvas is empty");
    }
    this.#canvas = canvas;
    this.#modules = modules;
    this.#herald = herald;
    this.#ctx = this.#canvas.getContext("2d");
    this.#registerEvents();
  }
  #registerEvents() {
    const unregister = this.#herald.batch([
      {
        event: o2.CLOSE,
        subscription: () => {
          unregister();
        }
      },
      {
        event: o2.DRAW,
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
        }
      },
      {
        event: o2.CALC,
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
        }
      },
      {
        event: o2.TYPE_DEFINITION,
        subscription: (event) => {
          const definitions = event.detail.definitions;
          definitions.text = text_default();
          definitions.group = group_default();
          definitions.image = image_default();
          definitions.polygon = polygon_default();
        }
      }
    ]);
  }
  reset() {
    this.#canvas.width += 0;
  }
  clear() {
    this.#ctx.clearRect(
      0,
      0,
      this.#canvas.width,
      this.#canvas.height
    );
  }
  async groupCalc(def, sessionId = null) {
    await ResolveGroupCalc(this.#modules, def, sessionId);
  }
  group(def) {
    ResolveGroupAction(this.#ctx, this.#modules, def);
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
      await ResolveCalcPolygon(def, step, this.#modules);
    }
    def.area = ResolvePolygonSize(def);
  }
  polygon({ polygon: { steps }, start: { x, y } }) {
    const ctx = this.#ctx;
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
    await ResolveImageCalc(this.#modules, def);
  }
  image(def) {
    ResolveImageAction(this.#ctx, def);
  }
  async textCalc(def) {
    await ResolveTextCalc(def, this.#modules, this.#ctx);
  }
  text(def) {
    ResolveTextAction(this.#ctx, def);
  }
  async calc(def) {
    const event = new CustomEvent(o.CALC, { detail: def });
    await this.#herald.dispatch(event);
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
export {
  Illustrator as default
};
