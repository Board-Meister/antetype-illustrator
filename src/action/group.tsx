import type { Modules, ISystemModule } from "@boardmeister/antetype";
import { IGroupDef } from "@src/type/group.d";
import { IIllustrator } from "@src/module";

export const ResolveGroupCalc = async (
  modules: Modules,
  group: IGroupDef
): Promise<void> => {
  group.start = await (modules.illustrator as IIllustrator).calc<IGroupDef['start']>({
    layerType: 'group',
    purpose: 'position',
    values: group.start,
  });
  group.layout = await (modules.system as ISystemModule).view.recalc(group.layout);
}

export const ResolveGroupAction = (
  ctx: CanvasRenderingContext2D,
  modules: Modules,
  group: IGroupDef,
): void => {
  ctx.save();
  ctx.translate(group.start.x, group.start.y);
  (modules.system as ISystemModule).view.redraw(group.layout);
  ctx.restore();
}
