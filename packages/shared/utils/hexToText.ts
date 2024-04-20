export const HexToText = (hex: string): string => {
  return Buffer.from(hex.replace('0x', ''), 'hex').toString('utf-8');
};
