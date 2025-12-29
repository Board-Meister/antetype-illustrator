import { Event as CoreEvent, type Canvas, type CanvasChangeEvent, type ICore } from '@boardmeister/antetype-core';
import { Event as WorkspaceEvent, ICalcEvent } from '@boardmeister/antetype-workspace';
import Core from "@boardmeister/antetype-core/dist/core";
import { Herald } from '@boardmeister/herald';
import type { ModulesWithCore } from "@src/type/type.d";
import type { IGroupDef, IImageDef, ITextDef } from '@src/index';
import Illustrator from '@src/module';
import {
  initialize, close,
} from "test/helpers/definition.helper";
import { CalculatedImage } from '@src/action/image';

describe('Values are properly calculated for', () => {
  let illustrator: Illustrator, core: ICore;
  const herald = new Herald();
  const canvas = document.createElement('canvas');
  const obj = jasmine.objectContaining;
  beforeEach(async () => {
    core = Core({ herald }) as ICore;
    const modules = { core } as ModulesWithCore;
    illustrator = new Illustrator(modules, herald);
    modules.illustrator = illustrator;
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
          // Mock event handle to mark each send value (by adding one to it)
          event: WorkspaceEvent.CALC,
          subscription: (e: CustomEvent<ICalcEvent>) => {
            const values = e.detail.values;
            const keys = Object.keys(values);
            for (const key of keys) {
              values[key] = Number(values[key]) + 1;
            }
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
  });

  afterEach(async () => {
    await close(canvas, herald);
  })

  const generateMinimalTextDetails = () => ({
    value: 'text text text text',
    font: { size: 12 },
    lineHeight: 12,
    columns: { gap: 1, amount: 1 },
    outline: { fill: { type: 'default', style: '' }, thickness: 1 }
  })

  it('text layer', async () => {
    await initialize(canvas, herald, [
      {
        type: 'text',
        start: { x: 1, y: 1 },
        size: { w: 100, h: 100 },
        text: generateMinimalTextDetails(),
      } as ITextDef,
      {
        type: 'text',
        start: { x: 0, y: 0 },
        size: { w: 99, h: 99 },
        text: Object.assign(generateMinimalTextDetails(), {
          align: {
            vertical: 'center',
            horizontal: 'center',
          },
          font: { size: 11 },
          lineHeight: 11,
          outline: undefined,
          columns: undefined,
        }),
      } as ITextDef,
      {
        type: 'text',
        start: { x: 0, y: 0 },
        size: { w: 49, h: 49 },
        text: Object.assign(generateMinimalTextDetails(), {
          wrap: true,
        }),
      } as ITextDef,
    ]);

    const textLayer = core.meta.document.layout[0];
    const textCenterLayer = core.meta.document.layout[1];
    const textSliceLayer = core.meta.document.layout[2] as ITextDef;
    expect(textLayer).toEqual(obj({
      area: obj({
        start: obj({ x: 2, y: 2 }),
        size: obj({ w: 101, h: 101 }),
      }),
      start: obj({ x: 2, y: 2 }),
      size: obj({ w: 101, h: 101 }),
      text: obj({
        value: 'text text text text',
        font: obj({
          size: 13,
        }),
        lineHeight: 13,
        columns: obj({
          gap: 2,
        }),
        outline: obj({
          thickness: 2,
        }),
        transY: 0,
        lines: [['text text text text', 0]]
      })
    }));
    expect(textCenterLayer).toEqual(obj({
      text: obj({
        font: obj({
          size: 12,
        }),
        lineHeight: 12,
        transY: 44, // (100 - 12) / 2 => (height / fontSize) / 2
        lines: [['text text text text', 0]]
      })
    }))
    expect(textSliceLayer.text.lines).toEqual([
      [ "text text", 0 ],
      [ "text text", 1 ]
    ])
  });


  it('image layer', async () => {
    await initialize(canvas, herald, [
      {
        type: 'image',
        start: { x: 1, y: 1 },
        size: { w: 100, h: 100 },
        image: {
          src: '/__spec__/asset/image-calc.jpg',
          timeout: 5000,
          outline: {
            thickness: 1,
          }
        }
      } as IImageDef,
    ], {
      illustrator: {
        image: {
          // Stops the calculation until image either loads or returns an error
          waitForLoad: true,
        }
      }
    });

    const imageLayer = core.meta.document.layout[0] as IImageDef;
    expect(imageLayer).toEqual(obj({
      area: obj({
        start: obj({ x: 2, y: 2 }),
        size: obj({ w: 101, h: 101 }),
      }),
      start: obj({ x: 2, y: 2 }),
      size: obj({ w: 101, h: 101 }),
      image: obj({
        outline: obj({
          thickness: 2,
        }),
      })
    }));
    expect(imageLayer.image.calculated).toBeInstanceOf(CalculatedImage)
  });

  it('group layer', async () => {
    await initialize(canvas, herald, [
      {
        type: 'group',
        start: { x: 0, y: 0 },
        size: { w: 100, h: 100 },
        group: {},
        layout: [
          {
            type: 'image',
            start: { x: 0, y: 0 },
            size: { w: 0, h: 0 },
            image: {},
          } as IImageDef,
        ]
      } as IGroupDef,
    ]);

    expect(core.meta.document.layout[0]).toEqual(obj({
      area: obj({
        start: obj({ x: 1, y: 1 }),
        size: obj({ w: 101, h: 101 }),
      }),
      start: obj({ x: 1, y: 1 }),
      size: obj({ w: 101, h: 101 }),
      layout: [
        obj({
          area: obj({
            start: obj({ x: 1, y: 1 }),
            size: obj({ w: 1, h: 1 }),
          }),
          start: obj({ x: 1, y: 1 }),
          size: obj({ w: 1, h: 1 }),
        })
      ],
    }));
  });

  // TODO test calculate linear fill shared.ts:5 calcFill
  // TODO no polygon test for now as it isn't really used
  // TODO add tests for group functionality like wrapping or clipping
  // TODO add tests for image generated with outlines and overcolor
});