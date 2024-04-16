// Default Sign Message Function
export const SIGN_MESSAGE = ({
  address,
  nonce,
}: {
  address: string;
  nonce: number;
}) => {
  return `Message:
        Welcome to OpenSea!
        
        Click to sign in and accept the OpenSea Terms of Service () and Privacy Policy ().
        
        This request will not trigger a blockchain transaction or cost any gas fees.
        
        Wallet address:
        ${address}
        
        Nonce:
        ${nonce}`;
};
