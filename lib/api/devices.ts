import {
  apiDelete,
  apiGet,
} from "@/lib/api/client";

export interface RegisteredDevice {
  id: string;
  label: string;
  lastActiveAt: string;
  createdAt?: string;
}

export interface MyDevicesResponse {
  devices: RegisteredDevice[];
  currentDeviceId: string;
  deviceLimit: number;
}

export function listMyDevices() {
  return apiGet<MyDevicesResponse>("/api/devices/me");
}

export function listUserDevicesAdmin(userId: string) {
  return apiGet<{
    userId: string;
    devices: RegisteredDevice[];
    deviceLimit: number;
  }>(`/api/admin/users/${encodeURIComponent(userId)}/devices`);
}

export function removeUserDeviceAdmin(userId: string, deviceId: string) {
  return apiDelete<{ ok: boolean; device: RegisteredDevice }>(
    `/api/admin/users/${encodeURIComponent(userId)}/devices/${encodeURIComponent(deviceId)}`
  );
}
