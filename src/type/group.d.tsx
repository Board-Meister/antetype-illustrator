import { IBaseDef } from "@boardmeister/antetype";

export interface IGroupDef extends IBaseDef {
  layout: IBaseDef[];
}
