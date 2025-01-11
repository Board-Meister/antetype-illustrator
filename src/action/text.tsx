import { HorizontalAlign, ITextDef, ITextOutline } from "@src/type/text.d";
import { generateFill } from "@src/shared";

export declare type TextLines = { 0: string, 1: number }[];
export const getFontSizeForCalc = (def: ITextDef): string => String(def.text.font?.size ?? 10);
export const getFontSize = (def: ITextDef): number => Number(def.text.font?.size ?? 10);
export const getSpaceChart = (): string => String.fromCharCode(8202);

/*
 * More text effects https://stackoverflow.com/a/55790112/11495586
 */
export const ResolveTextAction = (
  ctx: CanvasRenderingContext2D,
  def: ITextDef,
): void => {
  let { x } = def.start,
    lines: TextLines = [],
    previousColumnsLines = 0
  ;
  const { start: { y }, size: { w }, text } = def,
    { columns, transY, lineHeight } = text,
    value = [...text.lines as TextLines],
    linesAmount = Math.ceil(value.length/columns!.amount),
    { textBaseline = 'top' } = def.text
  ;

  ctx.save();

  ctx.font = prepareFontShorthand(def, ctx, String(getFontSize(def)));
  ctx.textBaseline = textBaseline;

  while ((lines = value.splice(0, linesAmount)).length) {
    lines.forEach((text, i) => {
      const nextLine = lines[i + 1] || value[0] || [''];
      const isLast = i + 1 == lines.length || nextLine[0] == '' || text[0][text[0].length - 1] == '\n';
      const verticalMove = transY! + (text[1] - previousColumnsLines)*lineHeight!;
      fillText(ctx, text[0], def, x, y, w, verticalMove, isLast);
    });
    previousColumnsLines += lines[lines.length - 1][1] + 1;
    x += columns!.gap + w;
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

// Order when joining: font-style* font-variant* font-weight* font-stretch* font-size/line-height* font-family
// values with "*" are optional
export const prepareFontShorthand = (def: ITextDef, ctx: CanvasRenderingContext2D, fontSize: string): string => {
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
