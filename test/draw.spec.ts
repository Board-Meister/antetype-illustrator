import { Event as CoreEvent, type Canvas, type CanvasChangeEvent, type ICore } from '@boardmeister/antetype-core';
import Core from "@boardmeister/antetype-core/dist/core";
import { Herald } from '@boardmeister/herald';
import type { IGroupDef, IImageDef, ITextDef } from '@src/index';
import Illustrator from '@src/module';
import {
  initialize, close,
} from "test/helpers/definition.helper";
import textDrawnBase64 from 'test/asset/text-drawn.base64';
import imageDrawnBase64 from 'test/asset/image-drawn.base64';
import groupDrawnBase64 from 'test/asset/group-drawn.base64';
import type { ModulesWithCore } from '@src/type/type';

describe('Layer is properly drawn', () => {
  let illustrator: Illustrator, core: ICore;
  const herald = new Herald();
  const canvas = document.createElement('canvas');
  canvas.width = 200;
  canvas.height = 200;
  canvas.style.height = '200px';
  canvas.style.width = '200px';
  document.body.appendChild(canvas)
  beforeEach(async () => {
    core = Core({ herald }) as ICore;
    const modules = { core } as ModulesWithCore;
    illustrator = new Illustrator(modules, herald);
    const registerEvents = (anchor: Canvas|null = null) => {
      const unregister = herald.batch([
        {
          event: CoreEvent.CLOSE,
          subscription: () => {
            unregister();
          },
          anchor,
        },
        {
          event: CoreEvent.CANVAS_CHANGE,
          subscription: async ({ detail: { current } }: CanvasChangeEvent): Promise<void> => {
            unregister();
            registerEvents(current);
          },
          anchor,
        },
      ])
    }
    registerEvents(null);
    await core.meta.setCanvas(canvas);
    modules.illustrator = illustrator;
  });

  afterEach(async () => {
    await close(canvas, herald);
  })

  it('text', async () => {
    await initialize(canvas, herald, [
      {
        type: 'clear',
        start: { x: 0, y: 0 },
        size: { w: 0, h: 0 },
      },
      {
        type: 'text',
        start: { x: 50, y: 50 },
        size: { w: 100, h: 100 },
        text: {
          align: {
            vertical: 'center',
            horizontal: 'center',
          },
          wrap: true,
          value: 'text text text text text text text text text text text text text text text text',
          font: { size: 16 },
          lineHeight: 16,
          columns: {
            gap: 1,
            amount: 4,
          },
          color: {
            type: 'linear',
            style: {
              pos: {
                  x: 50,
                  y: 50,
                },
                size: {
                  w: 100,
                  h: 100,
                },
                colors: [
                  {
                    offset: 0,
                    color: '#00F',
                  },
                  {
                    offset: 1,
                    color: '#0F0',
                  },
                ]
            }
          },
          spacing: 1.5,
          outline: {
            thickness: 5,
            fill: {
              type: 'linear',
              style: {
                pos: {
                    x: 50,
                    y: 50,
                  },
                  size: {
                    w: 100,
                    h: 100,
                  },
                  colors: [
                    {
                      offset: 0,
                      color: '#0F0',
                    },
                    {
                      offset: 1,
                      color: '#00F',
                    },
                  ]
              }
            }
          }
        },
      } as ITextDef,
    ]);

    expect(textDrawnBase64).toBe(canvas.toDataURL());
  });

  it('image', async () => {
    await initialize(canvas, herald, [
      {
        type: 'clear',
        start: { x: 0, y: 0 },
        size: { w: 0, h: 0 },
      },
      {
        type: 'image',
        start: { x: 0, y: 0 },
        size: { w: 50, h: 75 },
        image: {
          src: '/__spec__/asset/image-draw.jpg',
          timeout: 1000,
          align: {
            vertical: 'top',
            horizontal: 'left',
          },
          outline: {
            thickness: 10,
            fill: {
              style: '#FF0000',
            },
          }
        }
      } as IImageDef,
      {
        type: 'image',
        start: { x: 150, y: 0 },
        size: { w: 50, h: 75 },
        image: {
          src: '/__spec__/asset/users.webp',
          timeout: 1000,
          align: {
            vertical: 'top',
            horizontal: 'right',
          },
          overcolor: {
            fill: {
              style: '#FF0000'
            },
          },
        }
      },
      {
        type: 'image',
        start: { x: 0, y: 75 },
        size: { w: 200, h: 50 },
        image: {
          src: '/__spec__/asset/world.png',
          timeout: 1000,
          align: {
            vertical: 'center',
            horizontal: 'center',
          },
        }
      },
      {
        type: 'image',
        start: { x: 0, y: 125 },
        size: { w: 200, h: 25 },
        image: {
          fit: 'crop',
          src: '/__spec__/asset/world.png',
          timeout: 1000,
          align: {
            vertical: 'center',
            horizontal: 'center',
          },
        }
      }
    ], {
      illustrator: {
        image: {
          waitForLoad: true,
        }
      }
    });
    expect(imageDrawnBase64).toBe(canvas.toDataURL());
  });

  it('group', async () => {
    await initialize(canvas, herald, [
      {
        type: 'clear',
        start: { x: 0, y: 0 },
        size: { w: 0, h: 0 },
      },
      {
        type: 'group',
        start: { x: 50, y: 50 },
        size: { w: 150, h: 150 },
        group: {},
        layout: [
          {
            type: 'image',
            start: { x: 0, y: 0 },
            size: { w: 75, h: 75 },
            image: {
              src: '/__spec__/asset/image-draw.jpg',
              timeout: 1000,
              align: {
                vertical: 'center',
                horizontal: 'center',
              },
            }
          },
          {
            type: 'text',
            start: { x: 75, y: 0 },
            size: { w: 75, h: 75 },
            text: {
              align: {
                vertical: 'center',
                horizontal: 'center',
              },
              wrap: true,
              value: 'text text text text',
              font: { size: 16 },
              lineHeight: 16,
              color: '#F00',
              }
            },
        ]
      } as IGroupDef
    ], {
      illustrator: {
        image: {
          waitForLoad: true,
        }
      }
    });

    expect(groupDrawnBase64).toBe(canvas.toDataURL());
  });
});