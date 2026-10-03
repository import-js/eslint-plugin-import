declare module "typescript-declare-module-all" {
  export const someConst: string;
  export function someFunction(): void;
  export type SomeType = number;
  export interface SomeInterface {
    field: boolean;
  }
  export enum SomeEnum {
    A,
    B,
  }
  export class SomeClass {}
  export abstract class SomeAbstractClass {}
  export default function defaultFunction(): void;
}

declare module "typescript-declare-module-other" {
  export const otherConst: number;
}
