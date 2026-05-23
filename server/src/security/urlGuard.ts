import { promises as dns } from 'dns';
import { isIP } from 'net';

import ipaddr from 'ipaddr.js';

/** Error thrown when a URL fails the SSRF guard. */
export class BlockedUrlError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BlockedUrlError';
  }
}

/** True if the given IP literal is anything other than a regular public unicast address. */
const isBlockedIp = (ip: string): boolean => {
  try {
    return ipaddr.process(ip).range() !== 'unicast';
  } catch {
    // Unparseable → safer to block than to fall through.
    return true;
  }
};

/**
 * Validate a URL for proxy fetching. Parses the URL, requires http/https,
 * and resolves the hostname (via the OS resolver, so it matches what `fetch`
 * will use). Any resolved address that isn't a public unicast IP rejects.
 * @param rawUrl - URL string to validate
 * @returns The parsed URL on success
 * @throws BlockedUrlError on any failure mode
 */
export const assertSafeUrl = async (rawUrl: string): Promise<URL> => {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new BlockedUrlError('Invalid URL');
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new BlockedUrlError('Only http and https are allowed');
  }

  // `URL.hostname` keeps brackets around IPv6 literals — strip them before
  // checking, since `net.isIP` and the blocklist expect the bare address.
  const hostname = parsed.hostname.replace(/^\[|\]$/g, '');

  if (isIP(hostname)) {
    if (isBlockedIp(hostname)) {
      throw new BlockedUrlError('Target address is in a blocked range');
    }
    return parsed;
  }

  let addresses;
  try {
    addresses = await dns.lookup(hostname, { all: true });
  } catch {
    throw new BlockedUrlError('Hostname could not be resolved');
  }

  if (addresses.length === 0) {
    throw new BlockedUrlError('Hostname could not be resolved');
  }

  // A hostname can resolve to multiple IPs (A + AAAA, multiple A records).
  // Reject if any resolved address is blocked — we can't predict which one
  // `fetch` will pick.
  for (const { address } of addresses) {
    if (isBlockedIp(address)) {
      throw new BlockedUrlError('Target address is in a blocked range');
    }
  }

  return parsed;
};
