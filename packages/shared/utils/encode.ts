import crypto from 'crypto';
import configuration from '../configuration';

const key = crypto
  .createHash('sha512')
  .update(configuration().secret_key_encrypt)
  .digest('hex')
  .substring(0, 32);
const encryptionIV = crypto
  .createHash('sha512')
  .update(configuration().secret_iv_encrypt)
  .digest('hex')
  .substring(0, 16);

export const encryptData = (data: string) => {
  const cipher = crypto.createCipheriv(
    configuration().secret_encrypt_method,
    key,
    encryptionIV,
  );

  return Buffer.from(
    cipher.update(data, 'utf8', 'hex') + cipher.final('hex'),
  ).toString('base64'); // Encrypts data and converts to hex and base64
};

export const decryptData = encryptedData => {
  const buff = Buffer.from(encryptedData, 'base64');

  const decipher = crypto.createDecipheriv(
    configuration().secret_encrypt_method,
    key,
    encryptionIV,
  );

  return (
    decipher.update(buff.toString('utf8'), 'hex', 'utf8') +
    decipher.final('utf8')
  ); // Decrypts data and converts to utf8
};
