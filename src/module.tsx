import type { Modules } from "@boardmeister/antetype";
import { ResolvePolygonAction } from "@src/action/polygon";
import { IPolygonDef } from "@src/type/polygon.d";
import { IImageDef } from "@src/type/image.d";
import { ResolveImageAction } from "@src/action/image";
import { ITextDef } from "@src/type/text.d";
import { ResolveTextAction } from "@src/action/text";
import { ResolveGroupAction } from "@src/action/group";
import { IGroupDef } from "@src/type/group.d";
import { IInjected } from "@src/index";
import { Event, ICalcEvent } from "@src/type/event.d";

export interface IIllustrator {
  reset: () => void;
  clear: () => void;
  group: (def: IGroupDef) => Promise<void>;
  polygon: (def: IPolygonDef) => void;
  image: (def: IImageDef) => Promise<void>;
  text: (def: ITextDef) => Promise<void>;
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

  async group(def: IGroupDef): Promise<void> {
    await ResolveGroupAction(this.#ctx, this.#modules, def);
  }

  async polygon({ steps, start: { x, y } }: IPolygonDef): Promise<void> {
    const ctx = this.#ctx;
    ctx.save();
    ctx.beginPath();
    ({ x, y } = await this.calc<{ x: number, y: number }>({
      layerType: 'polygon',
      purpose: 'position',
      values: { x, y },
    }));
    ctx.moveTo(x, y);

    for (const step of steps) {
      await ResolvePolygonAction(ctx, step, x, y, this.#modules);
    }

    ctx.closePath();
    ctx.restore();
  }

  async image(def: IImageDef): Promise<void> {
    return ResolveImageAction(this.#ctx, this.#modules, def);
  }

  async text(def: ITextDef): Promise<void> {
    await ResolveTextAction(this.#ctx, def, this.#modules);
  }

  async calc<T extends Record<string, any> = Record<string, any>>(def: ICalcEvent): Promise<T> {
    const event = new CustomEvent(Event.CALC, { detail: def });
    await this.#injected.herald.dispatch(event);

    return event.detail.values as T;
  }
}
