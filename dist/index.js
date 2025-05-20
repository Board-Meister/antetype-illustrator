// node_modules/@boardmeister/antetype-core/dist/index.js
var o = { INIT: "antetype.init", CLOSE: "antetype.close", DRAW: "antetype.draw", CALC: "antetype.calc", RECALC_FINISHED: "antetype.recalc.finished", MODULES: "antetype.modules", SETTINGS: "antetype.settings.definition", TYPE_DEFINITION: "antetype.layer.type.definition", FONTS_LOADED: "antetype.font.loaded" };
var i = class {
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
  static subscriptions = { [o.MODULES]: "register" };
};

// src/index.ts
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
    modules.illustrator = new this.#module(canvas, modules, this.#injected.herald);
  }
  static subscriptions = {
    [o.MODULES]: "register"
  };
};
var EnAntetypeIllustrator = AntetypeIllustrator;
var src_default = EnAntetypeIllustrator;
export {
  AntetypeIllustrator,
  src_default as default
};
