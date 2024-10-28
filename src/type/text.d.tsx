import { IBaseDef, ISize, XValue } from "@boardmeister/antetype";
import { StandardLonghandProperties } from 'csstype'
import { FillStyle, FillTypes } from "@src/type/polygon.d";

export declare type VerticalAlign = 'center'|'top'|'bottom';
export declare type HorizontalAlign = 'center'|'left'|'right'|'justify';

export interface ITextAlign {
  vertical?: VerticalAlign;
  horizontal?: HorizontalAlign;
}

export interface ITextColumns {
  amount: number;
  gap: number;
}

export interface ITextFont {
  style?: StandardLonghandProperties['fontStyle'];
  family?: StandardLonghandProperties['fontFamily'];
  weight?: StandardLonghandProperties['fontWeight'];
  size?: StandardLonghandProperties['fontSize'];
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
  size: ISize,
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
}

export interface ITextDef extends IBaseDef {
  text: ITextArgs;
}
