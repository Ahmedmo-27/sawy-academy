import { listCourseGroups } from "@/lib/api/courseGroups";
import { listCourses } from "@/lib/api/courses";
import { listProducts } from "@/lib/api/products";
import type { DashboardMetric } from "@/lib/api/types";

/**
 * Dashboard uses endpoints that exist on the Express API today.
 * Orders/services stay at 0 until those routes are mounted — calling
 * them here only creates noisy 404s in the browser console.
 */
export async function getDashboardMetrics(): Promise<DashboardMetric[]> {
  const [groups, courses, products] = await Promise.allSettled([
    listCourseGroups(),
    listCourses(),
    listProducts(),
  ]);

  const groupList = groups.status === "fulfilled" ? groups.value : [];
  const courseList = courses.status === "fulfilled" ? courses.value : [];
  const productList = products.status === "fulfilled" ? products.value : [];

  return [
    {
      id: "course-groups",
      label: "Course groups",
      value: groupList.length,
      href: "/admin/course-groups",
      sheetRef: "GRP",
    },
    {
      id: "courses",
      label: "Total sub-courses",
      value: courseList.length,
      href: "/admin/courses",
      sheetRef: "CRS",
    },
    {
      id: "products",
      label: "Total products",
      value: productList.length,
      href: "/admin/products",
      sheetRef: "PRD",
    },
    {
      id: "pending-orders",
      label: "Pending orders",
      value: 0,
      href: "/admin/orders",
      sheetRef: "ORD",
    },
    {
      id: "pending-services",
      label: "Pending service requests",
      value: 0,
      href: "/admin/services",
      sheetRef: "SRV",
    },
    {
      id: "pending-verifications",
      label: "Pending payment verifications",
      value: 0,
      href: "/admin/orders",
      sheetRef: "PAY",
    },
  ];
}
