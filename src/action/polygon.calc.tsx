import type { Modules, IArea } from "@boardmeister/antetype";
import { IIllustrator } from "@src/module";
import { IBegin, ICurve, IFill, ILine, IMove, IPolygonDef, IStroke } from "@src/type/polygon.d";
import { calcFill } from "@src/shared";
import { Actions, PActions, PolygonActionTypes } from "@src/action/polygon";

export const ResolvePolygonSize = (def: IPolygonDef): IArea => {
  const size = def.polygon.size;
  return {
    start: {
      x: def.start.x + size.negative.x,
      y: def.start.y + size.negative.y,
    },
    size: {
      w: size.positive.x,
      h: size.positive.y,
    }
  }
}

export const ResolveCalcPolygon = async <K extends keyof PolygonActionTypes>(
  def: IPolygonDef,
  action: PActions<K>,
  modules: Modules,
): Promise<void> => {
  const illustrator = modules.illustrator as IIllustrator;
  const objSwitch: Actions = {
    close: (): void => {},
    fill: async (action: IFill): Promise<void> => {
      await calcFill(illustrator, action.args);
    },
    line: async (action: ILine): Promise<void> => {
      action.args = await illustrator.calc<ILine['args']>({
        layerType: 'polygon-line',
        purpose: 'position',
        values: action.args,
      });

      updateSizeVectors(def, action.args.x, 'x');
      updateSizeVectors(def, action.args.y, 'y');
    },
    curve: async (action: ICurve): Promise<void> => {
      action.args = await illustrator.calc<ICurve['args']>({
        layerType: 'polygon-curve',
        purpose: 'position',
        values: action.args,
      });

      updateSizeVectors(def, action.args.x, 'x');
      updateSizeVectors(def, action.args.cp1x, 'x');
      updateSizeVectors(def, action.args.cp2x, 'x');
      updateSizeVectors(def, action.args.y, 'y');
      updateSizeVectors(def, action.args.cp2y, 'y');
    },
    stroke: async (action: IStroke): Promise<void> => {
      action.args.thickness = (await illustrator.calc<{ thickness: number }>({
        layerType: 'polygon-stroke',
        purpose: 'thickness',
        values: { thickness: action.args.thickness ?? 5 },
      })).thickness;
    },
    begin: async (action: IBegin): Promise<void> => {
      action.args = await illustrator.calc<IBegin['args']>({
        layerType: 'polygon-begin',
        purpose: 'position',
        values: action.args,
      });

      updateSizeVectors(def, action.args.x, 'x');
      updateSizeVectors(def, action.args.y, 'y');
    },
    move: async (action: IMove): Promise<void> => {
      action.args = await illustrator.calc<IMove['args']>({
        layerType: 'polygon-move',
        purpose: 'position',
        values: action.args,
      });
    },
  };

  if (!action.means) {
    (action as ILine).means = 'line'
  }

  if (!objSwitch[action.means]) {
    return;
  }

  objSwitch[action.means](action);
}

const updateSizeVectors = (def: IPolygonDef, value: number, dir: 'x'|'y'): void => {
  if (value < 0) {
    const n = def.polygon.size.negative;
    n[dir] = Math.min(n[dir], value);
  } else {
    const p = def.polygon.size.positive;
    p[dir] = Math.max(p[dir], value);
  }
}
