import { IImageDef } from "@src/type/image.d";

export const IMAGE_ERROR_STATUS = Symbol('error');
export const IMAGE_TIMEOUT_STATUS = Symbol('timeout');
export const IMAGE_LOADING_STATUS = Symbol('loading');


interface IImageCoords {
  xDiff: number;
  yDiff: number;
  width: number;
  height: number;
}

export class CalculatedImage {
  image: HTMLImageElement;
  coords: IImageCoords;

  constructor(
    image: HTMLImageElement,
    coords: IImageCoords
  ) {
    this.image = image;
    this.coords = coords;
  }
}

export const ResolveImageAction = async (
  ctx: CanvasRenderingContext2D,
  def: IImageDef,
): Promise<void> => {
  const image = def.image.calculated;
  if (!image || imageTimeoutReached(image) || imageIsBeingLoaded(image)) {
    return;
  }

  if (!(image instanceof CalculatedImage)) {
    return;
  }

  const { start: { x, y } } = def.area!;
  ctx.drawImage(image.image, x + image.coords.xDiff, y + image.coords.yDiff, image.coords.width, image.coords.height);
}

const imageTimeoutReached = (image: unknown): boolean => {
  return image === IMAGE_TIMEOUT_STATUS;
}

const imageIsBeingLoaded = (image: unknown): boolean => {
  return image === IMAGE_LOADING_STATUS;
}
