import type { Modules, IBaseDef } from "@boardmeister/antetype";
import type { IWorkspaceSettings } from "@boardmeister/antetype-workspace";
import { IGroupDef } from "@src/type/group.d";
import { IIllustrator } from "@src/module";

export const ResolveGroupCalc = async (
  modules: Modules,
  def: IGroupDef
): Promise<void> => {
  const { group } = def;

  def.size = await (modules.illustrator as IIllustrator).calc<IGroupDef['size']>({
    layerType: 'group',
    purpose: 'size',
    values: def.size ?? { w: 0, h: 0 },
  });
  def.size.w ??= NaN;
  def.size.h ??= NaN;

  def.start = await (modules.illustrator as IIllustrator).calc<IGroupDef['start']>({
    layerType: 'group',
    purpose: 'position',
    values: def.start ?? { x: 0, y: 0 },
  });
  def.start.y ??= 0;
  def.start.x ??= 0;

  /* Set relative sizes */
  const settings = (modules.system.setting.get('workspace') ?? {}) as IWorkspaceSettings;
  settings.relative ??= {};
  const pRelHeight = settings.relative.height;
  const pRelWidth = settings.relative.width;
  if (!isNaN(def.size.h)) settings.relative.height = Math.floor(def.size.h);
  if (!isNaN(def.size.w)) settings.relative.width = Math.floor(def.size.w);
  modules.system.setting.set('workspace', settings);

  def.layout = await modules.system.view.recalc(def);

  group.gap = await (modules.illustrator as IIllustrator).calc<{ vertical: number, horizontal: number }>({
    layerType: 'group',
    purpose: 'gap',
    values: group.gap ?? { vertical: 0, horizontal: 0 },
  });
  group.gap.vertical ??= 0;
  group.gap.horizontal ??= 0;

  group.interaction ??= 'fixed';

  settings.relative.height = pRelHeight;
  settings.relative.width = pRelWidth;
}

export const ResolveGroupAction = (
  ctx: CanvasRenderingContext2D,
  modules: Modules,
  def: IGroupDef,
): void => {
  const { group, start } = def;
  if (def.layout.length === 0) {
    return;
  }

  ctx.save();
  ctx.translate(start.x, start.y);
  if (group.interaction === 'fixed') {
    modules.system.view.redraw(def.layout);
  } else {
    drawLayersRelatively(ctx, modules, def);
  }
  ctx.restore();
}

interface IRowLayer {
  def: IBaseDef;
  x: number;
}

interface IGroupRow {
  height: number,
  width: number,
  layers: IRowLayer[]
}

const getRowsHeight = (
  def: IGroupDef,
  rows: IGroupRow[],
): number => {
  let height = 0;
  const horizontal = def.group.gap!.horizontal!;
  rows.forEach(row => {
    height += row.height + horizontal;
  })

  return height - horizontal;
}

const getRowsWidth = (
  rows: IGroupRow[],
): number => {
  let width = 0;
  rows.forEach(row => {
    width += row.width;
  })

  return width;
}

const drawLayersRelatively = (
  ctx: CanvasRenderingContext2D,
  modules: Modules,
  def: IGroupDef,
): void => {
  const { group } = def;
  const { vertical, horizontal } = group.gap as { vertical: number, horizontal: number };
  const rows = separateIntoRows(def, def.layout);
  if (group.clip && (!isNaN(def.size?.w) || !isNaN(def.size?.h))) {
    // @TODO allow defining the shape of clipping (probably using polygon syntax)
    ctx.beginPath();
    ctx.rect(
      def.start.x,
      def.start.y,
      isNaN(def.size!.w) ? getRowsWidth(rows) : def.size.w,
      isNaN(def.size!.h) ? getRowsHeight(def, rows) : def.size.h,
    );
    ctx.clip();
  }

  let currentHeight = 0;
  let xShift = 0;
  rows.forEach(row => {
    row.layers.forEach(layer => {
      ctx.save();
      ctx.translate(xShift, currentHeight);
      modules.system.view.draw(layer.def);
      ctx.restore();
      xShift += layer.def.size.w + vertical;
    });
    xShift = 0;
    currentHeight += row.height + horizontal;
  });
}

const separateIntoRows = (
  def: IGroupDef,
  layout: IBaseDef[],
): IGroupRow[] => {
  const { size } = def;
  const rows: IGroupRow[] = [];
  const generateRow = (): IGroupRow => ({ height: 0, width: 0, layers: [] });
  let row = generateRow();
  layout.forEach((layer, i) => {
    if (
      (
        def.group.wrap
        && size.w != 0
        && row.width + layer.size.w > size.w
      )
      || (
        i != 0
        && def.group.direction === 'column'
      )
    ) {
      rows.push(row);
      row = generateRow();
    }

    row.layers.push({ x: row.width, def: layer });
    if (row.height < layer.size.h) row.height = layer.size.h;
    row.width += layer.size.w + def.group.gap!.vertical!;
  });
  rows.push(row);

  return rows;
}
