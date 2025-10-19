// Read and parse the trusted proxies from environment variables.
const trustedProxyStr = Deno.env.get("TRUSTED_PROXIES") || "";
const trustedProxies = new Set(trustedProxyStr.split(',').filter(Boolean));

/**
 * Securely extracts the client's IP address from a request by respecting
 * a configurable list of trusted proxies and parsing the X-Forwarded-For header.
 * 
 * @param req The incoming request.
 * @returns The validated client IP address or undefined if not found.
 */
export function getClientIp(req: Request): string | undefined {
  const remoteAddr = (req.headers.get('x-forwarded-for') || '').split(',').map(ip => ip.trim());

  // If no trusted proxies are configured, or the header is absent, use the immediate connection address.
  if (trustedProxies.size === 0) {
    return remoteAddr.length > 0 ? remoteAddr[0] : undefined;
  }

  // Parse X-Forwarded-For from right to left, skipping trusted proxies.
  for (let i = remoteAddr.length - 1; i >= 0; i--) {
    const ip = remoteAddr[i];
    if (!trustedProxies.has(ip)) {
      // Found the first non-trusted IP, which should be the client.
      // Basic IP validation can be added here if needed.
      return ip;
    }
  }

  // If all IPs in the header are trusted, fall back to the rightmost one.
  return remoteAddr.length > 0 ? remoteAddr[remoteAddr.length - 1] : undefined;
}
