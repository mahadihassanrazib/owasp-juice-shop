// VUL-2: Open redirect example for Semgrep demo
export function redirectAfterSessionExpiry() {
  const nextUrl = new URLSearchParams(window.location.search).get('next');
  // unsafe: using user-controlled `next` without validation
  window.location.href = nextUrl; // 🚨 semgrep: open-redirect
}

export default redirectAfterSessionExpiry;
