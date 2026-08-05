const DEVICE_ID_KEY = "sawy_device_id";
const COOKIE_MAX_AGE_SECONDS = 365 * 24 * 60 * 60;

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}=([^;]*)`)
  );
  return match ? decodeURIComponent(match[1]) : null;
}

function writeCookie(name: string, value: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
}

function generateDeviceId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16);
    const value = char === "x" ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

export function getStoredDeviceId(): string | null {
  if (typeof window === "undefined") return null;

  const fromStorage = localStorage.getItem(DEVICE_ID_KEY);
  if (fromStorage) return fromStorage;

  const fromCookie = readCookie(DEVICE_ID_KEY);
  if (fromCookie) {
    localStorage.setItem(DEVICE_ID_KEY, fromCookie);
    return fromCookie;
  }

  return null;
}

export function persistDeviceId(deviceId: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(DEVICE_ID_KEY, deviceId);
  writeCookie(DEVICE_ID_KEY, deviceId);
}

/** Returns an existing device id or creates and stores a new one. */
export function getOrCreateDeviceId(): string {
  const existing = getStoredDeviceId();
  if (existing) return existing;

  const next = generateDeviceId();
  persistDeviceId(next);
  return next;
}

/** Store a server-generated id when the client had none at first login. */
export function adoptDeviceId(deviceId: string | undefined) {
  if (!deviceId) return;
  persistDeviceId(deviceId);
}
