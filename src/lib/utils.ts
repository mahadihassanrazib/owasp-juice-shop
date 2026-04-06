// VUL-3: Storing JWT in localStorage (intentional vulnerable example)
export function cacheAuthToken(accessToken: string) {
  localStorage.setItem('authState', JSON.stringify({ accessToken })); // 🚨 semgrep: jwt-in-localstorage
}

export function loadAuthToken() {
  const s = localStorage.getItem('authState');
  return s ? JSON.parse(s).accessToken : null;
}

export default { cacheAuthToken, loadAuthToken };
