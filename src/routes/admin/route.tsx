import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { fetchSession } from "@/lib/session";

export const Route = createFileRoute("/admin")({
  beforeLoad: async () => {
    const session = await fetchSession();
    if (!session) throw redirect({ to: "/login" });
    return { user: session.user };
  },
  component: Outlet,
});
