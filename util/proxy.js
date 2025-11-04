const { URL } = require('node:url');

/** @type {string | undefined} */
let cachedRaw;
/** @type {import('axios').AxiosProxyConfig | null} */
let cachedProxy = null;

/**
 * Parse proxy argument from CLI and write to env.
 * Supports:
 *  - --proxy=http://127.0.0.1:7890
 *  - --proxy http://127.0.0.1:7890
 *  - http://127.0.0.1:7890
 *
 * @param {string[]} [args]
 */
function applyProxyFromArgs(args = process.argv.slice(2)) {
  let proxyValue;

  for (let i = 0; i < args.length; i += 1) {
    const current = args[i];
    if (!current) continue;

    if (current.startsWith('--proxy=')) {
      proxyValue = current.slice('--proxy='.length).trim();
      break;
    }

    if (current === '--proxy' || current === '-p') {
      proxyValue = (args[i + 1] || '').trim();
      break;
    }

    if (!current.startsWith('-') && /^https?:\/\//i.test(current)) {
      proxyValue = current.trim();
      break;
    }
  }

  if (proxyValue) {
    process.env.KUGOU_API_PROXY = proxyValue;
  }
}

/**
 * Parse platform argument from CLI and write to env.
 * Supports:
 *  - --platform=lite
 *  - --platform lite
 *
 * @param {string[]} [args]
 */
function applyPlatformFromArgs(args = process.argv.slice(2)) {
  let platformValue;

  for (let i = 0; i < args.length; i += 1) {
    const current = args[i];
    if (!current) continue;

    if (current.startsWith('--platform=')) {
      platformValue = current.slice('--platform='.length).trim();
      break;
    }

    if (current === '--platform' || current === '-t' || current === '-T') {
      platformValue = (args[i + 1] || '').trim();
      break;
    }
  }

  if (platformValue) {
    process.env.platform = platformValue;
  }
}

/**
 * Resolve proxy configuration from environment variable.
 * Caches latest parsed result to avoid repeated parsing.
 * @returns {import('axios').AxiosProxyConfig | null}
 */
function resolveProxy() {
  const rawProxyEnv = typeof process.env.KUGOU_API_PROXY === 'string' ? process.env.KUGOU_API_PROXY.trim() : undefined;
  const rawProxy = rawProxyEnv && rawProxyEnv.length > 0 ? rawProxyEnv : undefined;

  if (!rawProxy) {
    cachedRaw = undefined;
    cachedProxy = null;
    return null;
  }

  if (cachedRaw === rawProxy) {
    return cachedProxy;
  }

  cachedRaw = rawProxy;
  try {
    const parsed = new URL(rawProxy);
    if (!/^https?:$/.test(parsed.protocol)) {
      console.warn(`[proxy] Unsupported proxy protocol: ${parsed.protocol}`);
      cachedProxy = null;
      return null;
    }

    const proxyConfig = {
      protocol: parsed.protocol.replace(':', ''),
      host: parsed.hostname,
      port: parsed.port ? Number(parsed.port) : parsed.protocol === 'https:' ? 443 : 80,
    };

    if (parsed.username || parsed.password) {
      proxyConfig.auth = {
        username: parsed.username,
        password: parsed.password,
      };
    }

    cachedProxy = proxyConfig;
    console.info(`[proxy] Using proxy ${parsed.protocol}//${parsed.host}`);
  } catch (error) {
    console.warn(`[proxy] Failed to parse proxy address "${rawProxy}": ${error.message}`);
    cachedProxy = null;
  }

  return cachedProxy;
}

module.exports = { applyProxyFromArgs, applyPlatformFromArgs, resolveProxy };
