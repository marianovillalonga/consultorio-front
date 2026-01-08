import { setSessionCsrf } from "@/lib/session";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL;

const getCsrfToken = () => {
  if (typeof document === "undefined") return "";
  return (
    document.cookie
      .split(";")
      .map((c) => c.trim())
      .find((c) => c.startsWith("csrfToken="))
      ?.split("=")[1] || ""
  );
};

const getStoredCsrfToken = () => {
  if (typeof localStorage === "undefined") return "";
  return localStorage.getItem("csrfToken") || "";
};

type AuthUser = {
  id: number;
  role: string;
  email: string;
};

export type Patient = {
  id: number;
  fullName: string;
  email: string;
  dni?: string | null;
  phone?: string | null;
  obraSocial?: string | null;
  obraSocialNumero?: string | null;
  historialClinico?: string | null;
  treatmentPlan?: string | null;
  treatmentPlanItems?: string | null;
  studies?: string | null;
  studiesFiles?: string | null;
  historyEntries?: string | HistoryEntry[] | null;
  balance?: number | null;
  payments?: PaymentRecord[] | null;
  odontograma?: string | null;
};

type Dentist = {
  id: number;
  userId: number;
  license?: string | null;
  specialty?: string | null;
};

export type PaymentRecord = {
  amount: number;
  method: string;
  date: string;
  note?: string;
  serviceAmount?: number;
};

export type HistoryEntry = {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  notes: string;
};

export type AuthResponse = {
  token?: string;
  csrfToken?: string;
  user: AuthUser;
  patient?: Patient;
};

export type ProfileResponse =
  | { type: "patient"; data: Patient }
  | { type: "dentist"; data: Dentist };

export type Appointment = {
  id: number;
  dentistId: number;
  patientId: number;
  startAt: string;
  endAt: string;
  status: string;
  reason?: string | null;
  dentist?: Dentist & { user?: AuthUser };
  patient?: Patient;
};

export type AvailabilitySlot = {
  startAt: string;
  endAt: string;
  available: boolean;
};

export type AvailabilityRow = {
  id?: number;
  dentistId?: number;
  weekday: number;
  fromTime: string;
  toTime: string;
  slotMinutes: number;
};

export type ObraSocial = {
  id: number;
  numeroObraSocial?: string | null;
  nombre: string;
  descripcion?: string | null;
  telefono?: string | null;
  email?: string | null;
  notas?: string | null;
  aranceles?: {
    codigo: string;
    descripcion: string;
    vigenciaDesde?: string;
    arancelTotal?: number;
    copago?: number;
  }[];
  normasTrabajoFileName?: string | null;
  normasTrabajoFileData?: string | null;
  normasFacturacionFileName?: string | null;
  normasFacturacionFileData?: string | null;
};

export type Block = {
  id: number;
  dentistId: number;
  fromDateTime: string;
  toDateTime: string;
  reason?: string | null;
};

export type AdminUser = {
  id: number;
  email: string;
  role: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type UserPermission = {
  viewKey: string;
  canRead: boolean;
  canWrite: boolean;
};

export async function authRequest<T = AuthResponse>(
  endpoint: "/auth/login" | "/auth/register",
  payload: Record<string, unknown>
): Promise<T> {
  const res = await apiFetch(`${API_BASE_URL}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = (await res.json().catch(() => ({}))) as T & {
    message?: string;
  };

  if (!res.ok) {
    const errorMessage =
      (data as { message?: string }).message ||
      "No se pudo completar la solicitud";
    throw new Error(errorMessage);
  }

  return data;
}

export async function logoutRequest() {
  const res = await apiFetch(`${API_BASE_URL}/auth/logout`, {
    method: "POST",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("No se pudo cerrar sesion");
  return true;
}

export async function activateAccount(token: string) {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL
  if (!base) throw new Error("Falta NEXT_PUBLIC_API_BASE_URL")

  const url = `${base}/auth/activate?token=${encodeURIComponent(token)}`
  const res = await fetch(url, { method: "GET" })

  const data = await res.json().catch(() => ({})) as { ok?: boolean; message?: string }
  if (!res.ok) throw new Error(data.message || `No se pudo activar la cuenta (${res.status})`)

  return data.ok === true
}

export async function resendActivation(email: string) {
  const res = await apiFetch(`${API_BASE_URL}/auth/resend-activation`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ email }),
  });
  const data = (await res.json().catch(() => ({}))) as { ok?: boolean; message?: string };
  if (!res.ok) throw new Error(data.message || "No se pudo reenviar el correo");
  return data.ok;
}

export async function requestPasswordReset(email: string) {
  const res = await apiFetch(`${API_BASE_URL}/auth/forgot-password`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ email }),
  });
  const data = (await res.json().catch(() => ({}))) as { ok?: boolean; message?: string };
  if (!res.ok) throw new Error(data.message || "No se pudo enviar el correo");
  return data.ok;
}

export async function resetPassword(token: string, password: string) {
  const res = await apiFetch(`${API_BASE_URL}/auth/reset-password`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ token, password }),
  });
  const data = (await res.json().catch(() => ({}))) as { ok?: boolean; message?: string };
  if (!res.ok) throw new Error(data.message || "No se pudo cambiar la contrasena");
  return data.ok;
}

const authHeaders = (_token?: string) => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const csrf = getStoredCsrfToken() || getCsrfToken();
  if (csrf) headers["X-CSRF-Token"] = csrf;
  return headers;
};

const apiFetch = async (url: string, options: RequestInit = {}) => {
  const baseOptions: RequestInit = {
    credentials: "include",
    ...options,
    headers: options.headers ? { ...(options.headers as Record<string, string>) } : undefined,
  };

  let res = await fetch(url, baseOptions);
  if (res.status !== 401) return res;

  const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: "POST",
    credentials: "include",
  });
  if (!refreshRes.ok) return res;

  const refreshCsrf = refreshRes.headers.get("X-CSRF-Token");
  if (refreshCsrf) setSessionCsrf(refreshCsrf);

  res = await fetch(url, baseOptions);
  return res;
};

export async function fetchProfile(token: string): Promise<ProfileResponse> {
  const res = await apiFetch(`${API_BASE_URL}/account/profile`, {
    headers: authHeaders(token),
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as ProfileResponse & {
    message?: string;
  };
  if (!res.ok) throw new Error(data.message || "No se pudo obtener el perfil");
  return data;
}

export async function updateProfile(
  token: string,
  payload: Record<string, unknown>
): Promise<ProfileResponse> {
  const res = await apiFetch(`${API_BASE_URL}/account/profile`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  const data = (await res.json().catch(() => ({}))) as ProfileResponse & {
    message?: string;
  };
  if (!res.ok) throw new Error(data.message || "No se pudo actualizar el perfil");
  return data;
}

export async function fetchAvailability(token: string, dentistId: number, dateISO: string) {
  const res = await apiFetch(
    `${API_BASE_URL}/appointments/availability?dentistId=${dentistId}&date=${encodeURIComponent(dateISO)}`,
    {
      headers: authHeaders(token),
      cache: "no-store",
    }
  );
  const data = (await res.json().catch(() => ({}))) as {
    slots?: AvailabilitySlot[];
    message?: string;
  };
  if (!res.ok) throw new Error(data.message || "No se pudo obtener disponibilidad");
  return data;
}

export async function createAppointment(
  token: string,
  payload: { dentistId: number; patientId: number; startAt: string; endAt: string; reason?: string }
) {
  const res = await apiFetch(`${API_BASE_URL}/appointments`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  const data = (await res.json().catch(() => ({}))) as { message?: string };
  if (!res.ok) throw new Error(data.message || "No se pudo crear el turno");
  return data;
}

export async function fetchDentists(specialty?: string) {
  const params = specialty ? `?specialty=${encodeURIComponent(specialty)}` : "";
  const res = await apiFetch(`${API_BASE_URL}/dentists${params}`);
  const data = (await res.json().catch(() => ({}))) as {
    dentists?: { id: number; specialty?: string | null; license?: string | null; user?: { email: string } | null }[];
    message?: string;
  };
  if (!res.ok) throw new Error(data.message || "No se pudo obtener dentistas");
  return data.dentists || [];
}

export async function fetchSpecialties() {
  const res = await apiFetch(`${API_BASE_URL}/dentists/specialties`);
  const data = (await res.json().catch(() => ({}))) as { specialties?: string[]; message?: string };
  if (!res.ok) throw new Error(data.message || "No se pudo obtener especialidades");
  return data.specialties || [];
}

export async function fetchMyAppointments(token: string) {
  const res = await apiFetch(`${API_BASE_URL}/appointments/my`, {
    headers: authHeaders(token),
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as { appointments?: Appointment[]; message?: string };
  if (!res.ok) throw new Error(data.message || "No se pudieron obtener turnos");
  return data.appointments || [];
}

export async function cancelAppointment(token: string, id: number) {
  const res = await apiFetch(`${API_BASE_URL}/appointments/${id}/cancel`, {
    method: "PATCH",
    headers: authHeaders(token),
  });
  const data = (await res.json().catch(() => ({}))) as { message?: string };
  if (!res.ok) throw new Error(data.message || "No se pudo cancelar el turno");
  return data;
}

export async function updateAppointmentStatus(token: string, id: number, status: string) {
  const res = await apiFetch(`${API_BASE_URL}/appointments/${id}/status`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify({ status }),
  });
  const data = (await res.json().catch(() => ({}))) as { message?: string };
  if (!res.ok) throw new Error(data.message || "No se pudo actualizar el turno");
  return data;
}

export async function rescheduleAppointment(
  token: string,
  id: number,
  payload: { startAt: string; endAt: string; reason?: string }
) {
  const res = await apiFetch(`${API_BASE_URL}/appointments/${id}/reschedule`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  const data = (await res.json().catch(() => ({}))) as { appointment?: Appointment; message?: string };
  if (!res.ok) throw new Error(data.message || "No se pudo reprogramar el turno");
  return data.appointment;
}

export async function fetchPatients(token: string) {
  const res = await apiFetch(`${API_BASE_URL}/patients`, {
    headers: authHeaders(token),
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as { patients?: Patient[]; message?: string };
  if (!res.ok) throw new Error(data.message || "No se pudieron obtener pacientes");
  return data.patients || [];
}

export async function fetchPatient(token: string, id: number) {
  const res = await apiFetch(`${API_BASE_URL}/patients/${id}`, {
    headers: authHeaders(token),
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as { patient?: Patient; message?: string };
  if (!res.ok) throw new Error(data.message || "No se pudo obtener el paciente");
  return data.patient;
}

export async function fetchPatientAppointments(token: string, id: number) {
  const res = await apiFetch(`${API_BASE_URL}/patients/${id}/appointments`, {
    headers: authHeaders(token),
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as { appointments?: Appointment[]; message?: string };
  if (!res.ok) throw new Error(data.message || "No se pudieron obtener los turnos del paciente");
  return data.appointments || [];
}

export async function createPatient(token: string, payload: Partial<Patient> & { fullName: string }) {
  const res = await apiFetch(`${API_BASE_URL}/patients`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  const data = (await res.json().catch(() => ({}))) as { patient?: Patient; message?: string };
  if (!res.ok) throw new Error(data.message || "No se pudo crear el paciente");
  return data.patient;
}

export async function updatePatient(token: string, id: number, payload: Partial<Patient>) {
  const res = await apiFetch(`${API_BASE_URL}/patients/${id}`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  const data = (await res.json().catch(() => ({}))) as { patient?: Patient; message?: string };
  if (!res.ok) throw new Error(data.message || "No se pudo actualizar el paciente");
  return data.patient;
}

export async function listAvailability(token: string, dentistId: number) {
  const res = await apiFetch(`${API_BASE_URL}/availability/${dentistId}`, {
    headers: authHeaders(token),
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as { availability?: AvailabilityRow[]; message?: string };
  if (!res.ok) throw new Error(data.message || "No se pudo obtener la disponibilidad");
  return data.availability || [];
}

export async function saveAvailability(token: string, dentistId: number, rows: AvailabilityRow[]) {
  const res = await apiFetch(`${API_BASE_URL}/availability/${dentistId}`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(rows),
  });
  const data = (await res.json().catch(() => ({}))) as { availability?: AvailabilityRow[]; message?: string };
  if (!res.ok) throw new Error(data.message || "No se pudo guardar la disponibilidad");
  return data.availability || [];
}

export async function listBlocks(token: string, dentistId: number) {
  const res = await apiFetch(`${API_BASE_URL}/blocks/${dentistId}`, {
    headers: authHeaders(token),
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as { blocks?: Block[]; message?: string };
  if (!res.ok) throw new Error(data.message || "No se pudo obtener bloqueos");
  return data.blocks || [];
}

export async function createBlock(
  token: string,
  dentistId: number,
  payload: { fromDateTime: string; toDateTime: string; reason?: string }
) {
  const res = await apiFetch(`${API_BASE_URL}/blocks/${dentistId}`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  const data = (await res.json().catch(() => ({}))) as { block?: Block; message?: string };
  if (!res.ok) throw new Error(data.message || "No se pudo crear el bloqueo");
  return data.block;
}

export async function deleteBlock(token: string, dentistId: number, id: number) {
  const res = await apiFetch(`${API_BASE_URL}/blocks/${dentistId}/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  const data = (await res.json().catch(() => ({}))) as { ok?: boolean; message?: string };
  if (!res.ok) throw new Error(data.message || "No se pudo eliminar el bloqueo");
  return data.ok;
}

export async function fetchObrasSociales(token: string): Promise<ObraSocial[]> {
  const res = await apiFetch(`${API_BASE_URL}/obras-sociales`, {
    headers: authHeaders(token),
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as { obras?: ObraSocial[]; message?: string } | { obrasSociales?: ObraSocial[] };
  if (!res.ok) throw new Error((data as any).message || "No se pudieron obtener las obras sociales");
  // support both keys just in case
  return (data as any).obras || (data as any).obrasSociales || [];
}

export async function createObraSocial(token: string, payload: Partial<ObraSocial> & { nombre: string }) {
  const res = await apiFetch(`${API_BASE_URL}/obras-sociales`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  const data = (await res.json().catch(() => ({}))) as { obra?: ObraSocial; message?: string };
  if (!res.ok) throw new Error(data.message || "No se pudo crear la obra social");
  return data.obra;
}

export async function updateObraSocial(token: string, id: number, payload: Partial<ObraSocial>) {
  const res = await apiFetch(`${API_BASE_URL}/obras-sociales/${id}`, {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  const data = (await res.json().catch(() => ({}))) as { obra?: ObraSocial; message?: string };
  if (!res.ok) throw new Error(data.message || "No se pudo actualizar la obra social");
  return data.obra;
}

export async function deleteObraSocial(token: string, id: number) {
  const res = await apiFetch(`${API_BASE_URL}/obras-sociales/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  const data = (await res.json().catch(() => ({}))) as { ok?: boolean; message?: string };
  if (!res.ok) throw new Error(data.message || "No se pudo eliminar la obra social");
  return data.ok;
}

export async function fetchAdminUsers(token: string) {
  const res = await apiFetch(`${API_BASE_URL}/admin/users`, {
    headers: authHeaders(token),
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as { users?: AdminUser[]; message?: string };
  if (!res.ok) throw new Error(data.message || "No se pudieron obtener los usuarios");
  return data.users || [];
}

export async function createAdminUser(
  token: string,
  payload: { email: string; password: string; active?: boolean }
) {
  const res = await apiFetch(`${API_BASE_URL}/admin/users`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  const data = (await res.json().catch(() => ({}))) as { user?: AdminUser; message?: string };
  if (!res.ok) throw new Error(data.message || "No se pudo crear el usuario");
  return data.user;
}

export async function updateAdminUser(
  token: string,
  id: number,
  payload: { email?: string; password?: string; active?: boolean }
) {
  const res = await apiFetch(`${API_BASE_URL}/admin/users/${id}`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  const data = (await res.json().catch(() => ({}))) as { user?: AdminUser; message?: string };
  if (!res.ok) throw new Error(data.message || "No se pudo actualizar el usuario");
  return data.user;
}

export async function fetchAdminUserPermissions(token: string, id: number) {
  const res = await apiFetch(`${API_BASE_URL}/admin/users/${id}/permissions`, {
    headers: authHeaders(token),
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as { permissions?: UserPermission[]; message?: string };
  if (!res.ok) throw new Error(data.message || "No se pudieron obtener los permisos");
  return data.permissions || [];
}

export async function updateAdminUserPermissions(
  token: string,
  id: number,
  permissions: UserPermission[]
) {
  const res = await apiFetch(`${API_BASE_URL}/admin/users/${id}/permissions`, {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify({ permissions }),
  });
  const data = (await res.json().catch(() => ({}))) as { ok?: boolean; message?: string };
  if (!res.ok) throw new Error(data.message || "No se pudieron guardar los permisos");
  return data.ok;
}



