// =============================================================================
// semgrep-test.js  —  INTENTIONAL VULNERABILITIES for DevSecOps demonstration
// =============================================================================
// Project : CWASA MR App Admin  (p1641.2_cwasa_mr_app_admin_fe)
// Author  : Senior DevSecOps Engineer — pre-commit gate validation
// Purpose : Shows exactly what semgrep (p/owasp-top-ten) blocks BEFORE code
//           reaches the CI pipeline or a code review.
//
// Every vulnerability below is a realistic mistake a developer could introduce
// while working on THIS codebase, and maps to a real pattern already present:
//
//  VUL-1  src/components/auth/auth-header/index.tsx        line 19
//  VUL-2  src/features/api/apiSlice.ts                     line 31  (generalised)
//  VUL-3  src/lib/utils.ts                                 line 70  (JWT in storage)
//  VUL-4  src/pages/new-password/index.tsx                 line 23  (token in URL)
//  VUL-5  (new pattern) — dynamic KPI formatter via new Function()
//
// DO NOT MERGE — remove this file after the pre-commit demo.
// =============================================================================


// ─── VUL-1 · OWASP A03 – Injection: XSS via dangerouslySetInnerHTML ────────
//
// Mirrors: src/components/auth/auth-header/index.tsx:19
//   <p dangerouslySetInnerHTML={{ __html: description }} />
//
// Scenario: A developer extends CustomerNoticeCard to render rich-text notices
//   fetched from the billing API (e.g., maintenance announcements for the
//   water utility dashboard).  If the API is compromised, or a malicious
//   admin saves an XSS payload via the master-data notice editor, every admin
//   browser that loads the page executes attacker-controlled JavaScript.
//
// Fix: sanitize with DOMPurify before rendering, or use plain {text} prop.
//   import DOMPurify from "dompurify";
//   <p>{DOMPurify.sanitize(noticeFromApi)}</p>

function CustomerNoticeCard({ noticeFromApi }) {
    return (
        <div
            className="notice-card"
            dangerouslySetInnerHTML={{ __html: noticeFromApi }}  // 🚨 semgrep: react-dangerously-set-innerhtml
        />
    );
}


// ─── VUL-2 · OWASP A01 – Broken Access Control: Open Redirect ──────────────
//
// Mirrors: src/features/api/apiSlice.ts:31
//   window.location.href = "/login";            ← safe because destination is hardcoded
//
// Scenario: A developer generalises the post-session-expiry redirect to support
//   a "?next=" query parameter so users land back on the page they were viewing.
//   An attacker sends admins a crafted link:
//     https://cwasa-admin.bjitgroup.com/login?next=https://attacker.com
//   After successful OTP login the admin is silently redirected to a phishing
//   page that harvests credentials or installs malware.
//
// Fix: validate redirect target against an allowlist of internal routes.
//   const SAFE_ROUTES = ["/dashboard", "/billing", "/customer-management"];
//   if (SAFE_ROUTES.includes(nextUrl)) window.location.href = nextUrl;

function redirectAfterSessionExpiry() {
    const nextUrl = new URLSearchParams(window.location.search).get("next");
    window.location.href = nextUrl;
    // 🚨 semgrep: open-redirect
}


// ─── VUL-3 · OWASP A02 – Cryptographic Failure: JWT in localStorage ─────────
//
// Mirrors: src/lib/utils.ts:70  loadStateFromLocalStorage()
//   localStorage.getItem("authState") → JSON.parse → accessToken
//
// Scenario: A developer persists the Redux auth slice (which contains the JWT
//   access token) into localStorage for session continuity across page reloads.
//   localStorage is accessible to ANY JavaScript running on the page — meaning
//   VUL-1 or VUL-2 above immediately escalates to full token theft for every
//   admin role, including super-admins who can create users and change billing.
//
// Fix: store tokens in HttpOnly + Secure + SameSite=Strict cookies issued by
//   the server.  The token is then invisible to JavaScript entirely.

function cacheAuthToken(accessToken) {
    localStorage.setItem("authState", JSON.stringify({ accessToken }));
    // 🚨 semgrep: jwt-in-localstorage
}


// ─── VUL-4 · OWASP A02 – Sensitive Data Exposure: Reset Token in URL ────────
//
// Mirrors: src/pages/new-password/index.tsx:23
//   const token = new URLSearchParams(window.location.search).get("token");
//
// Scenario: The password-reset flow sends the user a link like:
//   https://cwasa-admin.bjitgroup.com/new-password?token=eyJhbGci...
//   The token is now exposed in:
//     • Browser history  (visible to anyone with access to the device)
//     • Server access logs (stored in plain text by nginx / load balancers)
//     • Referrer headers (leaked to any third-party script on the page)
//   An attacker with access to server logs can take over any admin account
//   during the reset window.
//
// Fix: deliver the token in the request body (POST), not the URL.
//   Send the user to /new-password and POST the token with the new password.

function buildPasswordResetUrl(token) {
    const resetUrl = `${window.location.origin}/new-password?token=${token}`; // 🚨 semgrep: sensitive-data-url
    return resetUrl;
}

// ─── VUL-5 · OWASP A03 – Injection: Code Injection via new Function() ───────
//
// Scenario: A developer builds a dynamic KPI chart formatter so that super-
//   admins can configure display expressions for meter-reading values in the
//   master-data settings (e.g., "value / 1000 + ' m³'").  The expression is
//   saved to the database and retrieved via the KPI API.
//   Any admin with write access to master-data can now execute arbitrary
//   JavaScript in every other admin's browser — stored XSS via code injection.
//
// Fix: use a safe expression library (e.g., expr-eval, mathjs) that never
//   calls eval/Function, or constrain formatters to a predefined enum.

function applyKpiFormatter(rawValue, formatterExpression) {
    const format = new Function("value", formatterExpression);   // 🚨 semgrep: detect-eval-with-expression
    return format(rawValue);
}
