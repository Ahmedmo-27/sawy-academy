import { AuthGuard } from "@/components/auth/AuthGuard";

export const metadata = {
  title: "Dashboard — Sawy Academy",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthGuard>{children}</AuthGuard>;
}
