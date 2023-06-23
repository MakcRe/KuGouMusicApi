import pako from 'pako';
export const randomString = (len = 16): string => {
  const keyString = '1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const _key: string[] = [];
  const keyStringArr: string[] = keyString.split('');
  for (let i = 0; i < len; i += 1) {
    const ceil = Math.ceil((keyStringArr.length - 1) * Math.random());
    const _tmp = keyStringArr[ceil];
    _key.push(_tmp);
  }

  return _key.join('');
};

export const mapToObject = (params: Map<string, any>): {[key: string]: any} => {
  const _data = {};
  params.forEach((value, key) => {
    if (value instanceof Map) {
      _data[key] = mapToObject(value);
    } else {
      _data[key] = value;
    }
  });
  return _data;
};


export const parseCookieString = (cookie: string): string => {
  const t = cookie.replace(/\s*(Domain|domain|path|expires)=[^(;|$)]+;*/g, '');
  return t.replace(/;HttpOnly/g, '');
};

export const cookieToJson = (cookie: string) => {
  if (!cookie) return {}
  let cookieArr = cookie.split(';')
  let obj = {}
  cookieArr.forEach((i) => {
    let arr = i.split('=')
    obj[arr[0]] = arr[1]
  })
  return obj
}

export const decodeLyrics = (val: string | Uint8Array | Buffer) => {
  let bytes: Uint8Array | null = null;
  if (val instanceof Uint8Array) bytes = val;
  if (Buffer.isBuffer(val)) bytes = new Uint8Array(val);
  if (typeof val === 'string') bytes = new Uint8Array(Buffer.from(val, 'base64'));
  if (bytes === null) return '';
  const enKey = [64, 71, 97, 119, 94, 50, 116, 71, 81, 54, 49, 45, 206, 210, 110, 105];
  const krcBytes = bytes.slice(4);
  const len = krcBytes.byteLength;
  for (let index = 0; index < len; index += 1) {
    krcBytes[index] = krcBytes[index] ^ enKey[index % enKey.length];
  }
  try {
    const inflate = pako.inflate(krcBytes);
    return Buffer.from(inflate).toString('utf8');
  } catch {
    return '';
  }
}