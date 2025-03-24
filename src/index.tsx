import type { IInjectable, Module } from "@boardmeister/marshal"
import type { Minstrel } from "@boardmeister/minstrel"
import type { Herald, ISubscriber, Subscriptions  } from "@boardmeister/herald"
import type {
  Modules, DrawEvent, CalcEvent, IBaseDef, IParentDef, ModulesEvent
} from "@boardmeister/antetype-core"
import type Illustrator from "@src/module";
import type { IIllustrator } from "@src/module";
import type { IPolygonArgs } from "@src/type/polygon.d";
import type { IImageArg } from "@src/type/image.d";
import type { ITextArgs } from "@src/type/text.d";
import type { IGroupArgs } from "@src/type/group.d";
import { Event as AntetypeCoreEvent } from "@boardmeister/antetype-core"

export interface ModulesWithCore extends Modules {
  illustrator: IIllustrator;
}

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
    this.#instance = modules.illustrator = new this.#module!(canvas, modules as ModulesWithCore, this.#injected!);
  }

  async draw(event: CustomEvent<DrawEvent>): Promise<void> {
    if (!this.#instance) {
      return;
    }
    const { element } = event.detail;
    const typeToAction: Record<string, (def: GenericBaseDef) => void> = {
      clear: this.#instance.clear.bind(this.#instance),
      polygon: this.#instance.polygon.bind(this.#instance),
      image: this.#instance.image.bind(this.#instance),
      text: this.#instance.text.bind(this.#instance),
      group: this.#instance.group.bind(this.#instance),
    };

    const el = typeToAction[element.type]
    if (typeof el == 'function') {
      await el(element as GenericBaseDef);
    }
  }

  async calc(event: CustomEvent<CalcEvent>): Promise<void> {
    if (!this.#instance || event.detail.element === null) {
      return;
    }
    const { element, sessionId } = event.detail;
    const typeToAction: Record<string, (def: GenericBaseDef, sessionId?: symbol|null) => Promise<void>> = {
      polygon: this.#instance.polygonCalc.bind(this.#instance),
      image: this.#instance.imageCalc.bind(this.#instance),
      text: this.#instance.textCalc.bind(this.#instance),
      group: this.#instance.groupCalc.bind(this.#instance),
    };

    const el = typeToAction[element.type]
    if (typeof el == 'function') {
      await el(element as GenericBaseDef, sessionId);
    }
  }

  static subscriptions: Subscriptions = {
    [AntetypeCoreEvent.MODULES]: 'register',
    [AntetypeCoreEvent.DRAW]: 'draw',
    [AntetypeCoreEvent.CALC]: 'calc',
  }
}

const EnAntetypeIllustrator: IInjectable<IInjected>&ISubscriber = AntetypeIllustrator;

export type { IIllustrator } from '@src/module';
export type { Event, ICalcEvent } from '@src/type/event.d';
export type { IPolygonDef } from "@src/type/polygon.d";
export type { IImageDef } from "@src/type/image.d";
export type { ITextDef } from "@src/type/text.d";
export type { IGroupDef } from "@src/type/group.d";
export default EnAntetypeIllustrator;

type Assign<T, R> = T & R;

type GenericBaseDef = Assign<IBaseDef|IParentDef, {
  polygon: IPolygonArgs,
  image: IImageArg,
  text: ITextArgs,
  group: IGroupArgs,
  layout: IBaseDef[],
}>;
