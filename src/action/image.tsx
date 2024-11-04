import type { Modules, ISystemModule } from "@boardmeister/antetype";
import { HorizontalAlignType, IImageDef, ImageFit, VerticalAlignType } from "@src/type/image.d";
import { generateFill } from "@src/shared";
import { IIllustrator } from "@src/module";

const IMAGE_ERROR_STATUS = Symbol('error');
const IMAGE_TIMEOUT_STATUS = Symbol('timeout');
const IMAGE_LOADING_STATUS = Symbol('loading');
const loadedImages: Record<string, HTMLImageElement|symbol> = {};

export const ResolveImageAction = async (
  ctx: CanvasRenderingContext2D,
  modules: Modules,
  def: IImageDef
): Promise<void> => {
  const src = def.image.src;
  const source = typeof src == 'function' ? await src(def) : src;
  const cachedImage = typeof source == 'string' ? loadedImages[source] : null;
  if (imageTimeoutReached(cachedImage) || imageIsBeingLoaded(cachedImage)) {
    return;
  }

  if (source instanceof Image || cachedImage instanceof Image) {
    await drawImage(
      ctx,
      source instanceof Image ? source : cachedImage as HTMLImageElement,
      def,
      modules,
    );
    return;
  }

  if (typeof source != 'string' || (!source.startsWith('http') && !source.startsWith('/'))) {
    console.warn('Image `' + source + '` has invalid source');
    return;
  }

  void loadImage(def, source, modules);
}

const imageTimeoutReached = (image: unknown): boolean => {
  return image === IMAGE_TIMEOUT_STATUS;
}

const imageIsBeingLoaded = (image: unknown): boolean => {
  return image === IMAGE_LOADING_STATUS;
}

const loadImage = async (def: IImageDef, src: string, modules: Modules): Promise<void> => {
  const image = new Image(),
    { image: { timeout = 30000 } } = def,
    view = (modules.system as ISystemModule).view
  ;
  image.crossOrigin = 'anonymous';
  image.src = src;

  const promise = new Promise<void>(resolve => {
    const timeoutTimer = setTimeout(() => {
      loadedImages[src] = IMAGE_TIMEOUT_STATUS;
      resolve();
      void view.redrawDebounce();
    }, timeout);

    image.onerror = () => {
      clearTimeout(timeoutTimer);
      loadedImages[src] = IMAGE_ERROR_STATUS;
      resolve();
      void view.redrawDebounce();
    };

    image.onload = () => {
      clearTimeout(timeoutTimer);
      loadedImages[src] = image;
      resolve();
      void view.redrawDebounce();
    };
  });
  loadedImages[src] = IMAGE_LOADING_STATUS;

  await promise;
}

const drawImage = async (
  ctx: CanvasRenderingContext2D,
  source: HTMLImageElement,
  def: IImageDef,
  modules: Modules,
): Promise<void> => {
  const { image, start } = def;
  ctx.save();
  let { w, h } = image.size;
  let { x, y } = start;

  ({ w, h } = await (modules.illustrator as IIllustrator).calc<{ h: number, w: number }>({
    layerType: 'image',
    purpose: 'size',
    values: { w, h },
  }));

  ({ x, y } = await (modules.illustrator as IIllustrator).calc<{ x: number, y: number }>({
    layerType: 'image',
    purpose: 'position',
    values: { x, y },
  }));

  const { width: asWidth, height: asHeight } = calculateAspectRatioFit(
      image.fit ?? 'default',
      source.width,
      source.height,
      w,
      h,
    ),
    leftDiff = getImageHorizontalDiff(image.align?.horizontal ?? 'center', w, asWidth),
    topDiff = getImageVerticalDiff(image.align?.vertical ?? 'center', h, asHeight)
  ;

  x += leftDiff;
  y += topDiff;

  if (image.fit === 'crop') {
    source = await cropImage(source, def)
  }

  if (image.overcolor) {
    source = await overcolorImage(source, def, asWidth, asHeight)
  }

  if (image.outline) {
    source = await outlineImage(source, def, asWidth, asHeight)
  }

  ctx.drawImage(source, x, y, asWidth, asHeight);

  ctx.restore();
}

const overcolorImage = async (
  image: HTMLImageElement,
  def: IImageDef,
  asWidth: number,
  asHeight: number,
): Promise<HTMLImageElement> => {
  const canvas = document.createElement('canvas'),
    ctx = canvas.getContext('2d')!,
    overcolor = def.image.overcolor!
  ;
  canvas.setAttribute('width', String(asWidth));
  canvas.setAttribute('height', String(asHeight));

  ctx.drawImage(image, 0, 0, asWidth, asHeight);

  ctx.globalCompositeOperation = 'source-in';
  ctx.fillStyle = generateFill(overcolor.fill.type, overcolor.fill.style);
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.globalCompositeOperation = 'source-over';

  const imageOvercolored =  await canvasToWebp(canvas, image);
  ctx.drawImage(imageOvercolored, 0, 0, asWidth, asHeight);

  return canvasToWebp(canvas, imageOvercolored);
}

const outlineImage = async (
  image: HTMLImageElement,
  def: IImageDef,
  asWidth: number,
  asHeight: number,
): Promise<HTMLImageElement> => {
  const canvas = document.createElement('canvas'),
    ctx = canvas.getContext('2d')!,
    outline = def.image.outline!,
    thickness = outline.thickness
  ;
  let dArr = [
    [-0.75, -0.75], // ↖️
    [ 0   , -1   ], // ⬆️
    [ 0.75, -0.75], // ↗️
    [ 1   ,  0   ], // ➡️
    [ 0.75,  0.75], // ↘️
    [ 0   ,  1   ], // ⬇️
    [-0.75,  0.75], // ↙️
    [-1   ,  0   ], // ⬅️
  ]
  ;

  // Our breaking point
  if (thickness > 5) {
    const granularity = Math.floor(thickness / 2.5);
    let newDArr: number[][] = [];
    for(let i=0; i < dArr.length; i++) {
      newDArr.push(dArr[i]);
      const [cX, cY] = dArr[i],
        [dX, dY] = i + 1 === dArr.length ? dArr[0] : dArr[i + 1]
      ;

      const trendX = cX > dX ? -1 : 1,
        trendY = cY > dY ? -1 : 1,
        bX = (Math.abs(cX - dX)/granularity) * trendX,
        bY = (Math.abs(cY - dY)/granularity) * trendY,
        between: number[][] = []
      ;
      let x = cX,
        y = cY
      ;
      while (
        (
          trendX > 0 && x + bX < dX
          || trendX < 0 && x + bX > dX
        )
        && (
          trendY > 0 && y + bY < dY
          || trendY < 0 && y + bY > dY
        )
      ) {
        x += bX;
        y += bY;
        between.push([x, y]);
      }
      newDArr = newDArr.concat(between);
    }

    dArr = newDArr;
  }



  canvas.setAttribute('width', String(asWidth + thickness*2));
  canvas.setAttribute('height', String(asHeight + thickness*2));

  for (let i = 0; i < dArr.length; i++) {
    ctx.drawImage(
      image,
      thickness + dArr[i][0] * thickness,
      thickness + dArr[i][1] * thickness,
      asWidth,
      asHeight,
    );

    if (thickness === 0) {
      break;
    }
  }

  ctx.globalCompositeOperation = 'source-in';
  ctx.fillStyle = generateFill(outline.fill.type, outline.fill.style);
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.globalCompositeOperation = 'source-over';

  ctx.drawImage(image, thickness, thickness, asWidth, asHeight);

  return canvasToWebp(canvas, image);
}

const canvasToWebp = async (canvas: HTMLCanvasElement, dft: HTMLImageElement): Promise<HTMLImageElement> => {
  const url = canvas.toDataURL('image/webp'),
    image = new Image()
  ;
  image.src = url;

  return new Promise<HTMLImageElement>(resolve => {
    const timeout = setTimeout(() => {
      resolve(dft);
    }, 1000);

    image.onerror = () => {
      clearTimeout(timeout);
      resolve(dft);
    };

    image.onload = () => {
      clearTimeout(timeout);
      resolve(image);
    };
  });
}

/**
 * @TODO verify performance as I can see a possibility to save cropped images (but it would a very space heavy process)
 *       but if there isn't any visible improvements I don't think its worth effort and taken space
 */
const cropImage = async (image: HTMLImageElement, def: IImageDef): Promise<HTMLImageElement> => {
  const { w: width, h: height } = def.image.size;
  let fitTo = def.image.fitTo ?? 'auto',
    x = 0,
    y = 0
  ;
  if (fitTo === 'auto') {
    fitTo = height > width ? 'height': 'width';
  }

  if (fitTo === 'height') {
    x = (width - (image.width * (height / image.height)))/2;
  } else if (fitTo === 'width') {
    y = (height - (image.height * (width / image.width)))/2;
  }

  const canvas = document.createElement('canvas'),
    ctx = canvas.getContext('2d')!
  ;

  canvas.setAttribute('width', String(width));
  canvas.setAttribute('height', String(height));
  ctx.drawImage(image, x, y, width - x*2, height - y*2);

  return canvasToWebp(canvas, image);
}

interface IRation {
  width: number;
  height: number;
}

const calculateAspectRatioFit = (
  fit: ImageFit,
  srcWidth: number,
  srcHeight: number,
  maxWidth: number,
  maxHeight: number,
): IRation => {
  if (fit === 'stretch' || fit === 'crop') {
    return {
      width: maxWidth,
      height: maxHeight,
    };
  }

  return getResized(srcWidth, srcHeight, maxWidth, maxHeight);
}

const getResized = (srcWidth: number, srcHeight: number, maxWidth: number, maxHeight: number): IRation => {
  const ratio = Math.min(maxWidth / srcWidth, maxHeight / srcHeight),
    width = srcWidth * ratio,
    height = srcHeight * ratio
  ;

  return {
    width,
    height,
  };
}

const getImageVerticalDiff = (align: VerticalAlignType, height: number, asHeight: number): number => {
  if (align == 'top') {
    return 0;
  }

  if (align == 'bottom') {
    return height - asHeight;
  }

  return (height - asHeight)/2;
}

const getImageHorizontalDiff = (align: HorizontalAlignType, width: number, asWidth: number): number => {
  if (align == 'left') {
    return 0;
  }

  if (align == 'right') {
    return width - asWidth;
  }

  return (width - asWidth)/2;
}

/**
 * @TODO transformations like this should be globally available, maybe separate repository?
 * It could work like this: At the beginning of each draw we would apply all transformations and at the end of the event
 * we would restore them.
 */
// const transform = (layer, x, y, width, height): void => {
//   const actions = {
//     rotate: degree => {
//       this.ctx.translate(x + width/2, y + height/2);
//       this.ctx.rotate((degree * Math.PI) / 180);
//       this.ctx.translate(-(x + width/2), -(y + height/2));
//     },
//     opacity: alpha => {
//       this.ctx.globalAlpha = alpha;
//     },
//     filter: filter => {
//       this.ctx.filter = filter;
//     },
//     default: e => {
//       throw new Error('Not recognized action');
//     },
//   };
//
//   Object.keys(layer.transform).forEach(action => {
//     let params = layer.transform[action];
//     if (typeof params === 'function') {
//       params = params(layer, this);
//     }
//     (actions[action] || actions.default)(...Array.isArray(params) ? params : [params]);
//   });
// }
