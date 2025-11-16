import type { ICore, Modules } from "@boardmeister/antetype-core"
import type Illustrator from "@src/module";
import type { IIllustrator } from "@src/module";

export interface ModulesWithCore extends Modules {
  core: ICore;
  illustrator?: IIllustrator;
}

export type Context = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;