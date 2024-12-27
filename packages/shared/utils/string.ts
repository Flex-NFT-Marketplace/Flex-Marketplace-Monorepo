export const getIPFSHostPath = (ipfsLink: string): string => {
  // Check if the link starts with the IPFS protocol
  if (!ipfsLink.startsWith('ipfs://')) {
    return ipfsLink;
  }

  // Remove the protocol and leading slash
  const trimmedLink = ipfsLink.slice('ipfs://'.length).trim();

  // Split the link by the first slash (separating host and path)
  const parts = trimmedLink.split('/', 2);

  // Extract host and path (or empty string if not found)
  const host = parts[0] || '';
  const path = parts[1] || '';
  let hostPath = process.env.IPFS_HOST + '/' + host + '/' + path;
  return hostPath;
};

export const strShortAddress = (address: string) => {
  if (!address) return '-';
  const start = address.substring(0, 2);
  const end = address.substring(address.length - 4);
  return `${start}..${end}`;
};
