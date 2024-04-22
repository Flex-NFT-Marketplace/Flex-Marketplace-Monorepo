export function isValidObjectId(str: string) {
  return /^[0-9a-fA-F]{24}$/.test(str);
}
