import type { Modules, IStart, Module } from "@boardmeister/antetype";
import { Event, ICalcEvent } from "@boardmeister/antetype-workspace";
import { ResolvePolygonAction } from "@src/action/polygon";
import { IPolygonDef } from "@src/type/polygon.d";
import { IImageDef } from "@src/type/image.d";
import { ResolveImageAction } from "@src/action/image";
import { ITextDef } from "@src/type/text.d";
import { ResolveTextAction } from "@src/action/text";
import { ResolveGroupAction } from "@src/action/group";
import { IGroupDef } from "@src/type/group.d";
import { IInjected } from "@src/index";
import { ResolveCalcPolygon } from "@src/action/polygon.calc";
import { ResolveImageCalc } from "@src/action/image.calc";
import { ResolveTextCalc } from "@src/action/text.calc";
import { ResolveGroupCalc } from "@src/action/group.calc";

export interface IIllustrator extends Module {
  reset: () => void;
  clear: () => void;
  group: (def: IGroupDef) => void;
  polygon: (def: IPolygonDef) => void;
  image: (def: IImageDef) => void;
  text: (def: ITextDef) => void;
  calc: <T extends Record<string, any>>(def: ICalcEvent) => Promise<T>;
}

export default class Illustrator implements IIllustrator {
  #canvas: HTMLCanvasElement;
  #modules: Modules;
  #ctx: CanvasRenderingContext2D;
  #injected: IInjected;

  constructor(
    canvas: HTMLCanvasElement|null,
    modules: Modules,
    injected: IInjected,
  ) {
    if (!canvas) {
      throw new Error('[Antetype Illustrator] Provided canvas is empty')
    }
    this.#canvas = canvas;
    this.#modules = modules;
    this.#injected = injected;
    this.#ctx = this.#canvas.getContext('2d')!;
  }

  reset(): void {
    this.#canvas.width += 0;
  }

  clear(): void {
    this.#ctx.clearRect(
      0,
      0,
      this.#canvas.width,
      this.#canvas.height,
    );
  }

  async groupCalc(def: IGroupDef): Promise<void> {
    await ResolveGroupCalc(this.#modules, def);
  }

  group(def: IGroupDef): void {
    ResolveGroupAction(this.#ctx, this.#modules, def);
  }

  async polygonCalc(def: IPolygonDef): Promise<void> {
    def.start = await this.calc<IStart>({
      layerType: 'polygon',
      purpose: 'position',
      values: def.start,
    });

    for (const step of def.polygon.steps) {
      await ResolveCalcPolygon(step, this.#modules);
    }
  }

  polygon({ polygon: { steps }, start: { x, y } }: IPolygonDef): void {
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

  async imageCalc(def: IImageDef): Promise<void> {
    await ResolveImageCalc(this.#modules, def);
  }

  image(def: IImageDef): void {
    ResolveImageAction(this.#ctx, def);
  }

  async textCalc(def: ITextDef): Promise<void> {
    await ResolveTextCalc(def, this.#modules);
  }

  text(def: ITextDef): void {
    ResolveTextAction(this.#ctx, def);
  }

  async calc<T extends Record<string, any> = Record<string, any>>(def: ICalcEvent): Promise<T> {
    const event = new CustomEvent(Event.CALC, { detail: def });
    await this.#injected.herald.dispatch(event);

    return event.detail.values as T;
  }
}
