import type { IInjectable, Module } from "@boardmeister/marshal"
import type { Minstrel } from "@boardmeister/minstrel"
import type { Herald, ISubscriber, Subscriptions  } from "@boardmeister/herald"
import { Event } from "@boardmeister/antetype"
import type { ModulesEvent } from "@boardmeister/antetype"
import type Illustrator from "@src/module";

export interface IInjected extends Record<string, object> {
  minstrel: Minstrel;
  herald: Herald;
}

export class AntetypeIllustrator {
  #module: (typeof Illustrator)|null = null;
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
    modules.illustrator = new this.#module!(canvas, modules, this.#injected!);
  }

  static subscriptions: Subscriptions = {
    [Event.MODULES]: 'register',
  }
}

const EnAntetypeIllustrator: IInjectable&ISubscriber = AntetypeIllustrator;

export default EnAntetypeIllustrator;
