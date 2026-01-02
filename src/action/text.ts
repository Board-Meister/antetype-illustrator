import { HorizontalAlign, ITextDef, ITextOutline } from "@src/type/text.d";
import { generateFill } from "@src/shared";
import type { Context } from "@src/type/type";

export declare type TextLines = { 0: string, 1: number }[];
export const getFontSizeForCalc = (def: ITextDef): string => String(def.text.font?.size ?? 10);
export const getFontSize = (def: ITextDef): number => Number(def.text.font?.size || 10);
export const getSpaceChart = (): string => String.fromCharCode(8202);

/*
 * More text effects https://stackoverflow.com/a/55790112/11495586
For text on circle https://stackoverflow.com/a/28997410/11495586
 */
export const ResolveTextAction = (
  ctx: Context,
  def: ITextDef,
): void => {
  let { x } = def.start,
    lines: TextLines = []
  ;
  const { start: { y }, size: { w, h }, text } = def,
    { columns, lineHeight, direction, overflow } = text,
    value = [...text.lines as TextLines],
    { textBaseline = 'top' } = def.text,
    { gap = 0 , amount = 1 } = columns ?? {},
    fullW = w - (gap * (amount - 1))
  ;
  let transY = text.transY ?? 0;

  // Must be visible at least one line!
  let linesAmount = Math.floor(h / lineHeight!) || 1;
  if (columns?.tactic == "evenly") {
    linesAmount = Math.ceil(value.length/amount);
  }

  ctx.save();

  if (direction == "right") {
    ctx.direction = "rtl";
    x += fullW/amount;
  } else {
    ctx.direction = "ltr";
  }

  ctx.font = prepareFontShorthand(def, ctx, String(getFontSize(def)));
  ctx.textBaseline = textBaseline;
  const getStartFrom = (lines: TextLines, linesAmount: number): number =>
    direction == "right" && lines.length >= linesAmount ? lines.length - linesAmount : 0;

  const startingX = x;
  while ((lines = value.splice(getStartFrom(value, linesAmount), linesAmount)).length) {
    lines.forEach((text, i) => {
      const nextLine = lines[i + 1] || value[getStartFrom(value, linesAmount)] || [''];
      const isLast = i + 1 == lines.length || nextLine[0] == '' || text[0][text[0].length - 1] == '\n';
      const verticalMove = transY! + i*lineHeight!;
      fillText(ctx, text[0], def, x, y, fullW/amount, verticalMove, isLast);
    });
    x += fullW/amount + gap;
    if (x + (startingX < 0 ? Math.abs(startingX) : 0) >= w && (!overflow || overflow == "vertical")) {
      x = startingX;
      transY += (lines.length*lineHeight!) + gap;
    }
  }

  ctx.restore();
}

const fillText = (
  ctx: Context,
  text: string,
  def: ITextDef,
  x: number,
  y: number,
  width: number,
  transY: number,
  isLast: boolean,
): number => {
  const { color = '#000', outline = null } = def.text;
  const horizontal = def.text.align?.horizontal || 'left';
  let realWidth;

  ({ text, x, realWidth } = alignHorizontally(def, ctx, horizontal, text, width, isLast, x));

  if (transY > 0) {
    y = y + transY;
  }

  ctx.fillStyle = typeof color == 'object' ? generateFill(color.type, color.style) : color;

  if (outline) {
    outlineText(ctx, outline, text, x, y, width);
  }

  ctx.fillText(text, x, y, width);

  return realWidth;
}

const outlineText = (
  ctx: Context,
  outline: ITextOutline,
  text: string,
  x: number,
  y: number,
  width: number
): void => {
  if (!outline.fill?.style) {
    return;
  }

  ctx.strokeStyle = generateFill(outline.fill.type, outline.fill.style);
  ctx.lineWidth = outline.thickness;
  ctx.lineJoin = outline.lineJoin ?? 'round';
  ctx.miterLimit = outline.miterLimit ?? 2;
  ctx.strokeText(text, x, y, width);
}

const alignHorizontally = (
  def: ITextDef,
  ctx: Context,
  horizontal: HorizontalAlign,
  text: string,
  width: number,
  isLast: boolean,
  x: number,
): { text: string, x: number, realWidth: number } => {
  const metrics = ctx.measureText(text);
  const realWidth = metrics.width;
  const isRight = def.text.direction === "right";

  ctx.textAlign = 'left';
  if (horizontal == 'center') {
    ctx.textAlign = 'center';
    x += width/2 * (isRight ? -1 : 1);
  } else if (horizontal == 'right') {
    ctx.textAlign = 'right';
    x += width * (isRight ? 0 : 1);
  } else if (horizontal == 'justify' && !isLast) {
    text = justifyText(text, metrics, width, ctx);
  } else if (isRight && realWidth < width) {
    x -= (width - realWidth);
  }

  return { text, x, realWidth }
}

const justifyText = (
  text: string,
  metrics: TextMetrics,
  width: number,
  ctx: Context,
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
export const prepareFontShorthand = (def: ITextDef, ctx: Context, fontSize: string): string => {
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
