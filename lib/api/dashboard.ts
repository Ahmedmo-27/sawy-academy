import { listCourseGroups } from "@/lib/api/courseGroups";
import { listCourses } from "@/lib/api/courses";
import { listFaqs } from "@/lib/api/faqs";
import { listOrders } from "@/lib/api/orders";
import { listProducts } from "@/lib/api/products";
import { listServiceRequests } from "@/lib/api/services";
import { listVideoAccessFlags } from "@/lib/api/videoAccessFlags";
import { runParallelStagedLoad, type StagedLoadCallback } from "@/lib/load/stagedLoad";
import type { DashboardMetric } from "@/lib/api/types";

export async function getDashboardMetrics(
  onProgress?: StagedLoadCallback
): Promise<DashboardMetric[]> {
  const [
    pendingOrders,
    pendingServices,
    openVideoFlags,
    groupList,
    courseList,
    productList,
    faqList,
  ] = await runParallelStagedLoad(
    [
      {
        label: "Pending orders",
        run: () => listOrders("pending").catch(() => []),
      },
      {
        label: "Service requests",
        run: () => listServiceRequests("pending").catch(() => []),
      },
      {
        label: "Video alerts",
        run: () =>
          listVideoAccessFlags({ status: "open", limit: 1 })
            .then((result) => result.pagination.total)
            .catch(() => 0),
      },
      { label: "Course groups", run: listCourseGroups },
      { label: "Courses", run: listCourses },
      { label: "Products", run: listProducts },
      { label: "FAQs", run: () => listFaqs({ includeHidden: true }) },
    ],
    onProgress
  );

  const openAlertCount =
    typeof openVideoFlags === "number" ? openVideoFlags : 0;

  return [
    {
      id: "pending-orders",
      label: "Pending payments",
      value: pendingOrders.length,
      href: "/admin/orders",
      sheetRef: "ORD",
    },
    {
      id: "pending-services",
      label: "Open service requests",
      value: pendingServices.length,
      href: "/admin/services",
      sheetRef: "SRV",
    },
    {
      id: "open-video-alerts",
      label: "Open video alerts",
      value: openAlertCount,
      href: "/admin/video-access-flags",
      sheetRef: "VID",
    },
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
      value: courseList.filter((course) => (course.lessons?.length ?? 0) > 0)
        .length,
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
      value: new Set(
        productList.map((product) => product.category).filter(Boolean)
      ).size,
      href: "/admin/products",
      sheetRef: "CAT",
    },
    {
      id: "faqs",
      label: "Published FAQs",
      value: faqList.filter((faq) => faq.published !== false).length,
      href: "/admin/faqs",
      sheetRef: "FAQ",
    },
  ];
}
