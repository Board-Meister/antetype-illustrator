import type { IInjectable, Module } from "@boardmeister/marshal"
import type { Herald, ISubscriber, Subscriptions  } from "@boardmeister/herald"
import type { ModulesEvent } from "@boardmeister/antetype-core"
import type Illustrator from "@src/module";
import type { ModulesWithCore } from "@src/type/type.d";
import type Marshal from "@boardmeister/marshal";
import { Event as AntetypeCoreEvent } from "@boardmeister/antetype-core"

export const ID = 'illustrator';
export const VERSION = '0.0.4';

export interface IInjected extends Record<string, object> {
  marshal: Marshal;
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
    marshal: 'boardmeister/marshal',
    herald: 'boardmeister/herald',
  }
  inject(injections: IInjected): void {
    this.#injected = injections;
  }

  register(event: ModulesEvent): void {
    const { registration } = event.detail;

    registration[ID] = {
      load: async () => {
         if (!this.#module) {
          const module = this.#injected!.marshal.getResourceUrl(this as Module, 'module.js');
          this.#module = ((await import(module)) as { default: typeof Illustrator }).default;
        }

        return (modules, canvas) => new this.#module!(canvas, modules as ModulesWithCore, this.#injected!.herald);
      },
      version: VERSION,
    };
  }

  static subscriptions: Subscriptions = {
    [AntetypeCoreEvent.MODULES]: 'register',
  }
}

const EnAntetypeIllustrator: IInjectable<IInjected>&ISubscriber = AntetypeIllustrator;

export default EnAntetypeIllustrator;


