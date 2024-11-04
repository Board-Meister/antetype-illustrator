import type { Modules, XValue, YValue } from "@boardmeister/antetype";
import {
  FillStyle,
  IBegin, IClose, ICurve, IFill, IFillDefault, IFillLinear, ILine, IMove, IStroke, LineJoin,
} from "@src/type/polygon.d";
import { generateFill } from "@src/shared";
import { IIllustrator } from "@src/module";

export const Actions = {
  line: (ctx: CanvasRenderingContext2D, x: XValue, y: YValue): void => {
    ctx.lineTo(x, y);
  },
  curve: (
    ctx: CanvasRenderingContext2D,
    cp1x: XValue,
    cp1y: YValue,
    cp2x: XValue,
    cp2y: YValue,
    curveX: XValue,
    curveY: YValue,
  ): void => {
    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, curveX, curveY);
  },
  stroke: (
    ctx: CanvasRenderingContext2D,
    thickness: XValue = 5,
    fill: FillStyle = '#000',
    lineJoin: LineJoin = 'round',
    miterLimit: XValue = 2,
  ): void => {
    ctx.save();
    ctx.strokeStyle = fill;
    ctx.lineWidth = thickness;
    ctx.lineJoin = lineJoin;
    ctx.miterLimit = miterLimit;
    ctx.stroke();
    ctx.restore();
  },
  begin: (ctx: CanvasRenderingContext2D, x: XValue, y: YValue): void => {
    ctx.beginPath();
    ctx.moveTo(x, y);
  },
  move: (ctx: CanvasRenderingContext2D, x: XValue, y: YValue): void => {
    ctx.moveTo(x, y);
  },
  fill: (ctx: CanvasRenderingContext2D, fill: IFillDefault|IFillLinear): void => {
    if (!fill.type) {
      (fill as IFillDefault).type = 'default';
    }

    const tmp = ctx.fillStyle;
    ctx.fillStyle = generateFill(fill.type, fill.style);
    ctx.fill();
    ctx.fillStyle = tmp;
  },
  close: (ctx: CanvasRenderingContext2D): void => {
    ctx.closePath();
  },
  default: (ctx: CanvasRenderingContext2D, x: XValue, y: YValue): void => Actions.line(ctx, x, y),
}

export interface PolygonActionTypes {
  line: ILine,
  curve: ICurve,
  stroke: IStroke,
  begin: IBegin,
  close: IClose,
  move: IMove
  fill: IFill
};

type PActionTypes = PolygonActionTypes;

type PActions<K extends keyof PActionTypes = keyof PActionTypes>
  = { [P in K]: { means: P, args: PActionTypes[P]['args'] } }[K]

type Actions = { [K in keyof PActionTypes]: (action: PActions<K>) => void }

export async function ResolvePolygonAction<K extends keyof PolygonActionTypes>(
  ctx: CanvasRenderingContext2D,
  action: PActions<K>,
  x: XValue,
  y: YValue,
  modules: Modules,
): Promise<void> {
  const illustrator = modules.illustrator as IIllustrator;
  const objSwitch: Actions = {
    fill: async (action: IFill): Promise<void> => {
      Actions.fill(ctx, action.args)
    },
    line: async (action: ILine): Promise<void> => {
      const { x: aX, y: aY } = await illustrator.calc<{ x: number, y: number }>({
        layerType: 'polygon-line',
        purpose: 'position',
        values: { x: action.args.x, y: action.args.y },
      });

      Actions.line(ctx, aX + x, aY + y)
    },
    curve: async (action: ICurve): Promise<void> => {
      const { x: aX, y: aY, cp1x, cp1y, cp2x, cp2y }
        = await illustrator.calc<{
          cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number
        }>({
          layerType: 'polygon-curve',
          purpose: 'position',
          values: {
            cp1x: action.args.cp1x, cp1y: action.args.cp1y, cp2x: action.args.cp2x, cp2y: action.args.cp2y,
            x: action.args.x, y: action.args.y,
          },
        })
      ;

      Actions.curve(ctx, cp1x + x, cp1y + y, cp2x + x, cp2y + y, aX + x, aY + y);
    },
    stroke: async (action: IStroke): Promise<void> => {
      const { thickness } = await illustrator.calc<{ thickness: number }>({
        layerType: 'polygon-stroke',
        purpose: 'thickness',
        values: { thickness: action.args.thickness ?? 5 },
      });

      Actions.stroke(
        ctx,
        thickness,
        action.args.fill ?? '#000',
        action.args.lineJoin ?? 'round',
        action.args.miterLimit ?? 2,
      );
    },
    begin: async (action: IBegin): Promise<void> => {
      const { x: aX, y: aY } = await illustrator.calc<{ x: number, y: number }>({
        layerType: 'polygon-begin',
        purpose: 'position',
        values: { x: action.args.x, y: action.args.y },
      });

      Actions.begin(ctx, aX + x, aY + y)
    },
    move: async (action: IMove): Promise<void> => {
      const { x: aX, y: aY } = await illustrator.calc<{ x: number, y: number }>({
        layerType: 'polygon-move',
        purpose: 'position',
        values: { x: action.args.x, y: action.args.y },
      });

      Actions.move(ctx, aX + x, aY + y)
    },
    close: async (): Promise<void> => Actions.close(ctx),
  };

  if (!action.means) {
    (action as ILine).means = 'line'
  }

  if (!objSwitch[action.means]) {
    return;
  }

  await objSwitch[action.means](action);
}
