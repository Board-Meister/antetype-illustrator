import type { Modules } from "@boardmeister/antetype";
import { HorizontalAlign, ITextColumns, ITextDef, ITextOutline, VerticalAlign } from "@src/type/text.d";
import { generateFill } from "@src/shared";
import { IIllustrator } from "@src/module";

declare type TextLines = { 0: string, 1: number }[];

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

  const { fontSize, gap } = await illustrator.calc<{ fontSize: number, gap: number }>({
    layerType: 'text',
    purpose: 'prepare',
    values: { fontSize: getFontSize(def), gap: def.text.columns?.gap || 0 },
  });

  def.text.columns = def.text.columns ?? { amount: 1, gap: 0 };
  def.text.columns.gap = gap;

  def.text.font = def.text.font ?? {};
  def.text.font.size = fontSize;

  return def;
}

/*
 * More text effects https://stackoverflow.com/a/55790112/11495586
 */
export const ResolveTextAction = (
  ctx: CanvasRenderingContext2D,
  def: ITextDef,
): void => {
  let { x, y } = def.start;
  const { h, w } = def.size;
  ctx.save();

  const { lines: texts, lineHeight, width: columnWidth, columns, fontSize } = prepare(def, ctx, w),
    linesAmount = Math.ceil(texts.length/columns.amount)
  ;

  // For some reason Safari line height is bigger than in other browsers
  if (isSafari()) {
    y -= fontSize*.2;
  }

  const transY = calcVerticalMove(h, lineHeight, texts, def.text.align?.vertical || 'top');

  let lines: TextLines = [],
    previousColumnsLines = 0
  ;

  while ((lines = texts.splice(0, linesAmount)).length) {
    lines.forEach((text, i) => {
      const nextLine = lines[i + 1] || texts[0] || [''];
      const isLast = i + 1 == lines.length || nextLine[0] == '' || text[0][text[0].length - 1] == '\n';
      const verticalMove = transY + (text[1] - previousColumnsLines)*lineHeight;
      fillText(ctx, text[0], def, x, y, columnWidth, verticalMove, isLast);
    });
    previousColumnsLines += lines[lines.length - 1][1] + 1;
    x += columns.gap + columnWidth;
  }

  ctx.restore();
}

const fillText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  def: ITextDef,
  x: number,
  y: number,
  width: number,
  transY: number,
  isLast: boolean,
): void => {
  const { color = '#000', outline = null } = def.text;
  const horizontal = def.text.align?.horizontal || 'left';

  if (horizontal != 'left') {
    ({ text, x } = alignHorizontally(ctx, horizontal, text, width, isLast, x));
  }

  if (transY > 0) {
    y = y + transY;
  }

  ctx.fillStyle = typeof color == 'object' ? generateFill(color.type, color.style) : color;

  if (outline) {
    outlineText(ctx, outline, text, x, y, width);
  }

  ctx.fillText(text, x, y, width);
}

const outlineText = (
  ctx: CanvasRenderingContext2D,
  outline: ITextOutline,
  text: string,
  x: number,
  y: number,
  width: number
): void => {
  ctx.strokeStyle = generateFill(outline.fill.type, outline.fill.style);
  ctx.lineWidth = outline.thickness;
  ctx.lineJoin = outline.lineJoin ?? 'round';
  ctx.miterLimit = outline.miterLimit ?? 2;
  ctx.strokeText(text, x, y, width);
}

const alignHorizontally = (
  ctx: CanvasRenderingContext2D,
  horizontal: HorizontalAlign,
  text: string,
  width: number,
  isLast: boolean,
  x: number,
): { text: string, x: number } => {
  const metrics = ctx.measureText(text);
  const realWidth = metrics.width;
  if (horizontal == 'center') {
    const transX = (width - realWidth)/2;
    if (transX > 0) {
      x = x + transX;
    }
  } else if (horizontal == 'right') {
    x = x + width - realWidth;
  } else if (horizontal == 'justify' && !isLast) {
    text = justifyText(text, metrics, width, ctx);
  }

  return { text, x }
}

const justifyText = (
  text: string,
  metrics: TextMetrics,
  width: number,
  ctx: CanvasRenderingContext2D,
): string => {
  if (metrics.width >= width) {
    return text;
  }

  const words = text.split(' '),
    spacingMeasure = ctx.measureText(getSpaceChart()),
    spacings = Math.floor((width - metrics.width)/spacingMeasure.width),
    amount = spacings/(words.length - 1)
  ;

  for (let j=0; j < words.length - 1; j++) {
    words[j] += getSpaceChart().repeat(amount);
  }

  return words.join(' ');
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

  ctx.font = prepareFontShorthand(def, ctx, fontSize);
  const colWidth = calcColumnWidth(width, columns)
  text = addSpacing(def, text);
  ctx.textBaseline = textBaseline;
  const lines = getTextLines(def, text, ctx, colWidth);

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

const getSpaceChart = (): string => String.fromCharCode(8202);

const getFontSize = (def: ITextDef): any => def.text.font?.size || 10;

// Order when joining: font-style* font-variant* font-weight* font-stretch* font-size/line-height* font-family
// values with "*" are optional
const prepareFontShorthand = (def: ITextDef, ctx: CanvasRenderingContext2D, fontSize: string): string => {
  const { font = null } = def.text;
  if (!font) {
    return ctx.font;
  }
  fontSize = fontSize + 'px ';
  const fontFamily = (font.family || 'serif') + ' ';
  // Safari default it bold (?), so we have to always include weight
  const fontWeight = (font.weight ?? 100) + ' ';

  let fontSh = '';
  if (font.style) {
    fontSh += font.style + ' ';
  }

  if (font.variant) {
    fontSh += font.variant + ' ';
  }

  fontSh += fontWeight

  if (font.stretch) {
    fontSh += font.stretch + ' ';
  }

  fontSh += fontSize;

  if (font.height) {
    fontSh += '/' + font.height + ' ';
  }

  return fontSh + fontFamily;
}

const calcColumnWidth = (rWidth: number, columns: ITextColumns): number => {
  return (rWidth - ((columns.amount - 1) * columns.gap))/columns.amount;
}

const isSafari = (): boolean => {
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
}
