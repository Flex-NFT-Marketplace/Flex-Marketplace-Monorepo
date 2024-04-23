import { AttributesMapType } from '../models';

export * from './formatContractAddress';
export * from './arrayLimitProcess';
export * from './promise';
export * from './bigNumberishToText';

export const typeOfVal = (val: any): AttributesMapType => {
  if (val === true || val === false) return AttributesMapType.Boolean;
  if (String(val) === '[object Object]') return AttributesMapType.Object;
  if (Number(val) === val) return AttributesMapType.Number;
  return AttributesMapType.String;
};
