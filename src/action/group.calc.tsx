import type { IArea } from "@boardmeister/antetype-core";
// import type { Modules } from "@boardmeister/antetype";
import type { IWorkspaceSettings } from "@boardmeister/antetype-workspace";
import { IGroupDef } from "@src/type/group.d";
import { IIllustrator } from "@src/module";
import { ModulesWithCore } from "@src/index";
import { getRowsHeight, getRowsWidth, separateIntoRows } from "@src/action/group";

const ResolveGroupSize = async (def: IGroupDef): Promise<IArea> => {
  let area: IArea;
  if (def.group.interaction === 'static') {
    area = ResolveGroupSizeForRelative(def);
  } else {
    area = ResolveGroupSizeForFixed(def);

    area.start.y += def.start.y;
    area.start.x += def.start.x;
  }

  if (def.group.clip) {
    if (!isNaN(def.size.h)) {
      area.size.h = def.size.h;
    }

    if (!isNaN(def.size.w)) {
      area.size.w = def.size.w;
    }
  }

  return area;
}

const generateArea = (def: IGroupDef): IArea => {
  return {
    size: {
      w: !isNaN(def.size.w ?? NaN) ? def.size.w : 0,
      h: !isNaN(def.size.h ?? NaN) ? def.size.h : 0,
    },
    start: {
      x: 0,
      y: 0,
    }
  };
}

const ResolveGroupSizeForRelative = (def: IGroupDef): IArea => {
  const area = generateArea(def);
  const rows = separateIntoRows(def, def.layout);
  if (!area.size.h) area.size.h = getRowsHeight(def, rows);
  if (!area.size.w) area.size.w = getRowsWidth(def, rows);
  area.start.x = def.start.x;
  area.start.y = def.start.y;

  return area;
}

const ResolveGroupSizeForFixed = (def: IGroupDef): IArea => {
  const area = generateArea(def);

  const skipW = !!area.size.w;
  const skipH = !!area.size.h;
  for (let i = 0; i < def.layout.length; i++) {
    const subArea = def.layout[i].area;
    if (!subArea) {
      continue;
    }
    if (!skipH) area.size.h = Math.max(area.size.h, subArea.size.h + subArea.start.y);
    if (!skipW) area.size.w = Math.max(area.size.w, subArea.size.w + subArea.start.x);
    area.start.y = Math.min(area.start.y, subArea.start.y);
    area.start.x = Math.min(area.start.x, subArea.start.x);
  }

  return area;
}

export const ResolveGroupCalc = async (
  modules: ModulesWithCore,
  def: IGroupDef,
  sessionId: symbol|null,
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

  group.gap = await (modules.illustrator as IIllustrator).calc<{ vertical: number, horizontal: number }>({
    layerType: 'group',
    purpose: 'gap',
    values: group.gap ?? { vertical: 0, horizontal: 0 },
  });
  group.gap.vertical ??= 0;
  group.gap.horizontal ??= 0;

  /* Set relative sizes */
  const settings = (modules.core!.setting.get('workspace') ?? {}) as IWorkspaceSettings;
  settings.relative ??= {};
  const pRelHeight = settings.relative.height;
  const pRelWidth = settings.relative.width;
  if (!isNaN(def.size.h)) settings.relative.height = Math.floor(def.size.h);
  if (!isNaN(def.size.w)) settings.relative.width = Math.floor(def.size.w);
  modules.core!.setting.set('workspace', settings);

  def.layout = await modules.core!.view.recalculate(def, def.layout, sessionId);

  group.interaction ??= 'fixed';

  settings.relative.height = pRelHeight;
  settings.relative.width = pRelWidth;

  def.area = await ResolveGroupSize(def);
}
