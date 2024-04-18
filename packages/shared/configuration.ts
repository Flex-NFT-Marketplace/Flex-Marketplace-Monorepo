import { config } from 'dotenv';

config();
config({ path: '../../.env' });
// Configuration Path
export default () => ({
  db_path: String(process.env.DB_PATH),
  onchain_worker_port: Number(process.env.ONCHAIN_WORKER_PORT) || 3001,
  api_port: Number(process.env.API_PORT) || 5001,
  begin_block: Number(process.env.BEGIN_BLOCK) || 0,
  jwt_secret: String(process.env.JWT_SECRET),
});
