import { IImageDef } from "@src/type/image.d";

export const IMAGE_ERROR_STATUS = Symbol('error');
export const IMAGE_TIMEOUT_STATUS = Symbol('timeout');
export const IMAGE_LOADING_STATUS = Symbol('loading');


interface IImageCoords {
  x: number;
  y: number;
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

  const { x, y, width, height } = image.coords;
  ctx.drawImage(image.image, x, y, width, height);
}

const imageTimeoutReached = (image: unknown): boolean => {
  return image === IMAGE_TIMEOUT_STATUS;
}

const imageIsBeingLoaded = (image: unknown): boolean => {
  return image === IMAGE_LOADING_STATUS;
}
