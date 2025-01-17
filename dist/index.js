// ../../tool/antetype/dist/index.js
var Event = /* @__PURE__ */ ((Event23) => {
  Event23["STRUCTURE"] = "antetype.structure";
  Event23["MIDDLE"] = "antetype.structure.middle";
  Event23["BAR_BOTTOM"] = "antetype.structure.bar.bottom";
  Event23["CENTER"] = "antetype.structure.center";
  Event23["COLUMN_LEFT"] = "antetype.structure.column.left";
  Event23["COLUMN_RIGHT"] = "antetype.structure.column.right";
  Event23["BAR_TOP"] = "antetype.structure.bar.top";
  Event23["MODULES"] = "antetype.modules";
  return Event23;
})(Event || {});

// ../antetype-core/dist/index.js
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
  async #n(e, n) {
    if (!this.#e) {
      let r = this.#t.minstrel.getResourceUrl(this, "core.js");
      this.#r = (await import(r)).default, this.#e = this.#r({ canvas: n, modules: e, injected: this.#t });
    }
    return this.#e;
  }
  async register(e) {
    let { modules: n, canvas: r } = e.detail;
    n.core = await this.#n(n, r);
  }
  async init(e) {
    if (!this.#e) throw new Error("Instance not loaded, trigger registration event first");
    let { base: n, settings: r } = e.detail;
    for (let a in r) this.#e.setting.set(a, r[a]);
    let o = this.#e.meta.document;
    o.base = n;
    let l = [];
    return (this.#e.setting.get("fonts") ?? []).forEach((a) => {
      l.push(this.#e.font.load(a));
    }), await Promise.all(l), o.layout = await this.#e.view.recalculate(o, o.base), await this.#e.view.redraw(o.layout), o;
  }
  async cloneDefinitions(e) {
    if (!this.#e) throw new Error("Instance not loaded, trigger registration event first");
    e.detail.element !== null && (e.detail.element = await this.#e.clone.definitions(e.detail.element));
  }
  static subscriptions = { [i.MODULES]: "register", "antetype.init": "init", "antetype.calc": [{ method: "cloneDefinitions", priority: -255 }] };
};

// ../antetype-workspace/dist/index.js
var Event2 = /* @__PURE__ */ ((Event222) => {
  Event222["STRUCTURE"] = "antetype.structure";
  Event222["MIDDLE"] = "antetype.structure.middle";
  Event222["BAR_BOTTOM"] = "antetype.structure.bar.bottom";
  Event222["CENTER"] = "antetype.structure.center";
  Event222["COLUMN_LEFT"] = "antetype.structure.column.left";
  Event222["COLUMN_RIGHT"] = "antetype.structure.column.right";
  Event222["BAR_TOP"] = "antetype.structure.bar.top";
  Event222["MODULES"] = "antetype.modules";
  return Event222;
})(Event2 || {});
var i2 = ((t) => (t.STRUCTURE = "antetype.structure", t.MIDDLE = "antetype.structure.middle", t.BAR_BOTTOM = "antetype.structure.bar.bottom", t.CENTER = "antetype.structure.center", t.COLUMN_LEFT = "antetype.structure.column.left", t.COLUMN_RIGHT = "antetype.structure.column.right", t.BAR_TOP = "antetype.structure.bar.top", t.MODULES = "antetype.modules", t))(i2 || {});
var c2 = ((r) => (r.INIT = "antetype.init", r.DRAW = "antetype.draw", r.CALC = "antetype.calc", r))(c2 || {});
var s2 = class {
  #t;
  #r = null;
  #e = null;
  static inject = { minstrel: "boardmeister/minstrel", herald: "boardmeister/herald" };
  inject(e) {
    this.#t = e;
  }
  async #n(e, n) {
    if (!this.#e) {
      let r = this.#t.minstrel.getResourceUrl(this, "core.js");
      this.#r = (await import(r)).default, this.#e = this.#r({ canvas: n, modules: e, injected: this.#t });
    }
    return this.#e;
  }
  async register(e) {
    let { modules: n, canvas: r } = e.detail;
    n.core = await this.#n(n, r);
  }
  async init(e) {
    if (!this.#e) throw new Error("Instance not loaded, trigger registration event first");
    let { base: n, settings: r } = e.detail;
    for (let a in r) this.#e.setting.set(a, r[a]);
    let o = this.#e.meta.document;
    o.base = n;
    let l = [];
    return (this.#e.setting.get("fonts") ?? []).forEach((a) => {
      l.push(this.#e.font.load(a));
    }), await Promise.all(l), o.layout = await this.#e.view.recalculate(o, o.base), await this.#e.view.redraw(o.layout), o;
  }
  async cloneDefinitions(e) {
    if (!this.#e) throw new Error("Instance not loaded, trigger registration event first");
    e.detail.element !== null && (e.detail.element = await this.#e.clone.definitions(e.detail.element));
  }
  static subscriptions = { [i2.MODULES]: "register", "antetype.init": "init", "antetype.calc": [{ method: "cloneDefinitions", priority: -255 }] };
};
var Event22 = /* @__PURE__ */ ((Event32) => {
  Event32["POSITION"] = "antetype.cursor.position";
  Event32["DOWN"] = "antetype.cursor.on.down";
  Event32["UP"] = "antetype.cursor.on.up";
  Event32["MOVE"] = "antetype.cursor.on.move";
  return Event32;
})(Event22 || {});
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
  }
  // @TODO there is not unregister method to remove all subscriptions
  draw(event) {
    if (!this.#instance) {
      return;
    }
    const { element } = event.detail;
    const typeToAction = {
      selection: this.#instance.drawSelection
    };
    const el = typeToAction[element.type];
    if (typeof el == "function") {
      el(element);
    }
  }
  static subscriptions = {
    [Event2.MODULES]: "register",
    [c2.DRAW]: "draw"
  };
};
var Event3 = /* @__PURE__ */ ((Event222) => {
  Event222["STRUCTURE"] = "antetype.structure";
  Event222["MIDDLE"] = "antetype.structure.middle";
  Event222["BAR_BOTTOM"] = "antetype.structure.bar.bottom";
  Event222["CENTER"] = "antetype.structure.center";
  Event222["COLUMN_LEFT"] = "antetype.structure.column.left";
  Event222["COLUMN_RIGHT"] = "antetype.structure.column.right";
  Event222["BAR_TOP"] = "antetype.structure.bar.top";
  Event222["MODULES"] = "antetype.modules";
  return Event222;
})(Event3 || {});
var i22 = ((t) => (t.STRUCTURE = "antetype.structure", t.MIDDLE = "antetype.structure.middle", t.BAR_BOTTOM = "antetype.structure.bar.bottom", t.CENTER = "antetype.structure.center", t.COLUMN_LEFT = "antetype.structure.column.left", t.COLUMN_RIGHT = "antetype.structure.column.right", t.BAR_TOP = "antetype.structure.bar.top", t.MODULES = "antetype.modules", t))(i22 || {});
var c22 = ((r) => (r.INIT = "antetype.init", r.DRAW = "antetype.draw", r.CALC = "antetype.calc", r))(c22 || {});
var s22 = class {
  #t;
  #r = null;
  #e = null;
  static inject = { minstrel: "boardmeister/minstrel", herald: "boardmeister/herald" };
  inject(e) {
    this.#t = e;
  }
  async #n(e, n) {
    if (!this.#e) {
      let r = this.#t.minstrel.getResourceUrl(this, "core.js");
      this.#r = (await import(r)).default, this.#e = this.#r({ canvas: n, modules: e, injected: this.#t });
    }
    return this.#e;
  }
  async register(e) {
    let { modules: n, canvas: r } = e.detail;
    n.core = await this.#n(n, r);
  }
  async init(e) {
    if (!this.#e) throw new Error("Instance not loaded, trigger registration event first");
    let { base: n, settings: r } = e.detail;
    for (let a in r) this.#e.setting.set(a, r[a]);
    let o = this.#e.meta.document;
    o.base = n;
    let l = [];
    return (this.#e.setting.get("fonts") ?? []).forEach((a) => {
      l.push(this.#e.font.load(a));
    }), await Promise.all(l), o.layout = await this.#e.view.recalculate(o, o.base), await this.#e.view.redraw(o.layout), o;
  }
  async cloneDefinitions(e) {
    if (!this.#e) throw new Error("Instance not loaded, trigger registration event first");
    e.detail.element !== null && (e.detail.element = await this.#e.clone.definitions(e.detail.element));
  }
  static subscriptions = { [i22.MODULES]: "register", "antetype.init": "init", "antetype.calc": [{ method: "cloneDefinitions", priority: -255 }] };
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
    const { height: height2, width: width2 } = this.#getSize();
    ctx.clearRect(
      -this.getLeft(),
      -this.getTop(),
      this.#canvas.width,
      this.#canvas.height
    );
    ctx.fillStyle = "#FFF";
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
  toRelative(value, direction = "x") {
    const { height: height2, width: width2 } = this.#getSizeRelative();
    if (direction === "x") {
      return value / height2 * 100 + "h%";
    }
    return value / width2 * 100 + "w%";
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
var Event4 = /* @__PURE__ */ ((Event52) => {
  Event52["CALC"] = "antetype.workspace.calc";
  return Event52;
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
    [c22.DRAW]: [
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
    [Event22.POSITION]: "subtractWorkspace"
  };
};
var EnAntetypeWorkspace = AntetypeWorkspace;
var src_default = EnAntetypeWorkspace;

// src/action/image.tsx
var IMAGE_ERROR_STATUS = Symbol("error");
var IMAGE_TIMEOUT_STATUS = Symbol("timeout");
var IMAGE_LOADING_STATUS = Symbol("loading");

// src/type/event.d.tsx
var Event5 = /* @__PURE__ */ ((Event6) => {
  Event6["CALC"] = "antetype.illustrator.calc";
  return Event6;
})(Event5 || {});

// src/index.tsx
var AntetypeIllustrator = class {
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
    this.#instance = modules.illustrator = new this.#module(canvas, modules, this.#injected);
  }
  async draw(event) {
    if (!this.#instance) {
      return;
    }
    const { element } = event.detail;
    const typeToAction = {
      clear: this.#instance.clear.bind(this.#instance),
      polygon: this.#instance.polygon.bind(this.#instance),
      image: this.#instance.image.bind(this.#instance),
      text: this.#instance.text.bind(this.#instance),
      group: this.#instance.group.bind(this.#instance)
    };
    const el = typeToAction[element.type];
    if (typeof el == "function") {
      await el(element);
    }
  }
  async calc(event) {
    if (!this.#instance || event.detail.element === null) {
      return;
    }
    const { element } = event.detail;
    const typeToAction = {
      polygon: this.#instance.polygonCalc.bind(this.#instance),
      image: this.#instance.imageCalc.bind(this.#instance),
      text: this.#instance.textCalc.bind(this.#instance),
      group: this.#instance.groupCalc.bind(this.#instance)
    };
    const el = typeToAction[element.type];
    if (typeof el == "function") {
      await el(element);
    }
  }
  static subscriptions = {
    [Event.MODULES]: "register",
    [c.DRAW]: "draw",
    [c.CALC]: "calc"
  };
};
var EnAntetypeIllustrator = AntetypeIllustrator;
var src_default2 = EnAntetypeIllustrator;
export {
  AntetypeIllustrator,
  Event5 as Event,
  src_default2 as default
};
