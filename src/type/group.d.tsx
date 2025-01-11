import { IParentDef } from "@boardmeister/antetype-core";

export interface IGroupArgs {
  clip?: boolean;
  interaction?: 'fixed'|'static';
  direction?: 'row'|'column';
  wrap?: boolean;
  gap?: {
    vertical?: number;
    horizontal?: number;
  }
}

export interface IGroupDef extends IParentDef {
  group: IGroupArgs;
}
