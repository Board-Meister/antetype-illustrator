// src/shared.tsx
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
    curve: (action2) => Actions.curve(
      ctx,
      action2.args.cp1x + x,
      action2.args.cp1y + y,
      action2.args.cp2x + x,
      action2.args.cp2y + y,
      action2.args.x + x,
      action2.args.y + y
    ),
    stroke: (action2) => Actions.stroke(
      ctx,
      action2.args.thickness ?? 5,
      action2.args.fill ?? "#000",
      action2.args.lineJoin ?? "round",
      action2.args.miterLimit ?? 2
    ),
    begin: (action2) => Actions.begin(ctx, action2.args.x + x, action2.args.y + y),
    move: (action2) => Actions.move(ctx, action2.args.x + x, action2.args.y + y),
    close: () => Actions.close(ctx)
  };
  if (!action.means) {
    action.means = "line";
  }
  if (!objSwitch[action.means]) {
    return;
  }
  objSwitch[action.means](action);
}

// src/action/image.tsx
var IMAGE_ERROR_STATUS = Symbol("error");
var IMAGE_TIMEOUT_STATUS = Symbol("timeout");
var IMAGE_LOADING_STATUS = Symbol("loading");
var loadedImages = {};
var ResolveImageAction = async (ctx, modules, def) => {
  const src = def.image.src;
  const source = typeof src == "function" ? await src(def) : src;
  const cachedImage = typeof source == "string" ? loadedImages[source] : null;
  console.log("image", src);
  if (imageTimeoutReached(cachedImage) || imageIsBeingLoaded(cachedImage)) {
    return;
  }
  if (source instanceof Image || cachedImage instanceof Image) {
    void drawImage(
      ctx,
      source instanceof Image ? source : cachedImage,
      def
    );
    return;
  }
  if (typeof source != "string" || !source.startsWith("http") && !source.startsWith("/")) {
    console.warn("Image `" + source + "` has invalid source");
    return;
  }
  void loadImage(def, source, modules);
};
var imageTimeoutReached = (image) => {
  return image === IMAGE_TIMEOUT_STATUS;
};
var imageIsBeingLoaded = (image) => {
  return image === IMAGE_LOADING_STATUS;
};
var loadImage = async (def, src, modules) => {
  console.log("load image");
  const image = new Image(), { image: { timeout = 3e4 } } = def;
  image.crossOrigin = "anonymous";
  image.src = src;
  const promise = new Promise((resolve) => {
    const timeoutTimer = setTimeout(() => {
      loadedImages[src] = IMAGE_TIMEOUT_STATUS;
      resolve();
      void modules.system.redrawDebounce();
    }, timeout);
    image.onerror = () => {
      clearTimeout(timeoutTimer);
      loadedImages[src] = IMAGE_ERROR_STATUS;
      resolve();
      void modules.system.redrawDebounce();
    };
    image.onload = () => {
      clearTimeout(timeoutTimer);
      loadedImages[src] = image;
      resolve();
      void modules.system.redrawDebounce();
    };
  });
  loadedImages[src] = IMAGE_LOADING_STATUS;
  await promise;
};
var drawImage = async (ctx, source, def) => {
  const { image, start } = def;
  ctx.save();
  const { w, h } = image.size;
  const { width: asWidth, height: asHeight } = calculateAspectRatioFit(
    image.fit ?? "default",
    source.width,
    source.height,
    w,
    h
  ), leftDiff = getImageHorizontalDiff(image.align?.horizontal ?? "center", w, asWidth), topDiff = getImageVerticalDiff(image.align?.vertical ?? "center", h, asHeight), x = start.x + leftDiff, y = start.y + topDiff;
  if (image.fit === "crop") {
    source = await cropImage(source, def);
  }
  if (image.overcolor) {
    source = await overcolorImage(source, def, asWidth, asHeight);
  }
  if (image.outline) {
    source = await outlineImage(source, def, asWidth, asHeight);
  }
  ctx.drawImage(source, x, y, asWidth, asHeight);
  ctx.restore();
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
    for (let i = 0; i < dArr.length; i++) {
      newDArr.push(dArr[i]);
      const [cX, cY] = dArr[i], [dX, dY] = i + 1 === dArr.length ? dArr[0] : dArr[i + 1];
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
  for (let i = 0; i < dArr.length; i++) {
    ctx.drawImage(
      image,
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
  ctx.drawImage(image, thickness, thickness, asWidth, asHeight);
  return canvasToWebp(canvas, image);
};
var canvasToWebp = async (canvas, dft) => {
  const url = canvas.toDataURL("image/webp"), image = new Image();
  image.src = url;
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
  const { w: width, h: height } = def.image.size;
  let fitTo = def.image.fitTo ?? "auto", x = 0, y = 0;
  if (fitTo === "auto") {
    fitTo = height > width ? "height" : "width";
  }
  if (fitTo === "height") {
    x = (width - image.width * (height / image.height)) / 2;
  } else if (fitTo === "width") {
    y = (height - image.height * (width / image.width)) / 2;
  }
  const canvas = document.createElement("canvas"), ctx = canvas.getContext("2d");
  canvas.setAttribute("width", String(width));
  canvas.setAttribute("height", String(height));
  ctx.drawImage(image, x, y, width - x * 2, height - y * 2);
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

// src/action/text.tsx
var ResolveTextAction = async (ctx, def) => {
  let { x, y } = def.start;
  const { h } = def.text.size;
  ctx.save();
  const { lines: texts, fontSize, lineHeight, width: columnWidth, columns } = await prepare(def, ctx), linesAmount = Math.ceil(texts.length / columns.amount);
  if (isSafari()) {
    y -= fontSize * 0.2;
  }
  const transY = calcVerticalMove(h, lineHeight, texts, def.text.align?.vertical || "top");
  let lines = [], previousColumnsLines = 0;
  while ((lines = texts.splice(0, linesAmount)).length) {
    lines.forEach((text, i) => {
      const nextLine = lines[i + 1] || texts[0] || [""];
      const isLast = i + 1 == lines.length || nextLine[0] == "" || text[0][text[0].length - 1] == "\n";
      const verticalMove = transY + (text[1] - previousColumnsLines) * lineHeight;
      fillText(ctx, text[0], def, x, y, columnWidth, verticalMove, isLast);
    });
    previousColumnsLines += lines[lines.length - 1][1] + 1;
    x += columns.gap + columnWidth;
  }
  ctx.restore();
};
var fillText = (ctx, text, def, x, y, width, transY, isLast) => {
  const { color = "#000", outline = null } = def.text;
  const horizontal = def.text.align?.horizontal || "left";
  if (horizontal != "left") {
    ({ text, x } = alignHorizontally(ctx, horizontal, text, width, isLast, x));
  }
  if (transY > 0) {
    y = y + transY;
  }
  ctx.fillStyle = typeof color == "object" ? generateFill(color.type, color.style) : color;
  if (outline) {
    outlineText(ctx, outline, text, x, y, width);
  }
  ctx.fillText(text, x, y, width);
};
var outlineText = (ctx, outline, text, x, y, width) => {
  ctx.strokeStyle = generateFill(outline.fill.type, outline.fill.style);
  ctx.lineWidth = outline.thickness;
  ctx.lineJoin = outline.lineJoin ?? "round";
  ctx.miterLimit = outline.miterLimit ?? 2;
  ctx.strokeText(text, x, y, width);
};
var alignHorizontally = (ctx, horizontal, text, width, isLast, x) => {
  const metrics = ctx.measureText(text);
  const realWidth = metrics.width;
  if (horizontal == "center") {
    const transX = (width - realWidth) / 2;
    if (transX > 0) {
      x = x + transX;
    }
  } else if (horizontal == "right") {
    x = x + width - realWidth;
  } else if (horizontal == "justify" && !isLast) {
    text = justifyText(text, metrics, width, ctx);
  }
  return { text, x };
};
var justifyText = (text, metrics, width, ctx) => {
  if (metrics.width >= width) {
    return text;
  }
  const words = text.split(" "), spacingMeasure = ctx.measureText(getSpaceChart()), spacings = Math.floor((width - metrics.width) / spacingMeasure.width), amount = spacings / (words.length - 1);
  for (let j = 0; j < words.length - 1; j++) {
    words[j] += getSpaceChart().repeat(amount);
  }
  return words.join(" ");
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
var prepare = async (def, ctx) => {
  const { size: { w }, textBaseline = "top" } = def.text;
  let { value: text } = def.text;
  const columns = def.text.columns ?? { amount: 1, gap: 0 };
  const width = calcColumnWidth(w, columns);
  ctx.font = prepareFontShorthand(def, ctx);
  text = addSpacing(def, text);
  ctx.textBaseline = textBaseline;
  const lines = getTextLines(def, text, ctx, width);
  const fontSize = getFontSize(def);
  return {
    lines,
    fontSize,
    lineHeight: def.text.lineHeight ?? fontSize,
    width,
    columns
  };
};
var getTextLines = (def, text, ctx, width) => {
  if (!def.text.wrap) {
    return [[text, 0]];
  }
  const rows = [];
  let words = text.split(/[^\S\r\n]/), line = "", i = 0;
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
    if (metrics.width > width) {
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
var addSpacing = (def, text) => {
  if (!def.text.spacing) {
    return text;
  }
  return text.split("").join(getSpaceChart().repeat(def.text.spacing));
};
var getSpaceChart = () => String.fromCharCode(8202);
var getFontSize = (def) => Number(def.text.font?.size || 10);
var prepareFontShorthand = (def, ctx) => {
  const { font = null } = def.text;
  if (!font) {
    return ctx.font;
  }
  const fontSize = getFontSize(def) + "px ";
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
var calcColumnWidth = (rWidth, columns) => {
  return (rWidth - (columns.amount - 1) * columns.gap) / columns.amount;
};
var isSafari = () => {
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
};

// src/action/group.tsx
var ResolveGroupAction = async (ctx, modules, group) => {
  console.log("group", group);
  ctx.save();
  ctx.translate(group.start.x, group.start.y);
  for (const layer of group.layout) {
    await modules.system.draw(layer);
  }
  ctx.restore();
};

// src/module.tsx
var Illustrator = class {
  #canvas;
  #modules;
  #ctx;
  constructor(canvas, modules) {
    if (!canvas) {
      throw new Error("[Antetype Illustrator] Provided canvas is empty");
    }
    this.#canvas = canvas;
    this.#modules = modules;
    this.#ctx = this.#canvas.getContext("2d");
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
  async group(def) {
    await ResolveGroupAction(this.#ctx, this.#modules, def);
  }
  async polygon({ steps, start: { x, y } }) {
    const ctx = this.#ctx;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x, y);
    for (const step of steps) {
      await ResolvePolygonAction(ctx, step, x, y);
    }
    ctx.closePath();
    ctx.restore();
  }
  async image(def) {
    return ResolveImageAction(this.#ctx, this.#modules, def);
  }
  async text(def) {
    await ResolveTextAction(this.#ctx, def);
  }
};
export {
  Illustrator as default
};
