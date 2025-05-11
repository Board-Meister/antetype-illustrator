import { IBaseDef, type InitEvent, type ISettings, type Layout } from '@boardmeister/antetype-core';
import type { Herald } from '@boardmeister/herald';
import { Event as CoreEvent } from "@boardmeister/antetype-core";

export const generateRandomLayer = (type: string): IBaseDef => ({
  type,
  start: { x: Math.random(), y: Math.random() },
  size: { w: Math.random(), h: Math.random() },
  _mark: Math.random(),
});

export const initialize = (herald: Herald, layout: Layout|null = null, settings: ISettings = {}): Promise<void> => {
  return herald.dispatch(new CustomEvent<InitEvent>(CoreEvent.INIT, {
    detail: {
      base: layout ?? [
        generateRandomLayer('clear1'),
        generateRandomLayer('clear2'),
        generateRandomLayer('clear3'),
        generateRandomLayer('clear4'),
      ],
      settings,
    }
  }));
}

export const close = (herald: Herald): Promise<void> => {
  return herald.dispatch(new CustomEvent<CloseEvent>(CoreEvent.CLOSE));
}