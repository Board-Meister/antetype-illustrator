// ../../tool/antetype/dist/index.js
var t = ((e) => (e.STRUCTURE = "antetype.structure", e.DRAW = "antetype.draw", e.MIDDLE = "antetype.structure.middle", e.BAR_BOTTOM = "antetype.structure.bar.bottom", e.CENTER = "antetype.structure.center", e.COLUMN_LEFT = "antetype.structure.column.left", e.COLUMN_RIGHT = "antetype.structure.column.right", e.BAR_TOP = "antetype.structure.bar.top", e.MODULES = "antetype.modules", e))(t || {});

// src/index.tsx
var AntetypeIllustrator = class {
  #module = null;
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
    modules.illustrator = new this.#module(canvas, modules, this.#injected);
  }
  static subscriptions = {
    [t.MODULES]: "register"
  };
};
var EnAntetypeIllustrator = AntetypeIllustrator;
var src_default = EnAntetypeIllustrator;
export {
  AntetypeIllustrator,
  src_default as default
};
