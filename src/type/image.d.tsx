import { IBaseDef, XValue } from "@boardmeister/antetype-core";
import { FillTypes } from "@src/type/polygon.d";
import { CalculatedImage } from "@src/action/image";

export type ImageFit = 'stretch'|'crop'|'default';
export type ImageFitTo = 'auto'|'height'|'width';
export type VerticalAlignType = 'top'|'bottom'|'center';
export type HorizontalAlignType = 'left'|'right'|'center';

export interface IImageAlign {
  vertical: VerticalAlignType;
  horizontal: HorizontalAlignType;
}

export interface IOutline {
  thickness: XValue;
  fill: FillTypes;
}

export interface IOvercolor {
  fill: FillTypes
}

export interface IImageArg {
  calculated?: CalculatedImage|symbol;
  timeout?: number;
  fit?: ImageFit;
  overcolor?: IOvercolor;
  outline?: IOutline;
  align?: IImageAlign;
  fitTo?: ImageFitTo;
  src: string|HTMLImageElement;
}

export interface IImageDef<T = never> extends IBaseDef<T> {
  image: IImageArg;
}
