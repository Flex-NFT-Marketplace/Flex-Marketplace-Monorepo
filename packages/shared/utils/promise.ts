export async function delay(sec: number): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, sec * 1000);
  });
}

export async function timeout<T>(promise: Promise<T>, sec: number): Promise<T> {
  // so we can have a more comprehensive error stack
  const err = new Error('timeout');
  return Promise.race([
    promise,
    new Promise<never>((resolve, reject) => {
      setTimeout(() => reject(err), sec * 1000);
    }),
  ]);
}

export async function promiseLimit(
  items: Array<any>,
  callback: (item: any) => Promise<void>,
  max = 5,
) {
  if (!items || items.length === 0) return;
  let promise = [];
  for (let i = 0; i < items.length; i++) {
    promise.push(items[i]);
    if (i % max === 0) {
      await Promise.all(promise.map(item => callback(item)));
      promise = [];
    }
  }
  await Promise.all(promise.map(item => callback(item)));
}

export async function attemptOperations(
  operations: (() => Promise<any>)[],
): Promise<any> {
  for (const operation of operations) {
    try {
      return await operation();
    } catch (error) {}
  }
  return null;
}
