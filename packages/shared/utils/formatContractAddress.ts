export const formattedContractAddress = (contractAddress: string) => {
  while (contractAddress.trim().length < 66) {
    contractAddress = contractAddress.trim().replace('0x', '0x0');
  }

  return contractAddress.toLowerCase().trim();
};

// Example: 1 FRI => 10**-18 STRK
export function formatBalance(qty: bigint, decimals: number) {
  const balance = String('0').repeat(decimals) + qty.toString();
  const rightCleaned = balance.slice(-decimals).replace(/(\d)0+$/gm, '$1');
  const leftCleaned = BigInt(
    balance.slice(0, balance.length - decimals),
  ).toString();
  return leftCleaned + '.' + rightCleaned;
}
