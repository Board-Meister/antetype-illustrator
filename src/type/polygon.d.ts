import type { IBaseDef, XValue, YValue, IStart } from "@boardmeister/antetype-core";

export declare type LineJoin = "round"|"bevel"|"miter";
export declare type FillStyle = any | boolean | CanvasGradient | CanvasPattern | string;

export interface ILine {
  means: 'line';
  args: {
    x: XValue;
    y: YValue;
  }
}

export interface ICurve {
  means: 'curve';
  args: {
    cp1x: XValue;
    cp1y: YValue;
    cp2x: XValue;
    cp2y: YValue;
    x: XValue;
    y: YValue;
  }
}

export interface IStroke {
  means: 'stroke';
  args: {
    thickness?: XValue;
    fill?: FillStyle;
    lineJoin?: LineJoin;
    miterLimit?: XValue;
  }
}

export interface IBegin {
  means: 'begin';
  args: {
    x: XValue;
    y: YValue;
  }
}

export interface IMove {
  means: 'move';
  args: {
    x: XValue;
    y: YValue;
  }
}

export interface IClose {
  means: 'close';
  args: object;
}

export interface LeanerFillColor {
  offset: number;
  color: string;
}

export interface LinearFillStyle {
  pos: {
    x: XValue;
    y: YValue;
  }
  size: {
    w: XValue;
    h: YValue;
  }
  colors: LeanerFillColor[]
}

export interface IFillLinear {
  type: 'linear';
  style: LinearFillStyle;
}

export interface IFillDefault {
  type: 'default';
  style: FillStyle;
}

export type FillTypes = IFillLinear|IFillDefault;

export interface IFill {
  means: 'fill';
  args: FillTypes
}

export type PolygonActions = ILine | ICurve | IStroke | IBegin | IMove | IClose | IFill;

export interface IPolygonArgs {
  steps: PolygonActions[];
  size: {
    negative: IStart;
    positive: IStart;
  }
}

export interface IPolygonDef<T = never> extends IBaseDef<T> {
  polygon: IPolygonArgs;
}
