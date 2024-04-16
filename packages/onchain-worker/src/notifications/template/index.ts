import numeral from 'numeral';
export default {
  mint: ({ name }: { name: string }) => `Your ${name} has been minted`,
  sold: ({
    name,
    amount,
    tokenSymbol,
    amountFormat,
  }: {
    name: string;
    amount: number;
    tokenSymbol: string;
    amountFormat?: string;
  }) =>
    `Your ${name} is sold for ${numeral(amount).format(
      amountFormat || '0,0.[0000]',
    )} ${tokenSymbol}`,

  offerAccepted: ({
    name,
    amount,
    tokenSymbol,
    amountFormat,
  }: {
    name: string;
    amount: number;
    tokenSymbol: string;
    amountFormat?: string;
  }) =>
    `Your offer ${numeral(amount).format(
      amountFormat || '0,0.[0000]',
    )} ${tokenSymbol} for ${name} have been accepted`,
};
