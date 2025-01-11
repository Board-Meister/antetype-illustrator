import type { IArea } from "@boardmeister/antetype-core";
import type { Modules } from "@boardmeister/antetype";
import { ITextColumns, ITextDef, VerticalAlign } from "@src/type/text.d";
import { calcFill } from "@src/shared";
import { IIllustrator } from "@src/module";
import { getFontSize, getSpaceChart, prepareFontShorthand, TextLines } from "@src/action/text";

export const ResolveTextSize = (def: ITextDef): IArea => {
  let fontSize = def.text.font?.size;
  if (!fontSize || typeof fontSize == 'string') {
    fontSize = 0;
  }

  return {
    start: {
      y: def.start.y - (def.text.transY ?? 0),
      x: def.start.x,
    },
    size: {
      w: def.size.w,
      h: (def.text.lineHeight ?? fontSize) * (def.text.lines?.length ?? 0),
    }
  };
}

export const ResolveTextCalc = async (
  def: ITextDef,
  modules: Modules,
  ctx: CanvasRenderingContext2D,
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

  const {
    lines,
    lineHeight: preparedLineHeight,
    width,
    columns,
    fontSize: preparedFontSize
  } = prepare(def, ctx, def.size.w);
  def.text.transY = calcVerticalMove(def.size.h, preparedLineHeight, lines, def.text.align?.vertical || 'top');

  // For some reason Safari line height is bigger than in other browsers
  if (isSafari()) {
    def.start.y -= preparedFontSize*.2;
  }

  def.text.lineHeight = preparedLineHeight;
  def.text.font.size = preparedFontSize;
  def.text.columns = columns;
  def.size.w = width;
  def.text.lines = lines;

  def.area = ResolveTextSize(def);

  return def;
}

interface IPreparedTextProperties {
  lines: TextLines;
  fontSize: number;
  lineHeight: number;
  width: number;
  columns: ITextColumns;
}

const prepare = (
  def: ITextDef,
  ctx: CanvasRenderingContext2D,
  width: number,
): IPreparedTextProperties => {
  const columns = def.text.columns ?? { gap: 0, amount: 1 },
    fontSize = getFontSize(def),
    { textBaseline = 'top' } = def.text
  ;
  let { value: text } = def.text;

  ctx.save();
  ctx.font = prepareFontShorthand(def, ctx, String(fontSize));
  ctx.textBaseline = textBaseline;
  const colWidth = calcColumnWidth(width, columns)
  text = addSpacing(def, text);
  const lines = getTextLines(def, text, ctx, colWidth);
  ctx.restore();

  return {
    lines,
    fontSize,
    lineHeight: def.text.lineHeight ?? fontSize,
    width: colWidth,
    columns,
  }
}

const getTextLines = (def: ITextDef, text: string, ctx: CanvasRenderingContext2D, width: number): TextLines => {
  if (!def.text.wrap) {
    return [[text, 0]];
  }

  const rows: TextLines = [];
  let words = text.split(/[^\S\r\n]/),
    line = '',
    i = 0
  ;
  while (words.length > 0) {
    const newLinePos = words[0].search(/[\r\n]/);

    if (newLinePos !== -1) {
      const newLine = words[0].substring(0, newLinePos);
      rows.push([(line + ' ' + newLine).trim() + '\n', i]);
      line = '';
      i++;
      words[0] = words[0].substring(newLinePos + 1);
      continue;
    }

    const metrics = ctx.measureText(line + words[0]);

    if (metrics.width > width) {
      if (line.length > 0) {
        rows.push([line.trim(), i]);
        i++;
      }
      line = '';
    }

    line += ' ' + words[0];
    words = words.splice(1);
  }

  if (line.length > 0) {
    rows.push([line.replace(/^\s+/, ''), i]);
  }

  return rows;
}

const addSpacing = (def: ITextDef, text: string): string => {
  if (!def.text.spacing) {
    return text;
  }

  return text.split('').join(getSpaceChart().repeat(def.text.spacing));
}

const calcColumnWidth = (rWidth: number, columns: ITextColumns): number => {
  return (rWidth - ((columns.amount - 1) * columns.gap))/columns.amount;
}

const isSafari = (): boolean => {
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
}

const calcVerticalMove = (height: number, lineHeight: number, lines: TextLines, vAlign: VerticalAlign): number => {
  if (!height || lines.length * lineHeight >= height) {
    return 0;
  }

  const diff = height - (lines.length * lineHeight);
  if (vAlign === 'center') {
    return diff/2;
  }

  if (vAlign === 'bottom') {
    return diff;
  }

  return 0;
}
