import { Modules, ISystemModule } from "@boardmeister/antetype";
import { IGroupDef } from "@src/type/group.d";

export const ResolveGroupAction = async (
  ctx: CanvasRenderingContext2D,
  modules: Modules,
  group: IGroupDef,
): Promise<void> => {
  ctx.save();
  ctx.translate(group.start.x, group.start.y);
  for (const layer of group.layout) {
    await (modules.system as ISystemModule).draw(layer);
  }
  ctx.restore();
}
