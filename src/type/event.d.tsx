export enum Event {
  CALC = 'antetype.illustrator.calc',
}

export interface ICalcEvent<T = Record<string, unknown>> {
  purpose: string;
  layerType: string;
  values: T;
}
