// ../../tool/antetype/dist/index.js
var Event = /* @__PURE__ */ ((Event22) => {
  Event22["STRUCTURE"] = "antetype.structure";
  Event22["DRAW"] = "antetype.draw";
  Event22["CALC"] = "antetype.calc";
  Event22["MIDDLE"] = "antetype.structure.middle";
  Event22["BAR_BOTTOM"] = "antetype.structure.bar.bottom";
  Event22["CENTER"] = "antetype.structure.center";
  Event22["COLUMN_LEFT"] = "antetype.structure.column.left";
  Event22["COLUMN_RIGHT"] = "antetype.structure.column.right";
  Event22["BAR_TOP"] = "antetype.structure.bar.top";
  Event22["MODULES"] = "antetype.modules";
  return Event22;
})(Event || {});

// ../antetype-workspace/dist/index.js
var t = ((e) => (e.STRUCTURE = "antetype.structure", e.DRAW = "antetype.draw", e.CALC = "antetype.calc", e.MIDDLE = "antetype.structure.middle", e.BAR_BOTTOM = "antetype.structure.bar.bottom", e.CENTER = "antetype.structure.center", e.COLUMN_LEFT = "antetype.structure.column.left", e.COLUMN_RIGHT = "antetype.structure.column.right", e.BAR_TOP = "antetype.structure.bar.top", e.MODULES = "antetype.modules", e))(t || {});
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
    const { height, width } = this.#getSize();
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
        const height2 = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
        return convertUnitToNumber(number) / 100 * height2;
      },
      "vw": (number) => {
        const width2 = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
        return convertUnitToNumber(number) / 100 * width2;
      },
      "default": (number) => number
    };
    let calculation = "";
    operation.split(" ").forEach((expression) => {
      expression = expression.trim();
      const last = expression[expression.length - 1], secondToLast = expression[expression.length - 2], result2 = (unitsTranslator[secondToLast + last] || unitsTranslator.default)(expression);
      calculation += String(isNaN(result2) ? 0 : result2);
    });
    const result = eval(calculation);
    if (result == void 0) {
      return NaN;
    }
    return result;
  }
  #getSystem() {
    return this.#modules.system;
  }
  #getSettings() {
    const height2 = this.#ctx.canvas.offsetHeight;
    return this.#getSystem().setting.get("workspace") ?? {
      height: height2,
      width: height2 * 0.707070707
    };
  }
  #getSize() {
    const ratio = this.#getSettings().width / this.#getSettings().height;
    let height2 = this.#ctx.canvas.offsetHeight, width2 = height2 * ratio;
    if (width2 > this.#ctx.canvas.offsetWidth) {
      width2 = this.#ctx.canvas.offsetWidth;
      height2 = width2 * (this.#getSettings().height / this.#getSettings().width);
    }
    return {
      width: width2,
      height: height2
    };
  }
  #isObject(value) {
    return typeof value === "object" && !Array.isArray(value) && value !== null;
  }
  async functionToNumber(data) {
    return await this.#iterateResolveAndCloneObject(data);
  }
  async #iterateResolveAndCloneObject(object) {
    const clone = {};
    await Promise.all(Object.keys(object).map(async (key) => {
      let result2 = await this.#resolve(object, key);
      if (this.#isObject(result2)) {
        result2 = await this.#iterateResolveAndCloneObject(result2);
      } else if (Array.isArray(result2)) {
        result2 = await this.#iterateResolveAndCloneArray(result2);
      }
      clone[key] = result2;
    }));
    return clone;
  }
  async #iterateResolveAndCloneArray(object) {
    const clone = [];
    await Promise.all(Object.keys(object).map(async (key) => {
      let result2 = await this.#resolve(object, key);
      if (this.#isObject(result2)) {
        result2 = await this.#iterateResolveAndCloneObject(result2);
      } else if (Array.isArray(result2)) {
        result2 = await this.#iterateResolveAndCloneArray(result2);
      }
      clone.push(result2);
    }));
    return clone;
  }
  async #resolve(object, key) {
    const value = object[key];
    const resolved = typeof value == "function" ? await value(this.#modules, object) : value;
    const calculated = this.calc(resolved);
    return isNaN(resolved) ? resolved : calculated;
  }
};
var Event2 = /* @__PURE__ */ ((Event22) => {
  Event22["CALC"] = "antetype.workspace.calc";
  return Event22;
})(Event2 || {});
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
  async functionToNumber(event) {
    event.detail.element = await this.#instance.functionToNumber(event.detail.element);
  }
  static subscriptions = {
    [
      "antetype.workspace.calc"
      /* CALC */
    ]: "calc",
    [t.CALC]: [
      {
        method: "functionToNumber",
        priority: -255
      }
    ],
    [t.MODULES]: "register",
    [t.DRAW]: [
      {
        method: "draw",
        priority: 10
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
    if (!this.#instance) {
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
