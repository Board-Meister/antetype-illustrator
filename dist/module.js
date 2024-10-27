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
function ResolvePolygonAction(ctx, action) {
  const objSwitch = {
    fill: (action2) => {
      Actions.fill(ctx, action2.args);
    },
    line: (action2) => {
      Actions.line(ctx, action2.args.x, action2.args.y);
    },
    curve: (action2) => Actions.curve(
      ctx,
      action2.args.cp1x,
      action2.args.cp1y,
      action2.args.cp2x,
      action2.args.cp2y,
      action2.args.x,
      action2.args.y
    ),
    stroke: (action2) => Actions.stroke(
      ctx,
      action2.args.thickness ?? 5,
      action2.args.fill ?? "#000",
      action2.args.lineJoin ?? "round",
      action2.args.miterLimit ?? 2
    ),
    begin: (action2) => Actions.begin(ctx, action2.args.x, action2.args.y),
    move: (action2) => Actions.move(ctx, action2.args.x, action2.args.y),
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
  const image = new Image(), { timeout = 3e4 } = def;
  image.crossOrigin = "anonymous";
  image.src = src;
  const promise = new Promise((resolve) => {
    const timeoutTimer = setTimeout(() => {
      loadedImages[src] = IMAGE_TIMEOUT_STATUS;
      resolve();
      void modules.system.redraw();
    }, timeout);
    image.onerror = () => {
      clearTimeout(timeoutTimer);
      loadedImages[src] = IMAGE_ERROR_STATUS;
      resolve();
      void modules.system.redraw();
    };
    image.onload = () => {
      clearTimeout(timeoutTimer);
      loadedImages[src] = image;
      resolve();
      void modules.system.redraw();
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

// ../../tool/antetype/dist/index.js
var t = ((e) => (e.STRUCTURE = "antetype.structure", e.DRAW = "antetype.draw", e.MIDDLE = "antetype.structure.middle", e.BAR_BOTTOM = "antetype.structure.bar.bottom", e.CENTER = "antetype.structure.center", e.COLUMN_LEFT = "antetype.structure.column.left", e.COLUMN_RIGHT = "antetype.structure.column.right", e.BAR_TOP = "antetype.structure.bar.top", e.MODULES = "antetype.modules", e))(t || {});

// src/module.tsx
var Illustrator = class {
  #canvas;
  #modules;
  #injected;
  #ctx;
  constructor(canvas, modules, injected) {
    if (!canvas) {
      throw new Error("[Antetype Illustrator] Provided canvas is empty");
    }
    this.#canvas = canvas;
    this.#modules = modules;
    this.#ctx = this.#canvas.getContext("2d");
    this.#injected = injected;
    this.registerDrawEvents();
  }
  /**
   * @TODO verify that we don't have to unregister our events. In theory this is a singleton but let's make sure
   *       that it works as intended
   */
  registerDrawEvents() {
    this.#injected.herald.batch([
      {
        event: t.DRAW,
        subscription: (event) => {
          const { element } = event.detail;
          const typeToAction = {
            clear: this.clear.bind(this),
            polygon: this.polygon.bind(this),
            image: this.image.bind(this)
          };
          const el = typeToAction[element.type];
          if (typeof el == "function") {
            el(element);
          }
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
  polygon({ steps, start: { x, y } }) {
    const ctx = this.#ctx;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x, y);
    steps.forEach((step) => {
      ResolvePolygonAction(ctx, step);
    });
    ctx.closePath();
    ctx.restore();
  }
  async image(def) {
    return ResolveImageAction(this.#ctx, this.#modules, def);
  }
};
export {
  Illustrator as default
};
