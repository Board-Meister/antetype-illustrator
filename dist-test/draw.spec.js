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

// ../antetype-core/src/type.d.ts
var Event = {
  INIT: "antetype.init",
  CLOSE: "antetype.close",
  DRAW: "antetype.draw",
  CALC: "antetype.calc",
  RECALC_FINISHED: "antetype.recalc.finished",
  MODULES: "antetype.modules",
  SETTINGS: "antetype.settings.definition",
  TYPE_DEFINITION: "antetype.layer.type.definition",
  FONTS_LOADED: "antetype.font.loaded"
};

// ../antetype-core/src/component/clone.ts
function Clone({ canvas }) {
  const ctx = canvas.getContext("2d");
  const maxDepth = 50;
  const originalSymbol = Symbol("original");
  const cloneSymbol = Symbol("clone");
  const isObject = (value) => {
    return typeof value === "object" && !Array.isArray(value) && value !== null;
  };
  const getOriginal = function(object) {
    return object[originalSymbol] ?? object;
  };
  const getClone = function(object) {
    return object[cloneSymbol] ?? object;
  };
  const iterateResolveAndCloneObject = async (object, recursive, depth = 0) => {
    if (recursive.has(object)) {
      return recursive.get(object);
    }
    if (object[originalSymbol] || object.type === "document") {
      return object;
    }
    const clone = {};
    recursive.set(object, clone);
    clone[originalSymbol] = object;
    object[cloneSymbol] = clone;
    if (maxDepth <= depth + 1) {
      console.error("We've reach limit depth!", object);
      throw new Error("limit reached");
    }
    for (const key of Object.keys(object)) {
      let result = await resolve(object[key], object);
      if (isObject(result)) {
        result = await iterateResolveAndCloneObject(result, recursive, depth + 1);
      } else if (Array.isArray(result)) {
        result = await iterateResolveAndCloneArray(result, recursive, depth + 1);
      }
      clone[key] = result;
    }
    ;
    return clone;
  };
  const iterateResolveAndCloneArray = async (object, recursive, depth = 0) => {
    const clone = [];
    if (maxDepth <= depth + 1) {
      console.error("We've reach limit depth!", object);
      throw new Error("limit reached");
    }
    for (const value of object) {
      let result = await resolve(value, object);
      if (isObject(result)) {
        result = await iterateResolveAndCloneObject(result, recursive, depth + 1);
      } else if (Array.isArray(result)) {
        result = await iterateResolveAndCloneArray(result, recursive, depth + 1);
      }
      clone.push(result);
    }
    ;
    return clone;
  };
  const resolve = async (value, object) => {
    return typeof value == "function" ? await value(ctx, object) : value;
  };
  const cloneDefinition = async (data) => {
    return await iterateResolveAndCloneObject(data, /* @__PURE__ */ new WeakMap());
  };
  const isClone = (layer) => !!layer[originalSymbol];
  return {
    isClone,
    cloneDefinition,
    getClone,
    getOriginal
  };
}

// ../antetype-core/src/core.ts
function Core(parameters) {
  const {
    herald
  } = parameters;
  const sessionQueue = [];
  const calcQueue = [];
  const layerPolicy = Symbol("layer");
  const { cloneDefinition, isClone, getOriginal, getClone } = Clone(parameters);
  const __DOCUMENT = {
    type: "document",
    base: [],
    layout: [],
    start: { x: 0, y: 0 },
    size: { w: 0, h: 0 },
    settings: {
      core: {
        fonts: []
      }
    }
  };
  console.log(__DOCUMENT);
  const debounce = (func, timeout = 100) => {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      if (args[0] === "clear") {
        return;
      }
      timer = setTimeout(() => {
        void func.apply({}, args);
      }, timeout);
    };
  };
  const debounceRecalculatedEvent = debounce(() => {
    void herald.dispatch(new CustomEvent(Event.RECALC_FINISHED));
  });
  const debounceCalcQueueCheck = debounce(async () => {
    if (calcQueue.length == 0) {
      return;
    }
    await calcQueue.shift()();
    debounceCalcQueueCheck();
  });
  const draw = (element) => {
    herald.dispatchSync(new CustomEvent(Event.DRAW, { detail: { element } }));
  };
  const redraw = (layout = __DOCUMENT.layout) => {
    for (const layer of layout) {
      draw(layer);
    }
  };
  const assignHierarchy = (element, parent, position) => {
    element.hierarchy ??= {
      parent,
      position
    };
    if (parent) {
      element.hierarchy.parent = parent;
    }
    if (position) {
      element.hierarchy.position = position;
    }
  };
  const moveCalculationToQueue = (func) => {
    let trigger = false;
    const awaitQueue = (resolve) => {
      setTimeout(() => {
        if (!trigger) {
          awaitQueue(resolve);
          return;
        }
        void func().then((result) => {
          resolve(result);
        });
      });
    };
    const promise = new Promise((resolve) => {
      awaitQueue(resolve);
    });
    calcQueue.push(() => {
      trigger = true;
      return promise;
    });
    debounceCalcQueueCheck();
    return promise;
  };
  const calc = async (element, parent = null, position = null, currentSession = null) => {
    if (currentSession !== (sessionQueue[0] ?? null)) {
      return moveCalculationToQueue(() => calc(element, parent, position, currentSession));
    }
    const original = getOriginal(element);
    position ??= original.hierarchy?.position ?? 0;
    assignHierarchy(original, parent ? getOriginal(parent) : null, position);
    const event = new CustomEvent(Event.CALC, { detail: { element, sessionId: currentSession } });
    await herald.dispatch(event);
    const clone = event.detail.element;
    if (clone !== null) {
      markAsLayer(clone);
      assignHierarchy(clone, parent ? getClone(parent) : null, position);
    }
    return clone;
  };
  const generateId = () => Math.random().toString(16).slice(2);
  const isLayer = (layer) => getClone(layer)[layerPolicy] === true;
  const markAsLayer = (layer) => {
    layer[layerPolicy] = true;
    getOriginal(layer).id ??= generateId();
    const clone = getClone(layer);
    if (!clone.id) {
      Object.defineProperty(clone, "id", {
        get() {
          return getOriginal(layer).id;
        }
      });
    }
    return layer;
  };
  const startSession = () => {
    const sessionId = Symbol("illustrator_session_id" + String(Math.random()));
    sessionQueue.push(sessionId);
    return sessionId;
  };
  const stopSession = () => {
    sessionQueue.shift();
  };
  const recalculate = async (parent = __DOCUMENT, layout = __DOCUMENT.base, startedSession = null) => {
    const currentSession = startedSession ?? startSession();
    markAsLayer(parent);
    const calculated = [];
    for (let i3 = 0; i3 < layout.length; i3++) {
      const calcLayer = await calc(layout[i3], parent, i3, currentSession);
      if (calcLayer !== null) calculated.push(calcLayer);
    }
    parent.layout = calculated;
    debounceRecalculatedEvent();
    if (!startedSession) {
      stopSession();
    }
    return calculated;
  };
  const calcAndUpdateLayer = async (original) => {
    if (!original.hierarchy?.parent) {
      return;
    }
    const position = original.hierarchy.position;
    const parent = original.hierarchy.parent;
    const newLayer = await calc(original, parent, position);
    if (newLayer === null) {
      removeVolatile(original);
      return;
    }
    getClone(parent).layout[position] = newLayer;
  };
  const move = async (original, newStart) => {
    original.start = newStart;
    await calcAndUpdateLayer(original);
  };
  const resize = async (original, newSize) => {
    original.size = newSize;
    await calcAndUpdateLayer(original);
  };
  const add = (def, parent = null, position = null) => {
    if (parent && isClone(parent)) {
      parent = getOriginal(parent);
    }
    let layout = parent ? parent.layout : __DOCUMENT.base;
    parent ??= __DOCUMENT;
    if (parent.base) {
      layout = parent.base;
    }
    position ??= layout.length;
    insert(def, parent, position, layout);
  };
  const addVolatile = (def, parent = null, position = null) => {
    if (parent && !isClone(parent)) {
      parent = getClone(parent);
    }
    parent ??= __DOCUMENT;
    position ??= parent.layout.length;
    insert(def, parent, position, parent.layout);
  };
  const insert = (def, parent, position, layout) => {
    layout.splice(position, 0, def);
    def.hierarchy = {
      position,
      parent
    };
    recalculatePositionInLayout(layout);
  };
  const recalculatePositionInLayout = (layout) => {
    for (let i3 = 0; i3 < layout.length; i3++) {
      const layer = layout[i3];
      if (!layer.hierarchy) {
        continue;
      }
      layer.hierarchy.position = i3;
    }
  };
  const remove = (def) => {
    if (!def.hierarchy?.parent) {
      return;
    }
    const position = def.hierarchy.position;
    const parent = getOriginal(def.hierarchy.parent);
    const layout = (parent?.type === "document" ? parent.base : parent?.layout) ?? [];
    if (layout[position] !== getOriginal(def)) {
      return;
    }
    layout.splice(position, 1);
    recalculatePositionInLayout(layout);
  };
  const removeVolatile = (def) => {
    if (!def.hierarchy?.parent) {
      return;
    }
    const position = def.hierarchy.position;
    const parent = getClone(def.hierarchy.parent);
    const layout = parent.layout;
    if (layout[position] !== getClone(def)) {
      return;
    }
    layout.splice(position, 1);
    recalculatePositionInLayout(layout);
  };
  const loadFont = async (font) => {
    try {
      const myFont = new FontFace(font.name, "url(" + font.url + ")");
      document.fonts.add(await myFont.load());
      module.view.redrawDebounce();
    } catch (error) {
      console.error("Font couldn't be loaded:", font.name + ",", font.url, error);
    }
  };
  const retrieveSettingsDefinition = async function(additional = {}) {
    const event = new CustomEvent(Event.SETTINGS, {
      detail: {
        settings: [],
        additional
      }
    });
    await herald.dispatch(event);
    return event.detail.settings;
  };
  const setSetting = (path, value, settings) => {
    if (path.length <= 1) {
      settings[path[0]] = value;
      return;
    }
    settings[path[0]] ??= {};
    if (typeof settings[path[0]] !== "object" || settings[path[0]] === null) {
      console.warn("Cannot set setting, due to one of destination not being an object", path, settings, value);
      return;
    }
    setSetting(path.slice(1), value, settings[path[0]]);
  };
  const getSetting = (path, settings) => {
    if (path.length <= 1) {
      return settings[path[0]];
    }
    if (!settings[path[0]]) {
      return void 0;
    }
    return getSetting(path.slice(1), settings[path[0]]);
  };
  const setSettingsDefinition = (e) => {
    const settings = e.detail.settings;
    const generateFonts = () => {
      const definitions = [];
      for (const font of __DOCUMENT.settings?.core?.fonts ?? []) {
        definitions.push([[
          {
            type: "asset",
            name: "url",
            label: "File",
            value: font.url
          },
          {
            type: "title",
            name: "name",
            label: "Name",
            value: font.name
          }
        ]]);
      }
      return definitions;
    };
    settings.push({
      details: {
        label: "Core"
      },
      name: "core",
      tabs: [
        {
          label: "Font",
          fields: [
            [{
              label: "Fonts",
              type: "container",
              fields: [
                [{
                  name: "fonts",
                  type: "list",
                  label: "Fonts List",
                  template: [
                    [
                      {
                        type: "asset",
                        name: "url",
                        label: "File",
                        value: ""
                      },
                      {
                        type: "title",
                        name: "name",
                        label: "Name",
                        value: ""
                      }
                    ]
                  ],
                  entry: {
                    url: "",
                    name: ""
                  },
                  fields: generateFonts()
                }]
              ]
            }]
          ]
        }
      ]
    });
  };
  const layerDefinitions = () => {
    const event = new CustomEvent(Event.TYPE_DEFINITION, {
      detail: {
        definitions: {}
      }
    });
    herald.dispatchSync(event);
    return event.detail.definitions;
  };
  const getModule = () => ({
    meta: {
      document: __DOCUMENT,
      generateId,
      layerDefinitions
    },
    clone: {
      definitions: cloneDefinition,
      getOriginal,
      getClone
    },
    manage: {
      markAsLayer,
      remove,
      removeVolatile,
      add,
      addVolatile,
      calcAndUpdateLayer
    },
    view: {
      calc,
      recalculate,
      draw,
      redraw,
      redrawDebounce: debounce(redraw),
      move,
      resize
    },
    policies: {
      isLayer,
      isClone
    },
    font: {
      load: loadFont
    },
    setting: {
      set(name, value) {
        const path = name.split(".");
        if (!path.slice(-1)) {
          path.pop();
        }
        setSetting(path, value, __DOCUMENT.settings);
      },
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
      get(name) {
        const path = name.split(".");
        if (!path.slice(-1)) {
          path.pop();
        }
        return getSetting(path, __DOCUMENT.settings) ?? null;
      },
      has: function(name) {
        return !!(this.get(name) ?? false);
      },
      retrieve: retrieveSettingsDefinition
    }
  });
  const module = getModule();
  const isObject = (item) => !!(item && typeof item === "object" && !Array.isArray(item));
  const mergeDeep = (target, ...sources) => {
    if (!sources.length) return target;
    const source = sources.shift();
    if (isObject(target) && isObject(source)) {
      for (const key in source) {
        const sEl = source[key];
        if (isObject(sEl)) {
          const tEl = target[key];
          if (!tEl) Object.assign(target, { [key]: {} });
          mergeDeep(target[key], sEl);
        } else {
          Object.assign(target, { [key]: sEl });
        }
      }
    }
    return mergeDeep(target, ...sources);
  };
  const init = async (base, settings) => {
    for (const key in settings) {
      module.setting.set(key, settings[key]);
    }
    const doc = __DOCUMENT;
    doc.settings = mergeDeep({}, doc.settings, settings);
    doc.base = base;
    void Promise.all((module.setting.get("core.fonts") ?? []).map((font) => module.font.load(font))).then(() => {
      void herald.dispatch(new CustomEvent(Event.FONTS_LOADED));
    });
    doc.layout = await module.view.recalculate(doc, doc.base);
    module.view.redraw(doc.layout);
    return doc;
  };
  const unregister = herald.batch([
    {
      event: Event.CLOSE,
      subscription: () => {
        unregister();
      }
    },
    {
      event: Event.INIT,
      subscription: (event) => {
        const { base, settings } = event.detail;
        return init(base, settings);
      }
    },
    {
      event: Event.SETTINGS,
      subscription: (e) => {
        setSettingsDefinition(e);
      }
    },
    {
      event: Event.CALC,
      subscription: [
        {
          priority: -255,
          method: async (event) => {
            if (event.detail.element === null) {
              return;
            }
            event.detail.element = await module.clone.definitions(event.detail.element);
          }
        }
      ]
    }
  ]);
  return module;
}

// ../herald/dist/index.js
var __classPrivateFieldGet = function(receiver, state, kind, f) {
  if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
  if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
  return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __classPrivateFieldSet = function(receiver, state, value, kind, f) {
  if (kind === "m") throw new TypeError("Private method is not writable");
  if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
  if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
  return kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value), value;
};
var _Herald_instances;
var _Herald_injected;
var _Herald_subscribers;
var _Herald_subscribersMap;
var _Herald_continueDispatching;
var _Herald_validateEvent;
var _Herald_prepareSubscribers;
var _Herald_getSubscriberMethod;
var _Herald_isObject;
var _Herald_sortSubscribers;
var _Herald_sort;
var Herald = class {
  constructor() {
    _Herald_instances.add(this);
    _Herald_injected.set(this, {
      subscribers: []
    });
    _Herald_subscribers.set(this, {});
    _Herald_subscribersMap.set(this, {});
  }
  inject(injections) {
    if (!__classPrivateFieldGet(this, _Herald_injected, "f"))
      return;
    __classPrivateFieldSet(this, _Herald_injected, injections, "f");
    __classPrivateFieldGet(this, _Herald_instances, "m", _Herald_sortSubscribers).call(this);
  }
  async dispatch(event) {
    __classPrivateFieldGet(this, _Herald_instances, "m", _Herald_validateEvent).call(this, event);
    for (const subscriber of __classPrivateFieldGet(this, _Herald_instances, "m", _Herald_prepareSubscribers).call(this, event.type)) {
      try {
        await __classPrivateFieldGet(this, _Herald_instances, "m", _Herald_getSubscriberMethod).call(this, subscriber)(event);
        if (__classPrivateFieldGet(this, _Herald_instances, "m", _Herald_continueDispatching).call(this, event)) {
          break;
        }
      } catch (e) {
        console.error("Dispatcher error:", e);
        throw e;
      }
    }
  }
  dispatchSync(event) {
    __classPrivateFieldGet(this, _Herald_instances, "m", _Herald_validateEvent).call(this, event);
    for (const subscriber of __classPrivateFieldGet(this, _Herald_instances, "m", _Herald_prepareSubscribers).call(this, event.type)) {
      try {
        __classPrivateFieldGet(this, _Herald_instances, "m", _Herald_getSubscriberMethod).call(this, subscriber)(event);
        if (__classPrivateFieldGet(this, _Herald_instances, "m", _Herald_continueDispatching).call(this, event)) {
          break;
        }
      } catch (e) {
        console.error("Dispatcher error:", e);
        throw e;
      }
    }
  }
  batch(events) {
    const unregistrations = [];
    events.forEach(({ event, subscription, constraint = null, sort = true, symbol = null }) => {
      unregistrations.push(this.register(event, subscription, constraint, sort, symbol));
    });
    return () => {
      unregistrations.forEach((unregistration) => {
        unregistration();
      });
    };
  }
  register(event, subscription, constraint = null, sort = true, symbol = null) {
    symbol ?? (symbol = Symbol("event"));
    const subs = Array.isArray(subscription) ? subscription : [
      typeof subscription == "object" ? subscription : { method: subscription }
    ];
    for (const sub of subs) {
      sub.priority ?? (sub.priority = 0);
      if (sub.priority < -256 || sub.priority > 256) {
        console.error("Subscriber priority must be in range -256:256", { [event]: sub });
        throw new Error("Error above stopped registration of an event");
      }
      sub.constraint ?? (sub.constraint = constraint);
    }
    __classPrivateFieldGet(this, _Herald_subscribers, "f")[event] = [
      ...__classPrivateFieldGet(this, _Herald_subscribers, "f")[event] ?? [],
      ...subs
    ];
    __classPrivateFieldGet(this, _Herald_subscribersMap, "f")[symbol] = [
      ...__classPrivateFieldGet(this, _Herald_subscribersMap, "f")[symbol] ?? [],
      ...subs
    ];
    sort && __classPrivateFieldGet(this, _Herald_instances, "m", _Herald_sort).call(this, event);
    return () => {
      this.unregister(event, symbol);
    };
  }
  unregister(event, symbol) {
    if (!__classPrivateFieldGet(this, _Herald_subscribersMap, "f")[symbol]) {
      console.warn("Tried to unregister not registered events", event);
      return;
    }
    const events = [...__classPrivateFieldGet(this, _Herald_subscribers, "f")[event]];
    __classPrivateFieldGet(this, _Herald_subscribersMap, "f")[symbol].forEach((sub) => {
      const index = events.indexOf(sub);
      if (index !== -1)
        events.splice(index, 1);
      else
        throw new Error("Attempt to remove event from wrong collection");
    });
    __classPrivateFieldGet(this, _Herald_subscribers, "f")[event] = events;
    delete __classPrivateFieldGet(this, _Herald_subscribersMap, "f")[symbol];
  }
};
_Herald_injected = /* @__PURE__ */ new WeakMap(), _Herald_subscribers = /* @__PURE__ */ new WeakMap(), _Herald_subscribersMap = /* @__PURE__ */ new WeakMap(), _Herald_instances = /* @__PURE__ */ new WeakSet(), _Herald_continueDispatching = function _Herald_continueDispatching2(event) {
  return event.cancelBubble;
}, _Herald_validateEvent = function _Herald_validateEvent2(event) {
  if (!(event instanceof CustomEvent)) {
    throw new Error("Event passed to dispatcher must be of type CustomEvent");
  }
}, _Herald_prepareSubscribers = function _Herald_prepareSubscribers2(key) {
  return [...__classPrivateFieldGet(this, _Herald_subscribers, "f")[key] ?? []];
}, _Herald_getSubscriberMethod = function _Herald_getSubscriberMethod2(subscriber) {
  const constraint = subscriber.constraint, { marshal = null } = __classPrivateFieldGet(this, _Herald_injected, "f"), module = typeof constraint == "string" ? marshal?.get(constraint) : constraint;
  let method = subscriber.method;
  if (module && typeof method == "string") {
    method = module[method] ?? null;
    if (method) {
      method = method.bind(module);
    }
  }
  if (typeof method != "function") {
    console.error("Error below references this object", constraint);
    throw new Error("Module " + String(constraint.constructor ?? constraint) + " doesn't have non-static method " + String(subscriber.method));
  }
  return method;
}, _Herald_isObject = function _Herald_isObject2(x) {
  return typeof x === "object" && !Array.isArray(x) && x !== null;
}, _Herald_sortSubscribers = function _Herald_sortSubscribers2() {
  const { marshal = null, subscribers = [] } = __classPrivateFieldGet(this, _Herald_injected, "f");
  __classPrivateFieldSet(this, _Herald_subscribers, {}, "f");
  subscribers.forEach((subscriberObject) => {
    const subscriptions = subscriberObject.module.subscriptions ?? subscriberObject.module.constructor?.subscriptions;
    if (typeof subscriptions != "object") {
      return;
    }
    if (!__classPrivateFieldGet(this, _Herald_instances, "m", _Herald_isObject).call(this, subscriptions)) {
      return;
    }
    Object.keys(subscriptions).forEach((moduleName) => {
      this.register(moduleName, subscriptions[moduleName], marshal?.getModuleConstraint(subscriberObject.config) ?? null, false);
    });
  });
  Object.keys(__classPrivateFieldGet(this, _Herald_subscribers, "f")).forEach((event) => {
    __classPrivateFieldGet(this, _Herald_instances, "m", _Herald_sort).call(this, event);
  });
}, _Herald_sort = function _Herald_sort2(event) {
  __classPrivateFieldGet(this, _Herald_subscribers, "f")[event].sort((a, b) => a.priority - b.priority);
};
Herald.inject = {
  "marshal": "boardmeister/marshal",
  "subscribers": "!subscriber"
};

// ../antetype-workspace/dist/index.js
var s = { INIT: "antetype.init", CLOSE: "antetype.close", DRAW: "antetype.draw", CALC: "antetype.calc", RECALC_FINISHED: "antetype.recalc.finished", MODULES: "antetype.modules", SETTINGS: "antetype.settings.definition", TYPE_DEFINITION: "antetype.layer.type.definition", FONTS_LOADED: "antetype.font.loaded" };
var d = class {
  #e;
  #t = null;
  static inject = { minstrel: "boardmeister/minstrel", herald: "boardmeister/herald" };
  inject(t) {
    this.#e = t;
  }
  async #r(t, e) {
    let r = this.#e.minstrel.getResourceUrl(this, "core.js");
    return this.#t = (await import(r)).default, this.#t({ canvas: e, modules: t, herald: this.#e.herald });
  }
  async register(t) {
    let { modules: e, canvas: r } = t.detail;
    e.core = await this.#r(e, r);
  }
  static subscriptions = { [s.MODULES]: "register" };
};
var o2 = ((e) => (e.CALC = "antetype.workspace.calc", e))(o2 || {});
var i2 = class {
  #e = null;
  #t;
  static inject = { minstrel: "boardmeister/minstrel", herald: "boardmeister/herald" };
  inject(e) {
    this.#t = e;
  }
  async register(e) {
    let { modules: r, canvas: a } = e.detail;
    if (!this.#e) {
      let n = this.#t.minstrel.getResourceUrl(this, "module.js");
      this.#e = (await import(n)).default;
    }
    r.workspace = new this.#e(a, r, this.#t.herald);
  }
  static subscriptions = { [s.MODULES]: "register" };
};

// src/shared.ts
async function calcFill(illustrator, fill) {
  if (fill.type === "linear") {
    const style = fill.style;
    style.pos = await illustrator.calc({
      layerType: "polygon-fill-linear",
      purpose: "position",
      values: style.pos
    });
    style.size = await illustrator.calc({
      layerType: "polygon-fill-linear",
      purpose: "size",
      values: style.size
    });
  }
  return fill;
}
function generateFill(type, style) {
  const filTypes = {
    "default": (style2) => {
      return style2;
    },
    linear: (style2) => {
      return generateLinearGradient(
        style2.colors,
        style2.pos.x,
        style2.pos.y,
        style2.size.w,
        style2.size.h
      );
    }
  };
  return (filTypes[type] || filTypes["default"])(style);
}
var generateLinearGradient = (colors, x, y, width, height) => {
  const canvas = document.createElement("canvas"), ctx = canvas.getContext("2d");
  const grd = ctx.createLinearGradient(x, y, width, height);
  colors.forEach((color) => {
    grd.addColorStop(color.offset, color.color);
  });
  return grd;
};

// src/action/polygon.ts
var Actions = {
  line: (ctx, x, y) => {
    ctx.lineTo(x, y);
  },
  curve: (ctx, cp1x, cp1y, cp2x, cp2y, curveX, curveY) => {
    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, curveX, curveY);
  },
  stroke: (ctx, thickness = 5, fill = "#000", lineJoin = "round", miterLimit = 2) => {
    ctx.save();
    ctx.strokeStyle = fill;
    ctx.lineWidth = thickness;
    ctx.lineJoin = lineJoin;
    ctx.miterLimit = miterLimit;
    ctx.stroke();
    ctx.restore();
  },
  begin: (ctx, x, y) => {
    ctx.beginPath();
    ctx.moveTo(x, y);
  },
  move: (ctx, x, y) => {
    ctx.moveTo(x, y);
  },
  fill: (ctx, fill) => {
    if (!fill.type) {
      fill.type = "default";
    }
    const tmp = ctx.fillStyle;
    ctx.fillStyle = generateFill(fill.type, fill.style);
    ctx.fill();
    ctx.fillStyle = tmp;
  },
  close: (ctx) => {
    ctx.closePath();
  },
  default: (ctx, x, y) => Actions.line(ctx, x, y)
};
function ResolvePolygonAction(ctx, action, x, y) {
  const objSwitch = {
    fill: (action2) => {
      Actions.fill(ctx, action2.args);
    },
    line: (action2) => {
      Actions.line(ctx, action2.args.x + x, action2.args.y + y);
    },
    curve: (action2) => {
      Actions.curve(
        ctx,
        action2.args.cp1x + x,
        action2.args.cp1y + y,
        action2.args.cp2x + x,
        action2.args.cp2y + y,
        action2.args.x + x,
        action2.args.y + y
      );
    },
    stroke: (action2) => {
      Actions.stroke(
        ctx,
        action2.args.thickness ?? 5,
        action2.args.fill ?? "#000",
        action2.args.lineJoin ?? "round",
        action2.args.miterLimit ?? 2
      );
    },
    begin: (action2) => {
      Actions.begin(ctx, action2.args.x + x, action2.args.y + y);
    },
    move: (action2) => {
      Actions.move(ctx, action2.args.x + x, action2.args.y + y);
    },
    close: () => Actions.close(ctx)
  };
  if (!objSwitch[action.means]) {
    return;
  }
  objSwitch[action.means](action);
}

// src/action/image.ts
var IMAGE_ERROR_STATUS = Symbol("error");
var IMAGE_TIMEOUT_STATUS = Symbol("timeout");
var IMAGE_LOADING_STATUS = Symbol("loading");
var CalculatedImage = class {
  image;
  coords;
  constructor(image2, coords) {
    this.image = image2;
    this.coords = coords;
  }
};
var ResolveImageAction = (ctx, def) => {
  const image2 = def.image.calculated;
  if (!image2 || imageTimeoutReached(image2) || imageIsBeingLoaded(image2) || !(image2 instanceof CalculatedImage)) {
    return;
  }
  const { start: { x, y } } = def.area;
  ctx.drawImage(image2.image, x + image2.coords.xDiff, y + image2.coords.yDiff, image2.coords.width, image2.coords.height);
};
var imageTimeoutReached = (image2) => {
  return image2 === IMAGE_TIMEOUT_STATUS;
};
var imageIsBeingLoaded = (image2) => {
  return image2 === IMAGE_LOADING_STATUS;
};

// src/action/text.ts
var getFontSizeForCalc = (def) => String(def.text.font?.size ?? 10);
var getFontSize = (def) => Number(def.text.font?.size ?? 10);
var getSpaceChart = () => String.fromCharCode(8202);
var ResolveTextAction = (ctx, def) => {
  let { x } = def.start, lines = [], previousColumnsLines = 0;
  const { start: { y }, size: { w }, text: text2 } = def, { columns, transY, lineHeight } = text2, value = [...text2.lines], linesAmount = Math.ceil(value.length / columns.amount), { textBaseline = "top" } = def.text;
  ctx.save();
  ctx.font = prepareFontShorthand(def, ctx, String(getFontSize(def)));
  ctx.textBaseline = textBaseline;
  while ((lines = value.splice(0, linesAmount)).length) {
    lines.forEach((text3, i3) => {
      const nextLine = lines[i3 + 1] || value[0] || [""];
      const isLast = i3 + 1 == lines.length || nextLine[0] == "" || text3[0][text3[0].length - 1] == "\n";
      const verticalMove = transY + (text3[1] - previousColumnsLines) * lineHeight;
      fillText(ctx, text3[0], def, x, y, w, verticalMove, isLast);
    });
    previousColumnsLines += lines[lines.length - 1][1] + 1;
    x += columns.gap + w;
  }
  ctx.restore();
};
var fillText = (ctx, text2, def, x, y, width, transY, isLast) => {
  const { color = "#000", outline = null } = def.text;
  const horizontal = def.text.align?.horizontal || "left";
  if (horizontal != "left") {
    ({ text: text2, x } = alignHorizontally(ctx, horizontal, text2, width, isLast, x));
  }
  if (transY > 0) {
    y = y + transY;
  }
  ctx.fillStyle = typeof color == "object" ? generateFill(color.type, color.style) : color;
  if (outline) {
    outlineText(ctx, outline, text2, x, y, width);
  }
  ctx.fillText(text2, x, y, width);
};
var outlineText = (ctx, outline, text2, x, y, width) => {
  if (!outline.fill?.style) {
    return;
  }
  ctx.strokeStyle = generateFill(outline.fill.type, outline.fill.style);
  ctx.lineWidth = outline.thickness;
  ctx.lineJoin = outline.lineJoin ?? "round";
  ctx.miterLimit = outline.miterLimit ?? 2;
  ctx.strokeText(text2, x, y, width);
};
var alignHorizontally = (ctx, horizontal, text2, width, isLast, x) => {
  const metrics = ctx.measureText(text2);
  const realWidth = metrics.width;
  if (horizontal == "center") {
    const transX = (width - realWidth) / 2;
    if (transX > 0) {
      x = x + transX;
    }
  } else if (horizontal == "right") {
    x = x + width - realWidth;
  } else if (horizontal == "justify" && !isLast) {
    text2 = justifyText(text2, metrics, width, ctx);
  }
  return { text: text2, x };
};
var justifyText = (text2, metrics, width, ctx) => {
  if (metrics.width >= width) {
    return text2;
  }
  const words = text2.split(" "), spacingMeasure = ctx.measureText(getSpaceChart()), spacings = Math.floor((width - metrics.width) / spacingMeasure.width), amount = spacings / (words.length - 1);
  for (let j = 0; j < words.length - 1; j++) {
    words[j] += getSpaceChart().repeat(amount);
  }
  return words.join(" ");
};
var prepareFontShorthand = (def, ctx, fontSize) => {
  const { font = null } = def.text;
  if (!font) {
    return ctx.font;
  }
  fontSize = fontSize + "px ";
  const fontFamily = (font.family || "serif") + " ";
  const fontWeight = (font.weight ?? 100) + " ";
  let fontSh = "";
  if (font.style) {
    fontSh += font.style + " ";
  }
  if (font.variant) {
    fontSh += font.variant + " ";
  }
  fontSh += fontWeight;
  if (font.stretch) {
    fontSh += font.stretch + " ";
  }
  fontSh += fontSize;
  if (font.height) {
    fontSh += "/" + font.height + " ";
  }
  return fontSh + fontFamily;
};

// src/action/group.ts
var ResolveGroupAction = (ctx, modules, def) => {
  const { group: group2, start } = def;
  if (def.layout.length === 0) {
    return;
  }
  ctx.save();
  ctx.translate(start.x, start.y);
  if (group2.interaction === "fixed") {
    modules.core.view.redraw(def.layout);
  } else {
    drawLayersRelatively(ctx, modules, def);
  }
  ctx.restore();
};
var getRowsHeight = (def, rows) => {
  let height = 0;
  const horizontal = def.group.gap.horizontal;
  rows.forEach((row) => {
    height += row.height + horizontal;
  });
  return height - horizontal;
};
var getRowsWidth = (def, rows) => {
  let width = 0;
  const vertical = def.group.gap.vertical;
  rows.forEach((row) => {
    if (def.group.direction === "column") {
      width = Math.max(width, row.width);
    } else {
      width += row.width + vertical;
    }
  });
  if (def.group.direction === "row") {
    width -= vertical;
  }
  return width;
};
var drawLayersRelatively = (ctx, modules, def) => {
  const { group: group2 } = def;
  const { vertical, horizontal } = group2.gap;
  const rows = separateIntoRows(def, def.layout);
  if (group2.clip && (!isNaN(def.size?.w) || !isNaN(def.size?.h))) {
    ctx.beginPath();
    ctx.rect(
      0,
      0,
      isNaN(def.size.w) ? getRowsWidth(def, rows) : def.size.w,
      isNaN(def.size.h) ? getRowsHeight(def, rows) : def.size.h
    );
    ctx.clip();
  }
  let currentHeight = 0;
  let xShift = 0;
  rows.forEach((row) => {
    row.layers.forEach((layer) => {
      layer.def.start.x = xShift;
      layer.def.start.y = currentHeight;
      if (layer.def.area) {
        layer.def.area.start.x = xShift;
        layer.def.area.start.y = currentHeight;
      }
      modules.core.view.draw(layer.def);
      xShift += layer.def.size.w + vertical;
    });
    xShift = 0;
    currentHeight += row.height + horizontal;
  });
};
var separateIntoRows = (def, layout) => {
  const { size } = def;
  const rows = [];
  const generateRow = () => ({ height: 0, width: 0, layers: [] });
  let row = generateRow();
  layout.forEach((layer, i3) => {
    if (def.group.wrap && size.w != 0 && row.width + layer.size.w > size.w || i3 != 0 && def.group.direction === "column") {
      rows.push(row);
      row = generateRow();
    }
    row.layers.push({ x: row.width, def: layer });
    if (row.height < layer.size.h) row.height = layer.size.h;
    row.width += layer.size.w + def.group.gap.vertical;
  });
  rows.push(row);
  return rows;
};

// src/action/polygon.calc.ts
var ResolvePolygonSize = (def) => {
  const size = def.polygon.size;
  return {
    start: {
      x: def.start.x + size.negative.x,
      y: def.start.y + size.negative.y
    },
    size: {
      w: size.positive.x - size.negative.x,
      h: size.positive.y - size.negative.y
    }
  };
};
var ResolveCalcPolygon = async (def, action, modules) => {
  const illustrator = modules.illustrator;
  const objSwitch = {
    close: () => {
    },
    fill: async (action2) => {
      await calcFill(illustrator, action2.args);
    },
    line: async (action2) => {
      action2.args = await illustrator.calc({
        layerType: "polygon-line",
        purpose: "position",
        values: action2.args
      });
      updateSizeVectors(def, action2.args.x, "x");
      updateSizeVectors(def, action2.args.y, "y");
    },
    curve: async (action2) => {
      action2.args = await illustrator.calc({
        layerType: "polygon-curve",
        purpose: "position",
        values: action2.args
      });
      updateSizeVectors(def, action2.args.x, "x");
      updateSizeVectors(def, action2.args.cp1x, "x");
      updateSizeVectors(def, action2.args.cp2x, "x");
      updateSizeVectors(def, action2.args.y, "y");
      updateSizeVectors(def, action2.args.cp2y, "y");
    },
    stroke: async (action2) => {
      action2.args.thickness = (await illustrator.calc({
        layerType: "polygon-stroke",
        purpose: "thickness",
        values: { thickness: action2.args.thickness ?? 5 }
      })).thickness;
    },
    begin: async (action2) => {
      action2.args = await illustrator.calc({
        layerType: "polygon-begin",
        purpose: "position",
        values: action2.args
      });
      updateSizeVectors(def, action2.args.x, "x");
      updateSizeVectors(def, action2.args.y, "y");
    },
    move: async (action2) => {
      action2.args = await illustrator.calc({
        layerType: "polygon-move",
        purpose: "position",
        values: action2.args
      });
    }
  };
  if (!action.means) {
    action.means = "line";
  }
  if (!objSwitch[action.means]) {
    return;
  }
  await objSwitch[action.means](action);
};
var updateSizeVectors = (def, value, dir) => {
  if (value < 0) {
    const n = def.polygon.size.negative;
    n[dir] = Math.min(n[dir], value);
  } else {
    const p = def.polygon.size.positive;
    p[dir] = Math.max(p[dir], value);
  }
};

// src/action/image.calc.ts
var loadedImages = {};
var cachedBySettings = {};
var ResolveImageSize = (def) => ({
  start: {
    x: def.start.x,
    y: def.start.y
  },
  size: {
    h: def.size.h,
    w: def.size.w
  }
});
var ResolveImageCalc = async (modules, def) => {
  const illustrator = modules.illustrator;
  def.size = await illustrator.calc({
    layerType: "image",
    purpose: "size",
    values: def.size
  });
  def.start = await illustrator.calc({
    layerType: "image",
    purpose: "position",
    values: def.start
  });
  def.area = ResolveImageSize(def);
  if (def.image?.outline?.thickness) {
    def.image.outline.thickness = (await illustrator.calc({
      layerType: "image",
      purpose: "thickness",
      values: {
        thickness: def.image.outline.thickness
      }
    })).thickness;
  }
  const cacheKey = getImageCacheKey(def.image), cached = cachedBySettings[cacheKey];
  if (cached) {
    def.image.calculated = calculateFromCache(def, cached);
    return;
  }
  if (def.image.src instanceof Image) {
    def.image.calculated = await calculateImage(def, def.image.src, modules, cacheKey);
    return;
  }
  if (typeof def.image.src != "string") {
    return;
  }
  const source = def.image.src;
  if (typeof source != "string" || !source.startsWith("blob:http") && !source.startsWith("http") && !source.startsWith("/")) {
    console.warn("Image `" + source + "` has invalid source");
    return;
  }
  const waitforLoad = modules.core.setting.get("illustrator.image.waitForLoad");
  const promise = loadImage(def, source, modules);
  if (waitforLoad) {
    await promise;
  } else {
  }
};
var calculateFromCache = (def, cached) => {
  const image2 = def.image, { w, h } = def.size;
  const { width: asWidth, height: asHeight } = calculateAspectRatioFit(
    image2.fit ?? "default",
    cached.width,
    cached.height,
    w,
    h
  ), xDiff = getImageHorizontalDiff(image2.align?.horizontal ?? "center", w, asWidth), yDiff = getImageVerticalDiff(image2.align?.vertical ?? "center", h, asHeight);
  return new CalculatedImage(
    cached.image,
    {
      xDiff,
      yDiff,
      width: asWidth,
      height: asHeight
    }
  );
};
var calculateImage = async (def, source, _modules, cacheKey = null) => {
  const image2 = def.image, { w, h } = def.size, sWidth = source.width || 200, sHeight = source.height || 200;
  const { width: asWidth, height: asHeight } = calculateAspectRatioFit(
    image2.fit ?? "default",
    sWidth,
    sHeight,
    w,
    h
  ), xDiff = getImageHorizontalDiff(image2.align?.horizontal ?? "center", w, asWidth), yDiff = getImageVerticalDiff(image2.align?.vertical ?? "center", h, asHeight);
  if (image2.fit === "crop") {
    source = await cropImage(source, def);
  }
  if (image2.overcolor) {
    source = await overcolorImage(source, def, asWidth, asHeight);
  }
  if (image2.outline) {
    source = await outlineImage(source, def, asWidth, asHeight);
  }
  cachedBySettings[cacheKey ?? getImageCacheKey(def.image)] = {
    image: source,
    width: sWidth,
    height: sHeight
  };
  return new CalculatedImage(
    source,
    {
      xDiff,
      yDiff,
      width: asWidth,
      height: asHeight
    }
  );
};
var getImageCacheKey = (image2) => JSON.stringify({ ...image2, timeout: void 0, calculated: void 0 });
var loadImage = async (def, src, modules) => {
  const image2 = new Image(), { image: { timeout = 3e4 } } = def, view = modules.core.view;
  image2.crossOrigin = "anonymous";
  image2.src = src;
  const promise = new Promise((resolve, reject) => {
    const timeoutTimer = setTimeout(() => {
      def.image.calculated = IMAGE_TIMEOUT_STATUS;
      reject(new Error("Image loading reached a timeout: " + src));
    }, timeout);
    image2.onerror = (e) => {
      clearTimeout(timeoutTimer);
      def.image.calculated = IMAGE_ERROR_STATUS;
      reject(e);
    };
    image2.onload = async () => {
      clearTimeout(timeoutTimer);
      def.image.calculated = await calculateImage(def, image2, modules);
      view.redrawDebounce();
      resolve();
    };
  });
  loadedImages[src] = IMAGE_LOADING_STATUS;
  await promise;
};
var overcolorImage = async (image2, def, asWidth, asHeight) => {
  const canvas = document.createElement("canvas"), ctx = canvas.getContext("2d"), overcolor = def.image.overcolor;
  canvas.setAttribute("width", String(asWidth));
  canvas.setAttribute("height", String(asHeight));
  ctx.drawImage(image2, 0, 0, asWidth, asHeight);
  ctx.globalCompositeOperation = "source-in";
  ctx.fillStyle = generateFill(overcolor.fill.type, overcolor.fill.style);
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.globalCompositeOperation = "source-over";
  const imageOvercolored = await canvasToWebp(canvas, image2);
  ctx.drawImage(imageOvercolored, 0, 0, asWidth, asHeight);
  return canvasToWebp(canvas, imageOvercolored);
};
var outlineImage = async (image2, def, asWidth, asHeight) => {
  const canvas = document.createElement("canvas"), ctx = canvas.getContext("2d"), outline = def.image.outline;
  if (!outline.thickness || !outline.fill) {
    return image2;
  }
  const thickness = outline.thickness;
  let dArr = [
    [-0.75, -0.75],
    // ↖️
    [0, -1],
    // ⬆️
    [0.75, -0.75],
    // ↗️
    [1, 0],
    // ➡️
    [0.75, 0.75],
    // ↘️
    [0, 1],
    // ⬇️
    [-0.75, 0.75],
    // ↙️
    [-1, 0]
    // ⬅️
  ];
  if (thickness > 5) {
    const granularity = Math.floor(thickness / 2.5);
    let newDArr = [];
    for (let i3 = 0; i3 < dArr.length; i3++) {
      newDArr.push(dArr[i3]);
      const [cX, cY] = dArr[i3], [dX, dY] = i3 + 1 === dArr.length ? dArr[0] : dArr[i3 + 1];
      const trendX = cX > dX ? -1 : 1, trendY = cY > dY ? -1 : 1, bX = Math.abs(cX - dX) / granularity * trendX, bY = Math.abs(cY - dY) / granularity * trendY, between = [];
      let x = cX, y = cY;
      while ((trendX > 0 && x + bX < dX || trendX < 0 && x + bX > dX) && (trendY > 0 && y + bY < dY || trendY < 0 && y + bY > dY)) {
        x += bX;
        y += bY;
        between.push([x, y]);
      }
      newDArr = newDArr.concat(between);
    }
    dArr = newDArr;
  }
  canvas.setAttribute("width", String(asWidth + thickness * 2));
  canvas.setAttribute("height", String(asHeight + thickness * 2));
  for (let i3 = 0; i3 < dArr.length; i3++) {
    ctx.drawImage(
      image2,
      thickness + dArr[i3][0] * thickness,
      thickness + dArr[i3][1] * thickness,
      asWidth,
      asHeight
    );
    if (thickness === 0) {
      break;
    }
  }
  ctx.globalCompositeOperation = "source-in";
  ctx.fillStyle = generateFill(outline.fill.type, outline.fill.style);
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.globalCompositeOperation = "source-over";
  ctx.drawImage(image2, thickness, thickness, asWidth, asHeight);
  return canvasToWebp(canvas, image2);
};
var canvasToWebp = async (canvas, dft) => {
  const image2 = new Image();
  image2.src = canvas.toDataURL("image/webp");
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      resolve(dft);
    }, 1e3);
    image2.onerror = () => {
      clearTimeout(timeout);
      resolve(dft);
    };
    image2.onload = () => {
      clearTimeout(timeout);
      resolve(image2);
    };
  });
};
var cropImage = async (image2, def) => {
  const { w: width, h: height } = def.size;
  let fitTo = def.image.fitTo ?? "auto", x = 0, y = 0;
  if (fitTo === "auto") {
    fitTo = height > width ? "height" : "width";
  }
  if (fitTo === "height") {
    x = (width - image2.width * (height / image2.height)) / 2;
  } else if (fitTo === "width") {
    y = (height - image2.height * (width / image2.width)) / 2;
  }
  const canvas = document.createElement("canvas"), ctx = canvas.getContext("2d");
  canvas.setAttribute("width", String(width));
  canvas.setAttribute("height", String(height));
  ctx.drawImage(image2, x, y, width - x * 2, height - y * 2);
  return canvasToWebp(canvas, image2);
};
var calculateAspectRatioFit = (fit, srcWidth, srcHeight, maxWidth, maxHeight) => {
  if (fit === "stretch" || fit === "crop") {
    return {
      width: maxWidth,
      height: maxHeight
    };
  }
  return getResized(srcWidth, srcHeight, maxWidth, maxHeight);
};
var getResized = (srcWidth, srcHeight, maxWidth, maxHeight) => {
  const ratio = Math.min(maxWidth / srcWidth, maxHeight / srcHeight), width = srcWidth * ratio, height = srcHeight * ratio;
  return {
    width,
    height
  };
};
var getImageVerticalDiff = (align, height, asHeight) => {
  if (align == "top") {
    return 0;
  }
  if (align == "bottom") {
    return height - asHeight;
  }
  return (height - asHeight) / 2;
};
var getImageHorizontalDiff = (align, width, asWidth) => {
  if (align == "left") {
    return 0;
  }
  if (align == "right") {
    return width - asWidth;
  }
  return (width - asWidth) / 2;
};

// src/action/text.calc.ts
var ResolveTextSize = (def) => {
  let fontSize = def.text.font?.size;
  if (!fontSize || typeof fontSize == "string") {
    fontSize = 0;
  }
  return {
    start: {
      y: def.start.y,
      x: def.start.x
    },
    size: {
      w: def.size.w,
      h: def.size.h ?? (def.text.lineHeight ?? fontSize) * (def.text.lines?.length ?? 0)
    }
  };
};
var ResolveTextCalc = async (def, modules, ctx) => {
  const illustrator = modules.illustrator;
  def.size = await illustrator.calc({
    layerType: "text",
    purpose: "size",
    values: def.size
  });
  def.start = await illustrator.calc({
    layerType: "text",
    purpose: "position",
    values: def.start
  });
  const {
    outlineThickness,
    fontSize,
    gap,
    lineHeight
  } = await illustrator.calc({
    layerType: "text",
    purpose: "prepare",
    values: {
      fontSize: getFontSizeForCalc(def),
      lineHeight: def.text.lineHeight ?? 0,
      gap: def.text.columns?.gap ?? 0,
      outlineThickness: def.text.outline?.thickness ?? 0
    }
  });
  if (def.text.lineHeight) {
    def.text.lineHeight = lineHeight;
  }
  if (def.text.outline?.thickness) {
    def.text.outline.thickness = outlineThickness;
  }
  def.text.columns = def.text.columns ?? { amount: 1, gap: 0 };
  def.text.columns.gap = gap;
  def.text.font = def.text.font ?? {};
  def.text.font.size = fontSize;
  if (typeof def.text.color?.type == "string") {
    await calcFill(illustrator, def.text.color);
  }
  const {
    lines,
    lineHeight: preparedLineHeight,
    width,
    columns,
    fontSize: preparedFontSize
  } = prepare(def, ctx, def.size.w);
  def.text.transY = calcVerticalMove(def.size.h, preparedLineHeight, lines, def.text.align?.vertical || "top");
  if (isSafari()) {
    def.start.y -= preparedFontSize * 0.2;
  }
  def.text.lineHeight = preparedLineHeight;
  def.text.font.size = preparedFontSize;
  def.text.columns = columns;
  def.size.w = width;
  def.text.lines = lines;
  def.area = ResolveTextSize(def);
  return def;
};
var prepare = (def, ctx, width) => {
  const columns = def.text.columns ?? { gap: 0, amount: 1 }, fontSize = getFontSize(def), { textBaseline = "top" } = def.text;
  let { value: text2 } = def.text;
  ctx.save();
  ctx.font = prepareFontShorthand(def, ctx, String(fontSize));
  ctx.textBaseline = textBaseline;
  const colWidth = calcColumnWidth(width, columns);
  text2 = addSpacing(def, text2);
  const lines = getTextLines(def, text2, ctx, colWidth);
  ctx.restore();
  return {
    lines,
    fontSize,
    lineHeight: def.text.lineHeight ?? fontSize,
    width: colWidth,
    columns
  };
};
var getTextLines = (def, text2, ctx, width) => {
  if (!def.text.wrap) {
    return [[text2, 0]];
  }
  const rows = [];
  let words = text2.split(/[^\S\r\n]/), line = "", i3 = 0;
  while (words.length > 0) {
    const newLinePos = words[0].search(/[\r\n]/);
    if (newLinePos !== -1) {
      const newLine = words[0].substring(0, newLinePos);
      rows.push([(line + " " + newLine).trim() + "\n", i3]);
      line = "";
      i3++;
      words[0] = words[0].substring(newLinePos + 1);
      continue;
    }
    const metrics = ctx.measureText(line + words[0]);
    if (metrics.width > width) {
      if (line.length > 0) {
        rows.push([line.trim(), i3]);
        i3++;
      }
      line = "";
    }
    line += " " + words[0];
    words = words.splice(1);
  }
  if (line.length > 0) {
    rows.push([line.replace(/^\s+/, ""), i3]);
  }
  return rows;
};
var addSpacing = (def, text2) => {
  if (!def.text.spacing) {
    return text2;
  }
  return text2.split("").join(getSpaceChart().repeat(def.text.spacing));
};
var calcColumnWidth = (rWidth, columns) => {
  return (rWidth - (columns.amount - 1) * columns.gap) / columns.amount;
};
var isSafari = () => {
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
};
var calcVerticalMove = (height, lineHeight, lines, vAlign) => {
  if (!height || lines.length * lineHeight >= height) {
    return 0;
  }
  const diff = height - lines.length * lineHeight;
  if (vAlign === "center") {
    return diff / 2;
  }
  if (vAlign === "bottom") {
    return diff;
  }
  return 0;
};

// src/action/group.calc.ts
var ResolveGroupSize = async (def) => {
  let area;
  if (def.group.interaction === "static") {
    area = ResolveGroupSizeForRelative(def);
  } else {
    area = ResolveGroupSizeForFixed(def);
    area.start.y += def.start.y;
    area.start.x += def.start.x;
  }
  if (def.group.clip) {
    if (!isNaN(def.size.h)) {
      area.size.h = def.size.h;
    }
    if (!isNaN(def.size.w)) {
      area.size.w = def.size.w;
    }
  }
  return area;
};
var generateArea = (def) => {
  return {
    size: {
      w: !isNaN(def.size.w ?? NaN) ? def.size.w : 0,
      h: !isNaN(def.size.h ?? NaN) ? def.size.h : 0
    },
    start: {
      x: 0,
      y: 0
    }
  };
};
var ResolveGroupSizeForRelative = (def) => {
  const area = generateArea(def);
  const rows = separateIntoRows(def, def.layout);
  if (!area.size.h) area.size.h = getRowsHeight(def, rows);
  if (!area.size.w) area.size.w = getRowsWidth(def, rows);
  area.start.x = def.start.x;
  area.start.y = def.start.y;
  return area;
};
var ResolveGroupSizeForFixed = (def) => {
  const area = generateArea(def);
  const skipW = !!area.size.w;
  const skipH = !!area.size.h;
  for (let i3 = 0; i3 < def.layout.length; i3++) {
    const subArea = def.layout[i3].area;
    if (!subArea) {
      continue;
    }
    if (!skipH) area.size.h = Math.max(area.size.h, subArea.size.h + subArea.start.y);
    if (!skipW) area.size.w = Math.max(area.size.w, subArea.size.w + subArea.start.x);
    area.start.y = Math.min(area.start.y, subArea.start.y);
    area.start.x = Math.min(area.start.x, subArea.start.x);
  }
  if (area.start.y < 0) {
    area.start.y = 0;
  }
  if (area.start.x < 0) {
    area.start.x = 0;
  }
  return area;
};
var ResolveGroupCalc = async (modules, def, sessionId) => {
  const { group: group2 } = def;
  def.size = await modules.illustrator.calc({
    layerType: "group",
    purpose: "size",
    values: def.size ?? { w: 0, h: 0 }
  });
  def.size.w ??= NaN;
  def.size.h ??= NaN;
  def.start = await modules.illustrator.calc({
    layerType: "group",
    purpose: "position",
    values: def.start ?? { x: 0, y: 0 }
  });
  def.start.y ??= 0;
  def.start.x ??= 0;
  group2.gap = await modules.illustrator.calc({
    layerType: "group",
    purpose: "gap",
    values: group2.gap ?? { vertical: 0, horizontal: 0 }
  });
  group2.gap.vertical ??= 0;
  group2.gap.horizontal ??= 0;
  const settings = modules.core.setting.get("workspace") ?? {};
  settings.relative ??= {};
  const pRelHeight = settings.relative.height;
  const pRelWidth = settings.relative.width;
  if (!isNaN(def.size.h)) settings.relative.height = def.size.h;
  if (!isNaN(def.size.w)) settings.relative.width = def.size.w;
  def.layout = await modules.core.view.recalculate(def, def.layout, sessionId);
  group2.interaction ??= "fixed";
  settings.relative.height = pRelHeight;
  settings.relative.width = pRelWidth;
  def.area = await ResolveGroupSize(def);
};

// src/definition/group.ts
var group = () => ({
  group: {
    clip: "boolean",
    interaction: "string",
    direction: "string",
    wrap: "boolean",
    gap: {
      vertical: "number",
      horizontal: "number"
    }
  }
});
var group_default = group;

// src/definition/image.ts
var image = () => ({
  image: {
    timeout: "number",
    fit: "string",
    overcolor: {
      fill: "string"
    },
    outline: {
      thickness: "number",
      fill: "string"
    },
    align: {
      vertical: "string",
      horizontal: "string"
    },
    fitTo: "string",
    src: "string"
  }
});
var image_default = image;

// src/definition/polygon.ts
var polygon = () => ({
  polygon: {
    steps: [
      {
        means: "string",
        args: {
          x: "number",
          y: "number",
          cp1x: "number",
          cp1y: "number",
          cp2x: "number",
          cp2y: "number",
          thickness: "number",
          fill: "string",
          lineJoin: "string",
          miterLimit: "number"
        }
      }
    ],
    size: {
      negative: {
        x: "number",
        y: "number"
      },
      positive: {
        x: "number",
        y: "number"
      }
    }
  }
});
var polygon_default = polygon;

// src/definition/text.ts
var text = () => ({
  text: {
    value: "string",
    align: {
      vertical: "string",
      horizontal: "string"
    },
    columns: {
      amount: "number",
      gap: "number"
    },
    font: {
      style: "string",
      family: "string",
      weight: "string",
      size: "string",
      stretch: "string",
      variant: "string",
      height: "string"
    },
    spacing: "number",
    textBaseline: "string",
    wrap: "boolean",
    lineHeight: "number",
    color: "string",
    outline: {
      fill: "string",
      thickness: "number",
      lineJoin: "string",
      miterLimit: "number",
      transY: "number",
      lines: [["string", "number"]]
    }
  }
});
var text_default = text;

// src/module.ts
var Illustrator = class {
  #canvas;
  #modules;
  #ctx;
  #herald;
  constructor(canvas, modules, herald) {
    if (!canvas) {
      throw new Error("[Antetype Illustrator] Provided canvas is empty");
    }
    this.#canvas = canvas;
    this.#modules = modules;
    this.#herald = herald;
    this.#ctx = this.#canvas.getContext("2d");
    this.#registerEvents();
  }
  #registerEvents() {
    const unregister = this.#herald.batch([
      {
        event: o.CLOSE,
        subscription: () => {
          unregister();
        }
      },
      {
        event: o.DRAW,
        subscription: async (event) => {
          const { element } = event.detail;
          const typeToAction = {
            clear: this.clear.bind(this),
            polygon: this.polygon.bind(this),
            image: this.image.bind(this),
            text: this.text.bind(this),
            group: this.group.bind(this)
          };
          const el = typeToAction[element.type];
          if (typeof el == "function") {
            await el(element);
          }
        }
      },
      {
        event: o.CALC,
        subscription: async (event) => {
          if (event.detail.element === null) {
            return;
          }
          const { element, sessionId } = event.detail;
          const typeToAction = {
            polygon: this.polygonCalc.bind(this),
            image: this.imageCalc.bind(this),
            text: this.textCalc.bind(this),
            group: this.groupCalc.bind(this)
          };
          const el = typeToAction[element.type];
          if (typeof el == "function") {
            await el(element, sessionId);
          }
        }
      },
      {
        event: o.TYPE_DEFINITION,
        subscription: (event) => {
          const definitions = event.detail.definitions;
          definitions.text = text_default();
          definitions.group = group_default();
          definitions.image = image_default();
          definitions.polygon = polygon_default();
        }
      }
    ]);
  }
  reset() {
    this.#canvas.width += 0;
  }
  clear() {
    this.#ctx.clearRect(
      0,
      0,
      this.#canvas.width,
      this.#canvas.height
    );
  }
  async groupCalc(def, sessionId = null) {
    await ResolveGroupCalc(this.#modules, def, sessionId);
  }
  group(def) {
    ResolveGroupAction(this.#ctx, this.#modules, def);
  }
  async polygonCalc(def) {
    def.start = await this.calc({
      layerType: "polygon",
      purpose: "position",
      values: def.start
    });
    def.polygon.size = {
      negative: { x: 0, y: 0 },
      positive: { x: 0, y: 0 }
    };
    for (const step of def.polygon.steps) {
      await ResolveCalcPolygon(def, step, this.#modules);
    }
    def.area = ResolvePolygonSize(def);
  }
  polygon({ polygon: { steps }, start: { x, y } }) {
    const ctx = this.#ctx;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x, y);
    for (const step of steps) {
      ResolvePolygonAction(ctx, step, x, y);
    }
    ctx.closePath();
    ctx.restore();
  }
  async imageCalc(def) {
    await ResolveImageCalc(this.#modules, def);
  }
  image(def) {
    ResolveImageAction(this.#ctx, def);
  }
  async textCalc(def) {
    await ResolveTextCalc(def, this.#modules, this.#ctx);
  }
  text(def) {
    ResolveTextAction(this.#ctx, def);
  }
  async calc(def) {
    const event = new CustomEvent(o2.CALC, { detail: def });
    await this.#herald.dispatch(event);
    return event.detail.values;
  }
  generateText(value) {
    return {
      type: "text",
      start: {
        x: 0,
        y: 0
      },
      size: {
        w: 300,
        h: 100
      },
      text: {
        value,
        font: {
          family: "Arial",
          weight: 400,
          size: 30
        }
      }
    };
  }
  generateImage(src) {
    return {
      type: "image",
      start: {
        x: 0,
        y: 0
      },
      size: {
        w: 300,
        h: 300
      },
      image: {
        src
      }
    };
  }
  generatePolygon(steps = []) {
    return {
      type: "polygon",
      start: {
        x: 0,
        y: 0
      },
      size: {
        w: NaN,
        h: NaN
      },
      polygon: {
        steps,
        size: {
          negative: {
            x: 0,
            y: 0
          },
          positive: {
            x: 0,
            y: 0
          }
        }
      }
    };
  }
  generateGroup(layout) {
    const group2 = {
      type: "group",
      start: {
        x: 0,
        y: 0
      },
      size: {
        w: NaN,
        h: NaN
      },
      group: {},
      layout: []
    };
    for (const layer of layout) {
      layer.hierarchy = {
        parent: group2,
        position: group2.layout.length
      };
      group2.layout.push(layer);
    }
    return group2;
  }
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

// test/asset/text-drawn.base64
var text_drawn_default = "data:image/png;base64,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";

// test/asset/image-drawn.base64
var image_drawn_default = "data:image/png;base64,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";

// test/asset/group-drawn.base64
var group_drawn_default = "data:image/png;base64,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";

// test/draw.spec.ts
describe("Layer is properly drawn", () => {
  let illustrator, core;
  const herald = new Herald();
  const canvas = document.createElement("canvas");
  canvas.width = 200;
  canvas.height = 200;
  canvas.style.height = "200px";
  canvas.style.width = "200px";
  document.body.appendChild(canvas);
  beforeEach(() => {
    core = Core({ herald, canvas });
    const modules = { core };
    illustrator = new Illustrator(canvas, modules, herald);
    modules.illustrator = illustrator;
    const unregister = herald.batch([
      {
        event: o.CLOSE,
        subscription: () => {
          unregister();
        }
      }
    ]);
  });
  afterEach(async () => {
    await close(herald);
  });
  it("text", async () => {
    await initialize(herald, [
      {
        type: "clear",
        start: { x: 0, y: 0 },
        size: { w: 0, h: 0 }
      },
      {
        type: "text",
        start: { x: 50, y: 50 },
        size: { w: 100, h: 100 },
        text: {
          align: {
            vertical: "center",
            horizontal: "center"
          },
          wrap: true,
          value: "text text text text",
          font: { size: 16 },
          lineHeight: 16,
          columns: {
            gap: 1,
            amount: 2
          },
          color: {
            type: "linear",
            style: {
              pos: {
                x: 50,
                y: 50
              },
              size: {
                w: 100,
                h: 100
              },
              colors: [
                {
                  offset: 0,
                  color: "#00F"
                },
                {
                  offset: 1,
                  color: "#0F0"
                }
              ]
            }
          },
          spacing: 1.5,
          outline: {
            thickness: 5,
            fill: {
              type: "linear",
              style: {
                pos: {
                  x: 50,
                  y: 50
                },
                size: {
                  w: 100,
                  h: 100
                },
                colors: [
                  {
                    offset: 0,
                    color: "#0F0"
                  },
                  {
                    offset: 1,
                    color: "#00F"
                  }
                ]
              }
            }
          }
        }
      }
    ]);
    expect(text_drawn_default).toBe(canvas.toDataURL());
  });
  it("image", async () => {
    await initialize(herald, [
      {
        type: "clear",
        start: { x: 0, y: 0 },
        size: { w: 0, h: 0 }
      },
      {
        type: "image",
        start: { x: 0, y: 0 },
        size: { w: 50, h: 75 },
        image: {
          src: "/__spec__/asset/image-draw.jpg",
          timeout: 1e3,
          align: {
            vertical: "top",
            horizontal: "left"
          },
          outline: {
            thickness: 10,
            fill: {
              style: "#FF0000"
            }
          }
        }
      },
      {
        type: "image",
        start: { x: 150, y: 0 },
        size: { w: 50, h: 75 },
        image: {
          src: "/__spec__/asset/users.webp",
          timeout: 1e3,
          align: {
            vertical: "top",
            horizontal: "right"
          },
          overcolor: {
            fill: {
              style: "#FF0000"
            }
          }
        }
      },
      {
        type: "image",
        start: { x: 0, y: 75 },
        size: { w: 200, h: 50 },
        image: {
          src: "/__spec__/asset/world.png",
          timeout: 1e3,
          align: {
            vertical: "center",
            horizontal: "center"
          }
        }
      },
      {
        type: "image",
        start: { x: 0, y: 125 },
        size: { w: 200, h: 25 },
        image: {
          fit: "crop",
          src: "/__spec__/asset/world.png",
          timeout: 1e3,
          align: {
            vertical: "center",
            horizontal: "center"
          }
        }
      }
    ], {
      illustrator: {
        image: {
          waitForLoad: true
        }
      }
    });
    expect(image_drawn_default).toBe(canvas.toDataURL());
  });
  it("group", async () => {
    await initialize(herald, [
      {
        type: "clear",
        start: { x: 0, y: 0 },
        size: { w: 0, h: 0 }
      },
      {
        type: "group",
        start: { x: 50, y: 50 },
        size: { w: 150, h: 150 },
        group: {},
        layout: [
          {
            type: "image",
            start: { x: 0, y: 0 },
            size: { w: 75, h: 75 },
            image: {
              src: "/__spec__/asset/image-draw.jpg",
              timeout: 1e3,
              align: {
                vertical: "center",
                horizontal: "center"
              }
            }
          },
          {
            type: "text",
            start: { x: 75, y: 0 },
            size: { w: 75, h: 75 },
            text: {
              align: {
                vertical: "center",
                horizontal: "center"
              },
              wrap: true,
              value: "text text text text",
              font: { size: 16 },
              lineHeight: 16,
              color: "#F00"
            }
          }
        ]
      }
    ], {
      illustrator: {
        image: {
          waitForLoad: true
        }
      }
    });
    expect(group_drawn_default).toBe(canvas.toDataURL());
  });
});
