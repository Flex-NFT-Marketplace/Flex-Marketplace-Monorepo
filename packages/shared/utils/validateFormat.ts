export function isValidObjectId(str: string) {
  return /^[0-9a-fA-F]{24}$/.test(str);
}

export function isValidAddress(str: string) {
  return /^[0-9A-Fa-f]+$/.test(str.replace('0x', ''));
}
