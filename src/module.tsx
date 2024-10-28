import type { Modules } from "@boardmeister/antetype";
import { ResolvePolygonAction } from "@src/action/polygon";
import { IPolygonDef } from "@src/type/polygon.d";
import { IImageDef } from "@src/type/image.d";
import { ResolveImageAction } from "@src/action/image";
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
  #ctx: CanvasRenderingContext2D;

  constructor(
    canvas: HTMLCanvasElement|null,
    modules: Modules,
  ) {
    if (!canvas) {
      throw new Error('[Antetype Illustrator] Provided canvas is empty')
    }
    this.#canvas = canvas;
    this.#modules = modules;
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
