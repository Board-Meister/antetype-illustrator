import type { IInjectable, Module } from "@boardmeister/marshal"
import type { Minstrel } from "@boardmeister/minstrel"
import type { Herald, ISubscriber, Subscriptions  } from "@boardmeister/herald"
import type { ModulesEvent } from "@boardmeister/antetype-core"
import type Illustrator from "@src/module";
import { Event as AntetypeCoreEvent } from "@boardmeister/antetype-core"
import type { ModulesWithCore } from "@src/type/type.d";

export interface IInjected extends Record<string, object> {
  minstrel: Minstrel;
  herald: Herald;
}

/**
 * The main piece of the tool - the drawing script.
 * Currently, supports:
 * - groups
 * - images
 * - polygons
 * - text
 * - clearing mechanism
 */
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
    modules.illustrator = new this.#module!(canvas, modules as ModulesWithCore, this.#injected!.herald);
  }

  static subscriptions: Subscriptions = {
    [AntetypeCoreEvent.MODULES]: 'register',
  }
}

const EnAntetypeIllustrator: IInjectable<IInjected>&ISubscriber = AntetypeIllustrator;

export default EnAntetypeIllustrator;


