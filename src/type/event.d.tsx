export enum Event {
  CALC = 'antetype.illustrator.calc',
}

export interface ICalcEvent<T extends Record<string, any> = Record<string, any>> {
  purpose: string;
  layerType: string;
  values: T;
}
