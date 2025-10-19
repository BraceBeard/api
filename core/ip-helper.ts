import { isIPv4, isIPv6, matchSubnets } from "@std/net/unstable-ip";

// Read and parse the trusted proxies from environment variables.
const trustedProxyStr = Deno.env.get("TRUSTED_PROXIES") || "";
const trustedProxies = new Set<string>();

trustedProxyStr.split(',').forEach(entry => {
  const trimmedEntry = entry.trim();
  if (!trimmedEntry) return;

  // Basic validation for IP or CIDR format.
  if (isIPv4(trimmedEntry) || isIPv6(trimmedEntry) || trimmedEntry.includes('/')) {
    trustedProxies.add(trimmedEntry);
  } else {
    console.warn(`Invalid entry in TRUSTED_PROXIES ignored: ${trimmedEntry}`);
  }
});

/**
 * Checks if a given IP is within the list of trusted proxies (supports CIDR).
 * @param ip The IP address to check.
 * @returns True if the IP is trusted, false otherwise.
 */
function isIpTrusted(ip: string): boolean {
  if (!isIPv4(ip) && !isIPv6(ip)) return false;
  return matchSubnets(ip, Array.from(trustedProxies));
}

/**
 * Securely extracts the client's IP address from a request by respecting
 * a configurable list of trusted proxies and parsing the X-Forwarded-For header.
 * 
 * @param req The incoming request.
 * @returns The validated client IP address or undefined if not found.
 */
export function getClientIp(req: Request): string | undefined {
  const xffHeader = req.headers.get('x-forwarded-for');

  // If no trusted proxies are configured, do not trust the X-Forwarded-For header.
  if (trustedProxies.size === 0) {
    if (xffHeader) {
      console.warn(
        'X-Forwarded-For header is present but no trusted proxies are configured. ' +
        'Set TRUSTED_PROXIES to trust this header. Falling back to global rate limit.'
      );
    }
    // Cannot determine a reliable IP, so we return undefined.
    return undefined;
  }

  if (!xffHeader) {
    return undefined;
  }

  const remoteAddrs = xffHeader.split(',').map(ip => ip.trim());

  // Parse X-Forwarded-For from right to left, skipping trusted proxies.
  // When all addresses are trusted, we treat the client as unknown and return undefined.
  for (let i = remoteAddrs.length - 1; i >= 0; i--) {
    const ip = remoteAddrs[i];
    if (!isIpTrusted(ip)) {
      // Found the first non-trusted IP, which should be the client.
      // Basic IP validation can be added here if needed.
      return ip;
    }
  }

  // If all IPs in the header are trusted, it indicates a possible misconfiguration.
  console.warn(
    'All IPs in X-Forwarded-For header are trusted. Could not determine client IP.'
  );
  return undefined;
}
