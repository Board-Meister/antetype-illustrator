import { FillStyle, LeanerFillColor, LinearFillStyle } from "@src/type/polygon.d";
import { XValue, YValue } from '@boardmeister/antetype'

export function generateFill(type: 'default'|'linear', style: FillStyle|LinearFillStyle): FillStyle {
  const filTypes = {
    'default': (style: FillStyle) => {
      return style;
    },
    linear: (style: LinearFillStyle) => {
      return generateLinearGradient(
        style.colors,
        style.pos.x,
        style.pos.y,
        style.size.w,
        style.size.h,
      );
    }
  };
  return (filTypes[type] || filTypes['default'])(style as any);
}

export const generateLinearGradient = (
  colors: LeanerFillColor[],
  x: XValue,
  y: YValue,
  width: XValue,
  height: YValue,
): CanvasGradient => {
  const canvas = document.createElement('canvas'),
    ctx = canvas.getContext('2d')!
  ;
  const grd = ctx.createLinearGradient(x, y, width, height);
  colors.forEach(color => {
    grd.addColorStop(color.offset, color.color);
  });

  return grd;
}
