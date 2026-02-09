import 'server-only';
import { HttpsProxyAgent } from 'https-proxy-agent';
import nodeFetch, { RequestInit as NodeFetchRequestInit } from 'node-fetch';

// Webshare rotating residential proxy pool
const WEBSHARE_PROXY_POOL = [
  'lxlnlqzu-1',  // Pakistan
  'lxlnlqzu-2',  // Korea
  'lxlnlqzu-3',  // Taiwan
  'lxlnlqzu-4',  // Poland
  'lxlnlqzu-5',  // Belgium
  'lxlnlqzu-6',  // Korea
  'lxlnlqzu-7',  // Taiwan
  'lxlnlqzu-8',  // France
  'lxlnlqzu-9',  // Japan
  'lxlnlqzu-10', // Malaysia
];

// Track current proxy index (in-memory, resets on server restart)
let currentProxyIndex = 0;
let failedProxies = new Set<number>();

interface ProxyConfig {
  type: string;
  username: string;
  password: string;
  server: string;
}

/**
 * Get the next available proxy, cycling through the pool
 */
function getNextProxy(): { username: string; index: number } | null {
  // If all proxies have failed, reset and try again
  if (failedProxies.size >= WEBSHARE_PROXY_POOL.length) {
    console.log('[Proxy] All proxies failed, resetting pool');
    failedProxies.clear();
  }

  // Find next non-failed proxy
  for (let i = 0; i < WEBSHARE_PROXY_POOL.length; i++) {
    const index = (currentProxyIndex + i) % WEBSHARE_PROXY_POOL.length;
    if (!failedProxies.has(index)) {
      currentProxyIndex = (index + 1) % WEBSHARE_PROXY_POOL.length;
      return { username: WEBSHARE_PROXY_POOL[index], index };
    }
  }

  return null;
}

/**
 * Mark a proxy as failed (temporarily)
 */
export function markProxyFailed(index: number): void {
  failedProxies.add(index);
  console.log(`[Proxy] Marked proxy ${index} (${WEBSHARE_PROXY_POOL[index]}) as failed. Failed count: ${failedProxies.size}/${WEBSHARE_PROXY_POOL.length}`);
}

/**
 * Reset failed proxies (call periodically or after successful requests)
 */
export function resetFailedProxies(): void {
  failedProxies.clear();
}

function getProxyConfig(specificIndex?: number): ProxyConfig | null {
  const proxyType = process.env.PROXY_TYPE;
  const password = process.env.PROXY_PASSWORD;

  if (!proxyType || !password) {
    return null;
  }

  let server: string;
  let username: string;

  switch (proxyType.toLowerCase()) {
    case 'webshare':
      server = 'p.webshare.io:80';
      // Use pool rotation for webshare
      if (specificIndex !== undefined) {
        username = WEBSHARE_PROXY_POOL[specificIndex];
      } else {
        const next = getNextProxy();
        if (!next) return null;
        username = next.username;
      }
      break;
    case 'generic':
      server = process.env.PROXY_SERVER || '';
      username = process.env.PROXY_USERNAME || '';
      if (!server || !username) {
        console.warn('[Proxy] Generic proxy type requires PROXY_SERVER and PROXY_USERNAME');
        return null;
      }
      break;
    default:
      console.warn(`[Proxy] Unknown proxy type: ${proxyType}`);
      return null;
  }

  return { type: proxyType, username, password, server };
}

export function createProxyAgent(proxyIndex?: number): HttpsProxyAgent<string> | undefined {
  const config = getProxyConfig(proxyIndex);

  if (!config) {
    return undefined;
  }

  const proxyUrl = `http://${config.username}:${config.password}@${config.server}`;
  console.log(`[Proxy] Using ${config.type} proxy: ${config.username} via ${config.server}`);

  return new HttpsProxyAgent(proxyUrl);
}

export interface FetchParams {
  url: string;
  method?: 'GET' | 'POST';
  body?: string;
  headers?: Record<string, string>;
}

// Random user agents to rotate
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
];

function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Create a proxied fetch function for youtube-transcript-plus
 * Cycles through proxy pool on failures/rate limits
 */
export function createProxiedFetch(): (params: FetchParams) => Promise<Response> {
  // Track which proxy we're using for this fetch session
  let currentAgent: HttpsProxyAgent<string> | undefined;
  let currentProxyIdx: number = -1;

  const getAgent = () => {
    const next = getNextProxy();
    if (!next) {
      // All proxies exhausted, reset and try first one
      resetFailedProxies();
      const retry = getNextProxy();
      if (!retry) return undefined;
      currentProxyIdx = retry.index;
      return createProxyAgent(retry.index);
    }
    currentProxyIdx = next.index;
    return createProxyAgent(next.index);
  };

  currentAgent = getAgent();

  return async (params: FetchParams): Promise<Response> => {
    const { url, method = 'GET', body, headers = {} } = params;
    const maxProxyAttempts = WEBSHARE_PROXY_POOL.length;

    for (let proxyAttempt = 0; proxyAttempt < maxProxyAttempts; proxyAttempt++) {
      try {
        const fetchOptions: NodeFetchRequestInit = {
          method,
          headers: {
            'User-Agent': getRandomUserAgent(),
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            ...headers,
          },
          body: body || undefined,
          agent: currentAgent,
        };

        const response = await nodeFetch(url, fetchOptions);

        // Check for rate limiting or errors that suggest proxy issue
        if (response.status === 429 || response.status === 503 || response.status === 403) {
          console.log(`[Proxy] Got ${response.status}, cycling to next proxy (attempt ${proxyAttempt + 1}/${maxProxyAttempts})`);
          if (currentProxyIdx >= 0) {
            markProxyFailed(currentProxyIdx);
          }
          currentAgent = getAgent();
          await sleep(500); // Brief pause before trying next proxy
          continue;
        }

        // Success - return the response
        return response as unknown as Response;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        console.log(`[Proxy] Request failed with proxy ${currentProxyIdx}: ${errorMsg}`);

        // Mark current proxy as failed and get next one
        if (currentProxyIdx >= 0) {
          markProxyFailed(currentProxyIdx);
        }
        currentAgent = getAgent();

        if (proxyAttempt < maxProxyAttempts - 1) {
          await sleep(500);
        }
      }
    }

    throw new Error('All proxies exhausted. Please try again later.');
  };
}

/**
 * Check if proxy is configured
 */
export function isProxyConfigured(): boolean {
  return getProxyConfig() !== null;
}
