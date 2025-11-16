import type { IBaseDef } from "@boardmeister/antetype-core";
import { IGroupDef } from "@src/type/group.d";
import type { Context, ModulesWithCore } from "@src/type/type.d";

export const ResolveGroupAction = (
  ctx: Context,
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

export const getRowsHeight = (
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

export const getRowsWidth = (
  def: IGroupDef,
  rows: IGroupRow[],
): number => {
  let width = 0;
  const vertical = def.group.gap!.vertical!;
  rows.forEach(row => {
    if (def.group.direction === "column") {
      width = Math.max(width, row.width);
    } else {
      width += row.width + vertical;
    }
  });

  if (def.group.direction === "row") {
    width -= vertical;
  }

  return width;
}

const drawLayersRelatively = (
  ctx: Context,
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
      0,
      0,
      isNaN(def.size!.w) ? getRowsWidth(def, rows) : def.size.w,
      isNaN(def.size!.h) ? getRowsHeight(def, rows) : def.size.h,
    );
    ctx.clip();
  }

  let currentHeight = 0;
  let xShift = 0;
  rows.forEach(row => {
    row.layers.forEach(layer => {
      layer.def.start.x = xShift;
      layer.def.start.y = currentHeight;
      if (layer.def.area) {
        layer.def.area.start.x = xShift;
        layer.def.area.start.y = currentHeight;
      }
      modules.core!.view.draw(layer.def);
      xShift += layer.def.size.w + vertical;
    });
    xShift = 0;
    currentHeight += row.height + horizontal;
  });
}

export const separateIntoRows = (
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
