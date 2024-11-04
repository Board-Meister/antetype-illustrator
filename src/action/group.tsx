import { Modules, ISystemModule } from "@boardmeister/antetype";
import { IGroupDef } from "@src/type/group.d";
import { IIllustrator } from "@src/module";

export const ResolveGroupAction = async (
  ctx: CanvasRenderingContext2D,
  modules: Modules,
  group: IGroupDef,
): Promise<void> => {
  ctx.save();
  const { x, y } = await (modules.illustrator as IIllustrator).calc<{ x: number, y: number }>({
    layerType: 'group',
    purpose: 'position',
    values: { x: group.start.x, y: group.start.y },
  });
  ctx.translate(x, y);
  for (const layer of group.layout) {
    await (modules.system as ISystemModule).view.draw(layer);
  }
  ctx.restore();
}
