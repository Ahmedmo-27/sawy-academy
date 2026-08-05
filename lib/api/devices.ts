import {
  apiDelete,
  apiGet,
  apiRequest,
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
}

export function listMyDevices() {
  return apiGet<MyDevicesResponse>("/api/devices/me");
}

export function removeMyDevice(deviceId: string) {
  return apiDelete<{ ok: boolean; device: RegisteredDevice }>(
    `/api/devices/me/${encodeURIComponent(deviceId)}`
  );
}

export function removeDeviceBeforeLogin(input: {
  deviceId: string;
  email: string;
  password: string;
}) {
  return apiRequest<{ ok: boolean; device: RegisteredDevice }>(
    `/api/devices/me/${encodeURIComponent(input.deviceId)}`,
    "DELETE",
    {
      body: {
        email: input.email,
        password: input.password,
      },
      auth: false,
    }
  );
}

export function listUserDevicesAdmin(userId: string) {
  return apiGet<{ userId: string; devices: RegisteredDevice[] }>(
    `/api/admin/users/${encodeURIComponent(userId)}/devices`
  );
}

export function removeUserDeviceAdmin(userId: string, deviceId: string) {
  return apiDelete<{ ok: boolean; device: RegisteredDevice }>(
    `/api/admin/users/${encodeURIComponent(userId)}/devices/${encodeURIComponent(deviceId)}`
  );
}
