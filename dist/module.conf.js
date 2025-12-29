// ../antetype-core/dist/index.js
var u = { INIT: "antetype.init", CLOSE: "antetype.close", DRAW: "antetype.draw", CALC: "antetype.calc", RECALC_FINISHED: "antetype.recalc.finished", MODULES: "antetype.modules", SETTINGS: "antetype.settings.definition", TYPE_DEFINITION: "antetype.layer.type.definition", FONTS_LOADED: "antetype.font.loaded", CANVAS_CHANGE: "antetype.canvas.change" };
var x = Symbol("original");
var Y = Symbol("clone");
var X = Symbol("layer");
var K = "core";
var J = "0.0.5";
var A = class {
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
    let { registration: g } = d.detail;
    g[K] = { load: async () => (!this.#t && !this.#e && (this.#e = new Promise((p) => {
      this.#i("core.js").then((c) => {
        this.#t = c.default, this.#e = false, p();
      });
    })), this.#e && await this.#e, console.log("load module3", this.#t), (p) => this.#t({ modules: p, herald: this.#n.herald })), version: J };
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
