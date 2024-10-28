import { ResolvePolygonAction } from "@src/action/polygon";
import { IPolygonDef } from "@src/type/polygon.d";
import { IImageDef } from "@src/type/image.d";
import { ResolveImageAction } from "@src/action/image";
import type { Modules, DrawEvent } from "@boardmeister/antetype";
import { IInjected } from "@src/index";
import { Event } from "@boardmeister/antetype"
import { ITextDef } from "@src/type/text.d";
import { ResolveTextAction } from "@src/action/text";
import { ResolveGroupAction } from "@src/action/group";
import { IGroupDef } from "@src/type/group.d";

export interface IIllustrator {
  polygon: (def: IPolygonDef) => void;
}

export default class Illustrator implements IIllustrator {
  #canvas: HTMLCanvasElement;
  #modules: Modules;
  #injected: IInjected;
  #ctx: CanvasRenderingContext2D;

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
    this.#ctx = this.#canvas.getContext('2d')!;
    this.#injected = injected;
    this.registerDrawEvents();
  }

  /**
   * @TODO verify that we don't have to unregister our events. In theory this is a singleton but let's make sure
   *       that it works as intended
   */
  registerDrawEvents(): void {
    this.#injected.herald.batch([
      {
        event: Event.DRAW,
        subscription: (event: CustomEvent<DrawEvent>) => {
          const { element } = event.detail;
          const typeToAction: Record<string, Function> = {
            clear: this.clear.bind(this),
            polygon: this.polygon.bind(this),
            image: this.image.bind(this),
            text: this.text.bind(this),
            group: this.group.bind(this),
          };

          const el = typeToAction[element.type]
          if (typeof el == 'function') {
            el(element);
          }
        }
      }
    ])
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
    ctx.moveTo(x, y);

    for (const step of steps) {
      await ResolvePolygonAction(ctx, step, x, y);
    }

    ctx.closePath();
    ctx.restore();
  }

  async image(def: IImageDef): Promise<void> {
    return ResolveImageAction(this.#ctx, this.#modules, def);
  }

  async text(def: ITextDef): Promise<void> {
    await ResolveTextAction(this.#ctx, def);
  }
}
