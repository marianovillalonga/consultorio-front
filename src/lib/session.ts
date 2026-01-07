export function saveSession(token: string, role: string) {
  localStorage.setItem("session", "1");
  localStorage.setItem("userRole", role);
}

export function clearSession() {
  localStorage.removeItem("session");
  localStorage.removeItem("userRole");
}

export function getSession() {
  const token = typeof localStorage !== "undefined" && localStorage.getItem("session") ? "session" : "";
  const role = typeof localStorage !== "undefined" ? localStorage.getItem("userRole") || "" : "";
  return { token, role };
}
