export default class Illustrator {
  canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement|null) {
    if (!canvas) {
      throw new Error('[Antetype Illustrator] Provided canvas is empty')
    }
    this.canvas = canvas;
  }
}
