export const AUTH_COOKIE = "soterra_auth";
export const AUTH_COOKIE_VALUE = "true";
export const SESSION_COOKIE = "soterra_session";
export const AUTH_STORAGE_KEY = "soterra_auth";

export type UserRole = "admin" | "member";

export type AppSession = {
  userId: string;
  tenantId: string;
  tenantName: string;
  name: string;
  email: string;
  role: UserRole;
};
