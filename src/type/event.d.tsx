export enum Event {
  CALC = 'antetype.illustrator.calc',
}

export interface ICalcEvent<T = Record<string, any>> {
  purpose: string;
  layerType: string;
  values: T;
}
