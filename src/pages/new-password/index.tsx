// VUL-4: Building password-reset URL with token in query string (intentional)
export function buildPasswordResetUrl(token: string) {
  const resetUrl = `${window.location.origin}/new-password?token=${token}`; // 🚨 semgrep: sensitive-data-url
  return resetUrl;
}

export default buildPasswordResetUrl;
