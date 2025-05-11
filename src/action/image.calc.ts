import type { ICore, IArea } from "@boardmeister/antetype-core";
import { HorizontalAlignType, IImageArg, IImageDef, ImageFit, VerticalAlignType } from "@src/type/image.d";
import { CalculatedImage, IMAGE_ERROR_STATUS, IMAGE_LOADING_STATUS, IMAGE_TIMEOUT_STATUS } from "@src/action/image";
import { generateFill } from "@src/shared";
import { ModulesWithCore } from "@src/index";

const loadedImages: Record<string, CalculatedImage|symbol> = {};
const cachedBySettings: Record<string, CachedImage> = {};

interface CachedImage {
  image: HTMLImageElement;
  width: number;
  height: number;
}

const ResolveImageSize = (def: IImageDef): IArea => ({
  start: {
    x: def.start.x,
    y: def.start.y,
  },
  size: {
    h: def.size.h,
    w: def.size.w,
  }
});

export const ResolveImageCalc = async (
  modules: ModulesWithCore,
  def: IImageDef,
): Promise<void> => {
  const illustrator = modules.illustrator!;
  def.size = await illustrator.calc<IImageDef['size']>({
    layerType: 'image',
    purpose: 'size',
    values: def.size,
  });

  def.start = await illustrator.calc<IImageDef['start']>({
    layerType: 'image',
    purpose: 'position',
    values: def.start,
  });

  def.area = ResolveImageSize(def);

  if (def.image?.outline?.thickness) {
    def.image.outline.thickness = (await illustrator.calc<{ thickness: number }>({
      layerType: 'image',
      purpose: 'thickness',
      values: {
        thickness: def.image.outline.thickness,
      },
    })).thickness;
  }

  const cacheKey = getImageCacheKey(def.image),
    cached = cachedBySettings[cacheKey]
  ;
  if (cached) {
    def.image.calculated = calculateFromCache(def, cached);
    return;
  }

  if (def.image.src instanceof Image) {
    def.image.calculated = await calculateImage(def, def.image.src, modules, cacheKey);
    return;
  }

  if (typeof def.image.src != 'string') {
    return;
  }

  const source = def.image.src;
  if (
    typeof source != 'string'
    || (!source.startsWith('blob:http') && !source.startsWith('http') && !source.startsWith('/'))
  ) {
    console.warn('Image `' + source + '` has invalid source');
    return;
  }

  const waitforLoad = modules.core.setting.get<boolean>('illustrator.image.waitForLoad')
  const promise = loadImage(def, source, modules);
  if (waitforLoad) {
    await promise;
  } else {
    void promise;
  }
}
const calculateFromCache = (
  def: IImageDef,
  cached: CachedImage,
): CalculatedImage => {
  const image = def.image,
    { w, h } =  def.size
  ;

  const { width: asWidth, height: asHeight } = calculateAspectRatioFit(
      image.fit ?? 'default',
      cached.width,
      cached.height,
      w,
      h,
    ),
    xDiff = getImageHorizontalDiff(image.align?.horizontal ?? 'center', w, asWidth),
    yDiff = getImageVerticalDiff(image.align?.vertical ?? 'center', h, asHeight)
  ;

  return new CalculatedImage(
    cached.image,
    {
      xDiff,
      yDiff,
      width: asWidth,
      height: asHeight,
    }
  );
}

const calculateImage = async (
  def: IImageDef,
  source: HTMLImageElement,
  _modules: ModulesWithCore,
  cacheKey: string|null = null,
): Promise<CalculatedImage> => {
  const image = def.image,
    { w, h } =  def.size,
    // @TODO well it doesn't really matter what you use here? I don't understand why but it works??
    sWidth = source.width || 200,
    sHeight = source.height || 200
  ;
  const { width: asWidth, height: asHeight } = calculateAspectRatioFit(
      image.fit ?? 'default',
      sWidth,
      sHeight,
      w,
      h,
    ),
    xDiff = getImageHorizontalDiff(image.align?.horizontal ?? 'center', w, asWidth),
    yDiff = getImageVerticalDiff(image.align?.vertical ?? 'center', h, asHeight)
  ;

  if (image.fit === 'crop') {
    source = await cropImage(source, def)
  }

  if (image.overcolor) {
    source = await overcolorImage(source, def, asWidth, asHeight)
  }

  if (image.outline) {
    source = await outlineImage(source, def, asWidth, asHeight)
  }

  cachedBySettings[cacheKey ?? getImageCacheKey(def.image)] = {
    image: source,
    width: sWidth,
    height: sHeight,
  };

  return new CalculatedImage(
    source,
    {
      xDiff,
      yDiff,
      width: asWidth,
      height: asHeight,
    }
  );
}

const getImageCacheKey = (image: IImageArg): string =>
  JSON.stringify({ ...image, timeout: undefined, calculated: undefined });

const loadImage = async (def: IImageDef, src: string, modules: ModulesWithCore): Promise<void> => {
  const image = new Image(),
    { image: { timeout = 30000 } } = def,
    view = (modules.core as ICore).view
  ;
  image.crossOrigin = 'anonymous';
  image.src = src;

  const promise = new Promise<void>((resolve, reject) => {
    const timeoutTimer = setTimeout(() => {
      def.image.calculated = IMAGE_TIMEOUT_STATUS;
      reject(new Error('Image loading reached a timeout: ' + src));
    }, timeout);

    image.onerror = e => {
      clearTimeout(timeoutTimer);
      def.image.calculated = IMAGE_ERROR_STATUS;
      reject(e);
    };

    image.onload = async () => {
      clearTimeout(timeoutTimer);
      def.image.calculated = await calculateImage(def, image, modules);
      view.redrawDebounce();
      resolve();
    };
  });
  loadedImages[src] = IMAGE_LOADING_STATUS;

  await promise;
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
    outline = def.image.outline!
  ;
  if (!outline.thickness || !outline.fill) {
    return image;
  }
  const thickness = outline.thickness;
  let dArr = [
    [-0.75, -0.75], // ↖️
    [ 0   , -1   ], // ⬆️
    [ 0.75, -0.75], // ↗️
    [ 1   ,  0   ], // ➡️
    [ 0.75,  0.75], // ↘️
    [ 0   ,  1   ], // ⬇️
    [-0.75,  0.75], // ↙️
    [-1   ,  0   ], // ⬅️
  ];

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
  const image = new Image();
  image.src = canvas.toDataURL('image/webp');

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

const cropImage = async (image: HTMLImageElement, def: IImageDef): Promise<HTMLImageElement> => {
  const { w: width, h: height } = def.size;
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
