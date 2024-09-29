export type ScalarType = string | number;
export type ObjType = {
  a: ScalarType;
  b: ScalarType;
};

export const a = 13;
export const b = 18;

const defaultExport: ObjType = { a, b };

export default defaultExport;
