import { AdminLoader } from "@/components/admin/AdminLoader";

export default function AdminLoading() {
  return (
    <div className="p-8 lg:p-10">
      <AdminLoader label="Loading…" />
    </div>
  );
}
