export type MyType = string
export enum MyEnum {
  Foo,
  Bar,
  Baz
}
export interface Foo {
  native: string | number
  typedef: MyType
  enum: MyEnum
}

export abstract class Bar {
  abstract foo(): Foo

  method() {
    return "foo"
  }
}

export function getFoo() : MyType {
  return "foo"
}


type DefaultTypeExport = {
  name: string,
  age: number
}
export default DefaultTypeExport;
