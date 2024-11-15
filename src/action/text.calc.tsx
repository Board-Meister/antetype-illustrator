import type { Modules } from "@boardmeister/antetype";
import { ITextDef } from "@src/type/text.d";
import { calcFill } from "@src/shared";
import { IIllustrator } from "@src/module";
import { getFontSize } from "@src/action/text";

export const ResolveTextCalc = async (
  def: ITextDef,
  modules: Modules,
): Promise<ITextDef> => {
  const illustrator = modules.illustrator as IIllustrator;
  def.size = await illustrator.calc<ITextDef['size']>({
    layerType: 'text',
    purpose: 'size',
    values: def.size,
  });

  def.start = await illustrator.calc<ITextDef['start']>({
    layerType: 'text',
    purpose: 'position',
    values: def.start,
  });

  const {
    outlineThickness,
    fontSize,
    gap,
    lineHeight
  } = await illustrator.calc<{ fontSize: number, gap: number, outlineThickness: number, lineHeight: number }>({
    layerType: 'text',
    purpose: 'prepare',
    values: {
      fontSize: getFontSize(def),
      lineHeight: def.text.lineHeight ?? 0,
      gap: def.text.columns?.gap ?? 0,
      outlineThickness: def.text.outline?.thickness ?? 0,
    },
  });

  if (def.text.lineHeight) {
    def.text.lineHeight = lineHeight;
  }

  if (def.text.outline?.thickness) {
    def.text.outline.thickness = outlineThickness;
  }

  def.text.columns = def.text.columns ?? { amount: 1, gap: 0 };
  def.text.columns.gap = gap;

  def.text.font = def.text.font ?? {};
  def.text.font.size = fontSize;

  if (typeof def.text.color.type == 'string') {
    await calcFill(illustrator, def.text.color);
  }

  return def;
}
