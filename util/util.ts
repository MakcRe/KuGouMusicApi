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