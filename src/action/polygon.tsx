import {
  FillStyle,
  IBegin, IClose, ICurve, IFill, IFillDefault, IFillLinear, ILine, IMove, IStroke, LineJoin,
} from "@src/type/polygon.d";
import { XValue, YValue } from "@boardmeister/antetype";
import { generateFill } from "@src/shared";

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

export function ResolvePolygonAction<K extends keyof PolygonActionTypes>(
  ctx: CanvasRenderingContext2D,
  action: PActions<K>,
): void {
  const objSwitch: Actions = {
    fill: (action: IFill): void => {
      Actions.fill(ctx, action.args)
    },
    line: (action: ILine): void => {
      Actions.line(ctx, action.args.x, action.args.y)
    },
    curve: (action: ICurve): void => Actions.curve(
      ctx,
      action.args.cp1x,
      action.args.cp1y,
      action.args.cp2x,
      action.args.cp2y,
      action.args.x,
      action.args.y,
    ),
    stroke: (action: IStroke): void => Actions.stroke(
      ctx,
      action.args.thickness ?? 5,
      action.args.fill ?? '#000',
      action.args.lineJoin ?? 'round',
      action.args.miterLimit ?? 2,
    ),
    begin: (action: IBegin): void => Actions.begin(ctx, action.args.x, action.args.y),
    move: (action: IMove): void => Actions.move(ctx, action.args.x, action.args.y),
    close: (): void => Actions.close(ctx),
  };

  if (!action.means) {
    (action as ILine).means = 'line'
  }

  if (!objSwitch[action.means]) {
    return;
  }

  objSwitch[action.means](action);
}
