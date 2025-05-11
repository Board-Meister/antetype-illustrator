// ../antetype-core/dist/index.js
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

// test/helpers/definition.helper.ts
var generateRandomLayer = (type) => ({
  type,
  start: { x: Math.random(), y: Math.random() },
  size: { w: Math.random(), h: Math.random() },
  _mark: Math.random()
});
var initialize = (herald, layout = null, settings = {}) => {
  return herald.dispatch(new CustomEvent(o.INIT, {
    detail: {
      base: layout ?? [
        generateRandomLayer("clear1"),
        generateRandomLayer("clear2"),
        generateRandomLayer("clear3"),
        generateRandomLayer("clear4")
      ],
      settings
    }
  }));
};
var close = (herald) => {
  return herald.dispatch(new CustomEvent(o.CLOSE));
};
export {
  close,
  generateRandomLayer,
  initialize
};
