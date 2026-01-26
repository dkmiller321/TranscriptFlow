import 'server-only';
import { HttpsProxyAgent } from 'https-proxy-agent';
import nodeFetch, { RequestInit as NodeFetchRequestInit } from 'node-fetch';

interface ProxyConfig {
  type: string;
  username: string;
  password: string;
  server: string;
}

function getProxyConfig(): ProxyConfig | null {
  const proxyType = process.env.PROXY_TYPE;
  const username = process.env.PROXY_USERNAME;
  const password = process.env.PROXY_PASSWORD;

  if (!proxyType || !username || !password) {
    return null;
  }

  let server: string;

  switch (proxyType.toLowerCase()) {
    case 'webshare':
      server = 'p.webshare.io:80';
      break;
    case 'packetstream':
      server = process.env.PROXY_SERVER || 'proxy.packetstream.io:31112';
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

  return { type: proxyType, username, password, server };
}

export function createProxyAgent(): HttpsProxyAgent<string> | undefined {
  const config = getProxyConfig();

  if (!config) {
    return undefined;
  }

  const proxyUrl = `http://${config.username}:${config.password}@${config.server}`;
  console.log(`[Proxy] Using ${config.type} proxy via ${config.server}`);

  return new HttpsProxyAgent(proxyUrl);
}

export interface FetchParams {
  url: string;
  method?: 'GET' | 'POST';
  body?: string;
  headers?: Record<string, string>;
}

/**
 * Create a proxied fetch function for youtube-transcript-plus
 * Uses node-fetch which properly supports HTTP agents for proxying
 */
export function createProxiedFetch(): (params: FetchParams) => Promise<Response> {
  const agent = createProxyAgent();

  return async (params: FetchParams): Promise<Response> => {
    const { url, method = 'GET', body, headers = {} } = params;

    const fetchOptions: NodeFetchRequestInit = {
      method,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        ...headers,
      },
      body: body || undefined,
      agent: agent, // node-fetch properly supports the agent option
    };

    const response = await nodeFetch(url, fetchOptions);

    // Convert node-fetch Response to standard Web API Response
    // This is needed because youtube-transcript-plus expects Web API Response
    return response as unknown as Response;
  };
}

/**
 * Check if proxy is configured
 */
export function isProxyConfigured(): boolean {
  return getProxyConfig() !== null;
}
