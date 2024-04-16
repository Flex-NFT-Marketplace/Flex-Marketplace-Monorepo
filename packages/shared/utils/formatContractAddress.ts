export const formattedContractAddress = (contractAddress: string) => {
  if (contractAddress.length == 65) {
    return contractAddress.replace('0x', '0x0').toLowerCase().trim();
  }

  if (contractAddress.length == 64) {
    return contractAddress.replace('0x', '0x00').toLowerCase().trim();
  }

  return contractAddress.toLowerCase().trim();
};
