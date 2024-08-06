import { AttributesMapType } from '../models';

export * from './formatContractAddress';
export * from './arrayLimitProcess';
export * from './promise';
export * from './bigNumberishToText';
export * from './getTypedDataMessage';

export const typeOfVal = (val: any): AttributesMapType => {
  if (val === true || val === false) return AttributesMapType.Boolean;
  if (String(val) === '[object Object]') return AttributesMapType.Object;
  if (Number(val) === val) return AttributesMapType.Number;
  if (Array.isArray(val)) return AttributesMapType.Array;
  return AttributesMapType.String;
};
export * from './validateFormat';
