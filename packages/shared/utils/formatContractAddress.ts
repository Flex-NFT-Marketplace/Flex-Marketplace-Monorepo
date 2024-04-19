export const formattedContractAddress = (contractAddress: string) => {
  while (contractAddress.length < 66) {
    contractAddress = contractAddress.replace('0x', '0x0');
  }

  return contractAddress.toLowerCase().trim();
};
