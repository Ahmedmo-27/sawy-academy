import Link from "next/link";
import type { StudentDashboardData } from "@/lib/api/studentDashboard";

interface StudentSummaryCardsProps {
  dashboard: StudentDashboardData;
}

interface SummaryCard {
  id: string;
  label: string;
  value: number | null;
  detail: string;
  href: string;
}

export function StudentSummaryCards({
  dashboard,
}: StudentSummaryCardsProps) {
  const activeEnrollments =
    dashboard.enrollments.data?.filter(
      (item) =>
        item.completed !== true &&
        (item.totalLessons <= 0 || item.completedLessons < item.totalLessons)
    ).length ?? null;
  const pendingOrders =
    dashboard.orders.data?.filter((order) => order.status === "pending").length ??
    null;
  const openRequests =
    dashboard.serviceRequests.data?.filter(
      (request) => request.status === "pending" || request.status === "in review"
    ).length ?? null;
  const deviceCount = dashboard.devices.data?.devices.length ?? null;

  const cards: SummaryCard[] = [
    {
      id: "courses",
      label: "Active courses",
      value: activeEnrollments,
      detail: "In progress",
      href: "/dashboard/profile#enrollments",
    },
    {
      id: "orders",
      label: "Pending orders",
      value: pendingOrders,
      detail: "Awaiting verification",
      href: "/dashboard/profile#orders",
    },
    {
      id: "services",
      label: "Open requests",
      value: openRequests,
      detail: "Pending or in review",
      href: "/dashboard/profile#services",
    },
    {
      id: "devices",
      label: "Registered devices",
      value: deviceCount,
      detail: dashboard.devices.data
        ? `${dashboard.devices.data.deviceLimit} allowed`
        : "Device register unavailable",
      href: "/dashboard/profile#devices",
    },
  ];

  return (
    <ul className="grid gap-px bg-hairline sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <li key={card.id} className="bg-concrete">
          <Link
            href={card.href}
            className="group flex min-h-40 flex-col justify-between p-6 transition-colors duration-200 hover:bg-concrete-dark/30 focus-visible:bg-concrete-dark/30 sm:p-8"
            aria-label={`${card.label}: ${
              card.value === null ? "unavailable" : card.value
            }. ${card.detail}`}
          >
            <p className="label-caps text-charcoal-infill">{card.label}</p>
            <div className="mt-8">
              <p className="font-serif text-4xl font-light tabular-nums text-charcoal">
                {card.value ?? "—"}
              </p>
              <p className="type-infill mt-2 text-charcoal-infill">
                {card.value === null ? "Unavailable" : card.detail}
              </p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
