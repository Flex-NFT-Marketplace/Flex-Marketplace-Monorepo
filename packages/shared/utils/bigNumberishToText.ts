import { BigNumberish, byteArray } from 'starknet';

export const BigNumberishToText = (data: BigNumberish[]): string => {
  return byteArray.stringFromByteArray({
    data,
    pending_word: '',
    pending_word_len: data.length,
  });
};

export const convertDataIntoString = (data: any): string => {
  if (typeof data === 'bigint') {
    return BigNumberishToText([data]);
  } else if (typeof data === 'object') {
    return BigNumberishToText(data);
  } else return data;
};
