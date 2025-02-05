import type { IStart, Layout, Module } from "@boardmeister/antetype-core";
import { Event } from "@boardmeister/antetype-workspace";
import { ResolvePolygonAction } from "@src/action/polygon";
import { IPolygonDef, PolygonActions } from "@src/type/polygon.d";
import { IImageDef } from "@src/type/image.d";
import { ResolveImageAction } from "@src/action/image";
import { ITextDef } from "@src/type/text.d";
import { ResolveTextAction } from "@src/action/text";
import { ResolveGroupAction } from "@src/action/group";
import { IGroupDef } from "@src/type/group.d";
import type { ICalcEvent, IInjected, ModulesWithCore } from "@src/index";
import { ResolveCalcPolygon, ResolvePolygonSize } from "@src/action/polygon.calc";
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
  calc: <T = Record<string, unknown>>(def: ICalcEvent) => Promise<T>;
  generateText: (value: string) => ITextDef;
  generateImage: (src: string|HTMLImageElement) => IImageDef;
  generatePolygon: (steps: PolygonActions[])=>  IPolygonDef;
  generateGroup: (layout: Layout) => IGroupDef;
}

export default class Illustrator implements IIllustrator {
  #canvas: HTMLCanvasElement;
  #modules: ModulesWithCore;
  #ctx: CanvasRenderingContext2D;
  #injected: IInjected;

  constructor(
    canvas: HTMLCanvasElement|null,
    modules: ModulesWithCore,
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
    def.polygon.size = {
      negative: { x: 0, y: 0 },
      positive: { x: 0, y: 0 },
    };

    for (const step of def.polygon.steps) {
      await ResolveCalcPolygon(def, step, this.#modules);
    }

    def.area = ResolvePolygonSize(def);
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
    await ResolveTextCalc(def, this.#modules, this.#ctx);
  }

  text(def: ITextDef): void {
    ResolveTextAction(this.#ctx, def);
  }

  async calc<T = Record<string, unknown>>(def: ICalcEvent): Promise<T> {
    const event = new CustomEvent(Event.CALC, { detail: def });
    await this.#injected.herald.dispatch(event);

    return event.detail.values as T;
  }

  generateText(value: string): ITextDef {
    return {
      type: 'text',
      start: {
        x: 0,
        y: 0,
      },
      size: {
        w: 300,
        h: 100,
      },
      text: {
        value,
        font: {
          family: 'Arial',
          weight: 400,
          size: 30,
        }
      }
    }
  }

  generateImage(src: string|HTMLImageElement): IImageDef {
    return {
      type: 'image',
      start: {
        x: 0,
        y: 0,
      },
      size: {
        w: 300,
        h: 300,
      },
      image: {
        src,
      }
    }
  }

  generatePolygon(steps: PolygonActions[] = []): IPolygonDef {
    return {
      type: 'polygon',
      start: {
        x: 0,
        y: 0,
      },
      size: {
        w: NaN,
        h: NaN,
      },
      polygon: {
        steps,
        size: {
          negative: {
            x: 0,
            y: 0,
          },
          positive: {
            x: 0,
            y: 0,
          },
        }
      }
    }
  }

  generateGroup(layout: Layout): IGroupDef {
    const group = {
      type: 'group',
      start: {
        x: 0,
        y: 0,
      },
      size: {
        w: NaN,
        h: NaN,
      },
      group: {},
      layout: [] as Layout,
    }


    for (const layer of layout) {
      layer.hierarchy = {
        parent: group,
        position: group.layout.length,
      }
      group.layout.push(layer);
    }

    return group;
  };
}
