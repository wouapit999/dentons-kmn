/**
 * Vercel Edge Middleware — runs on every request before the SPA loads.
 * Returns hard HTTP 400 / 404 for scanner probes (no SPA fallback).
 *
 * Addresses CRITICAL "Command Injection" and HIGH "Exposed Path" findings
 * from the Wouapit-Hack remediation report.
 */
export const config = {
  // Skip static assets and our own API
  matcher: "/((?!_next/static|_next/image|favicon\\.ico|static/|robots\\.txt|manifest\\.json|api/).*)",
};

// ── Command-injection probe parameters ────────────────────────────────────────
const BAD_PARAMS = [
  "cmd","exec","command","run","shell","eval","system","passthru","invoke",
];

// ── Suspicious payload patterns in any parameter value ───────────────────────
const PAYLOAD_PATTERNS = [
  /[;|`$()<>]/,         // shell metacharacters
  /\b(whoami|cat|ls|wget|curl|nc|bash|sh)\b/i,
  /\.\.\/|\.\.\\/,      // path traversal
  /<script|javascript:|onerror=/i, // basic XSS
  /(union|select|insert|update|delete|drop)\s+(all|from|into|table)/i, // SQLi
];

// ── Sensitive paths that should never exist in this app ──────────────────────
const BLOCKED_PATHS = [
  // WordPress
  /^\/wp-admin/, /^\/wp-login/, /^\/wp-config/, /^\/wp-content/, /^\/wp-includes/,
  // Database admin
  /^\/adminer/, /^\/phpmyadmin/, /^\/pma/,
  // Config files
  /^\/config\.(php|xml|yaml|yml|json)$/, /^\/configuration\.php$/, /^\/web\.config$/,
  /^\/settings\.php$/, /^\/local\.xml$/, /^\/appsettings\.json$/,
  // Database dumps & backups
  /^\/(backup|db_backup|dump|database)\.sql$/, /^\/.*\.bak$/,
  // Spring Boot / Java
  /^\/actuator/, /^\/debug$/, /^\/console$/,
  // Web shells
  /^\/(shell|cmd|webshell|backdoor|c99|r57|upload|file_manager|manager|filemanager|db|database|sql)\.php$/,
  // Linux/system files
  /^\/passwd$/, /^\/shadow$/, /^\/id_rsa$/, /^\/id_dsa$/, /^\/\.bash_history$/,
  /^\/\.ssh/, /^\/\.aws/, /^\/\.env$/,
  // Cloud credentials
  /^\/(aws|credentials|google-services)\.json$/, /^\/credentials$/,
  // GraphQL endpoints (not used)
  /^\/_?graphql$/, /^\/graphiql$/,
  // Laravel debug tools
  /^\/telescope/, /^\/horizon/,
  // Symfony profiler
  /^\/_profiler/, /^\/_wdt/,
  // Generic monitoring & metrics
  /^\/trace$/, /^\/metrics$/, /^\/health$/, /^\/info$/, /^\/ping$/, /^\/version$/, /^\/env$/, /^\/status$/,
  // Rails
  /^\/rails\/info/,
];

export default function middleware(request: Request): Response | undefined {
  const url      = new URL(request.url);
  const path     = url.pathname.toLowerCase();
  const params   = url.searchParams;

  // ── 1. Block command-injection probe parameters with HTTP 400 ────────────
  for (const param of BAD_PARAMS) {
    if (params.has(param)) {
      return new Response("Bad Request", {
        status: 400,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-store",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }
  }

  // ── 2. Block suspicious payloads in any param value with HTTP 400 ────────
  for (const [, value] of params) {
    for (const pattern of PAYLOAD_PATTERNS) {
      if (pattern.test(value)) {
        return new Response("Bad Request", {
          status: 400,
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "no-store",
            "X-Content-Type-Options": "nosniff",
          },
        });
      }
    }
  }

  // ── 3. Block sensitive paths with HTTP 404 ──────────────────────────────
  for (const pattern of BLOCKED_PATHS) {
    if (pattern.test(path)) {
      return new Response("Not Found", {
        status: 404,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-store",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }
  }

  // ── 4. Otherwise let the request continue to the SPA ─────────────────────
  return undefined;
}
