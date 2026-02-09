import 'server-only';
import { HttpsProxyAgent } from 'https-proxy-agent';
import nodeFetch, { RequestInit as NodeFetchRequestInit } from 'node-fetch';

interface ProxyConfig {
  type: string;
  username: string;
  password: string;
  server: string;
  isResidential: boolean;
}

function getProxyConfig(): ProxyConfig | null {
  const proxyType = process.env.PROXY_TYPE;
  const username = process.env.PROXY_USERNAME;
  const password = process.env.PROXY_PASSWORD;

  if (!proxyType || !username || !password) {
    return null;
  }

  let server: string;
  let isResidential = false;

  switch (proxyType.toLowerCase()) {
    case 'webshare':
      // Datacenter proxy - more likely to be rate limited
      server = 'p.webshare.io:80';
      break;
    case 'webshare-residential':
      // Residential rotating proxy - better for YouTube
      server = process.env.PROXY_SERVER || 'proxy.webshare.io:80';
      isResidential = true;
      break;
    case 'packetstream':
      server = process.env.PROXY_SERVER || 'proxy.packetstream.io:31112';
      isResidential = true;
      break;
    case 'brightdata':
      server = process.env.PROXY_SERVER || 'brd.superproxy.io:22225';
      isResidential = true;
      break;
    case 'generic':
      server = process.env.PROXY_SERVER || '';
      if (!server) {
        console.warn('[Proxy] Generic proxy type requires PROXY_SERVER');
        return null;
      }
      break;
    default:
      console.warn(`[Proxy] Unknown proxy type: ${proxyType}`);
      return null;
  }

  return { type: proxyType, username, password, server, isResidential };
}

export function createProxyAgent(): HttpsProxyAgent<string> | undefined {
  const config = getProxyConfig();

  if (!config) {
    return undefined;
  }

  const proxyUrl = `http://${config.username}:${config.password}@${config.server}`;
  console.log(`[Proxy] Using ${config.type} proxy via ${config.server}${config.isResidential ? ' (residential)' : ''}`);

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
 * Uses node-fetch which properly supports HTTP agents for proxying
 * Includes retry logic with exponential backoff
 */
export function createProxiedFetch(): (params: FetchParams) => Promise<Response> {
  const agent = createProxyAgent();
  const maxRetries = 3;

  return async (params: FetchParams): Promise<Response> => {
    const { url, method = 'GET', body, headers = {} } = params;

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
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
          agent: agent,
        };

        const response = await nodeFetch(url, fetchOptions);

        // Check for rate limiting responses
        if (response.status === 429 || response.status === 503) {
          const retryAfter = response.headers.get('retry-after');
          const delayMs = retryAfter ? parseInt(retryAfter) * 1000 : Math.pow(2, attempt) * 1000;
          console.log(`[Proxy] Rate limited (${response.status}), waiting ${delayMs}ms before retry ${attempt + 1}/${maxRetries}`);
          await sleep(delayMs);
          continue;
        }

        // Convert node-fetch Response to standard Web API Response
        return response as unknown as Response;
      } catch (error) {
        lastError = error as Error;
        const delayMs = Math.pow(2, attempt) * 1000;
        console.log(`[Proxy] Request failed (attempt ${attempt + 1}/${maxRetries}): ${lastError.message}`);

        if (attempt < maxRetries - 1) {
          await sleep(delayMs);
        }
      }
    }

    throw lastError || new Error('All retry attempts failed');
  };
}

/**
 * Check if proxy is configured
 */
export function isProxyConfigured(): boolean {
  return getProxyConfig() !== null;
}
