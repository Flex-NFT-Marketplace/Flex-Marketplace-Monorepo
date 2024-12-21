import { config } from 'dotenv';

config();
config({ path: '../../.env' });
// Configuration Path
export default () => ({
  db_path: String(process.env.DB_PATH),
  onchain_worker_port: Number(process.env.ONCHAIN_WORKER_PORT) || 3001,
  onchain_queue_port: Number(process.env.ONCHAIN_QUEUE_PORT) || 3002,
  offchain_worker_port: Number(process.env.OFFCHAIN_WORKER_PORT) || 3030,
  api_port: Number(process.env.API_PORT) || 5001,
  flexhaus_api_port: Number(process.env.FLEXHAUS_API_PORT) || 5002,
  begin_block: Number(process.env.BEGIN_BLOCK) || 0,
  jwt_secret: String(process.env.JWT_SECRET),
  jwt_expire: String(process.env.JWT_EXPIRE) || '1d',
  ipfs_gateway: String(process.env.IPFS_GATEWAY) || 'https://ipfs.io/ipfs/',
  pinata_key: String(process.env.PINATA_API_KEY),
  pinata_hub_key: String(process.env.PINATA_HUB_KEY),
  secret_key_encrypt:
    String(process.env.SECRET_KEY_ENCRYPT) ||
    '12345678901234567890123456789012', /// Key Encrypto privatekey
  secret_iv_encrypt:
    String(process.env.SECRET_IV_ENCRYPT) || '12345678901234567890123456789012',
  secret_encrypt_method:
    String(process.env.SECRET_ENCRYPT_METHOD) || 'aes-256-ctr',
  account_payer_estimate_private_key: String(
    process.env.ACCOUNT_PAYER_PRIVATE_KEY,
  ),
  account_payer_estimate_address: String(process.env.ACCOUNT_PAYER_ADDRESS),

  mailer: {
    host: String(process.env.EMAIL_HOST),
    port: Number(process.env.EMAIL_PORT),
    user: String(process.env.EMAIL_USERNAME),
    pass: String(process.env.EMAIL_PASS),
  },

  validator: {
    address: String(process.env.VALIDATOR_AD),
    privateKey: String(process.env.VALIDATOR_PK),
  },

  file_storage_path: String(process.env.FILE_STORAGE_PATH),

  image_dimension: {
    logo: {
      width: parseInt(process.env.LOGO_WIDTH, 10) || 300,
      height: parseInt(process.env.LOGO_HEIGHT, 10) || 300,
    },
    banner: {
      width: parseInt(process.env.BANNER_WIDTH, 10) || 1400,
      height: parseInt(process.env.BANNER_HEIGHT, 10) || 800,
    },
  },
});
