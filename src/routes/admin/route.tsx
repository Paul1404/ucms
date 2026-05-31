import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin-shell";
import { fetchSession } from "@/lib/session";

export const Route = createFileRoute("/admin")({
  beforeLoad: async () => {
    const session = await fetchSession();
    if (!session) throw redirect({ to: "/login" });
    return { user: session.user };
  },
  loader: ({ context }) => ({ user: context.user }),
  component: AdminLayout,
});

function AdminLayout() {
  const { user } = Route.useLoaderData();
  return (
    <AdminShell user={user}>
      <Outlet />
    </AdminShell>
  );
}
