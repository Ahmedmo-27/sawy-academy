import { listCourseGroups } from "@/lib/api/courseGroups";
import { listCourses } from "@/lib/api/courses";
import { listProducts } from "@/lib/api/products";
import { runParallelStagedLoad, type StagedLoadCallback } from "@/lib/load/stagedLoad";
import type { DashboardMetric } from "@/lib/api/types";

export async function getDashboardMetrics(
  onProgress?: StagedLoadCallback
): Promise<DashboardMetric[]> {
  const [groupList, courseList, productList] = await runParallelStagedLoad(
    [
      { label: "Course groups", run: listCourseGroups },
      { label: "Courses", run: listCourses },
      { label: "Products", run: listProducts },
    ],
    onProgress
  );

  return [
    {
      id: "course-groups",
      label: "Course groups",
      value: groupList.length,
      href: "/admin/course-groups",
      sheetRef: "GRP",
    },
    {
      id: "diploma-groups",
      label: "Diploma groups",
      value: groupList.filter((group) => group.type === "diploma").length,
      href: "/admin/course-groups",
      sheetRef: "DIP",
    },
    {
      id: "courses",
      label: "Total courses",
      value: courseList.length,
      href: "/admin/courses",
      sheetRef: "CRS",
    },
    {
      id: "courses-with-lessons",
      label: "Courses with lessons",
      value: courseList.filter((course) => (course.lessons?.length ?? 0) > 0).length,
      href: "/admin/courses",
      sheetRef: "LSN",
    },
    {
      id: "products",
      label: "Total products",
      value: productList.length,
      href: "/admin/products",
      sheetRef: "PRD",
    },
    {
      id: "product-categories",
      label: "Product categories",
      value: new Set(productList.map((product) => product.category).filter(Boolean)).size,
      href: "/admin/products",
      sheetRef: "CAT",
    },
  ];
}
