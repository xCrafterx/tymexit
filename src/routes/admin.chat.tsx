import { createFileRoute } from "@tanstack/react-router";
import { AdminLiveChats } from "@/routes/admin.czaty";
import { AuthGuard } from "@/components/AuthGuard";

export const Route = createFileRoute("/admin/chat")({
  head: () => ({ meta: [{ title: "Czat admina — TymekIT" }] }),
  component: () => (
    <AuthGuard requireRole="admin">
      <AdminLiveChats />
    </AuthGuard>
  ),
});