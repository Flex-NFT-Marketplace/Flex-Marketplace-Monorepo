// Job channels
export const QUEUE_METADATA = 'metadata';

// job type
export const JOB_QUEUE_NFT_METADATA = 'fetch_metadata';

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
