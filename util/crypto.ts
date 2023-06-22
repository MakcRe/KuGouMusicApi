import * as crypto from 'node:crypto';
import { randomString } from './util';
const publicRasKey = `-----BEGIN PUBLIC KEY-----\nMIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDIAG7QOELSYoIJvTFJhMpe1s/gbjDJX51HBNnEl5HXqTW6lQ7LC8jr9fWZTwusknp+sVGzwd40MwP6U5yDE27M/X1+UR4tvOGOqp94TJtQ1EPnWGWXngpeIW5GxoQGao1rmYWAu6oi1z9XkChrsUdC6DJE5E221wf/4WLFxwAtRQIDAQAB\n-----END PUBLIC KEY-----`;
export function cryptoMd5 (data: BufferLike){
  const  buffer = typeof data === 'object' ? JSON.stringify(data) : data;
  return crypto.createHash('md5').update(buffer).digest('hex');
}

export function cryptoAesEncrypt(data: BufferLike): AesEncrypt;
export function cryptoAesEncrypt(data: BufferLike, opt: { key: string }): AesEncrypt;
export function cryptoAesEncrypt(data: BufferLike, opt: { key: string, iv: string }): string;
export function cryptoAesEncrypt(data: BufferLike, opt?: { key?: string, iv?: string }): AesEncrypt | string {
  if (typeof data === 'object') data = JSON.stringify(data);
  const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data as string);
  let key: string, iv: string, tempKey: string = '';
  if (opt?.key && opt?.iv) {
    key = opt.key;
    iv = opt.iv;
  } else {
    tempKey = opt?.key || randomString(16).toLowerCase();
    key = cryptoMd5(tempKey).substring(0, 32);
    iv = key.substring(key.length - 16, key.length);
  }

  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  const dest = Buffer.concat([cipher.update(buffer), cipher.final()]);
  if (opt?.key && opt?.key) return  dest.toString('hex');
  return  {str: dest.toString('hex'), key: tempKey };
}
export function cryptoAesDecrypt (data: string, key: string, iv?: string) {
  if (!iv) key = cryptoMd5(key).substring(0, 32);
  iv = iv || key.substring(key.length - 16, key.length);
  const cipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  const dest = Buffer.concat([cipher.update(data, 'hex'), cipher.final()]);try {
    return JSON.parse(dest.toString());
  } catch (e) {
    return dest.toString();
  }
}


export function cryptoRSAEncrypt(data: BufferLike): string;
export function cryptoRSAEncrypt(data: BufferLike, publicKey: string): string;
export  function cryptoRSAEncrypt(data: BufferLike, publicKey?: string): string {
  if (typeof data === 'object') data = JSON.stringify(data);
  const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data as  string);
  const _buffer = Buffer.concat([buffer, Buffer.alloc(128 - buffer.length)]);
  publicKey = publicKey || publicRasKey;
  return crypto.publicEncrypt({ key: publicKey, padding: crypto.constants.RSA_NO_PADDING }, _buffer).toString('hex');
}

