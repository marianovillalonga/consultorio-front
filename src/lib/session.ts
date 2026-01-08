export function saveSession(token: string, role: string, csrfToken = "") {
  localStorage.setItem("session", "1");
  localStorage.setItem("userRole", role);
  if (csrfToken) {
    localStorage.setItem("csrfToken", csrfToken);
  } else {
    localStorage.removeItem("csrfToken");
  }
}

export function setSessionCsrf(csrfToken: string) {
  if (typeof localStorage === "undefined") return;
  if (csrfToken) {
    localStorage.setItem("csrfToken", csrfToken);
  }
}

export function clearSession() {
  localStorage.removeItem("session");
  localStorage.removeItem("userRole");
  localStorage.removeItem("csrfToken");
}

export function getSession() {
  const token = typeof localStorage !== "undefined" && localStorage.getItem("session") ? "session" : "";
  const role = typeof localStorage !== "undefined" ? localStorage.getItem("userRole") || "" : "";
  const csrfToken = typeof localStorage !== "undefined" ? localStorage.getItem("csrfToken") || "" : "";
  return { token, role, csrfToken };
}
