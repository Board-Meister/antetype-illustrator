// ../../tool/antetype/dist/index.js
var Event = /* @__PURE__ */ ((Event23) => {
  Event23["STRUCTURE"] = "antetype.structure";
  Event23["DRAW"] = "antetype.draw";
  Event23["CALC"] = "antetype.calc";
  Event23["SIZE"] = "antetype.size";
  Event23["MIDDLE"] = "antetype.structure.middle";
  Event23["BAR_BOTTOM"] = "antetype.structure.bar.bottom";
  Event23["CENTER"] = "antetype.structure.center";
  Event23["COLUMN_LEFT"] = "antetype.structure.column.left";
  Event23["COLUMN_RIGHT"] = "antetype.structure.column.right";
  Event23["BAR_TOP"] = "antetype.structure.bar.top";
  Event23["MODULES"] = "antetype.modules";
  return Event23;
})(Event || {});

// ../antetype-workspace/dist/index.js
var Event2 = /* @__PURE__ */ ((Event222) => {
  Event222["STRUCTURE"] = "antetype.structure";
  Event222["DRAW"] = "antetype.draw";
  Event222["CALC"] = "antetype.calc";
  Event222["MIDDLE"] = "antetype.structure.middle";
  Event222["BAR_BOTTOM"] = "antetype.structure.bar.bottom";
  Event222["CENTER"] = "antetype.structure.center";
  Event222["COLUMN_LEFT"] = "antetype.structure.column.left";
  Event222["COLUMN_RIGHT"] = "antetype.structure.column.right";
  Event222["BAR_TOP"] = "antetype.structure.bar.top";
  Event222["MODULES"] = "antetype.modules";
  return Event222;
})(Event2 || {});
var cloned = Symbol("cloned");
var Workspace = class {
  #maxDepth = 50;
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
  setOrigin() {
    this.#translationSet++;
    if (this.#translationSet > 1) {
      return;
    }
    const ctx = this.#ctx;
    ctx.save();
    const { height: height2, width: width2 } = this.#getSize();
    ctx.translate((ctx.canvas.offsetWidth - width2) / 2, (ctx.canvas.offsetHeight - height2) / 2);
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
  async cloneDefinitions(data) {
    return await this.#iterateResolveAndCloneObject(data, /* @__PURE__ */ new WeakMap());
  }
  #decimal(number, precision = 2) {
    return +number.toFixed(precision);
  }
  #getSystem() {
    return this.#modules.system;
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
  #isObject(value) {
    return typeof value === "object" && !Array.isArray(value) && value !== null;
  }
  async #iterateResolveAndCloneObject(object, recursive, depth = 0) {
    if (recursive.has(object)) {
      return recursive.get(object);
    }
    if (object[cloned]) {
      return object;
    }
    const clone = {};
    recursive.set(object, clone);
    clone[cloned] = true;
    if (this.#maxDepth <= depth + 1) {
      console.error("We've reach limit depth!", object);
      throw new Error("limit reached");
    }
    await Promise.all(Object.keys(object).map(async (key) => {
      let result2 = await this.#resolve(object, key);
      if (this.#isObject(result2)) {
        result2 = await this.#iterateResolveAndCloneObject(result2, recursive, depth + 1);
      } else if (Array.isArray(result2)) {
        result2 = await this.#iterateResolveAndCloneArray(result2, recursive, depth + 1);
      }
      clone[key] = result2;
    }));
    return clone;
  }
  async #iterateResolveAndCloneArray(object, recursive, depth = 0) {
    const clone = [];
    if (this.#maxDepth <= depth + 1) {
      console.error("We've reach limit depth!", object);
      throw new Error("limit reached");
    }
    await Promise.all(Object.keys(object).map(async (key) => {
      let result2 = await this.#resolve(object, key);
      if (this.#isObject(result2)) {
        result2 = await this.#iterateResolveAndCloneObject(result2, recursive, depth + 1);
      } else if (Array.isArray(result2)) {
        result2 = await this.#iterateResolveAndCloneArray(result2, recursive, depth + 1);
      }
      clone.push(result2);
    }));
    return clone;
  }
  async #resolve(object, key) {
    const value = object[key];
    return typeof value == "function" ? await value(this.#modules, this.#ctx, object) : value;
  }
};
var Event22 = /* @__PURE__ */ ((Event32) => {
  Event32["CALC"] = "antetype.workspace.calc";
  return Event32;
})(Event22 || {});
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
  /**
   * @TODO Should this be moved to the core?
   */
  async cloneDefinitions(event) {
    if (event.detail.element === null) {
      return;
    }
    event.detail.element = await this.#instance.cloneDefinitions(event.detail.element);
  }
  static subscriptions = {
    [
      "antetype.workspace.calc"
      /* CALC */
    ]: "calc",
    [Event2.CALC]: [
      {
        method: "cloneDefinitions",
        priority: -255
      }
    ],
    [Event2.MODULES]: "register",
    [Event2.DRAW]: [
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
    ]
  };
};
var EnAntetypeWorkspace = AntetypeWorkspace;
var src_default = EnAntetypeWorkspace;

// src/action/image.tsx
var IMAGE_ERROR_STATUS = Symbol("error");
var IMAGE_TIMEOUT_STATUS = Symbol("timeout");
var IMAGE_LOADING_STATUS = Symbol("loading");

// src/type/event.d.tsx
var Event3 = /* @__PURE__ */ ((Event4) => {
  Event4["CALC"] = "antetype.illustrator.calc";
  return Event4;
})(Event3 || {});

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
    [Event.DRAW]: "draw",
    [Event.CALC]: "calc"
  };
};
var EnAntetypeIllustrator = AntetypeIllustrator;
var src_default2 = EnAntetypeIllustrator;
export {
  AntetypeIllustrator,
  Event3 as Event,
  src_default2 as default
};
