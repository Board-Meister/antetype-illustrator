// ../antetype-core/dist/index.js
var l = { INIT: "antetype.init", CLOSE: "antetype.close", SAVE: "antetype.save", DRAW: "antetype.draw", CALC: "antetype.calc", RECALC_FINISHED: "antetype.recalc.finished", MODULES: "antetype.modules", SETTINGS: "antetype.settings.definition", TYPE_DEFINITION: "antetype.layer.type.definition", FONTS_LOADED: "antetype.font.loaded", CANVAS_CHANGE: "antetype.canvas.change", SERIALIZE: "antetype.meta.serialize" };
var T = Symbol("original");
var X = Symbol("clone");
var $ = Symbol("layer");

// src/module.conf.ts
var ID = "illustrator";
var VERSION = "0.0.4";
var AntetypeIllustrator = class {
  #module = null;
  #injected;
  static inject = {
    marshal: "boardmeister/marshal",
    herald: "boardmeister/herald"
  };
  inject(injections) {
    this.#injected = injections;
  }
  register(event) {
    const { registration } = event.detail;
    registration[ID] = {
      load: async () => {
        if (!this.#module) {
          const module = this.#injected.marshal.getResourceUrl(this, "module.js");
          this.#module = (await import(module)).default;
        }
        return (modules) => new this.#module(modules);
      },
      version: VERSION
    };
  }
  static subscriptions = {
    [l.MODULES]: "register"
  };
};
var EnAntetypeIllustrator = AntetypeIllustrator;
var module_conf_default = EnAntetypeIllustrator;
export {
  AntetypeIllustrator,
  ID,
  VERSION,
  module_conf_default as default
};
