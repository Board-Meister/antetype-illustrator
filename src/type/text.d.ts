import type { IBaseDef, XValue } from "@boardmeister/antetype-core";
import { StandardLonghandProperties } from 'csstype'
import { FillStyle, FillTypes } from "@src/type/polygon.d";
import { TextLines } from "@src/action/text";

export declare type VerticalAlign = 'center'|'top'|'bottom';
export declare type HorizontalAlign = 'center'|'left'|'right'|'justify';
export declare type TextColumnsTactics = 'evenly'|'from-side';
export declare type TextDirection = 'left'|'right';

export interface ITextAlign {
  vertical?: VerticalAlign;
  horizontal?: HorizontalAlign;
}

export interface ITextColumns {
  amount: number;
  gap: number;
  tactic?: TextColumnsTactics;
}

export interface ITextFont {
  style?: StandardLonghandProperties['fontStyle'];
  family?: StandardLonghandProperties['fontFamily'];
  weight?: StandardLonghandProperties['fontWeight'];
  size?: StandardLonghandProperties['fontSize']|number;
  stretch?: StandardLonghandProperties['fontStretch'];
  variant?: StandardLonghandProperties['fontVariant'];
  height?: StandardLonghandProperties['lineHeight'];
}

export interface ITextOutline {
  fill: FillTypes;
  thickness: XValue;
  lineJoin?: "round"|"bevel"|"miter";
  miterLimit?: number;
}

export interface ITextArgs {
  value: string;
  align?: ITextAlign
  columns?: ITextColumns;
  font?: ITextFont;
  spacing?: number;
  textBaseline?: 'top'|'hanging'|'middle'|'alphabetic'|'ideographic'|'bottom';
  wrap?: boolean;
  lineHeight?: XValue;
  color?: FillStyle|FillTypes;
  outline?: ITextOutline;
  direction?: TextDirection;
  // Calculated do not set!
  transY?: number;
  lines?: TextLines;
}

export interface ITextDef extends IBaseDef {
  text: ITextArgs;
}
