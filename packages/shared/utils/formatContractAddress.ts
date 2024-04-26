export const formattedContractAddress = (contractAddress: string) => {
  while (contractAddress.trim().length < 66) {
    contractAddress = contractAddress.trim().replace('0x', '0x0');
  }

  return contractAddress.toLowerCase().trim();
};
