import { config } from 'dotenv';

config();
config({ path: '../../.env' });

export default () => ({
  db_path: String(process.env.DB_PATH),
  onchain_worker_port: Number(process.env.ONCHAIN_WORKER_PORT) || 3001,
  offchain_worker_port: Number(process.env.OFFCHAIN_WORKER_PORT) || 3030,
  api_port: Number(process.env.API_PORT) || 5001,
  begin_block: Number(process.env.BEGIN_BLOCK) || 0,
});
