// Job channels
export const QUEUE_METADATA = 'metadata';

// onchain Job Channels
export const ONCHAIN_QUEUES = {
  QUEUE_DEPLOY_CONTRACT: 'QUEUE_DEPLOY_CONTRACT',
  QUEUE_UPGRADE_CONTRACT: 'QUEUE_UPGRADE_CONTRACT',
  QUEUE_TRANSFER_20: `QUEUE_TRANSFER_20`,
  QUEUE_MINT_721: 'QUEUE_MINT_721',
  QUEUE_BURN_721: 'QUEUE_BURN_721',
  QUEUE_UPDATE_METADATA_721: 'QUEUE_UPDATE_METADATA_721',
  QUEUE_MINT_1155: 'QUEUE_MINT_1155',
  QUEUE_BURN_1155: 'QUEUE_BURN_1155',
  QUEUE_UPDATE_METADATA_1155: 'QUEUE_UPDATE_METADATA_1155',
  QUEUE_TRANSFER_721: 'QUEUE_TRANSFER_721',
  QUEUE_TRANSFER_1155: 'QUEUE_TRANSFER_1155',
  QUEUE_TAKER_BID: 'QUEUE_TAKER_BID',
  QUEUE_TAKER_ASK: 'QUEUE_TAKER_ASK',
  QUEUE_CANCEL_ALL_ORDERS: 'QUEUE_CANCEL_ALL_ORDERS',
  QUEUE_CANCEL_OFFER: 'QUEUE_CANCEL_OFFER',
  QUEUE_PHASE_DROP_UPDATED: 'QUEUE_PHASE_DROP_UPDATED',
  QUEUE_FLEX_DROP_MINTED: 'QUEUE_FLEX_DROP_MINTED',
  QUEUE_CREATOR_PAYOUT_UPDATED: 'QUEUE_CREATOR_PAYOUT_UPDATED',
  QUEUE_PAYER_UPDATED: 'QUEUE_PAYER_UPDATED',
  QUEUE_ITEM_STAKED: 'QUEUE_ITEM_STAKED',
  QUEUE_ITEM_UNSTAKED: 'QUEUE_ITEM_UNSTAKED',
  QUEUE_UPDATE_DROP: 'QUEUE_UPDATE_DROP',
};

// job type
export const JOB_QUEUE_NFT_METADATA = 'fetch_metadata';

// onchain jobs
export const ONCHAIN_JOBS = {
  JOB_DEPLOY_CONTRACT: 'JOB_DEPLOY_CONTRACT',
  JOB_UPGRADE_CONTRACT: 'JOB_UPGRADE_CONTRACT',
  JOB_TRANSFER_20: 'JOB_TRANSFER_20',
  JOB_MINT_721: 'JOB_MINT_721',
  JOB_BURN_721: 'JOB_BURN_721',
  JOB_UPDATE_METADATA_721: 'JOB_UPDATE_METADATA_721',
  JOB_MINT_1155: 'JOB_MINT_1155',
  JOB_BURN_1155: 'JOB_BURN_1155',
  JOB_UPDATE_METADATA_1155: 'JOB_UPDATE_METADATA_1155',
  JOB_TRANSFER_721: 'JOB_TRANSFER_721',
  JOB_TRANSFER_1155: 'JOB_TRANSFER_1155',
  JOB_TAKER_BID: 'JOB_TAKER_BID',
  JOB_TAKER_ASK: 'JOB_TAKER_ASK',
  JOB_CANCEL_ALL_ORDERS: 'JOB_CANCEL_ALL_ORDERS',
  JOB_CANCEL_OFFER: 'JOB_CANCEL_OFFER',
  JOB_PHASE_DROP_UPDATED: 'JOB_PHASE_DROP_UPDATED',
  JOB_FLEX_DROP_MINTED: 'JOB_FLEX_DROP_MINTED',
  JOB_CREATOR_PAYOUT_UPDATED: 'JOB_CREATOR_PAYOUT_UPDATED',
  JOB_PAYER_UPDATED: 'JOB_PAYER_UPDATED',
  JOB_ITEM_STAKED: 'JOB_ITEM_STAKED',
  JOB_ITEM_UNSTAKED: 'JOB_ITEM_UNSTAKED',
  JOB_UPDATE_DROP: 'JOB_UPDATE_DROP',
};

export const MQ_JOB_DEFAULT_CONFIG = {
  removeOnComplete: true,
  removeOnFail: {
    count: 1000, // keep up to 1000 jobs
  },
  attempts: 5,
  backoff: {
    type: 'exponential',
    delay: 1000,
  },
};
