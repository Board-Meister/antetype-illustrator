// ../antetype-core/dist/index.js
var u = { INIT: "antetype.init", CLOSE: "antetype.close", DRAW: "antetype.draw", CALC: "antetype.calc", RECALC_FINISHED: "antetype.recalc.finished", MODULES: "antetype.modules", SETTINGS: "antetype.settings.definition", TYPE_DEFINITION: "antetype.layer.type.definition", FONTS_LOADED: "antetype.font.loaded", CANVAS_CHANGE: "antetype.canvas.change" };
var E = Symbol("original");
var _ = Symbol("clone");
var W = Symbol("layer");
var Y = "core";
var X = "0.0.5";
var B = class {
  #n;
  #t = null;
  #e = false;
  #o = null;
  static inject = { marshal: "boardmeister/marshal", herald: "boardmeister/herald" };
  inject(d) {
    this.#n = d;
  }
  async loadModules(d) {
    return (await this.#r()).loadModules(d);
  }
  register(d) {
    let { registration: I } = d.detail;
    I[Y] = { load: async () => (!this.#t && !this.#e && (this.#e = new Promise((y) => {
      this.#i("core.js").then((l) => {
        this.#t = l.default, this.#e = false, y();
      });
    })), this.#e && await this.#e, console.log("load module3", this.#t), (y) => this.#t({ modules: y, herald: this.#n.herald })), version: X };
  }
  static subscriptions = { [u.MODULES]: "register" };
  #i(d) {
    return import(this.#n.marshal.getResourceUrl(this, d));
  }
  async #r() {
    return this.#o ??= (await this.#i("helper.js")).default, new this.#o(this.#n.herald);
  }
};

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
        return (modules) => new this.#module(modules, this.#injected.herald);
      },
      version: VERSION
    };
  }
  static subscriptions = {
    [u.MODULES]: "register"
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
