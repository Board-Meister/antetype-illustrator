import type { IBaseDef } from "@boardmeister/antetype-core";
import { IGroupDef } from "@src/type/group.d";
import { ModulesWithCore } from "@src/index";

export const ResolveGroupAction = (
  ctx: CanvasRenderingContext2D,
  modules: ModulesWithCore,
  def: IGroupDef,
): void => {
  const { group, start } = def;
  if (def.layout.length === 0) {
    return;
  }

  ctx.save();
  ctx.translate(start.x, start.y);
  if (group.interaction === 'fixed') {
    modules.core!.view.redraw(def.layout);
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
  modules: ModulesWithCore,
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
      modules.core!.view.draw(layer.def);
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
