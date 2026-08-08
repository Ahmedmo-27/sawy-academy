import { listMyDevices, type MyDevicesResponse } from "@/lib/api/devices";
import { listMyEnrollments } from "@/lib/api/enrollments";
import { listMyOrders } from "@/lib/api/orders";
import { listMyServiceRequests } from "@/lib/api/services";
import type { Enrollment, Order, ServiceRequest } from "@/lib/api/types";

export interface DashboardResource<T> {
  data: T | null;
  error: string | null;
}

export interface StudentDashboardData {
  enrollments: DashboardResource<Enrollment[]>;
  orders: DashboardResource<Order[]>;
  serviceRequests: DashboardResource<ServiceRequest[]>;
  devices: DashboardResource<MyDevicesResponse>;
}

function errorMessage(reason: unknown) {
  return reason instanceof Error ? reason.message : "This information is unavailable.";
}

function resourceFromResult<T>(
  result: PromiseSettledResult<T>
): DashboardResource<T> {
  return result.status === "fulfilled"
    ? { data: result.value, error: null }
    : { data: null, error: errorMessage(result.reason) };
}

/**
 * Loads each student register independently so one unavailable endpoint does
 * not hide the rest of the dashboard.
 */
export async function getStudentDashboard(): Promise<StudentDashboardData> {
  const [enrollments, orders, serviceRequests, devices] =
    await Promise.allSettled([
      listMyEnrollments(),
      listMyOrders(),
      listMyServiceRequests(),
      listMyDevices(),
    ]);

  return {
    enrollments: resourceFromResult(enrollments),
    orders: resourceFromResult(orders),
    serviceRequests: resourceFromResult(serviceRequests),
    devices: resourceFromResult(devices),
  };
}
