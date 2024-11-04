// ../../tool/antetype/dist/index.js
var t = ((e) => (e.STRUCTURE = "antetype.structure", e.DRAW = "antetype.draw", e.MIDDLE = "antetype.structure.middle", e.BAR_BOTTOM = "antetype.structure.bar.bottom", e.CENTER = "antetype.structure.center", e.COLUMN_LEFT = "antetype.structure.column.left", e.COLUMN_RIGHT = "antetype.structure.column.right", e.BAR_TOP = "antetype.structure.bar.top", e.MODULES = "antetype.modules", e))(t || {});

// src/action/image.tsx
var IMAGE_ERROR_STATUS = Symbol("error");
var IMAGE_TIMEOUT_STATUS = Symbol("timeout");
var IMAGE_LOADING_STATUS = Symbol("loading");

// src/type/event.d.tsx
var Event = /* @__PURE__ */ ((Event2) => {
  Event2["CALC"] = "antetype.illustrator.calc";
  return Event2;
})(Event || {});

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
  static subscriptions = {
    [t.MODULES]: "register",
    [t.DRAW]: "draw"
  };
};
var EnAntetypeIllustrator = AntetypeIllustrator;
var src_default = EnAntetypeIllustrator;
export {
  AntetypeIllustrator,
  Event,
  src_default as default
};
