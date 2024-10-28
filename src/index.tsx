import type { IInjectable, Module } from "@boardmeister/marshal"
import type { Minstrel } from "@boardmeister/minstrel"
import type { Herald, ISubscriber, Subscriptions  } from "@boardmeister/herald"
import { Event } from "@boardmeister/antetype"
import type {  DrawEvent, ModulesEvent } from "@boardmeister/antetype"
import type Illustrator from "@src/module";

export interface IInjected extends Record<string, object> {
  minstrel: Minstrel;
  herald: Herald;
}

export class AntetypeIllustrator {
  #module: (typeof Illustrator)|null = null;
  #instance: Illustrator|null = null;
  #injected?: IInjected;
  static inject: Record<string, string> = {
    minstrel: 'boardmeister/minstrel',
    herald: 'boardmeister/herald',
  }
  inject(injections: IInjected): void {
    this.#injected = injections;
  }

  async register(event: CustomEvent<ModulesEvent>): Promise<void> {
    const { modules, canvas } = event.detail;
    if (!this.#module) {
      const module = this.#injected!.minstrel.getResourceUrl(this as Module, 'module.js');
      this.#module = (await import(module)).default;
    }
    this.#instance = modules.illustrator = new this.#module!(canvas, modules);
  }

  draw(event: CustomEvent<DrawEvent>): void {
    if (!this.#instance) {
      return;
    }
    const { element } = event.detail;
    const typeToAction: Record<string, Function> = {
      clear: this.#instance.clear.bind(this.#instance),
      polygon: this.#instance.polygon.bind(this.#instance),
      image: this.#instance.image.bind(this.#instance),
      text: this.#instance.text.bind(this.#instance),
      group: this.#instance.group.bind(this.#instance),
    };

    const el = typeToAction[element.type]
    if (typeof el == 'function') {
      el(element);
    }
  }

  static subscriptions: Subscriptions = {
    [Event.MODULES]: 'register',
    [Event.DRAW]: 'draw',
  }
}

const EnAntetypeIllustrator: IInjectable&ISubscriber = AntetypeIllustrator;

export default EnAntetypeIllustrator;
